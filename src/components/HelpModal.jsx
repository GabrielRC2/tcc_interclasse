'use client';
import React from 'react';
import { X, HelpCircle } from 'lucide-react';

/**
 * Modal de ajuda reutilizável para explicar funcionalidades das páginas
 * @param {boolean} isOpen - Se o modal está aberto
 * @param {function} onClose - Função para fechar o modal
 * @param {string} title - Título do modal
 * @param {Array} sections - Array de seções com {title, content}
 */
export const HelpModal = ({ isOpen, onClose, title, sections }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <HelpCircle size={24} className="text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-6">
                    {sections.map((section, index) => (
                        <div key={index}>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                {section.title}
                            </h3>
                            <div className="text-gray-700 dark:text-gray-300 space-y-2">
                                {Array.isArray(section.content) ? (
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        {section.content.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>{section.content}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Botão de ajuda inline para ser usado ao lado dos títulos
 */
export const HelpButton = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all hover:scale-110 ml-3"
            title="Ajuda"
        >
            <HelpCircle size={18} />
        </button>
    );
};
