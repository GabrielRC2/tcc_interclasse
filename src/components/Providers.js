'use client';
import { SessionProvider } from 'next-auth/react';
import { TournamentProvider } from '@/contexts/TournamentContext';

export function Providers({ children }) {
    return (
        <SessionProvider>
            <TournamentProvider>
                {children}
            </TournamentProvider>
        </SessionProvider>
    );
}
