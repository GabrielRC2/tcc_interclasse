'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, HelpCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/common';

// Contexto do Confirm
const ConfirmContext = createContext({});

// Hook para usar o confirm
export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm deve ser usado dentro de ConfirmProvider');
    }
    return context;
};

// Componente Modal de Confirmação
const ConfirmModal = ({ isOpen, onClose, onConfirm, config, inputValue, selectedValue, onInputChange, onSelectedChange }) => {
    if (!isOpen) return null;

    const getIcon = (type) => {
        const iconClass = "w-6 h-6";
        switch (type) {
            case 'danger':
                return <AlertTriangle className={`${iconClass} text-red-500`} />;
            case 'warning':
                return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
            case 'info':
                return <Info className={`${iconClass} text-blue-500`} />;
            case 'success':
                return <CheckCircle className={`${iconClass} text-green-500`} />;
            default:
                return <HelpCircle className={`${iconClass} text-gray-500`} />;
        }
    };

    const getColorClasses = (type) => {
        switch (type) {
            case 'danger':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-200 dark:border-red-800',
                    confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
                    cancelBtn: 'bg-gray-500 hover:bg-gray-600 text-white'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                    border: 'border-yellow-200 dark:border-yellow-800',
                    confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white',
                    cancelBtn: 'bg-gray-500 hover:bg-gray-600 text-white'
                };
            case 'info':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-200 dark:border-blue-800',
                    confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
                    cancelBtn: 'bg-gray-500 hover:bg-gray-600 text-white'
                };
            case 'success':
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-200 dark:border-green-800',
                    confirmBtn: 'bg-green-600 hover:bg-green-700 text-white',
                    cancelBtn: 'bg-gray-500 hover:bg-gray-600 text-white'
                };
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-gray-900/20',
                    border: 'border-gray-200 dark:border-gray-800',
                    confirmBtn: 'bg-gray-600 hover:bg-gray-700 text-white',
                    cancelBtn: 'bg-gray-500 hover:bg-gray-600 text-white'
                };
        }
    };

    const colors = getColorClasses(config.type);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-scale-in">
                {/* Header com ícone */}
                <div className={`${colors.bg} ${colors.border} border-b px-6 py-4 rounded-t-lg`}>
                    <div className="flex items-center gap-3">
                        {getIcon(config.type)}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {config.title || 'Confirmação'}
                        </h3>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="px-6 py-4">
                    <div className="text-gray-700 dark:text-gray-300">
                        {config.message?.split('\n').map((line, index) => (
                            <p key={index} className={index > 0 ? "mt-2" : ""}>{line}</p>
                        ))}
                    </div>

                    {/* Input de texto */}
                    {config.inputType === 'text' && (
                        <div className="mt-4">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => onInputChange(e.target.value)}
                                placeholder={config.placeholder}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Select com opções */}
                    {config.inputType === 'select' && config.options && (
                        <div className="mt-4 space-y-2">
                            {config.options.map((option, index) => (
                                <label
                                    key={index}
                                    className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="confirm-option"
                                        value={option.value}
                                        checked={selectedValue === option.value}
                                        onChange={(e) => onSelectedChange(e.target.value)}
                                        className="mr-3 text-red-600 focus:ring-red-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {option.label}
                                        </div>
                                        {option.description && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {option.description}
                                            </div>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}

                    {config.details && (
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {config.details.split('\n').map((line, index) => (
                                    <div key={index} className={index > 0 ? "mt-1" : ""}>{line}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer com botões */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 rounded-b-lg">
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${colors.cancelBtn}`}
                        >
                            {config.cancelText || 'Cancelar'}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={
                                config.required &&
                                ((config.inputType === 'select' && !selectedValue) ||
                                    (config.inputType === 'text' && !inputValue))
                            }
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${colors.confirmBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {config.confirmText || 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Provider do Confirm
export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        config: {},
        resolve: null,
        inputValue: '',
        selectedValue: ''
    });

    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                config: {
                    message,
                    title: options.title,
                    type: options.type || 'default',
                    confirmText: options.confirmText,
                    cancelText: options.cancelText,
                    details: options.details,
                    inputType: options.inputType,
                    options: options.options,
                    placeholder: options.placeholder,
                    required: options.required
                },
                resolve,
                inputValue: '',
                selectedValue: ''
            });
        });
    }, []);

    const prompt = useCallback((message, options = {}) => {
        return confirm(message, {
            ...options,
            inputType: 'text',
            type: options.type || 'info',
            required: true
        });
    }, [confirm]);

    const select = useCallback((message, selectOptions, options = {}) => {
        return confirm(message, {
            ...options,
            inputType: 'select',
            options: selectOptions,
            type: options.type || 'info',
            required: true
        });
    }, [confirm]);

    const handleConfirm = useCallback(() => {
        // Se tem input/select, retorna o valor escolhido
        if (confirmState.config.inputType === 'select') {
            confirmState.resolve?.(confirmState.selectedValue || null);
        } else if (confirmState.config.inputType === 'text') {
            confirmState.resolve?.(confirmState.inputValue || null);
        } else {
            // Confirm normal
            confirmState.resolve?.(true);
        }
        setConfirmState({ isOpen: false, config: {}, resolve: null, inputValue: '', selectedValue: '' });
    }, [confirmState]);

    const handleCancel = useCallback(() => {
        confirmState.resolve?.(null);
        setConfirmState({ isOpen: false, config: {}, resolve: null, inputValue: '', selectedValue: '' });
    }, [confirmState.resolve]);

    const updateInputValue = useCallback((value) => {
        setConfirmState(prev => ({ ...prev, inputValue: value }));
    }, []);

    const updateSelectedValue = useCallback((value) => {
        setConfirmState(prev => ({ ...prev, selectedValue: value }));
    }, []);

    // Funções de conveniência
    const confirmApi = {
        confirm,
        prompt,
        select,
        danger: (message, options = {}) => confirm(message, { ...options, type: 'danger' }),
        warning: (message, options = {}) => confirm(message, { ...options, type: 'warning' }),
        info: (message, options = {}) => confirm(message, { ...options, type: 'info' }),
        success: (message, options = {}) => confirm(message, { ...options, type: 'success' })
    };

    return (
        <ConfirmContext.Provider value={confirmApi}>
            {children}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                config={confirmState.config}
                inputValue={confirmState.inputValue}
                selectedValue={confirmState.selectedValue}
                onInputChange={updateInputValue}
                onSelectedChange={updateSelectedValue}
            />
        </ConfirmContext.Provider>
    );
};

export default ConfirmProvider;