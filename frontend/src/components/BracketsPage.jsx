'use client';
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar } from 'lucide-react';
import { Button, Select, CardSplat } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';

export const BracketsPage = () => {
    const { selectedTournament } = useTournament();
    const [modalidades, setModalidades] = useState([]);
    const [chaveamento, setChaveamento] = useState([]);
    const [selectedModalidade, setSelectedModalidade] = useState('');
    const [selectedGenero, setSelectedGenero] = useState('');
    const [generos] = useState(['Masculino', 'Feminino']);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadModalidades();
    }, []);

    useEffect(() => {
        loadChaveamento();
    }, [selectedModalidade, selectedGenero, selectedTournament]);

    const loadModalidades = async () => {
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

    const loadChaveamento = async () => {
        if (!selectedTournament || !selectedModalidade || !selectedGenero) {
            setChaveamento([]);
            return;
        }

        try {
            const response = await fetch(`/api/chaveamento?torneioId=${selectedTournament.id}&modalidadeId=${selectedModalidade}&genero=${selectedGenero}`);
            const data = await response.json();
            setChaveamento(data);
        } catch (error) {
            console.error('Erro ao carregar chaveamento:', error);
            setChaveamento([]);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Carregando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CHAVEAMENTO</h1>
                    {selectedTournament && (
                        <p className="text-gray-500 dark:text-gray-400">
                            Torneio: {selectedTournament.name}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Modalidade"
                                value={selectedModalidade}
                                onChange={(e) => {
                                    setSelectedModalidade(e.target.value);
                                    setSelectedGenero('');
                                    setChaveamento([]);
                                }}
                            >
                                <option value="">Selecione a modalidade</option>
                                {modalidades.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                ))}
                            </Select>

                            <Select
                                label="Gênero"
                                value={selectedGenero}
                                onChange={(e) => setSelectedGenero(e.target.value)}
                            >
                                <option value="">Selecione o gênero</option>
                                {generos.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {/* Chaveamento por Grupos */}
                    {chaveamento.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                {selectedModalidade && selectedGenero
                                    ? 'Nenhum chaveamento encontrado. Realize o sorteio dos grupos primeiro.'
                                    : 'Selecione Modalidade e Gênero'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {chaveamento.map(grupoData => (
                                <div key={grupoData.grupo} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                                            GRUPO {grupoData.grupo}
                                        </h2>

                                        {/* Times do Grupo */}
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                Times Participantes ({grupoData.times.length})
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {grupoData.times.map(time => (
                                                    <div key={time.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                                        <Trophy size={14} className="text-yellow-500" />
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            {time.nome}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            ({time.curso})
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Rodadas */}
                                        <div className="space-y-4">
                                            {grupoData.rodadas.map(rodada => (
                                                <div key={rodada.numero} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3">
                                                        Rodada {rodada.numero}
                                                    </h4>
                                                    <div className="grid gap-2">
                                                        {rodada.partidas.map((partida, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                                                <div className="flex items-center gap-4">
                                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                        {partida.time1}
                                                                    </span>
                                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                        ({partida.time1Curso})
                                                                    </span>
                                                                </div>
                                                                <span className="font-bold text-blue-600 dark:text-blue-400 mx-4">VS</span>
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                        ({partida.time2Curso})
                                                                    </span>
                                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                        {partida.time2}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <CardSplat />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
