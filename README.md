# Chat de Processos Seletivos DPMG

Aplicação web em Next.js para consultar processos seletivos de estágio da Defensoria Pública de Minas Gerais por meio de um chat com IA.

O sistema autentica o usuário na API da DPMG, armazena o token em cookie HTTP-only e usa esse token para consultar municípios e processos seletivos de estágio.

## Funcionalidades

- Login com CPF e senha na API da DPMG.
- Chat em português para tirar dúvidas sobre processos seletivos de estágio.
- Consulta de municípios de Minas Gerais por nome.
- Consulta de processos seletivos por município e período de inscrição.
- Respostas geradas por IA usando OpenRouter via AI SDK.
- Redirecionamento automático para login quando a sessão expira.

## Tecnologias

- Next.js
- React
- TypeScript
- AI SDK
- OpenRouter
- Zod
- React Markdown

## Requisitos

- Node.js instalado
- npm instalado
- Chave de API do OpenRouter
- Credenciais válidas para acesso aos serviços da DPMG

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo de ambiente local:

```bash
cp .env.example .env.local
```

3. Configure a chave do OpenRouter em `.env.local`:

```env
OPENROUTER_API_KEY=sua_chave_aqui
```

## Como Executar

Ambiente de desenvolvimento:

```bash
npm run dev
```

Depois acesse `http://localhost:3000`.

Build de produção:

```bash
npm run build
```

Executar build de produção:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

## Estrutura Principal

```text
app/
  api/
    chat/route.ts      Endpoint do chat e integração com IA
    login/route.ts     Endpoint de autenticação na DPMG
  login/
    page.tsx           Pagina de login
    login-form.tsx     Formulario de login
  chat.tsx             Interface do chat
  page.tsx             Pagina inicial protegida
  layout.tsx           Layout raiz
lib/
  dpmg.ts              Cliente para APIs da DPMG
```

## Fluxo da Aplicação

1. O usuário acessa `/`.
2. Se não houver cookie `dpmg_token`, ele é redirecionado para `/login`.
3. O login envia CPF e senha para `/api/login`.
4. A API autentica na DPMG e salva o token em cookie HTTP-only.
5. O chat envia mensagens para `/api/chat`.
6. O endpoint valida a sessão, aciona o modelo via OpenRouter e consulta as APIs da DPMG quando necessário.

## Observações

- O assistente deve responder apenas sobre processos seletivos de estágio da DPMG.
- A variável `OPENROUTER_API_KEY` é obrigatória para usar o chat.
- O token da DPMG não fica disponível no cliente, pois é armazenado como cookie HTTP-only.
