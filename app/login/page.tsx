import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from './login-form';

export default async function LoginPage() {
  const token = (await cookies()).get('dpmg_token')?.value;

  if (token) {
    redirect('/');
  }

  return (
    <main className="page-shell">
      <section className="center-panel">
        <h1 className="login-title">Login</h1>
        <p className="login-subtitle">
          Acesse para consultar processos seletivos de estágio da Defensoria Pública de Minas Gerais.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
