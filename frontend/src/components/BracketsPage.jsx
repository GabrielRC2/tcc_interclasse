'use client';
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Target, Award } from 'lucide-react';
import { Button, Select, CardSplat } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';

export const BracketsPage = () => {
    const { selectedTournament } = useTournament();
    const toast = useToast();
    const confirm = useConfirm();
    const [modalidadesDisponiveis, setModalidadesDisponiveis] = useState([]);
    const [gruposData, setGruposData] = useState([]);
    const [classificacao, setClassificacao] = useState([]);
    const [classificacoesPorGrupo, setClassificacoesPorGrupo] = useState({}); // Novo estado
    const [eliminatorias, setEliminatorias] = useState([]);
    
    // Agora usando modalidade+gênero combinados
    const [modalidadeSelecionada, setModalidadeSelecionada] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [classificacaoGeralExpandida, setClassificacaoGeralExpandida] = useState(false);

    useEffect(() => {
        if (selectedTournament) {
            carregarGruposDisponiveis();
        } else {
            setModalidadesDisponiveis([]);
        }
    }, [selectedTournament]);

    useEffect(() => {
        loadData();
    }, [modalidadeSelecionada, selectedTournament]);

    const carregarGruposDisponiveis = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/grupos-disponiveis?torneioId=${selectedTournament.id}`);
            if (response.ok) {
                const data = await response.json();
                setModalidadesDisponiveis(data);
            } else {
                console.error('Erro ao carregar grupos disponíveis');
            }
        } catch (error) {
            console.error('Erro ao carregar grupos disponíveis:', error);
        }
        setLoading(false);
    };

    // Função para selecionar modalidade+gênero combinados
    const selecionarModalidade = (modalidade) => {
        setModalidadeSelecionada(modalidade);
    };

    const loadData = async () => {
        if (!selectedTournament || !modalidadeSelecionada) {
            setGruposData([]);
            setClassificacao([]);
            setClassificacoesPorGrupo({});
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
            const response = await fetch(`/api/grupos?torneioId=${selectedTournament.id}&modalidadeId=${modalidadeSelecionada.modalidadeId}&genero=${modalidadeSelecionada.genero}`);
            const data = await response.json();
            setGruposData(data);

            // Carregar classificações individuais para cada grupo
            if (data.length > 0) {
                await loadClassificacoesPorGrupo(data);
            } else {
                setClassificacoesPorGrupo({});
            }
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
            setGruposData([]);
            setClassificacoesPorGrupo({});
        }
    };

    const loadClassificacoesPorGrupo = async (grupos) => {
        try {
            const classificacoesPorGrupo = {};
            
            // Carregar classificação para cada grupo individualmente
            await Promise.all(grupos.map(async (grupo) => {
                try {
                    // CORREÇÃO: Adicionar filtro de gênero para manter consistência
                    const params = new URLSearchParams({
                        torneioId: selectedTournament.id.toString(),
                        grupoId: grupo.id.toString()
                    });
                    
                    // Adicionar filtro de gênero se disponível
                    if (modalidadeSelecionada?.genero) {
                        params.append('genero', modalidadeSelecionada.genero);
                    }
                    
                    const url = `/api/classificacao?${params.toString()}`;
                    const response = await fetch(url);
                    
                    if (!response.ok) {
                        console.error(`Erro ${response.status} ao carregar classificação do grupo ${grupo.nome}`);
                        classificacoesPorGrupo[grupo.nome] = [];
                        return;
                    }
                    
                    const data = await response.json();
                    classificacoesPorGrupo[grupo.nome] = data.classificacao || [];
                } catch (error) {
                    console.error(`Erro ao carregar classificação do grupo ${grupo.nome}:`, error);
                    classificacoesPorGrupo[grupo.nome] = [];
                }
            }));

            setClassificacoesPorGrupo(classificacoesPorGrupo);
        } catch (error) {
            console.error('Erro ao carregar classificações por grupo:', error);
            setClassificacoesPorGrupo({});
        }
    };

    const loadClassificacao = async () => {
        try {
            // Buscar classificação geral da modalidade/gênero selecionados (todos os grupos)
            const response = await fetch(`/api/classificacao?torneioId=${selectedTournament.id}&modalidadeId=${modalidadeSelecionada.modalidadeId}&genero=${modalidadeSelecionada.genero}&classificacaoGeral=true`);
            const data = await response.json();
            setClassificacao(data.classificacao || []);
        } catch (error) {
            console.error('Erro ao carregar classificação:', error);
            setClassificacao([]);
        }
    };

    const loadEliminatorias = async () => {
        try {
            const response = await fetch(`/api/eliminatorias?torneioId=${selectedTournament.id}&modalidadeId=${modalidadeSelecionada.modalidadeId}&genero=${modalidadeSelecionada.genero}`);
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
        console.log('modalidadeSelecionada:', modalidadeSelecionada);
        console.log('classificacao.length:', classificacao.length);
        console.log('faseEscolhida:', faseEscolhida);

        // Verificações mais robustas
        if (!selectedTournament) {
            toast.error('Erro: Nenhum torneio selecionado');
            console.error('selectedTournament é null/undefined');
            return;
        }

        if (!selectedTournament.id) {
            toast.error('Erro: Torneio selecionado não tem ID válido');
            console.error('selectedTournament.id é null/undefined:', selectedTournament);
            return;
        }

        if (!modalidadeSelecionada) {
            toast.warning('Selecione modalidade e gênero antes de gerar eliminatórias.');
            return;
        }

        if (classificacao.length === 0) {
            toast.warning('Nenhuma classificação encontrada. Complete a fase de grupos primeiro.');
            return;
        }

        const faseTexto = faseEscolhida || 'automática';
        const confirmar = await confirm.info(`Gerar ${faseTexto} com base na classificação atual?`, {
            title: 'Gerar Eliminatórias',
            confirmText: 'Gerar',
            cancelText: 'Cancelar'
        });
        
        if (!confirmar) return;

        try {
            // Verificação adicional antes de acessar propriedades
            if (!selectedTournament?.id) {
                toast.error('Erro: Torneio não selecionado ou ID inválido');
                return;
            }

            const bodyData = {
                torneioId: selectedTournament.id,
                modalidadeId: modalidadeSelecionada.modalidadeId,
                genero: modalidadeSelecionada.genero,
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
                
                toast.success(mensagem);
                await loadEliminatorias();
                await loadClassificacao(); // Recarregar classificação
            } else {
                const error = await response.json();
                toast.error(error.error || 'Erro ao gerar eliminatórias');
            }
        } catch (error) {
            console.error('Erro ao gerar eliminatórias:', error);
            toast.error('Erro ao gerar eliminatórias');
        }
    };

    const mostrarOpcoesEliminatorias = async () => {
        console.log('=== DEBUG mostrarOpcoesEliminatorias ===');
        console.log('selectedTournament:', selectedTournament);
        console.log('modalidadeSelecionada:', modalidadeSelecionada);
        console.log('classificacao:', classificacao);

        if (!selectedTournament || !modalidadeSelecionada) {
            toast.warning('Selecione torneio e modalidade antes de gerar eliminatórias.');
            return;
        }

        const numTimes = classificacao.length;
        console.log('numTimes:', numTimes);

        // Se não há classificação, pode ser que seja uma fase subsequente
        if (numTimes === 0) {
            const confirmar = await confirm.info('Não há classificação dos grupos carregada. Deseja tentar gerar a próxima fase das eliminatórias baseada nos vencedores da fase anterior?', {
                title: 'Gerar Próxima Fase',
                confirmText: 'Gerar',
                cancelText: 'Cancelar'
            });
            
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
        const opcoesSelect = opcoes.map((op, i) => ({
            value: op,
            label: `${i+1}. ${op}`,
            description: `Gerar ${op}`
        }));
        
        // Adicionar opção automática
        opcoesSelect.push({
            value: 'auto',
            label: `${opcoes.length + 1}. Deixar a API decidir automaticamente`,
            description: 'A API escolherá a melhor fase baseada no número de times'
        });
        
        const escolha = await confirm.select(
            'Escolha a fase inicial das eliminatórias:',
            opcoesSelect,
            {
                title: 'Configurar Eliminatórias',
                confirmText: 'Gerar',
                cancelText: 'Cancelar',
                required: true
            }
        );
        
        console.log('escolha do usuário:', escolha);
        
        if (escolha) {
            if (escolha === 'auto') {
                // Deixar a API decidir automaticamente
                console.log('Deixando a API decidir automaticamente');
                gerarEliminatorias(); // Sem especificar fase
            } else {
                // Usar a fase escolhida
                console.log('faseEscolhida:', escolha);
                gerarEliminatorias(escolha);
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

    // Componente reutilizável para tabela de classificação
    const TabelaClassificacao = ({ dados, titulo, grupoEspecifico = false, classificacaoGeral = false }) => (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Award size={20} className={grupoEspecifico ? "text-blue-500" : "text-green-500"} />
                    {titulo}
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-600">
                                <th className="text-left py-2 px-2 font-semibold text-gray-900 dark:text-gray-100">Pos</th>
                                <th className="text-left py-2 px-2 font-semibold text-gray-900 dark:text-gray-100">Time</th>
                                {classificacaoGeral && (
                                    <th className="text-center py-2 px-2 font-semibold text-gray-900 dark:text-gray-100">Grupo</th>
                                )}
                                <th className="text-center py-2 px-2 font-semibold text-gray-900 dark:text-gray-100">PTS</th>
                                <th className="text-center py-2 px-2 font-semibold text-gray-900 dark:text-gray-100">J</th>
                                <th className="text-center py-2 px-2 font-semibold text-gray-900 dark:text-gray-100">V</th>
                                <th className="text-center py-2 px-2 font-semibold text-gray-900 dark:text-gray-100">E</th>
                                <th className="text-center py-2 px-2 font-semibold text-gray-900 dark:text-gray-100">D</th>
                                <th className="text-center py-2 px-2 font-semibold text-gray-900 dark:text-gray-100">GP</th>
                                <th className="text-center py-2 px-2 font-semibold text-gray-900 dark:text-gray-100">GC</th>
                                <th className="text-center py-2 px-2 font-semibold text-gray-900 dark:text-gray-100">SG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dados.map((time, index) => (
                                <tr key={time.timeId} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="py-2 px-2 font-bold text-gray-900 dark:text-gray-100">{index + 1}°</td>
                                    <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">{time.nome}</td>
                                    {classificacaoGeral && (
                                        <td className="py-2 px-2 text-center">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {time.grupo}
                                            </span>
                                        </td>
                                    )}
                                    <td className="py-2 px-2 text-center font-bold text-blue-600 dark:text-blue-400">{time.pontos}</td>
                                    <td className="py-2 px-2 text-center text-gray-900 dark:text-gray-100">{time.jogos}</td>
                                    <td className="py-2 px-2 text-center text-green-600 dark:text-green-400">{time.vitorias}</td>
                                    <td className="py-2 px-2 text-center text-yellow-600 dark:text-yellow-400">{time.empates}</td>
                                    <td className="py-2 px-2 text-center text-red-600 dark:text-red-400">{time.derrotas}</td>
                                    <td className="py-2 px-2 text-center text-gray-900 dark:text-gray-100">{time.golsPro}</td>
                                    <td className="py-2 px-2 text-center text-gray-900 dark:text-gray-100">{time.golsContra}</td>
                                    <td className="py-2 px-2 text-center font-semibold text-gray-900 dark:text-gray-100">{time.saldoGols > 0 ? '+' : ''}{time.saldoGols}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <CardSplat />
        </div>
    );

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600 dark:text-gray-400">Carregando...</div>;
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
                        onClick={mostrarOpcoesEliminatorias} 
                        disabled={!selectedTournament?.id || !modalidadeSelecionada || classificacao.length === 0}
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
                    {/* Seleção de Modalidade + Gênero com grupos disponíveis */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Modalidades com Grupos Criados
                        </h3>
                        
                        {modalidadesDisponiveis.length === 0 ? (
                            <div className="text-center py-8">
                                <Users size={32} className="mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    Nenhuma modalidade com grupos criados ainda
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                    Crie grupos primeiro na seção "Grupos"
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {modalidadesDisponiveis.map(modalidade => (
                                    <button
                                        key={`${modalidade.modalidadeId}-${modalidade.genero}`}
                                        type="button"
                                        onClick={() => selecionarModalidade(modalidade)}
                                        className={`p-6 rounded-lg border transition-all text-left ${
                                            modalidadeSelecionada && 
                                            modalidadeSelecionada.modalidadeId === modalidade.modalidadeId && 
                                            modalidadeSelecionada.genero === modalidade.genero
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-700'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <Users size={20} className="text-blue-500" />
                                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                                                {modalidade.modalidadeNome}
                                            </span>
                                            <span className={`text-sm px-3 py-1 rounded-full ${
                                                modalidade.genero === 'Masculino' 
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                                    : 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                                            }`}>
                                                {modalidade.genero}
                                            </span>
                                        </div>
                                        <p className="text-base text-gray-600 dark:text-gray-400">
                                            {modalidade.totalGrupos} grupo{modalidade.totalGrupos !== 1 ? 's' : ''} • {modalidade.totalTimes} time{modalidade.totalTimes !== 1 ? 's' : ''}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Fase de Grupos */}
                    {gruposData.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                    <Users size={24} className="text-blue-500" />
                                    FASE DE GRUPOS
                                </h2>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {gruposData.map(grupo => (
                                        <div key={grupo.nome} className="space-y-4">
                                            {/* Classificação do grupo */}
                                            {classificacoesPorGrupo[grupo.nome] && classificacoesPorGrupo[grupo.nome].length > 0 && (
                                                <TabelaClassificacao
                                                    dados={classificacoesPorGrupo[grupo.nome]}
                                                    titulo={`CLASSIFICAÇÃO - GRUPO ${grupo.nome}`}
                                                    grupoEspecifico={true}
                                                />
                                            )}
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
                                <div 
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 -m-3 rounded-lg transition-colors"
                                    onClick={() => setClassificacaoGeralExpandida(!classificacaoGeralExpandida)}
                                >
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <Award size={24} className="text-green-500" />
                                        CLASSIFICAÇÃO GERAL - {modalidadeSelecionada?.modalidade} {modalidadeSelecionada?.genero}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Todos os times da modalidade organizados por pontuação geral • Clique para {classificacaoGeralExpandida ? "minimizar" : "expandir"}
                                    </p>
                                </div>

                                {classificacaoGeralExpandida && (
                                    <div className="mt-6">
                                        <TabelaClassificacao
                                            dados={classificacao}
                                            titulo=""
                                            grupoEspecifico={false}
                                            classificacaoGeral={true}
                                        />
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
                                                {fase.fase} - {fase.partidas[0].modalidade}
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
                                {modalidadeSelecionada
                                    ? 'Nenhum chaveamento encontrado. Realize o sorteio dos grupos primeiro.'
                                    : 'Selecione uma modalidade e gênero'
                                }
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
