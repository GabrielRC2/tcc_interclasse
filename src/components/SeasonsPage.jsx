'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Trophy, Users, Clock, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, Select, CardSplat } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import { ModalidadesModal } from '@/components/ModalidadesModal';
import { HelpModal, HelpButton } from '@/components/HelpModal';

export const SeasonsPage = () => {
    const toast = useToast();
    const confirm = useConfirm();
    // Estados de controle de usuário
    const [currentUser, setCurrentUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    
    const [seasons, setSeasons] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalidadesModalOpen, setIsModalidadesModalOpen] = useState(false);
    const [torneioSelecionado, setTorneioSelecionado] = useState(null);
    const [editingSeason, setEditingSeason] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedYears, setExpandedYears] = useState(new Set());
    const [showHelp, setShowHelp] = useState(false);

    const { refreshTournaments } = useTournament();

    const [formData, setFormData] = useState({
        name: '',
        location: 'ETEC João Belarmino',
        startDate: '',
        endDate: '',
        status: 'PLANEJAMENTO'
    });

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
                status: season.status
            });
        }
        setIsModalOpen(true);
    };

    const handleGerenciarModalidades = (season) => {
        setTorneioSelecionado(season);
        setIsModalidadesModalOpen(true);
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
        return <div className="flex justify-center items-center h-64 text-gray-600 dark:text-gray-400">Carregando...</div>;
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
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="flex items-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">TORNEIOS</h1>
                        <HelpButton onClick={() => setShowHelp(true)} />
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto">
                        <Plus size={20} className="mr-2" />
                        Novo Torneio
                    </Button>
                </div>

                <div className="space-y-4">
                    {Object.keys(groupedSeasons).length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center">
                            <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Nenhum torneio encontrado</p>
                            <Button onClick={() => setIsModalOpen(true)}>
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
                                                            <Button
                                                                onClick={() => handleGerenciarModalidades(season)}
                                                                className="bg-purple-600 hover:bg-purple-700 text-sm"
                                                            >
                                                                <Settings size={16} className="mr-1" />
                                                                Modalidades
                                                            </Button>
                                                            <Button onClick={() => handleEdit(season)} className="text-sm">
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDelete(season)}
                                                                className="bg-red-600 hover:bg-red-700 text-sm"
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
                                                        <strong>Modalidades:</strong> {Array.isArray(season.modalities) ? season.modalities.join(', ') : (season.modalities || 'Nenhuma')}
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

            <ModalidadesModal
                isOpen={isModalidadesModalOpen}
                onClose={() => setIsModalidadesModalOpen(false)}
                torneio={torneioSelecionado}
                onUpdate={loadSeasons}
            />
            
            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title="Ajuda - Temporadas"
                sections={[
                    {
                        title: "O que é a página de Temporadas?",
                        content: "Esta página gerencia os torneios (temporadas) do sistema. Cada torneio representa um evento competitivo, como 'Meio do Ano 2025' ou 'Fim de Ano 2025', onde acontecem as partidas de diferentes modalidades esportivas."
                    },
                    {
                        title: "Visualizando Torneios",
                        content: [
                            "Os torneios são organizados por ano em seções expansíveis",
                            "Cada card mostra: nome, status, período, local e quantidade de times",
                            "As estatísticas incluem número de partidas totais e finalizadas",
                            "Clique no ano para expandir/recolher os torneios daquele período"
                        ]
                    },
                    {
                        title: "Criando um Torneio",
                        content: [
                            "Clique em 'Novo Torneio' no topo da página",
                            "Preencha: nome (ex: Meio do Ano 2025), local, datas de início e fim",
                            "Selecione o status inicial (geralmente 'Planejamento')",
                            "O ano é extraído automaticamente da data de início",
                            "Após criar, use 'Gerenciar Modalidades' para vincular esportes"
                        ]
                    },
                    {
                        title: "Gerenciando Modalidades",
                        content: [
                            "Clique no ícone de engrenagem (⚙️) no card do torneio",
                            "Selecione quais modalidades farão parte do torneio",
                            "Marque/desmarque: Futsal, Vôlei, Handebol, Basquete",
                            "As modalidades vinculadas aparecerão nas outras páginas do sistema",
                            "Você pode alterar as modalidades a qualquer momento"
                        ]
                    },
                    {
                        title: "Status do Torneio",
                        content: [
                            "PLANEJAMENTO: Torneio em fase de organização, times podem ser ajustados",
                            "EM ANDAMENTO: Torneio ativo com partidas acontecendo",
                            "FINALIZADO: Torneio concluído, não permite mais alterações",
                            "O status afeta as permissões de edição em outras partes do sistema"
                        ]
                    },
                    {
                        title: "Editando Torneios",
                        content: [
                            "Clique no ícone de lápis no card do torneio",
                            "Você pode alterar: nome, local, datas e status",
                            "Cuidado ao alterar datas de torneios com partidas agendadas",
                            "O sistema mantém a integridade dos dados relacionados"
                        ]
                    },
                    {
                        title: "Excluindo Torneios",
                        content: [
                            "Clique no ícone de lixeira no card do torneio",
                            "Confirme a exclusão na mensagem de aviso",
                            "ATENÇÃO: Excluir um torneio remove todos os dados relacionados:",
                            "Times, partidas, grupos, chaveamentos e estatísticas",
                            "Esta ação não pode ser desfeita, use com cautela"
                        ]
                    },
                    {
                        title: "Dicas Importantes",
                        content: [
                            "Crie o torneio primeiro, depois vincule as modalidades",
                            "Mantenha nomes claros e descritivos (ex: 'Interclasse 2025 - 1º Semestre')",
                            "Defina datas realistas que permitam tempo para organização",
                            "Use o status 'Planejamento' enquanto organiza times e grupos",
                            "Só mude para 'Em Andamento' quando as partidas começarem"
                        ]
                    }
                ]}
            />
        </>
    );
};
