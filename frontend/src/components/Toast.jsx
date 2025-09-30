'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// Contexto do Toast
const ToastContext = createContext({});

// Hook para usar o toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast deve ser usado dentro de ToastProvider');
    }
    return context;
};

// Componente individual do Toast
const Toast = ({ toast, onRemove }) => {
    const getToastIcon = (type) => {
        switch (type) {
            case 'success':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'info':
            default:
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    const getToastStyles = (type) => {
        const baseStyles = "flex items-start gap-3 p-4 rounded-lg shadow-lg border transition-all duration-300 ease-in-out transform";

        switch (type) {
            case 'success':
                return `${baseStyles} bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200`;
            case 'error':
                return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200`;
            case 'warning':
                return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200`;
            case 'info':
            default:
                return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200`;
        }
    };

    const getIconContainerStyles = (type) => {
        switch (type) {
            case 'success':
                return 'text-green-600 dark:text-green-400';
            case 'error':
                return 'text-red-600 dark:text-red-400';
            case 'warning':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'info':
            default:
                return 'text-blue-600 dark:text-blue-400';
        }
    };

    return (
        <div className={`${getToastStyles(toast.type)} animate-slide-in-right`}>
            <div className={`flex-shrink-0 ${getIconContainerStyles(toast.type)}`}>
                {getToastIcon(toast.type)}
            </div>

            <div className="flex-1">
                {toast.title && (
                    <h4 className="text-sm font-semibold mb-1">{toast.title}</h4>
                )}
                <p className="text-sm opacity-90">{toast.message}</p>
            </div>

            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Fechar notificação"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};

// Container dos Toasts
const ToastContainer = ({ toasts, removeToast }) => {
    if (!toasts.length) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full pr-4 md:pr-0">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    toast={toast}
                    onRemove={removeToast}
                />
            ))}
        </div>
    );
};

// Provider do Toast
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const toastId = useRef(0);

    const addToast = useCallback((type, message, title = null, duration = 5000) => {
        const id = ++toastId.current;

        const newToast = {
            id,
            type,
            message,
            title,
            duration
        };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove após a duração especificada
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Funções de conveniência
    const toast = {
        success: (message, title, duration) => addToast('success', message, title, duration),
        error: (message, title, duration) => addToast('error', message, title, duration),
        warning: (message, title, duration) => addToast('warning', message, title, duration),
        info: (message, title, duration) => addToast('info', message, title, duration),
        remove: removeToast,
        clear: () => setToasts([])
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

export default ToastProvider;