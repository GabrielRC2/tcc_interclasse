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
    const [selectedModalidade, setSelectedModalidade] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('bracketsPage_selectedModalidade') || '';
        }
        return '';
    });
    const [selectedGenero, setSelectedGenero] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('bracketsPage_selectedGenero') || '';
        }
        return '';
    });
    const [generos] = useState(['Masculino', 'Feminino']);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadModalidades();
    }, []);

    useEffect(() => {
        loadData();
    }, [selectedModalidade, selectedGenero, selectedTournament]);

    // Persistir filtros no localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('bracketsPage_selectedModalidade', selectedModalidade);
        }
    }, [selectedModalidade]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('bracketsPage_selectedGenero', selectedGenero);
        }
    }, [selectedGenero]);

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

    const gerarEliminatorias = async (faseEscolhida = null) => {
        console.log('=== DEBUG gerarEliminatorias ===');
        console.log('selectedTournament:', selectedTournament);
        console.log('selectedModalidade:', selectedModalidade);
        console.log('selectedGenero:', selectedGenero);
        console.log('classificacao.length:', classificacao.length);
        console.log('faseEscolhida:', faseEscolhida);

        // Verificações mais robustas
        if (!selectedTournament) {
            alert('Erro: Nenhum torneio selecionado');
            console.error('selectedTournament é null/undefined');
            return;
        }

        if (!selectedTournament.id) {
            alert('Erro: Torneio selecionado não tem ID válido');
            console.error('selectedTournament.id é null/undefined:', selectedTournament);
            return;
        }

        if (!selectedModalidade || !selectedGenero) {
            alert('Selecione modalidade e gênero antes de gerar eliminatórias.');
            return;
        }

        if (classificacao.length === 0) {
            alert('Nenhuma classificação encontrada. Complete a fase de grupos primeiro.');
            return;
        }

        const faseTexto = faseEscolhida || 'automática';
        const confirmar = window.confirm(`Gerar ${faseTexto} com base na classificação atual?`);
        if (!confirmar) return;

        try {
            // Verificação adicional antes de acessar propriedades
            if (!selectedTournament?.id) {
                alert('Erro: Torneio não selecionado ou ID inválido');
                return;
            }

            const bodyData = {
                torneioId: selectedTournament.id,
                modalidadeId: selectedModalidade,
                genero: selectedGenero,
                faseEscolhida: faseEscolhida
            };

            console.log('Enviando para API:', bodyData);

            const response = await fetch('/api/eliminatorias/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            if (response.ok) {
                const result = await response.json();

                let mensagem = `${result.fase} gerada com sucesso!\n`;
                mensagem += `${result.timesClassificados} times classificados\n`;
                mensagem += `${result.partidasCriadas} partidas criadas`;

                if (result.detalhes?.fasesExistentes?.length > 0) {
                    mensagem += `\n\nFases já criadas: ${result.detalhes.fasesExistentes.join(', ')}`;
                }

                alert(mensagem);
                await loadEliminatorias();
                await loadClassificacao(); // Recarregar classificação
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao gerar eliminatórias');
            }
        } catch (error) {
            console.error('Erro ao gerar eliminatórias:', error);
            alert('Erro ao gerar eliminatórias');
        }
    };

    const mostrarOpcoesEliminatorias = () => {
        console.log('=== DEBUG mostrarOpcoesEliminatorias ===');
        console.log('selectedTournament:', selectedTournament);
        console.log('selectedModalidade:', selectedModalidade);
        console.log('selectedGenero:', selectedGenero);
        console.log('classificacao:', classificacao);

        if (!selectedTournament || !selectedModalidade || !selectedGenero) {
            alert('Selecione torneio, modalidade e gênero antes de gerar eliminatórias.');
            return;
        }

        const numTimes = classificacao.length;
        console.log('numTimes:', numTimes);

        // Se não há classificação, pode ser que seja uma fase subsequente
        if (numTimes === 0) {
            const confirmar = window.confirm('Não há classificação dos grupos carregada. Deseja tentar gerar a próxima fase das eliminatórias baseada nos vencedores da fase anterior?');
            if (confirmar) {
                gerarEliminatorias(); // Sem especificar fase, deixa a API decidir
            }
            return;
        }

        const opcoes = [];

        if (numTimes >= 16) opcoes.push('Oitavas de Final');
        if (numTimes >= 8) opcoes.push('Quartas de Final');
        if (numTimes >= 4) opcoes.push('Semifinais');
        if (numTimes >= 2) opcoes.push('Final');

        console.log('opcoes disponíveis:', opcoes);

        if (opcoes.length <= 1) {
            // Se só há uma opção, gerar diretamente
            console.log('Gerando diretamente:', opcoes[0]);
            gerarEliminatorias(opcoes[0]);
            return;
        }

        // Mostrar modal com opções
        let prompt = `Escolha a fase inicial das eliminatórias:\n`;
        prompt += opcoes.map((op, i) => `${i + 1}. ${op}`).join('\n');
        prompt += `\n${opcoes.length + 1}. Deixar a API decidir automaticamente`;
        prompt += '\n\nDigite o número da opção:';

        const escolha = window.prompt(prompt);

        console.log('escolha do usuário:', escolha);

        if (escolha) {
            const indice = parseInt(escolha) - 1;
            if (indice >= 0 && indice < opcoes.length) {
                const faseEscolhida = opcoes[indice];
                console.log('faseEscolhida:', faseEscolhida);
                gerarEliminatorias(faseEscolhida);
            } else if (indice === opcoes.length) {
                console.log('Deixando API decidir automaticamente');
                gerarEliminatorias(); // Sem especificar fase
            }
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
        <div className="space-y-8 font-inter">
            <div className="flex flex-wrap justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">CHAVEAMENTO</h1>
                    {selectedTournament && (
                        <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                            Torneio: {selectedTournament.name}
                        </p>
                    )}
                </div>
            </div>

            {!selectedTournament ? (
                <div className="text-center py-16">
                    <Trophy size={56} className="mx-auto text-slate-300 mb-6" />
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                        Selecione um torneio no Dashboard primeiro
                    </p>
                </div>
            ) : (
                <>
                    {/* Filtros */}
                    <div className="flex flex-wrap justify-between items-center gap-6">
                        <div className="w-full lg:w-2/3 xl:w-1/2">
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                <div className="flex flex-wrap justify-between items-center gap-6">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                    {/* Botão X para limpar filtros - dentro da caixa */}
                                    {(selectedModalidade || selectedGenero) && (
                                        <button
                                            onClick={() => {
                                                setSelectedModalidade('');
                                                setSelectedGenero('');
                                            }}
                                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                                            title="Limpar Filtros"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Botão Gerar Eliminatórias - fora da caixa, alinhado à direita */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="primary"
                                onClick={mostrarOpcoesEliminatorias}
                                disabled={!selectedTournament?.id || !selectedModalidade || !selectedGenero || classificacao.length === 0}
                                className="bg-gradient-to-r from-red-500 to-red-600 font-semibold"
                            >
                                <Trophy className="mr-2" size={16} />
                                Gerar Eliminatórias
                            </Button>
                        </div>
                    </div>

                    {/* Fase de Grupos */}
                    {gruposData.length > 0 && (
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl p-8 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                        <Users size={24} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    FASE DE GRUPOS
                                </h2>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {gruposData.map(grupo => (
                                        <div key={grupo.nome} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-slate-600">
                                                Grupo {grupo.nome}
                                            </h3>
                                            <div className="space-y-3">
                                                {grupo.times.map(time => (
                                                    <div key={time.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex-1">
                                                            {time.nome}
                                                        </span>
                                                        <Trophy size={14} className="text-amber-500" />
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
                        <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl p-8 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                                        <Award size={24} className="text-teal-600 dark:text-teal-400" />
                                    </div>
                                    CLASSIFICAÇÃO GERAL
                                </h2>

                                <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
                                                <th className="text-left py-4 px-4 font-bold text-slate-700 dark:text-slate-300">Pos</th>
                                                <th className="text-left py-4 px-4 font-bold text-slate-700 dark:text-slate-300">Time</th>
                                                <th className="text-center py-4 px-3 font-bold text-slate-700 dark:text-slate-300">PTS</th>
                                                <th className="text-center py-4 px-2 font-bold text-slate-700 dark:text-slate-300">J</th>
                                                <th className="text-center py-4 px-2 font-bold text-slate-700 dark:text-slate-300">V</th>
                                                <th className="text-center py-4 px-2 font-bold text-slate-700 dark:text-slate-300">E</th>
                                                <th className="text-center py-4 px-2 font-bold text-slate-700 dark:text-slate-300">D</th>
                                                <th className="text-center py-4 px-2 font-bold text-slate-700 dark:text-slate-300">GP</th>
                                                <th className="text-center py-4 px-2 font-bold text-slate-700 dark:text-slate-300">GC</th>
                                                <th className="text-center py-4 px-3 font-bold text-slate-700 dark:text-slate-300">SG</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classificacao.map((time, index) => (
                                                <tr key={time.timeId} className={`${index < 8 ? 'bg-teal-50 dark:bg-teal-900 border-l-4 border-l-teal-400' : 'bg-white dark:bg-slate-800'} border-b border-slate-100 dark:border-slate-700`}>
                                                    <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                        {index < 3 ? (
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                                                index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                                                                    'bg-gradient-to-r from-amber-600 to-amber-700'
                                                                }`}>
                                                                {index + 1}
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                                {index + 1}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-100 cursor-pointer">{time.nome}</td>
                                                    <td className="py-4 px-3 text-center font-bold text-blue-600 dark:text-blue-400 text-base">{time.pontos}</td>
                                                    <td className="py-4 px-2 text-center text-slate-600 dark:text-slate-400">{time.jogos}</td>
                                                    <td className="py-4 px-2 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{time.vitorias}</td>
                                                    <td className="py-4 px-2 text-center text-amber-600 dark:text-amber-400 font-semibold">{time.empates}</td>
                                                    <td className="py-4 px-2 text-center text-rose-600 dark:text-rose-400 font-semibold">{time.derrotas}</td>
                                                    <td className="py-4 px-2 text-center text-slate-600 dark:text-slate-400">{time.golsPro}</td>
                                                    <td className="py-4 px-2 text-center text-slate-600 dark:text-slate-400">{time.golsContra}</td>
                                                    <td className="py-4 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                                                        <span className={time.saldoGols > 0 ? 'text-emerald-600 dark:text-emerald-400' : time.saldoGols < 0 ? 'text-rose-600 dark:text-rose-400' : ''}>
                                                            {time.saldoGols > 0 ? '+' : ''}{time.saldoGols}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {classificacao.length > 8 && (
                                    <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-900 rounded-xl border border-teal-200 dark:border-teal-700">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-teal-100 dark:bg-teal-800 rounded-lg">
                                                <Trophy size={18} className="text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">
                                                <strong>Classificados para {determinarFase(Math.min(classificacao.length, 16))}:</strong> Primeiros {Math.min(classificacao.length, 16)} colocados (destacados em verde-água)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <CardSplat />
                        </div>
                    )}

                    {/* Eliminatórias */}
                    {eliminatorias.length > 0 && (
                        <div className="bg-gradient-to-br from-slate-50 to-red-50/30 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl p-8 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                        <Target size={24} className="text-red-600 dark:text-red-400" />
                                    </div>
                                    FASE ELIMINATÓRIA
                                </h2>

                                <div className="space-y-8">
                                    {eliminatorias.map(fase => (
                                        <div key={fase.fase} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6 pb-3 border-b border-slate-200 dark:border-slate-600 flex items-center gap-3">
                                                <div className="w-2 h-8 bg-gradient-to-b from-red-400 to-red-600 rounded-full"></div>
                                                {fase.fase} - {fase.partidas[0].modalidade}
                                            </h3>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                {fase.partidas.map((partida, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                                                                {partida.time1}
                                                            </span>
                                                        </div>
                                                        <div className="text-center px-4">
                                                            {partida.resultado ? (
                                                                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded-lg">
                                                                    {partida.resultado}
                                                                </span>
                                                            ) : (
                                                                <span className="font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">VS</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 flex-1 justify-end">
                                                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                                                                {partida.time2}
                                                            </span>
                                                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
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
                        <div className="text-center py-16">
                            <Calendar size={56} className="mx-auto text-slate-300 mb-6" />
                            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
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
