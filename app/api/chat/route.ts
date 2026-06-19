import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, stepCountIs, streamText, tool } from 'ai';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LoginObrigatorioError, buscarMunicipio, consultarProcessosEstagio, verificarLoginDpmg } from '@/lib/dpmg';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const hoje = new Date().toISOString().slice(0, 10);

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('dpmg_token')?.value;

  if (!token) {
    return loginObrigatorioResponse();
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: 'OPENROUTER_API_KEY nao configurada.' }, { status: 500 });
  }

  const loginValido = await verificarLoginDpmg(token);

  if (!loginValido) {
    return loginObrigatorioResponse();
  }

  const { messages } = await request.json();

  const result = streamText({
    model: openrouter('openai/gpt-5.4-nano'),
    system: `
Voce e um assistente especializado exclusivamente em processos seletivos de estagio da Defensoria Publica de Minas Gerais.

Regras:
- Responda somente sobre processos seletivos de estagio da DPMG.
- Se a pergunta nao for sobre processos seletivos de estagio da DPMG, explique brevemente que so pode ajudar com esse assunto.
- Quando o usuario informar uma cidade, use buscarMunicipio antes de consultar processos.
- Para consultar processos seletivos, use consultarProcessosEstagio.
- Datas sao opcionais. Nunca exija periodo de inscricao para consultar processos.
- Se o usuario nao informar datas, chame consultarProcessosEstagio com inicioInscricao e finalInscricao vazios ou omitidos.
- Se o usuario informar datas em qualquer formato comum, como "12 de abril", "12/04", "12/04/2026" ou "abril", interprete e converta para YYYY-MM-DD antes de chamar tools.
- Se o usuario informar dia e mes sem ano, use o ano da data atual: ${hoje}.
- Se o usuario informar uma unica data, use essa data como filtro mais adequado ao contexto. Se o contexto nao indicar inicio ou fim, use a mesma data em inicioInscricao e finalInscricao.
- Ao responder para o usuario, formate datas de inscricao como dd/mm/aaaa, mesmo que a API retorne YYYY-MM-DD ou outro formato.
- Nao invente processos, datas, cargos, links ou resultados.
- Se uma tool retornar requiresLogin=true, informe que a sessao expirou e que o usuario sera redirecionado para login.
- Se a API nao retornar processos para os filtros, diga que nao encontrou processos para os criterios informados.
- Responda em portugues do Brasil, de forma objetiva.
`,
    messages: await convertToModelMessages(messages),
    tools: {
      buscarMunicipio: tool({
        description: 'Busca o uuid de um municipio de Minas Gerais pelo nome da cidade.',
        inputSchema: z.object({
          nomeCidade: z.string().describe('Nome da cidade informada pelo usuario.'),
        }),
        execute: async ({ nomeCidade }) => buscarMunicipio(nomeCidade),
      }),
      consultarProcessosEstagio: tool({
        description:
          'Consulta processos seletivos de estagio da DPMG. O periodo de inscricao e opcional.',
        inputSchema: z.object({
          uuidMunicipio: z.string().optional().describe('UUID do municipio retornado por buscarMunicipio.'),
          inicioInscricao: z
            .string()
            .optional()
            .describe('Data inicial de inscricao no formato YYYY-MM-DD. Omitir se o usuario nao informou.'),
          finalInscricao: z
            .string()
            .optional()
            .describe('Data final de inscricao no formato YYYY-MM-DD. Omitir se o usuario nao informou.'),
        }),
        execute: async ({ uuidMunicipio, inicioInscricao, finalInscricao }) => {
          try {
            return await consultarProcessosEstagio(
              {
                uuidMunicipio,
                inicioInscricao,
                finalInscricao,
              },
              token,
            );
          } catch (error) {
            if (error instanceof LoginObrigatorioError) {
              return {
                requiresLogin: true,
                status: error.status,
                message: 'Sessao expirada ou login invalido.',
              };
            }

            throw error;
          }
        },
      }),
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}

function loginObrigatorioResponse() {
  const response = NextResponse.json({ error: 'Sessao expirada ou login invalido.' }, { status: 401 });

  response.cookies.delete('dpmg_token');

  return response;
}
