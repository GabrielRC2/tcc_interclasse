'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Trophy, Filter } from 'lucide-react';
import { Button, Select } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';

export const MatchesPage = () => {
    const { selectedTournament } = useTournament();
    const [matches, setMatches] = useState([]);
    const [filteredMatches, setFilteredMatches] = useState([]);
    const [modalidades, setModalidades] = useState([]);
    const [selectedModalidade, setSelectedModalidade] = useState('');
    const [selectedGenero, setSelectedGenero] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [generos] = useState(['Masculino', 'Feminino']);
    const [statusOptions] = useState(['Agendada', 'Em andamento', 'Finalizada', 'Cancelada']);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadMatches();
    }, [selectedTournament, selectedModalidade, selectedGenero]);

    useEffect(() => {
        applyFilters();
    }, [matches, selectedStatus]);

    const loadInitialData = async () => {
        try {
            const response = await fetch('/api/modalidades');
            const data = await response.json();
            setModalidades(data);
        } catch (error) {
            console.error('Erro ao carregar modalidades:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMatches = async () => {
        if (!selectedTournament) {
            setMatches([]);
            return;
        }

        try {
            let url = `/api/partidas?torneioId=${selectedTournament.id}`;

            if (selectedModalidade && selectedGenero) {
                url += `&modalidadeId=${selectedModalidade}&genero=${selectedGenero}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            console.log('Partidas carregadas:', data.length);
            setMatches(data);
        } catch (error) {
            console.error('Erro ao carregar partidas:', error);
            setMatches([]);
        }
    };

    const applyFilters = () => {
        let filtered = [...matches];

        if (selectedStatus) {
            filtered = filtered.filter(match => match.status === selectedStatus);
        }

        setFilteredMatches(filtered);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Finalizada': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Em andamento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Agendada': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Carregando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">PARTIDAS</h1>
                    {selectedTournament && (
                        <p className="text-gray-500 dark:text-gray-400">
                            Torneio: {selectedTournament.name} • {filteredMatches.length} partidas
                        </p>
                    )}
                </div>
            </div>

            {!selectedTournament ? (
                <div className="text-center py-12">
                    <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        Selecione um torneio no Dashboard primeiro
                    </p>
                </div>
            ) : (
                <>
                    {/* Filtros */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Select
                                label="Modalidade"
                                value={selectedModalidade}
                                onChange={(e) => {
                                    setSelectedModalidade(e.target.value);
                                    setSelectedGenero('');
                                }}
                            >
                                <option value="">Todas as modalidades</option>
                                {modalidades.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                ))}
                            </Select>

                            <Select
                                label="Gênero"
                                value={selectedGenero}
                                onChange={(e) => setSelectedGenero(e.target.value)}
                                disabled={!selectedModalidade}
                            >
                                <option value="">Todos os gêneros</option>
                                {generos.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </Select>

                            <Select
                                label="Status"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="">Todos os status</option>
                                {statusOptions.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </Select>

                            <div className="flex items-end">
                                <Button
                                    onClick={() => {
                                        setSelectedModalidade('');
                                        setSelectedGenero('');
                                        setSelectedStatus('');
                                    }}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <Filter size={16} className="mr-2" />
                                    Limpar Filtros
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Partidas */}
                    {filteredMatches.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                {matches.length === 0
                                    ? 'Nenhuma partida encontrada. Gere o chaveamento primeiro.'
                                    : 'Nenhuma partida corresponde aos filtros selecionados.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                    📋 Ordem Otimizada de Partidas
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    As partidas abaixo foram organizadas automaticamente para maximizar o tempo de descanso entre jogos dos times,
                                    garantindo uma distribuição equilibrada ao longo do torneio.
                                </p>
                            </div>

                            {filteredMatches.map((match) => (
                                <div key={match.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                                    <div className="flex flex-wrap justify-between items-start gap-4">
                                        {/* Info da Partida */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Partida #{match.ordem}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    Grupo {match.grupo}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                                                    {match.status}
                                                </span>
                                            </div>

                                            {/* Times */}
                                            <div className="flex items-center justify-center gap-4 mb-4">
                                                <div className="text-center">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                        {match.team1}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {match.team1Course}
                                                    </p>
                                                </div>

                                                <div className="text-center px-4">
                                                    {match.result ? (
                                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                            {match.result}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xl font-bold text-gray-400">
                                                            VS
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-center">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                        {match.team2}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {match.team2Course}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Detalhes */}
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Trophy size={14} />
                                                    <span>{match.modality} • {match.category}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    <span>{match.date}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    <span>{match.time}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    <span>{match.location}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
