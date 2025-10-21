'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Trophy, Users, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, Select, CardSplat, Loading } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';

export const SeasonsPage = () => {
    const toast = useToast();
    const confirm = useConfirm();
    // Estados de controle de usuário
    const [currentUser, setCurrentUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    
    const [seasons, setSeasons] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSeason, setEditingSeason] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedYears, setExpandedYears] = useState(new Set());

    const { selectedTournament, refreshTournaments } = useTournament();

    const [formData, setFormData] = useState({
        name: '',
        location: 'ETEC João Belarmino',
        startDate: '',
        endDate: '',
        modalities: '',
        status: 'PLANEJAMENTO'
    });

    // Opções de modalidades baseadas no tipo de torneio
    const modalitiesByType = {
        'Meio do Ano': 'Vôlei, Handebol',
        'Fim de Ano': 'Futsal, Basquete'
    };

    useEffect(() => {
        loadSeasons();
        loadCurrentUser();
    }, []);

    // Função para buscar dados do usuário logado
    const loadCurrentUser = async () => {
        try {
            const response = await fetch('/api/users/me');
            
            if (response.ok) {
                const userData = await response.json();
                setCurrentUser(userData);
            } else {
                console.error('Erro ao buscar dados do usuário');
                setCurrentUser(null);
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            setCurrentUser(null);
        } finally {
            setUserLoading(false);
        }
    };

    useEffect(() => {
        // Atualizar modalidades quando o nome do torneio mudar
        if (formData.name && modalitiesByType[formData.name]) {
            setFormData(prev => ({
                ...prev,
                modalities: modalitiesByType[formData.name]
            }));
        }
    }, [formData.name]);

    const loadSeasons = async () => {
        try {
            const response = await fetch('/api/torneios');
            const data = await response.json();
            setSeasons(data);
        } catch (error) {
            console.error('Erro ao carregar torneios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validação: Data de fim deve ser posterior à data de início
        if (formData.startDate && formData.endDate) {
            const dataInicio = new Date(formData.startDate);
            const dataFim = new Date(formData.endDate);
            
            if (dataFim < dataInicio) {
                toast.error('A data de fim não pode ser anterior à data de início!');
                return;
            }
        }

        try {
            let endpoint = '/api/torneios';
            let method = 'POST';

            if (editingSeason) {
                endpoint = `/api/torneios/${editingSeason.id}`;
                method = 'PUT';
            }

            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await loadSeasons();
                // Atualizar também o contexto de torneios
                await refreshTournaments();
                closeModal();
                toast.success(`Torneio ${editingSeason ? 'editado' : 'criado'} com sucesso!`);
            } else {
                const error = await response.json();
                toast.error(error.error || 'Erro ao salvar torneio');
            }
        } catch (error) {
            console.error('Erro ao salvar torneio:', error);
            toast.error('Erro ao salvar torneio');
        }
    };

    const handleEdit = async (season) => {
        try {
            // Buscar dados completos do torneio da API
            const response = await fetch(`/api/torneios/${season.id}`);
            if (response.ok) {
                const torneioCompleto = await response.json();

                setEditingSeason(torneioCompleto);
                setFormData({
                    name: torneioCompleto.name,
                    location: torneioCompleto.location,
                    startDate: torneioCompleto.startDate,
                    endDate: torneioCompleto.endDate,
                    modalities: torneioCompleto.modalities,
                    status: torneioCompleto.status
                });
            } else {
                // Fallback para os dados que já temos
                setEditingSeason(season);

                // Extrair nome base removendo o ano se presente
                const baseNome = season.name.replace(/\s\d{4}$/, '');

                setFormData({
                    name: baseNome,
                    location: season.location,
                    startDate: season.startDate,
                    endDate: season.endDate,
                    modalities: season.modalities,
                    status: season.status
                });
            }
        } catch (error) {
            console.error('Erro ao buscar dados do torneio:', error);
            // Usar dados locais como fallback
            setEditingSeason(season);

            // Extrair nome base removendo o ano se presente
            const baseNome = season.name.replace(/\s\d{4}$/, '');

            setFormData({
                name: baseNome,
                location: season.location,
                startDate: season.startDate,
                endDate: season.endDate,
                modalities: season.modalities,
                status: season.status
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (season) => {
        const confirmed = await confirm.danger(`Tem certeza que deseja excluir o torneio "${season.name}"?`, {
            title: 'Confirmar Exclusão',
            confirmText: 'Excluir',
            cancelText: 'Cancelar'
        });

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(`/api/torneios/${season.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadSeasons();
                // Atualizar também o contexto de torneios
                await refreshTournaments();
                toast.success('Torneio excluído com sucesso!');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Erro ao excluir torneio');
            }
        } catch (error) {
            console.error('Erro ao excluir torneio:', error);
            toast.error('Erro ao excluir torneio');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSeason(null);
        setFormData({
            name: '',
            location: 'ETEC João Belarmino',
            startDate: '',
            endDate: '',
            modalities: '',
            status: 'PLANEJAMENTO'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'EM ANDAMENTO': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'PLANEJAMENTO': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'FINALIZADO': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        }
    };

    // Agrupar torneios por ano
    const groupSeasonsByYear = () => {
        const grouped = {};
        seasons.forEach(season => {
            const year = new Date(season.startDate).getFullYear();
            if (!grouped[year]) {
                grouped[year] = [];
            }
            grouped[year].push(season);
        });

        // Ordenar anos de forma decrescente
        return Object.keys(grouped)
            .sort((a, b) => parseInt(b) - parseInt(a))
            .reduce((acc, year) => {
                acc[year] = grouped[year].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                return acc;
            }, {});
    };

    const toggleYear = (year) => {
        const newExpanded = new Set(expandedYears);
        if (newExpanded.has(year)) {
            newExpanded.delete(year);
        } else {
            newExpanded.add(year);
        }
        setExpandedYears(newExpanded);
    };

    if (loading) {
        return <Loading message="Carregando..." />;
    }

    // Bloquear acesso para usuários do tipo 'staff'
    if (currentUser && currentUser.tipo_usuario === 'staff') {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h2>
                <p className="text-gray-700 dark:text-gray-300">
                    Usuários do tipo <b>staff</b> não têm permissão para acessar a área de temporadas.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Entre em contato com um administrador se precisar de acesso.
                </p>
            </div>
        );
    }

    const groupedSeasons = groupSeasonsByYear();

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">TORNEIOS</h1>
                        {selectedTournament && (
                            <p className="text-gray-500 dark:text-gray-400">
                                Torneio: {selectedTournament.name}
                            </p>
                        )}
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto">
                        <Plus size={20} className="mr-2" />
                        Novo Torneio
                    </Button>
                </div>

                <div className="space-y-4">
                    {Object.keys(groupedSeasons).length === 0 ? (
                        <div className="text-center py-12">
                            <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum torneio encontrado</p>
                            <Button onClick={() => setIsModalOpen(true)} className="mt-4">
                                Criar Primeiro Torneio
                            </Button>
                        </div>
                    ) : (
                        Object.entries(groupedSeasons).map(([year, yearSeasons]) => (
                            <div key={year} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                                {/* Cabeçalho do Ano */}
                                <button
                                    onClick={() => toggleYear(year)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {expandedYears.has(year) ? (
                                            <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
                                        ) : (
                                            <ChevronRight size={20} className="text-gray-500 dark:text-gray-400" />
                                        )}
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                            {year}
                                        </h2>
                                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm font-medium">
                                            {yearSeasons.length} torneio{yearSeasons.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </button>

                                {/* Lista de Torneios do Ano */}
                                {expandedYears.has(year) && (
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {yearSeasons.map(season => (
                                            <div key={season.id} className="bg-white dark:bg-gray-800 p-6 relative overflow-hidden">
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                                                                {season.name}
                                                            </h3>
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(season.status)}`}>
                                                                {season.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button onClick={() => handleEdit(season)} className="text-sm">
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDelete(season)}
                                                                variant="outline"
                                                                className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20 text-sm"
                                                            >
                                                                Excluir
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                            <MapPin size={16} />
                                                            <span className="text-sm">{season.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                            <Calendar size={16} />
                                                            <span className="text-sm">{season.startDate} - {season.endDate}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                            <Users size={16} />
                                                            <span className="text-sm">{season.teamsCount || 0} times</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                            <Clock size={16} />
                                                            <span className="text-sm">{season.matchesPlayed || 0}/{season.matchesTotal || 0} partidas</span>
                                                        </div>
                                                    </div>

                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        <strong>Modalidades:</strong> {season.modalities}
                                                    </div>
                                                </div>
                                                <CardSplat />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSeason ? "Editar Torneio" : "Novo Torneio"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Nome do Torneio"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    >
                        <option value="">Selecione o tipo de torneio</option>
                        <option value="Meio do Ano">Meio do Ano</option>
                        <option value="Fim de Ano">Fim de Ano</option>
                    </Select>

                    <Input
                        label="Local"
                        placeholder="Digite o local"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Data de Início"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                        <Input
                            label="Data de Fim"
                            type="date"
                            value={formData.endDate}
                            min={formData.startDate} // Impede selecionar data anterior à data de início
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Modalidades (Automático)
                        </label>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {formData.modalities || 'Selecione o tipo de torneio'}
                        </div>
                    </div>

                    <Select
                        label="Status do Torneio"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                    >
                        <option value="PLANEJAMENTO">Planejamento</option>
                        <option value="EM ANDAMENTO">Em Andamento</option>
                        <option value="FINALIZADO">Finalizado</option>
                    </Select>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" onClick={closeModal} className="bg-gray-500">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingSeason ? 'Salvar' : 'Criar'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};
