import { NextResponse } from 'next/server';

const LOGIN_URL = 'https://gerais.defensoria.mg.def.br/scsdp/service/login/interno';

export async function POST(request: Request) {
  const { cpf, senha } = await request.json();

  if (!cpf || !senha) {
    return NextResponse.json({ error: 'Informe CPF e senha.' }, { status: 400 });
  }

  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cpf, senha }),
  });

  const token = (await response.text()).trim();

  if (!response.ok || !token) {
    return NextResponse.json({ error: 'CPF ou senha inválidos.' }, { status: 401 });
  }

  const result = NextResponse.json({ ok: true });

  result.cookies.set('dpmg_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return result;
}
