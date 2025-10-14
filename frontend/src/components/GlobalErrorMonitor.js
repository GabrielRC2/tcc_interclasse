'use client';
import { useGlobalErrors } from '@/hooks/useGlobalErrors';

// Componente que monitora todos os erros globais em todas as páginas
export function GlobalErrorMonitor() {
    useGlobalErrors(); // Executa o hook de monitoramento global
    return null; // Não renderiza nada visível
}

// Manter compatibilidade com nome antigo
export function InternetMonitor() {
    return <GlobalErrorMonitor />;
}