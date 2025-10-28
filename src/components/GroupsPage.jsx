'use client';
import React, { useState, useEffect } from 'react';
import { Shuffle, Users, Trophy, Play, Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Select, CardSplat } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import { HelpModal, HelpButton } from '@/components/HelpModal';

export const GroupsPage = () => {
    const { selectedTournament, pageStates, updatePageState } = useTournament();
    const toast = useToast();
    const confirm = useConfirm();
    const [modalidadesDisponiveis, setModalidadesDisponiveis] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [timesDisponiveis, setTimesDisponiveis] = useState([]);

    // Estados dos filtros - agora usando modalidade+gênero combinados
    const [modalidadeSelecionada, setModalidadeSelecionada] = useState(null);
    const [quantidadeGrupos, setQuantidadeGrupos] = useState(pageStates?.groups?.quantidadeGrupos || '');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isTimesExpanded, setIsTimesExpanded] = useState(true);
    const [showHelp, setShowHelp] = useState(false);

    // Função para selecionar modalidade+gênero combinados
    const selecionarModalidade = (modalidade) => {
        setModalidadeSelecionada(modalidade);
        setQuantidadeGrupos('');
        setGrupos([]);
        setTimesDisponiveis([]);

        if (updatePageState) {
            updatePageState('groups', {
                modalidadeSelecionada: modalidade,
                quantidadeGrupos: ''
            });
        }
    };

    useEffect(() => {
        if (selectedTournament) {
            carregarModalidadesDisponiveis();
        } else {
            setModalidadesDisponiveis([]);
        }
    }, [selectedTournament]);

    useEffect(() => {
        if (modalidadeSelecionada && selectedTournament) {
            loadTimesDisponiveis();
            loadGrupos();
        }
    }, [modalidadeSelecionada, selectedTournament]);

    const carregarModalidadesDisponiveis = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/modalidades-disponiveis?torneioId=${selectedTournament.id}`);
            if (response.ok) {
                const data = await response.json();
                setModalidadesDisponiveis(data);
            } else {
                setError('Erro ao carregar modalidades disponíveis');
            }
        } catch (error) {
            setError('Erro ao carregar modalidades disponíveis');
        }
        setLoading(false);
    };

    const loadGrupos = async () => {
        if (!selectedTournament || !modalidadeSelecionada) {
            setGrupos([]);
            return;
        }

        try {
            console.log('Carregando grupos...', { selectedTournament: selectedTournament.id, modalidadeSelecionada });
            const response = await fetch(`/api/grupos?torneioId=${selectedTournament.id}&modalidadeId=${modalidadeSelecionada.modalidadeId}&genero=${modalidadeSelecionada.genero}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('Grupos carregados:', data);
            setGrupos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
            setError('Erro ao carregar grupos');
            setGrupos([]);
        }
    };

    const loadTimesDisponiveis = async () => {
        if (!modalidadeSelecionada || !selectedTournament) {
            setTimesDisponiveis([]);
            return;
        }

        try {
            console.log('Carregando times disponíveis...', { modalidadeSelecionada, torneio: selectedTournament.id });
            const response = await fetch(`/api/times-disponiveis?modalidadeId=${modalidadeSelecionada.modalidadeId}&genero=${modalidadeSelecionada.genero}&torneioId=${selectedTournament.id}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`Times disponíveis para ${modalidadeSelecionada.genero}:`, data);
            setTimesDisponiveis(Array.isArray(data) ? data : []);

            // Sugerir quantidade de grupos baseado no número de times
            if (data && data.length > 0) {
                const gruposSugeridos = Math.ceil(data.length / 4); // 4 times por grupo
                setQuantidadeGrupos(gruposSugeridos.toString());
                if (updatePageState) {
                    updatePageState('groups', { quantidadeGrupos: gruposSugeridos.toString() });
                }
            }
        } catch (error) {
            console.error('Erro ao carregar times disponíveis:', error);
            setTimesDisponiveis([]);
        }
    };

    const handleSorteio = async () => {
        if (!selectedTournament || !modalidadeSelecionada) {
            toast.warning('Selecione uma modalidade e gênero primeiro');
            return;
        }

        if (!quantidadeGrupos || parseInt(quantidadeGrupos) < 1) {
            toast.warning('Selecione a quantidade de grupos');
            return;
        }

        if (timesDisponiveis.length < parseInt(quantidadeGrupos)) {
            toast.error(`Número insuficiente de times. Você tem ${timesDisponiveis.length} times e quer ${quantidadeGrupos} grupos.`);
            return;
        }

        // Verificar se já existe sorteio
        const jaTemSorteio = grupos.length > 0;
        const mensagem = jaTemSorteio
            ? `REFAZER sorteio de ${timesDisponiveis.length} times em ${quantidadeGrupos} grupos? O sorteio atual será substituído.`
            : `Realizar sorteio de ${timesDisponiveis.length} times em ${quantidadeGrupos} grupos?`;

        const confirmed = await confirm.warning(mensagem, {
            title: jaTemSorteio ? 'Refazer Sorteio' : 'Realizar Sorteio',
            confirmText: jaTemSorteio ? 'Refazer' : 'Confirmar',
            cancelText: 'Cancelar'
        });

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch('/api/grupos/sorteio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    torneioId: selectedTournament.id,
                    modalidadeId: modalidadeSelecionada.modalidadeId,
                    genero: modalidadeSelecionada.genero,
                    quantidadeGrupos: parseInt(quantidadeGrupos)
                })
            });

            if (response.ok) {
                await loadGrupos();
                toast.success(jaTemSorteio ? 'Sorteio refeito com sucesso!' : 'Sorteio realizado com sucesso!');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Erro ao realizar sorteio');
            }
        } catch (error) {
            console.error('Erro ao realizar sorteio:', error);
            toast.error('Erro ao realizar sorteio');
        }
    };





    const limparGrupos = async () => {
        if (!selectedTournament || !modalidadeSelecionada) {
            toast.warning('Selecione uma modalidade e gênero primeiro');
            return;
        }

        if (grupos.length === 0) {
            toast.warning('Nenhum grupo para limpar');
            return;
        }

        const partidasResponse = await fetch(`/api/partidas?torneioId=${selectedTournament.id}&modalidadeId=${modalidadeSelecionada.modalidadeId}&genero=${modalidadeSelecionada.genero}`);
        const partidas = await partidasResponse.json();

        const confirmacao = await confirm.danger(
            `⚠️ ATENÇÃO: Limpar TODOS os grupos de ${modalidadeSelecionada.modalidadeNome} ${modalidadeSelecionada.genero}?\n\n` +
            `Isso irá deletar:\n` +
            `• ${grupos.length} grupo(s)\n` +
            `• ${partidas.length} partida(s) relacionada(s)\n` +
            `• Todos os eventos e estatísticas\n\n` +
            `Esta ação NÃO PODE ser desfeita!`,
            {
                title: 'Confirmar Limpeza de Grupos',
                confirmText: 'Limpar Tudo',
                cancelText: 'Cancelar'
            }
        );

        if (!confirmacao) return;

        try {
            const response = await fetch('/api/grupos/limpar', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    torneioId: selectedTournament.id,
                    modalidadeId: modalidadeSelecionada.modalidadeId,
                    genero: modalidadeSelecionada.genero
                })
            });

            if (response.ok) {
                const result = await response.json();
                await loadGrupos(); // Recarregar para atualizar a interface
                toast.success(`✅ ${result.message}\n\nGrupos limpos: ${result.gruposNomes?.join(', ') || 'N/A'}`);
            } else {
                const error = await response.json();
                toast.error('❌ ' + (error.error || 'Erro ao limpar grupos'));
            }
        } catch (error) {
            console.error('Erro ao limpar grupos:', error);
            toast.error('❌ Erro ao limpar grupos');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600 dark:text-gray-400">Carregando...</div>;
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <div className="flex items-center">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">GRUPOS</h1>
                            <HelpButton onClick={() => setShowHelp(true)} />
                        </div>
                        {selectedTournament && (
                            <p className="text-gray-500 dark:text-gray-400">
                                Torneio: {selectedTournament.name}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <Button
                            onClick={handleSorteio}
                            disabled={!selectedTournament || !modalidadeSelecionada || !quantidadeGrupos}
                            className="w-full md:w-auto"
                        >
                            <Shuffle size={20} className="mr-2" />
                            Realizar Sorteio
                        </Button>

                        {/* Botão Limpar Grupos - aparece apenas quando há grupos */}
                        {grupos.length > 0 && (
                            <Button
                                onClick={limparGrupos}
                                variant="outline"
                                className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20 w-full md:w-auto"
                            >
                                <Trash2 size={20} className="mr-2" />
                                Limpar Grupos
                            </Button>
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
                        {/* Seleção de Modalidade + Gênero com detecção automática */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Modalidades Disponíveis
                            </h3>

                            {modalidadesDisponiveis.length === 0 ? (
                                <div className="text-center py-8">
                                    <Trophy size={32} className="mx-auto text-gray-400 mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Nenhuma modalidade com times cadastrados ainda
                                    </p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                        Cadastre times primeiro na seção "Times"
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {modalidadesDisponiveis.map(modalidade => (
                                        <button
                                            key={modalidade.categoriaId}
                                            type="button"
                                            onClick={() => selecionarModalidade(modalidade)}
                                            className={`p-6 rounded-lg border transition-all text-left ${modalidadeSelecionada &&
                                                    modalidadeSelecionada.modalidadeId === modalidade.modalidadeId &&
                                                    modalidadeSelecionada.genero === modalidade.genero
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-700'
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <Trophy size={20} className="text-blue-500" />
                                                <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                                                    {modalidade.modalidadeNome}
                                                </span>
                                                <span className={`text-sm px-3 py-1 rounded-full ${modalidade.genero === 'Masculino'
                                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                                        : 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                                                    }`}>
                                                    {modalidade.genero}
                                                </span>
                                            </div>
                                            <p className="text-base text-gray-600 dark:text-gray-400">
                                                {modalidade.totalTimes} time{modalidade.totalTimes !== 1 ? 's' : ''} cadastrado{modalidade.totalTimes !== 1 ? 's' : ''}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Quantidade de grupos - só aparece quando modalidade selecionada */}
                            {modalidadeSelecionada && (
                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                                    <Select
                                        label="Quantidade de Grupos"
                                        value={quantidadeGrupos}
                                        onChange={(e) => setQuantidadeGrupos(e.target.value)}
                                        disabled={timesDisponiveis.length === 0}
                                    >
                                        <option value="">{timesDisponiveis.length > 0 ? 'Selecione a quantidade' : 'Sem times disponíveis'}</option>
                                        {timesDisponiveis.length > 0 && Array.from({ length: Math.max(1, Math.ceil(timesDisponiveis.length / 2)) }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>
                                                {num} grupo{num > 1 ? 's' : ''} (~{Math.ceil(timesDisponiveis.length / num)} times/grupo)
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* Preview dos Times que Participarão do Sorteio */}
                        {timesDisponiveis.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                                <div
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 -m-3 rounded-lg transition-colors"
                                    onClick={() => setIsTimesExpanded(!isTimesExpanded)}
                                >
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        Times que Participarão do Sorteio ({timesDisponiveis.length})
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Clique para {isTimesExpanded ? "minimizar" : "expandir"} a lista de times
                                    </p>
                                </div>

                                {isTimesExpanded && (
                                    <div className="mt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {timesDisponiveis.map(time => (
                                                <div key={time.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <Trophy size={16} className="text-blue-500" />
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{time.nome}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {time.curso} • {time.jogadoresCount} jogadores
                                                        </p>
                                                    </div>
                                                    <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                                        #{time.id}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {quantidadeGrupos && (
                                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                                    <strong>Preview do Sorteio:</strong> {timesDisponiveis.length} times serão distribuídos em {quantidadeGrupos} grupos,
                                                    com aproximadamente {Math.ceil(timesDisponiveis.length / parseInt(quantidadeGrupos))} times por grupo.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Exibir Grupos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {grupos.length === 0 ? (
                                <div className="col-span-full text-center py-12">
                                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                                        {selectedTournament && modalidadeSelecionada
                                            ? 'Nenhum grupo encontrado. Realize o sorteio.'
                                            : 'Selecione uma modalidade e gênero'
                                        }
                                    </p>
                                </div>
                            ) : (
                                grupos.map(grupo => (
                                    <div key={grupo.nome} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                                                GRUPO {grupo.nome}
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {grupo.times.map(time => (
                                                    <div key={time.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                        <Trophy size={16} className="text-yellow-500" />
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{time.nome}</p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{time.curso.nome}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <CardSplat />
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
            
            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title="Ajuda - Grupos"
                sections={[
                    {
                        title: "O que é a página de Grupos?",
                        content: "Esta página permite criar e gerenciar grupos para a fase classificatória do torneio. Os grupos organizam os times que irão se enfrentar antes das eliminatórias, permitindo classificação justa baseada em desempenho."
                    },
                    {
                        title: "Preparando para Criar Grupos",
                        content: [
                            "Certifique-se de que o torneio está selecionado",
                            "Tenha times criados e vinculados às modalidades desejadas",
                            "Cada modalidade + gênero terá seus próprios grupos",
                            "Exemplo: Futsal Masculino terá grupos separados de Futsal Feminino"
                        ]
                    },
                    {
                        title: "Selecionando Modalidade e Gênero",
                        content: [
                            "Primeiro, escolha uma modalidade (ex: Futsal, Vôlei)",
                            "Os cards mostram quantos times estão disponíveis",
                            "Só aparecem modalidades que foram vinculadas ao torneio",
                            "Após selecionar, a lista de times disponíveis é carregada"
                        ]
                    },
                    {
                        title: "Definindo Quantidade de Grupos",
                        content: [
                            "Escolha quantos grupos deseja criar (geralmente 2 a 4)",
                            "O sistema divide os times de forma equilibrada",
                            "Grupos com times pares permitem rodízio completo",
                            "Exemplo: 8 times em 2 grupos = 4 times por grupo"
                        ]
                    },
                    {
                        title: "Sorteando Grupos",
                        content: [
                            "Clique em 'Sortear Grupos' após definir a quantidade",
                            "O sistema distribui os times aleatoriamente entre os grupos",
                            "Os grupos são nomeados automaticamente (A, B, C...)",
                            "Se não gostar do sorteio, limpe e faça novamente"
                        ]
                    },
                    {
                        title: "Visualizando Grupos",
                        content: [
                            "Cada grupo mostra os times sorteados em cards",
                            "Você pode ver curso, série e informações de cada time",
                            "A seção de times disponíveis mostra o que ainda não foi sorteado",
                            "Expanda/recolha seções para melhor visualização"
                        ]
                    },
                    {
                        title: "Limpando Grupos",
                        content: [
                            "Use 'Limpar Grupos' para desfazer o sorteio",
                            "Isso remove os grupos mas mantém os times",
                            "Útil se quiser refazer o sorteio com diferentes configurações",
                            "ATENÇÃO: Se já houver partidas agendadas, não será possível limpar"
                        ]
                    },
                    {
                        title: "Próximos Passos",
                        content: [
                            "Após criar grupos, vá para a página 'Partidas'",
                            "Lá você poderá gerar as partidas da fase de grupos",
                            "As partidas são criadas automaticamente baseadas nos grupos",
                            "Cada time jogará contra todos do seu grupo (todos contra todos)"
                        ]
                    },
                    {
                        title: "Dicas Importantes",
                        content: [
                            "Crie grupos balanceados em quantidade de times",
                            "Evite grupos com apenas 2 times (muito poucas partidas)",
                            "Grupos de 3-5 times são ideais para torneios escolares",
                            "Lembre-se: cada modalidade/gênero precisa de grupos separados"
                        ]
                    }
                ]}
            />
        </>
    );
};