import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Chat from './chat';

export default async function HomePage() {
  const token = (await cookies()).get('dpmg_token')?.value;

  if (!token) {
    redirect('/login');
  }

  return (
    <main className="page-shell">
      <Chat />
    </main>
  );
}
