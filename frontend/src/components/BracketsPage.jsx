'use client';
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Target, Award } from 'lucide-react';
import { Button, Select, CardSplat } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';

export const BracketsPage = () => {
    const { selectedTournament } = useTournament();
    const [modalidades, setModalidades] = useState([]);
    const [gruposData, setGruposData] = useState([]);
    const [classificacao, setClassificacao] = useState([]);
    const [eliminatorias, setEliminatorias] = useState([]);
    const [selectedModalidade, setSelectedModalidade] = useState('');
    const [selectedGenero, setSelectedGenero] = useState('');
    const [generos] = useState(['Masculino', 'Feminino']);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadModalidades();
    }, []);

    useEffect(() => {
        loadData();
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

    const loadData = async () => {
        if (!selectedTournament || !selectedModalidade || !selectedGenero) {
            setGruposData([]);
            setClassificacao([]);
            setEliminatorias([]);
            return;
        }

        await Promise.all([
            loadGrupos(),
            loadClassificacao(),
            loadEliminatorias()
        ]);
    };

    const loadGrupos = async () => {
        try {
            const response = await fetch(`/api/grupos?torneioId=${selectedTournament.id}&modalidadeId=${selectedModalidade}&genero=${selectedGenero}`);
            const data = await response.json();
            setGruposData(data);
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
            setGruposData([]);
        }
    };

    const loadClassificacao = async () => {
        try {
            const response = await fetch(`/api/classificacao?torneioId=${selectedTournament.id}&modalidadeId=${selectedModalidade}&genero=${selectedGenero}`);
            const data = await response.json();
            setClassificacao(data.classificacao || []);
        } catch (error) {
            console.error('Erro ao carregar classificação:', error);
            setClassificacao([]);
        }
    };

    const loadEliminatorias = async () => {
        try {
            const response = await fetch(`/api/eliminatorias?torneioId=${selectedTournament.id}&modalidadeId=${selectedModalidade}&genero=${selectedGenero}`);
            const data = await response.json();
            setEliminatorias(data.eliminatorias || []);
        } catch (error) {
            console.error('Erro ao carregar eliminatórias:', error);
            setEliminatorias([]);
        }
    };

    const gerarEliminatorias = async () => {
        if (classificacao.length === 0) {
            alert('Nenhuma classificação encontrada. Complete a fase de grupos primeiro.');
            return;
        }

        const confirmar = window.confirm(`Gerar fase eliminatória com ${classificacao.length} times classificados?`);
        if (!confirmar) return;

        try {
            const response = await fetch('/api/eliminatorias/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    torneioId: selectedTournament.id,
                    modalidadeId: selectedModalidade,
                    genero: selectedGenero
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Eliminatórias geradas com sucesso! ${result.partidasGeradas} partidas criadas.`);
                await loadEliminatorias();
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao gerar eliminatórias');
            }
        } catch (error) {
            console.error('Erro ao gerar eliminatórias:', error);
            alert('Erro ao gerar eliminatórias');
        }
    };

    const determinarFase = (totalTimes) => {
        if (totalTimes >= 9) return 'Oitavas de Final';
        if (totalTimes >= 5) return 'Quartas de Final';
        if (totalTimes === 4) return 'Semifinal';
        if (totalTimes === 3) return 'Triangular Final';
        if (totalTimes === 2) return 'Final';
        return 'Final';
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
                <div className="flex gap-2">
                    <Button 
                        onClick={gerarEliminatorias} 
                        disabled={classificacao.length === 0}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        <Target className="mr-2" size={16} />
                        Gerar Eliminatórias
                    </Button>
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

                    {/* Fase de Grupos */}
                    {gruposData.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                    <Users size={24} className="text-blue-500" />
                                    FASE DE GRUPOS
                                </h2>

                                <div className="grid gap-4">
                                    {gruposData.map(grupo => (
                                        <div key={grupo.nome} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">
                                                Grupo {grupo.nome}
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {grupo.times.map(time => (
                                                    <div key={time.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                                        <Trophy size={14} className="text-yellow-500" />
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                            {time.nome}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <CardSplat />
                        </div>
                    )}

                    {/* Classificação */}
                    {classificacao.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                    <Award size={24} className="text-green-500" />
                                    CLASSIFICAÇÃO GERAL
                                </h2>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-600">
                                                <th className="text-left py-2 px-2 font-semibold">Pos</th>
                                                <th className="text-left py-2 px-2 font-semibold">Time</th>
                                                <th className="text-center py-2 px-2 font-semibold">PTS</th>
                                                <th className="text-center py-2 px-2 font-semibold">J</th>
                                                <th className="text-center py-2 px-2 font-semibold">V</th>
                                                <th className="text-center py-2 px-2 font-semibold">E</th>
                                                <th className="text-center py-2 px-2 font-semibold">D</th>
                                                <th className="text-center py-2 px-2 font-semibold">GP</th>
                                                <th className="text-center py-2 px-2 font-semibold">GC</th>
                                                <th className="text-center py-2 px-2 font-semibold">SG</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classificacao.map((time, index) => (
                                                <tr key={time.timeId} className={`${index < 8 ? 'bg-green-50 dark:bg-green-900/20' : ''} border-b border-gray-100 dark:border-gray-700`}>
                                                    <td className="py-2 px-2 font-bold">{index + 1}°</td>
                                                    <td className="py-2 px-2 font-medium">{time.nome}</td>
                                                    <td className="py-2 px-2 text-center font-bold text-blue-600 dark:text-blue-400">{time.pontos}</td>
                                                    <td className="py-2 px-2 text-center">{time.jogos}</td>
                                                    <td className="py-2 px-2 text-center text-green-600 dark:text-green-400">{time.vitorias}</td>
                                                    <td className="py-2 px-2 text-center text-yellow-600 dark:text-yellow-400">{time.empates}</td>
                                                    <td className="py-2 px-2 text-center text-red-600 dark:text-red-400">{time.derrotas}</td>
                                                    <td className="py-2 px-2 text-center">{time.golsPro}</td>
                                                    <td className="py-2 px-2 text-center">{time.golsContra}</td>
                                                    <td className="py-2 px-2 text-center font-semibold">{time.saldoGols > 0 ? '+' : ''}{time.saldoGols}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {classificacao.length > 8 && (
                                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            <strong>Classificados para {determinarFase(Math.min(classificacao.length, 16))}:</strong> Primeiros {Math.min(classificacao.length, 16)} colocados (destacados em verde)
                                        </p>
                                    </div>
                                )}
                            </div>
                            <CardSplat />
                        </div>
                    )}

                    {/* Eliminatórias */}
                    {eliminatorias.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                    <Target size={24} className="text-red-500" />
                                    FASE ELIMINATÓRIA
                                </h2>

                                <div className="space-y-6">
                                    {eliminatorias.map(fase => (
                                        <div key={fase.fase} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
                                                {fase.fase}
                                            </h3>
                                            <div className="grid gap-3">
                                                {fase.partidas.map((partida, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                                        <div className="flex items-center gap-4">
                                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                {partida.time1}
                                                            </span>
                                                        </div>
                                                        <div className="text-center">
                                                            {partida.resultado ? (
                                                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                                                    {partida.resultado}
                                                                </span>
                                                            ) : (
                                                                <span className="font-bold text-gray-400">VS</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4">
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
                    )}

                    {/* Estado vazio */}
                    {gruposData.length === 0 && classificacao.length === 0 && (
                        <div className="text-center py-12">
                            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                {selectedModalidade && selectedGenero
                                    ? 'Nenhum chaveamento encontrado. Realize o sorteio dos grupos primeiro.'
                                    : 'Selecione Modalidade e Gênero'
                                }
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
