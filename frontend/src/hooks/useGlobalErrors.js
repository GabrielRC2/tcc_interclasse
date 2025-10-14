'use client';
import { useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';

// Hook expandido para tratar todos os erros globais
export function useGlobalErrors() {
    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        // 1. EVENTOS DE INTERNET (já implementado)
        const handleOffline = () => {
            toast.error('🔌 Sem conexão com a internet. Verifique sua conexão.');
        };

        const handleOnline = () => {
            toast.success('✅ Conexão com a internet restaurada.');
        };

        // 2. INTERCEPTADOR GLOBAL DE FETCH
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);

                // Tratar códigos de erro HTTP automaticamente
                if (!response.ok) {
                    const url = args[0];
                    const operation = extractOperationFromUrl(url);

                    switch (response.status) {
                        case 401:
                            toast.error('🔑 Sessão expirada. Você será redirecionado...');
                            // Como o app usa componentes e não URLs, você pode:
                            // Opção 1: Limpar localStorage/sessionStorage
                            localStorage.clear();
                            sessionStorage.clear();
                            // Opção 2: Recarregar a página para forçar novo login
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                            // Opção 3: Emitir evento customizado para sidebar tratar
                            // window.dispatchEvent(new CustomEvent('forceLogout'));
                            break;

                        case 403:
                            toast.error('🛡️ Você não tem permissão para esta operação.');
                            break;

                        case 404:
                            toast.error(`❓ Recurso não encontrado${operation ? ` para ${operation}` : ''}.`);
                            break;

                        case 408:
                            toast.error('⏱️ Timeout: A operação demorou muito. Tente novamente.');
                            break;

                        case 409:
                            toast.error('⚠️ Conflito: Esta operação não pode ser realizada no momento.');
                            break;

                        case 422:
                            toast.error('📋 Dados inválidos. Verifique os campos preenchidos.');
                            break;

                        case 429:
                            toast.error('⏱️ Muitas tentativas. Aguarde um momento e tente novamente.');
                            break;

                        case 500:
                        case 502:
                        case 503:
                        case 504:
                            toast.error('🔧 Erro interno do servidor. Tente novamente em alguns minutos.');
                            break;

                        default:
                            if (response.status >= 400) {
                                toast.error(`❌ Erro ${response.status}: Falha na${operation ? ` ${operation}` : ' operação'}.`);
                            }
                    }
                }

                return response;

            } catch (error) {
                // Tratar erros de rede e timeout
                if (error.name === 'AbortError') {
                    toast.error('⏱️ Operação cancelada por timeout.');
                } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    toast.error('🔌 Erro de conexão. Verifique sua internet.');
                } else if (error.message.includes('NetworkError')) {
                    toast.error('🌐 Erro de rede. Tente novamente.');
                } else {
                    // Só mostra erro genérico se não foi um erro HTTP já tratado
                    console.error('Erro de fetch não tratado:', error);
                    toast.error('❌ Erro inesperado. Tente novamente.');
                }

                throw error; // Re-lança para o código original tratar se necessário
            }
        };

        // 3. ADICIONAR TIMEOUT AUTOMÁTICO (opcional)
        const originalFetchWithTimeout = window.fetch;
        window.fetch = (url, options = {}) => {
            const timeoutMs = options.timeout || 30000; // 30 segundos padrão

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            return originalFetchWithTimeout(url, {
                ...options,
                signal: controller.signal
            }).finally(() => {
                clearTimeout(timeoutId);
            });
        };

        // 4. LISTENERS DE EVENTOS
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        // 5. INTERCEPTAR ERROS NÃO CAPTURADOS
        const handleUnhandledError = (event) => {
            console.error('Erro global não capturado:', event.error);
            toast.error('❌ Erro inesperado na aplicação.');
        };

        const handleUnhandledRejection = (event) => {
            console.error('Promise rejeitada não capturada:', event.reason);
            toast.error('❌ Erro inesperado em operação assíncrona.');
            event.preventDefault(); // Previne que apareça no console
        };

        window.addEventListener('error', handleUnhandledError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        // CLEANUP
        return () => {
            window.fetch = originalFetch; // Restaura fetch original
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('error', handleUnhandledError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [toast, router]);
}

// Função auxiliar para extrair tipo de operação da URL
function extractOperationFromUrl(url) {
    if (typeof url !== 'string') return null;

    if (url.includes('/api/teams')) return 'times';
    if (url.includes('/api/jogadores')) return 'jogadores';
    if (url.includes('/api/partidas')) return 'partidas';
    if (url.includes('/api/grupos')) return 'grupos';
    if (url.includes('/api/eliminatorias')) return 'eliminatórias';
    if (url.includes('/api/torneios')) return 'torneios';
    if (url.includes('/api/classificacao')) return 'classificação';
    if (url.includes('/api/modalidades')) return 'modalidades';
    if (url.includes('/api/users')) return 'usuários';

    return null;
}

// Manter compatibilidade com código existente
export function useInternetStatus() {
    return useGlobalErrors();
}