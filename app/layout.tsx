import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Processos de Estágio - DPMG',
  description: 'Chat para consultar processos seletivos de estágio da DPMG',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
