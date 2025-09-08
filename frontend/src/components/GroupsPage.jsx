'use client';
import React, { useState, useEffect } from 'react';
import { Shuffle, Users, Trophy, Play, Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Select, CardSplat } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';

export const GroupsPage = () => {
    const { selectedTournament, pageStates, updatePageState } = useTournament();
    const [modalidades, setModalidades] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [timesDisponiveis, setTimesDisponiveis] = useState([]);

    // Estados dos filtros - inicializar com valores do contexto
    const [selectedModalidade, setSelectedModalidade] = useState(pageStates?.groups?.selectedModalidade || '');
    const [selectedGenero, setSelectedGenero] = useState(pageStates?.groups?.selectedGenero || '');
    const [quantidadeGrupos, setQuantidadeGrupos] = useState(pageStates?.groups?.quantidadeGrupos || '');

    const [generos] = useState(['Masculino', 'Feminino']);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Função para atualizar estado e salvar no contexto
    const updateFilterState = (field, value) => {
        const newState = { [field]: value };

        if (field === 'selectedModalidade') {
            setSelectedModalidade(value);
            // Limpar dependências quando modalidade muda
            setSelectedGenero('');
            setQuantidadeGrupos('');
            newState.selectedGenero = '';
            newState.quantidadeGrupos = '';
            setGrupos([]);
            setTimesDisponiveis([]);
        } else if (field === 'selectedGenero') {
            setSelectedGenero(value);
            setQuantidadeGrupos('');
            newState.quantidadeGrupos = '';
        } else if (field === 'quantidadeGrupos') {
            setQuantidadeGrupos(value);
        }

        if (updatePageState) {
            updatePageState('groups', newState);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedModalidade && selectedGenero && selectedTournament) {
            loadTimesDisponiveis();
        }
    }, [selectedModalidade, selectedGenero, selectedTournament]);

    useEffect(() => {
        if (selectedModalidade && selectedGenero && selectedTournament) {
            loadGrupos();
        }
    }, [selectedModalidade, selectedGenero, selectedTournament]);

    const loadInitialData = async () => {
        try {
            const modalidadesRes = await fetch('/api/modalidades');
            const modalidadesData = await modalidadesRes.json();
            setModalidades(modalidadesData || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            setModalidades([]);
        } finally {
            setLoading(false);
        }
    };

    const loadGrupos = async () => {
        if (!selectedTournament || !selectedModalidade || !selectedGenero) {
            setGrupos([]);
            return;
        }

        try {
            console.log('Carregando grupos...', { selectedTournament: selectedTournament.id, selectedModalidade, selectedGenero });
            const response = await fetch(`/api/grupos?torneioId=${selectedTournament.id}&modalidadeId=${selectedModalidade}&genero=${selectedGenero}`);

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
        if (!selectedModalidade || !selectedGenero || !selectedTournament) {
            setTimesDisponiveis([]);
            return;
        }

        try {
            console.log('Carregando times disponíveis...', { selectedModalidade, selectedGenero, torneio: selectedTournament.id });
            const response = await fetch(`/api/times-disponiveis?modalidadeId=${selectedModalidade}&genero=${selectedGenero}&torneioId=${selectedTournament.id}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`Times disponíveis para ${selectedGenero}:`, data);
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
        if (!selectedTournament || !selectedModalidade || !selectedGenero) {
            alert('Selecione Modalidade e Gênero (Torneio já selecionado no Dashboard)');
            return;
        }

        if (!quantidadeGrupos || parseInt(quantidadeGrupos) < 1) {
            alert('Selecione a quantidade de grupos');
            return;
        }

        if (timesDisponiveis.length < parseInt(quantidadeGrupos)) {
            alert(`Número insuficiente de times. Você tem ${timesDisponiveis.length} times e quer ${quantidadeGrupos} grupos.`);
            return;
        }

        // Verificar se já existe sorteio
        const jaTemSorteio = grupos.length > 0;
        const mensagem = jaTemSorteio
            ? `REFAZER sorteio de ${timesDisponiveis.length} times em ${quantidadeGrupos} grupos? O sorteio atual será substituído.`
            : `Realizar sorteio de ${timesDisponiveis.length} times em ${quantidadeGrupos} grupos?`;

        if (!confirm(mensagem)) {
            return;
        }

        try {
            const response = await fetch('/api/grupos/sorteio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    torneioId: selectedTournament.id,
                    modalidadeId: selectedModalidade,
                    genero: selectedGenero,
                    quantidadeGrupos: parseInt(quantidadeGrupos)
                })
            });

            if (response.ok) {
                await loadGrupos();
                alert(jaTemSorteio ? 'Sorteio refeito com sucesso!' : 'Sorteio realizado com sucesso!');
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao realizar sorteio');
            }
        } catch (error) {
            console.error('Erro ao realizar sorteio:', error);
            alert('Erro ao realizar sorteio');
        }
    };

    const gerarChaveamento = async () => {
        if (!selectedTournament || !selectedModalidade || !selectedGenero) {
            alert('Selecione Modalidade e Gênero primeiro');
            return;
        }

        if (grupos.length === 0) {
            alert('Realize o sorteio primeiro');
            return;
        }

        const modalidadeNome = modalidades.find(m => m.id == selectedModalidade)?.nome;
        const confirm = window.confirm(`Gerar chaveamento para ${modalidadeNome} ${selectedGenero}? Partidas antigas desta modalidade/gênero serão substituídas.`);

        if (!confirm) return;

        try {
            const response = await fetch('/api/matches/generate', {
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
                alert(`✅ ${result.partidasGeradas} partidas de ${result.modalidade} ${result.genero} geradas!`);
            } else {
                const error = await response.json();
                alert('❌ ' + (error.error || 'Erro ao gerar chaveamento'));
            }
        } catch (error) {
            console.error('Erro ao gerar chaveamento:', error);
            alert('❌ Erro ao gerar chaveamento');
        }
    };

    // Função para limpar grupos
    const limparGrupos = async () => {
        if (!selectedTournament || !selectedModalidade || !selectedGenero) {
            alert('Selecione Modalidade e Gênero primeiro');
            return;
        }

        if (grupos.length === 0) {
            alert('Nenhum grupo para limpar');
            return;
        }

        const modalidadeNome = modalidades.find(m => m.id == selectedModalidade)?.nome;
        const confirmacao = window.confirm(
            `⚠️ ATENÇÃO: Limpar TODOS os grupos de ${modalidadeNome} ${selectedGenero}?\n\n` +
            `Isso irá deletar:\n` +
            `• ${grupos.length} grupo(s)\n` +
            `• Todas as partidas relacionadas\n` +
            `• Todos os eventos e estatísticas\n\n` +
            `Esta ação NÃO PODE ser desfeita!`
        );

        if (!confirmacao) return;

        try {
            const response = await fetch('/api/grupos/limpar', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    torneioId: selectedTournament.id,
                    modalidadeId: selectedModalidade,
                    genero: selectedGenero
                })
            });

            if (response.ok) {
                const result = await response.json();
                await loadGrupos(); // Recarregar para atualizar a interface
                alert(`✅ ${result.message}\n\nGrupos limpos: ${result.gruposNomes?.join(', ') || 'N/A'}`);
            } else {
                const error = await response.json();
                alert('❌ ' + (error.error || 'Erro ao limpar grupos'));
            }
        } catch (error) {
            console.error('Erro ao limpar grupos:', error);
            alert('❌ Erro ao limpar grupos');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Carregando...</div>;
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">GRUPOS</h1>
                        {selectedTournament && (
                            <p className="text-gray-500 dark:text-gray-400">
                                Torneio: {selectedTournament.name}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleSorteio} disabled={!selectedTournament || !selectedModalidade || !selectedGenero || !quantidadeGrupos}>
                            <Shuffle size={20} className="mr-2" />
                            Realizar Sorteio
                        </Button>

                        {/* Botão Limpar Grupos - aparece apenas quando há grupos */}
                        {grupos.length > 0 && (
                            <Button
                                onClick={limparGrupos}
                                variant="outline"
                                className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
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
                        {/* Filtros - modalidade, gênero e quantidade de grupos */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Select
                                    label="Modalidade"
                                    value={selectedModalidade}
                                    onChange={(e) => updateFilterState('selectedModalidade', e.target.value)}
                                >
                                    <option value="">Selecione a modalidade</option>
                                    {modalidades.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome}</option>
                                    ))}
                                </Select>

                                <Select
                                    label="Gênero"
                                    value={selectedGenero}
                                    onChange={(e) => updateFilterState('selectedGenero', e.target.value)}
                                >
                                    <option value="">Selecione o gênero</option>
                                    {generos.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </Select>

                                <Select
                                    label="Quantidade de Grupos"
                                    value={quantidadeGrupos}
                                    onChange={(e) => updateFilterState('quantidadeGrupos', e.target.value)}
                                    disabled={timesDisponiveis.length === 0}
                                >
                                    <option value="">Selecione a quantidade</option>
                                    {timesDisponiveis.length > 0 && Array.from({ length: Math.max(1, Math.ceil(timesDisponiveis.length / 2)) }, (_, i) => i + 1).map(num => (
                                        <option key={num} value={num}>
                                            {num} grupo{num > 1 ? 's' : ''} ({Math.ceil(timesDisponiveis.length / num)} times/grupo)
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Preview dos Times que Participarão do Sorteio */}
                        {timesDisponiveis.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        Times que Participarão do Sorteio ({timesDisponiveis.length})
                                    </h3>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {quantidadeGrupos && (
                                            <span>
                                                {quantidadeGrupos} grupos • ~{Math.ceil(timesDisponiveis.length / parseInt(quantidadeGrupos))} times por grupo
                                            </span>
                                        )}
                                    </div>
                                </div>

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

                        {/* Exibir Grupos */}
                        <div className="grid gap-6">
                            {grupos.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                                        {selectedTournament && selectedModalidade && selectedGenero
                                            ? 'Nenhum grupo encontrado. Realize o sorteio.'
                                            : 'Selecione Torneio, Modalidade e Gênero'
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
        </>
    );
};