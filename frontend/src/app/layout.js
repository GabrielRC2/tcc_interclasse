import { Inter } from 'next/font/google';
import { TournamentProvider } from '@/contexts/TournamentContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ICM - Interclasse',
  description: 'Sistema de gerenciamento de torneios interclasse',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <TournamentProvider>
          {children}
        </TournamentProvider>
      </body>
    </html>
  );
}