import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/Confirm';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ICM - Interclasse',
  description: 'Sistema de gerenciamento de torneios interclasse',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ToastProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
