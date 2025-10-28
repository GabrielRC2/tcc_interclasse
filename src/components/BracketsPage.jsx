'use client';
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Target, Award } from 'lucide-react';
import { Button, Select, CardSplat } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import { HelpModal, HelpButton } from '@/components/HelpModal';

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
    const [loadingData, setLoadingData] = useState(false); // Loading específico para atualizações
    const [classificacaoGeralExpandida, setClassificacaoGeralExpandida] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [previousData, setPreviousData] = useState({
        grupos: [],
        classificacao: [],
        eliminatorias: []
    });

    useEffect(() => {
        if (selectedTournament) {
            carregarGruposDisponiveis();
        } else {
            setModalidadesDisponiveis([]);
            setLoading(false); // Se não há torneio, não precisamos mais do loading inicial
        }
    }, [selectedTournament]);

    useEffect(() => {
        if (selectedTournament && modalidadeSelecionada) {
            loadData();
        } else if (!selectedTournament) {
            // Limpar apenas quando não há torneio selecionado
            setGruposData([]);
            setClassificacao([]);
            setClassificacoesPorGrupo({});
            setEliminatorias([]);
            setLoading(false); // Garantir que loading seja false
        }
    }, [modalidadeSelecionada, selectedTournament]);

    const carregarGruposDisponiveis = async () => {
        // Usar loadingData em vez de loading para não esconder a página
        setLoadingData(true);
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
        setLoadingData(false);
        setLoading(false); // Só definir loading false após primeira carga
    };

    // Função para selecionar modalidade+gênero combinados
    const selecionarModalidade = (modalidade) => {
        setModalidadeSelecionada(modalidade);
    };

    const loadData = async () => {
        if (!selectedTournament || !modalidadeSelecionada) {
            // Não limpar os dados imediatamente para evitar flash
            // Apenas não recarregar se não há seleção
            return;
        }

        setLoadingData(true);
        
        // Preservar dados anteriores enquanto carrega
        setPreviousData({
            grupos: gruposData,
            classificacao: classificacao,
            eliminatorias: eliminatorias
        });
        
        try {
            await Promise.all([
                loadGrupos(),
                loadClassificacao(),
                loadEliminatorias()
            ]);
        } finally {
            setLoadingData(false);
            setLoading(false); // Garantir que após primeiro carregamento, loading seja false
        }
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
                
                // Recarregar dados sem mostrar loading global
                setLoadingData(true);
                try {
                    await Promise.all([
                        loadEliminatorias(),
                        loadClassificacao()
                    ]);
                } finally {
                    setLoadingData(false);
                }
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
            label: `${opcoes.length + 1}. Deixar o Sistema decidir automaticamente`,
            description: 'O Sistema escolherá a melhor fase baseada no número de times'
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
                // Deixar o Sistema decidir automaticamente
                console.log('Deixando o Sistema decidir automaticamente');
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
                            {dados.map((time, index) => {
                                // Calcular posição real (excluindo times com WO anteriores)
                                const timesAntes = dados.slice(0, index);
                                const timesComWOAntes = timesAntes.filter(t => t.temWO).length;
                                const posicaoReal = index + 1 - timesComWOAntes;
                                
                                return (
                                <tr key={time.timeId} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="py-2 px-2 font-bold text-center">
                                        {time.temWO ? (
                                            <span className="text-red-700 dark:text-red-500 font-bold">WO</span>
                                        ) : (
                                            <span className="text-gray-900 dark:text-gray-100">{posicaoReal}°</span>
                                        )}
                                    </td>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <CardSplat />
        </div>
    );

    // Só mostrar carregamento inicial se não há torneio selecionado ou na primeira carga
    if (loading && !selectedTournament) {
        return <div className="flex justify-center items-center h-64 text-gray-600 dark:text-gray-400">Carregando...</div>;
    }

    // Usar dados preservados durante carregamento para evitar flash
    const displayData = {
        grupos: loadingData && previousData.grupos.length > 0 ? previousData.grupos : gruposData,
        classificacao: loadingData && previousData.classificacao.length > 0 ? previousData.classificacao : classificacao,
        eliminatorias: loadingData && previousData.eliminatorias.length > 0 ? previousData.eliminatorias : eliminatorias
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CHAVEAMENTO</h1>
                            <HelpButton onClick={() => setShowHelp(true)} />
                        </div>
                        {loadingData && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
                                Atualizando...
                            </div>
                        )}
                    </div>
                    {selectedTournament && (
                        <p className="text-gray-500 dark:text-gray-400">
                            Torneio: {selectedTournament.name}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={mostrarOpcoesEliminatorias} 
                        disabled={!selectedTournament?.id || !modalidadeSelecionada || displayData.classificacao.length === 0}
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
                    {displayData.grupos.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                    <Users size={24} className="text-blue-500" />
                                    FASE DE GRUPOS
                                </h2>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {displayData.grupos.map(grupo => (
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
                    {displayData.classificacao.length > 0 && (
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
                                            dados={displayData.classificacao}
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
                    {displayData.eliminatorias.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                    <Target size={24} className="text-red-500" />
                                    FASE ELIMINATÓRIA
                                </h2>

                                <div className="space-y-6">
                                    {displayData.eliminatorias.map(fase => (
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
                    {displayData.grupos.length === 0 && displayData.classificacao.length === 0 && (
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
            
            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title="Ajuda - Chaveamento"
                sections={[
                    {
                        title: "O que é a página de Chaveamento?",
                        content: "Esta página exibe as classificações dos grupos e permite gerar as eliminatórias (mata-mata) do torneio. É onde você acompanha o desempenho dos times na fase de grupos e cria os confrontos das fases finais."
                    },
                    {
                        title: "Entendendo a Classificação",
                        content: [
                            "A tabela mostra a pontuação de cada time em seu grupo",
                            "PTS (Pontos): Vitória = 3 pts, Empate = 1 pt, Derrota = 0 pts",
                            "J (Jogos): Número de partidas FINALIZADAS (não conta agendadas)",
                            "V/E/D: Vitórias, Empates e Derrotas",
                            "GP/GC: Gols/Pontos Pró e Contra",
                            "SG: Saldo de Gols (GP - GC)",
                            "Times com WO aparecem marcados e vão para o final da tabela"
                        ]
                    },
                    {
                        title: "Visualizando Classificações",
                        content: [
                            "Selecione a modalidade + gênero desejada",
                            "Veja a classificação de cada grupo individualmente",
                            "Expanda a 'Classificação Geral' para ver todos os grupos juntos",
                            "A classificação geral é útil para comparar times de grupos diferentes",
                            "Os dados são atualizados automaticamente após cada partida"
                        ]
                    },
                    {
                        title: "O que são Eliminatórias?",
                        content: [
                            "Fase mata-mata: quem perde está eliminado",
                            "Classificados dos grupos avançam para esta fase",
                            "Geralmente os 2 melhores de cada grupo se classificam",
                            "Confrontos são definidos baseados na classificação",
                            "Exemplo: 1º do Grupo A x 2º do Grupo B"
                        ]
                    },
                    {
                        title: "Gerando Eliminatórias",
                        content: [
                            "Clique em 'Gerar Eliminatórias' após concluir fase de grupos",
                            "Escolha a fase inicial: Oitavas, Quartas, Semifinais ou Final",
                            "Ou deixe o Sistema decidir automaticamente baseado no nº de times",
                            "O sistema cria os confrontos seguindo regras de chaveamento",
                            "Times são distribuídos evitando confrontos do mesmo grupo logo de início"
                        ]
                    },
                    {
                        title: "Fases das Eliminatórias",
                        content: [
                            "OITAVAS DE FINAL: 16 times (8 jogos)",
                            "QUARTAS DE FINAL: 8 times (4 jogos)",
                            "SEMIFINAIS: 4 times (2 jogos)",
                            "FINAL: 2 times (1 jogo)",
                            "O sistema adapta conforme o número de classificados"
                        ]
                    },
                    {
                        title: "Reorganizando Eliminatórias",
                        content: [
                            "Use 'Reorganizar Eliminatórias' para ajustar chaveamento",
                            "Útil se houve erro na geração ou deseja alterar confrontos",
                            "ATENÇÃO: Só reorganize antes das partidas começarem",
                            "Partidas já finalizadas não podem ser alteradas",
                            "Use com cuidado para manter a integridade do torneio"
                        ]
                    },
                    {
                        title: "Próxima Fase",
                        content: [
                            "Clique em 'Próxima Fase' para avançar nas eliminatórias",
                            "Vencedores da fase atual avançam automaticamente",
                            "Exemplo: Vencedores das Quartas vão para Semifinais",
                            "O sistema valida se todas as partidas foram finalizadas",
                            "Não é possível avançar com jogos pendentes"
                        ]
                    },
                    {
                        title: "Quando Gerar Eliminatórias?",
                        content: [
                            "Aguarde TODAS as partidas da fase de grupos serem finalizadas",
                            "Verifique a classificação final de cada grupo",
                            "Confirme quantos times se classificam por grupo",
                            "Geralmente: 2 primeiros colocados avançam",
                            "Em caso de empate em pontos, usa-se saldo de gols como critério"
                        ]
                    },
                    {
                        title: "Dicas Importantes",
                        content: [
                            "Finalize TODAS as partidas de grupos antes de gerar eliminatórias",
                            "A coluna J (Jogos) mostra apenas partidas FINALIZADAS",
                            "Verifique a classificação cuidadosamente antes de gerar mata-mata",
                            "Após gerar eliminatórias, vá para 'Partidas' para agendar os jogos",
                            "Não reorganize chaveamento após partidas começarem",
                            "Mantenha registros precisos para evitar disputas"
                        ]
                    }
                ]}
            />
        </div>
    );
};
