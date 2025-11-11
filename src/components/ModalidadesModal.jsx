'use client';
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';

export const ModalidadesModal = ({ isOpen, onClose, torneio, onUpdate }) => {
    const toast = useToast();
    const confirm = useConfirm();
    const [modalidadesTorneio, setModalidadesTorneio] = useState([]);
    const [todasModalidades, setTodasModalidades] = useState([]);
    const [modalidadeSelecionada, setModalidadeSelecionada] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && torneio) {
            carregarDados();
        }
    }, [isOpen, torneio]);

    const carregarDados = async () => {
        setLoading(true);
        try {
            // Buscar modalidades do torneio
            const resModalidadesTorneio = await fetch(`/api/torneios/${torneio.id}/modalidades`);
            const modalidadesTorneioData = await resModalidadesTorneio.json();
            setModalidadesTorneio(modalidadesTorneioData);

            // Buscar todas as modalidades disponíveis
            const resTodas = await fetch('/api/modalidades');
            const todasData = await resTodas.json();
            setTodasModalidades(todasData);
        } catch (error) {
            console.error('Erro ao carregar modalidades:', error);
        } finally {
            setLoading(false);
        }
    };

    const adicionarModalidade = async () => {
        if (!modalidadeSelecionada) return;

        try {
            const response = await fetch(`/api/torneios/${torneio.id}/modalidades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modalidadeId: parseInt(modalidadeSelecionada) })
            });

            if (response.ok) {
                await carregarDados();
                setModalidadeSelecionada('');
                onUpdate?.(); // Notificar componente pai para atualizar
                toast.success('✅ Modalidade adicionada com sucesso!');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Erro ao adicionar modalidade');
            }
        } catch (error) {
            console.error('Erro ao adicionar modalidade:', error);
            toast.error('Erro ao adicionar modalidade');
        }
    };

    const removerModalidade = async (modalidadeId) => {
        const confirmed = await confirm.danger(
            'Deseja realmente remover esta modalidade do torneio?',
            {
                title: 'Remover Modalidade',
                confirmText: 'Remover',
                cancelText: 'Cancelar'
            }
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `/api/torneios/${torneio.id}/modalidades?modalidadeId=${modalidadeId}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                await carregarDados();
                onUpdate?.(); // Notificar componente pai para atualizar
                toast.success('✅ Modalidade removida com sucesso!');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Erro ao remover modalidade');
            }
        } catch (error) {
            console.error('Erro ao remover modalidade:', error);
            toast.error('Erro ao remover modalidade');
        }
    };

    if (!isOpen) return null;

    // Filtrar modalidades disponíveis (que não estão no torneio)
    const modalidadesDisponiveis = todasModalidades.filter(
        m => !modalidadesTorneio.some(mt => mt.modalidadeId === m.id)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Gerenciar Modalidades - {torneio?.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Adicionar Nova Modalidade */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Adicionar Modalidade
                        </h3>
                        <div className="flex gap-2">
                            <select
                                value={modalidadeSelecionada}
                                onChange={(e) => setModalidadeSelecionada(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                disabled={loading || modalidadesDisponiveis.length === 0}
                            >
                                <option value="">
                                    {modalidadesDisponiveis.length === 0 
                                        ? 'Todas as modalidades já foram adicionadas' 
                                        : 'Selecione uma modalidade'}
                                </option>
                                {modalidadesDisponiveis.map(modalidade => (
                                    <option key={modalidade.id} value={modalidade.id}>
                                        {modalidade.nome}
                                    </option>
                                ))}
                            </select>
                            <Button
                                onClick={adicionarModalidade}
                                disabled={!modalidadeSelecionada || loading}
                                variant="primary"
                            >
                                <Plus size={20} />
                                Adicionar
                            </Button>
                        </div>
                    </div>

                    {/* Lista de Modalidades do Torneio */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Modalidades Cadastradas ({modalidadesTorneio.length})
                        </h3>
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Carregando...</div>
                        ) : modalidadesTorneio.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Nenhuma modalidade cadastrada neste torneio
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {modalidadesTorneio.map(modalidade => (
                                    <div
                                        key={`modalidade-${modalidade.modalidadeId}-${modalidade.id}`}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                    >
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {modalidade.nome}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removerModalidade(modalidade.modalidadeId)}
                                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Remover modalidade"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
                    <Button onClick={onClose} variant="secondary">
                        Fechar
                    </Button>
                </div>
            </div>
        </div>
    );
};
