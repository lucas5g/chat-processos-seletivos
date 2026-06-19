# AGENTS.md

## Comandos Verificados

- `npm install` instala as dependências a partir de `package-lock.json`.
- `npm run dev` inicia o app Next.js em desenvolvimento.
- `npm run build` passa no estado atual e também executa checagem TypeScript durante o build.
- `npx tsc --noEmit` é o typecheck focado; passou no estado atual.
- `npx tsc --noEmit` gera `tsconfig.tsbuildinfo` por causa de `incremental`; remova o arquivo se ele aparecer como não versionado.
- `npm run lint` está quebrado no estado atual: o script chama `next lint`, mas Next 16.2.9 interpreta `lint` como diretório e falha com `Invalid project directory provided`.
- Não há suíte de testes configurada em `package.json`.

## Ambiente

- O app precisa de `OPENROUTER_API_KEY`; a única variável documentada está em `.env.example`.
- `.env` e `.env*.local` são ignorados pelo git; não leia nem exponha valores reais de ambiente em respostas, diffs ou logs.
- Next 16.2.9 no lockfile exige Node `>=20.9.0`.

## Arquitetura

- App único em Next.js App Router; os entrypoints reais estão em `app/page.tsx`, `app/login/page.tsx`, `app/api/login/route.ts` e `app/api/chat/route.ts`.
- `/` é protegido por cookie `dpmg_token`; sem cookie, redireciona para `/login`.
- `/api/login` autentica contra `https://gerais.defensoria.mg.def.br/scsdp/service/login/interno` e salva o token em cookie HTTP-only `dpmg_token`.
- `/api/chat` valida o token chamando a API da DPMG antes de acionar a IA; se inválido, apaga o cookie e responde 401.
- Integrações externas da DPMG ficam centralizadas em `lib/dpmg.ts`; as chamadas usam `cache: 'no-store'` e dependem do bearer token da DPMG.
- O chat usa AI SDK com OpenRouter em `app/api/chat/route.ts`, modelo `openai/gpt-5.4-nano`, e tools `buscarMunicipio` e `consultarProcessosEstagio`.
- Imports absolutos usam o alias `@/*` definido em `tsconfig.json`.

## Cuidados ao Alterar

- Mantenha o token da DPMG apenas no servidor/cookie HTTP-only; não passe o token para componentes client.
- Preserve o comportamento de redirecionar para `/login` em 401 ou quando uma tool retorna `requiresLogin=true`.
- O assistente deve continuar restrito a processos seletivos de estágio da DPMG; essa regra está no prompt de sistema de `/api/chat`.
- Ao editar texto em português visível ao usuário ou documentação, use acentuação correta.
