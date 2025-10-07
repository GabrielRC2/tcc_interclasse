'use client';
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Target, Filter, X, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { useTournament } from '@/contexts/TournamentContext';
import { SumulaModal } from '@/components/SumulaModal';
import { TournamentSelector } from '@/components/TournamentSelector';
import { Button, CardSplat, Select } from '@/components/common';
import { mockData } from '@/data';

export const Dashboard = () => {
  const { selectedTournament, tournaments, selectTournament, loading } = useTournament();

  const [partidaSelecionada, setPartidaSelecionada] = useState(null);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);

  // Estados para próximas partidas
  const [proximasPartidas, setProximasPartidas] = useState([]);
  const [carregandoProximas, setCarregandoProximas] = useState(false);

  // Estados para partidas agendadas
  const [partidasAgendadas, setPartidasAgendadas] = useState([]);
  const [carregandoAgendadas, setCarregandoAgendadas] = useState(false);

  // Estados para jogadores em destaque
  const [jogadoresDestaque, setJogadoresDestaque] = useState({});
  const [carregandoJogadores, setCarregandoJogadores] = useState(false);

  // Estados para partidas finalizadas (súmulas)
  const [partidasFinalizadas, setPartidasFinalizadas] = useState([]);
  const [carregandoFinalizadas, setCarregandoFinalizadas] = useState(false);

  // Estados para controlar seções expandidas/minimizadas
  const [secaoAgendadasExpandida, setSecaoAgendadasExpandida] = useState(false);
  const [secaoFinalizadasExpandida, setSecaoFinalizadasExpandida] = useState(false);

  // Estados para filtros
  const [filtrosAgendadas, setFiltrosAgendadas] = useState({
    modalidade: '',
    genero: '',
    local: ''
  });
  const [filtrosFinalizadas, setFiltrosFinalizadas] = useState({
    modalidade: '',
    genero: '',
    local: ''
  });

  // Opções de filtro (será populado dinamicamente)
  const [modalidades, setModalidades] = useState([]);
  const [locais, setLocais] = useState([]);

  useEffect(() => {
    if (selectedTournament) {
      carregarProximasPartidas();
      carregarJogadoresDestaque();
      carregarOpcoesFiltragem();
    } else {
      setProximasPartidas([]);
      setJogadoresDestaque({});
      setPartidasFinalizadas([]);
      setPartidasAgendadas([]);
      setModalidades([]);
      setLocais([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament]);

  // Carregar partidas agendadas quando a seção for expandida
  useEffect(() => {
    if (secaoAgendadasExpandida && selectedTournament && partidasAgendadas.length === 0) {
      carregarPartidasAgendadas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secaoAgendadasExpandida, selectedTournament]);

  // Carregar partidas finalizadas quando a seção for expandida
  useEffect(() => {
    if (secaoFinalizadasExpandida && selectedTournament && partidasFinalizadas.length === 0) {
      carregarPartidasFinalizadas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secaoFinalizadasExpandida, selectedTournament]);

  // Aplicar filtros nas partidas agendadas
  useEffect(() => {
    if (secaoAgendadasExpandida && selectedTournament) {
      carregarPartidasAgendadas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosAgendadas]);

  // Aplicar filtros nas partidas finalizadas
  useEffect(() => {
    if (secaoFinalizadasExpandida && selectedTournament) {
      carregarPartidasFinalizadas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosFinalizadas]);

  // busca próximas partidas
  const carregarProximasPartidas = async () => {
    if (!selectedTournament) return;
    setCarregandoProximas(true);
    try {
      const res = await fetch(`/api/partidas/proximas?torneioId=${selectedTournament.id}`);
      const data = res.ok ? await res.json() : [];
      setProximasPartidas(data);
    } catch (err) {
      console.error('Erro ao carregar próximas partidas:', err);
      setProximasPartidas([]);
    } finally {
      setCarregandoProximas(false);
    }
  };

  // busca jogadores em destaque
  const carregarJogadoresDestaque = async () => {
    if (!selectedTournament) return;
    setCarregandoJogadores(true);
    try {
      const res = await fetch(`/api/jogadores/destaque?torneioId=${selectedTournament.id}`);
      const data = res.ok ? await res.json() : {};
      setJogadoresDestaque(data);
    } catch (err) {
      console.error('Erro ao carregar jogadores em destaque:', err);
      setJogadoresDestaque({});
    } finally {
      setCarregandoJogadores(false);
    }
  };

  // busca opções para filtragem
  const carregarOpcoesFiltragem = async () => {
    if (!selectedTournament) return;
    try {
      // Carregar modalidades
      const resModalidades = await fetch('/api/modalidades');
      if (resModalidades.ok) {
        const modalidadesData = await resModalidades.json();
        setModalidades(modalidadesData);
      }

      // Carregar locais
      const resLocais = await fetch('/api/locais');
      if (resLocais.ok) {
        const locaisData = await resLocais.json();
        setLocais(locaisData);
      }
    } catch (err) {
      console.error('Erro ao carregar opções de filtragem:', err);
    }
  };

  // busca partidas agendadas com filtros
  const carregarPartidasAgendadas = async () => {
    if (!selectedTournament) return;
    setCarregandoAgendadas(true);
    try {
      let url = `/api/partidas?torneioId=${selectedTournament.id}`;

      // Adicionar filtros à URL
      if (filtrosAgendadas.modalidade) url += `&modalidadeId=${filtrosAgendadas.modalidade}`;
      if (filtrosAgendadas.genero) url += `&genero=${encodeURIComponent(filtrosAgendadas.genero)}`;
      if (filtrosAgendadas.local) url += `&localId=${filtrosAgendadas.local}`;

      const res = await fetch(url);
      const data = res.ok ? await res.json() : [];

      // filtrar por status agendada/pendente
      const agendadas = (data || []).filter(p => {
        const s = (p.status || '').toLowerCase();
        return s === 'agendada' || s === 'pendente' || s === 'programada' || s === 'marcada';
      });
      setPartidasAgendadas(agendadas);
    } catch (err) {
      console.error('Erro ao carregar partidas agendadas:', err);
      setPartidasAgendadas([]);
    } finally {
      setCarregandoAgendadas(false);
    }
  };

  // busca partidas finalizadas com filtros
  const carregarPartidasFinalizadas = async () => {
    if (!selectedTournament) return;
    setCarregandoFinalizadas(true);
    try {
      let url = `/api/partidas?torneioId=${selectedTournament.id}`;

      // Adicionar filtros à URL
      if (filtrosFinalizadas.modalidade) url += `&modalidadeId=${filtrosFinalizadas.modalidade}`;
      if (filtrosFinalizadas.genero) url += `&genero=${encodeURIComponent(filtrosFinalizadas.genero)}`;
      if (filtrosFinalizadas.local) url += `&localId=${filtrosFinalizadas.local}`;

      const res = await fetch(url);
      const data = res.ok ? await res.json() : [];

      // filtrar por status finalizada (aceitar variações de texto)
      const finalizadas = (data || []).filter(p => {
        const s = (p.status || '').toLowerCase();
        return s === 'finalizada' || s === 'encerrada' || s === 'finalizado' || s === 'concluida';
      });
      setPartidasFinalizadas(finalizadas);
    } catch (err) {
      console.error('Erro ao carregar partidas finalizadas:', err);
      setPartidasFinalizadas([]);
    } finally {
      setCarregandoFinalizadas(false);
    }
  };

  // quando a súmula for enviada a partir do modal, recarrega as listas
  const tratarSumulaEnviada = async (partidaId) => {
    // recarregar listas (a súmula acabou de ser criada e a partida deve aparecer como finalizada)
    if (secaoFinalizadasExpandida) await carregarPartidasFinalizadas();
    if (secaoAgendadasExpandida) await carregarPartidasAgendadas();
    await carregarProximasPartidas(); // Atualizar próximas partidas também
    await carregarJogadoresDestaque(); // Atualizar jogadores em destaque
  };

  // funções para limpar filtros
  const limparFiltrosAgendadas = () => {
    setFiltrosAgendadas({
      modalidade: '',
      genero: '',
      local: ''
    });
  };

  const limparFiltrosFinalizadas = () => {
    setFiltrosFinalizadas({
      modalidade: '',
      genero: '',
      local: ''
    });
  };

  return (
    <div>
      {/* Seletor de Torneio Global */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Torneio Ativo
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedTournament ? `${selectedTournament.name} • ${selectedTournament.status}` : 'Selecione um torneio para visualizar dados específicos'}
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
            <Button
              onClick={() => setShowTournamentSelector(true)}
              variant="outline"
              className="flex items-center justify-center gap-2 w-full md:w-auto"
            >
              <Settings size={16} />
              {selectedTournament ? 'Alterar Torneio' : 'Selecionar Torneio'}
            </Button>
            {selectedTournament && (
              <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full text-sm font-medium w-full md:w-auto text-center">
                {selectedTournament.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedTournament && (
        <>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-6">
            Dashboard - {selectedTournament.name}
          </h1>

          <div className="mt-6">
            {/* PARTIDAS ATUAIS (próximas partidas do banco de dados) */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">PARTIDAS ATUAIS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {carregandoProximas ? (
                  <div className="col-span-2 text-center py-8 text-gray-600 dark:text-gray-400">Carregando próximas partidas...</div>
                ) : proximasPartidas.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">Nenhuma partida agendada encontrada.</div>
                ) : (
                  proximasPartidas.slice(0, 2).map((match) => (
                    <div key={match.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-red-600 dark:text-red-400 font-semibold uppercase">PRÓXIMA</p>
                        </div>
                        <p className="text-2xl font-bold my-2 text-gray-900 dark:text-gray-100">{match.team1} VS {match.team2}</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">{match.result}</p>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Esporte: {match.modality}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Modalidade: {match.category}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Local: {match.location}</p>
                          {match.fase && <p className="text-sm text-gray-600 dark:text-gray-300">Fase: {match.fase}</p>}
                        </div>
                      </div>
                      <CardSplat />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* JOGADORES EM DESTAQUE (dados reais do banco) */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">JOGADORES(AS) EM DESTAQUE</h2>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                {carregandoJogadores ? (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">Carregando jogadores em destaque...</div>
                ) : Object.keys(jogadoresDestaque).length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nenhum jogador encontrado para este torneio.</div>
                ) : (
                  <div className="space-y-6">
                    {/* Renderizar cada modalidade */}
                    {Object.entries(jogadoresDestaque).map(([modalidade, jogadores]) => {
                      if (!jogadores || jogadores.length === 0) return null;

                      // Separar jogadores por gênero
                      const masculinos = jogadores.filter(player => player.gender === 'Masculino');
                      const femininos = jogadores.filter(player => player.gender === 'Feminino');

                      return (
                        <div key={modalidade} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                            {modalidade === 'volei' ? 'VÔLEI' : modalidade.toUpperCase()}
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Masculino */}
                            {masculinos.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                  Masculino
                                </h4>
                                <div className="space-y-1">
                                  {masculinos.slice(0, 3).map((player, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-gray-400 w-4">
                                          {i + 1}º
                                        </span>
                                        <div>
                                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                            {player.name.replace(' (M)', '')}
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {player.team}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                                          {player.points}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-1">pts</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Feminino */}
                            {femininos.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                  Feminino
                                </h4>
                                <div className="space-y-1">
                                  {femininos.slice(0, 3).map((player, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-gray-400 w-4">
                                          {i + 1}º
                                        </span>
                                        <div>
                                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                            {player.name.replace(' (F)', '')}
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {player.team}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                                          {player.points}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-1">pts</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Mensagem se não há dados */}
                    {Object.keys(jogadoresDestaque).length === 0 && (
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        Nenhuma modalidade encontrada para este torneio.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SEÇÃO: PARTIDAS AGENDADAS */}
            <div className="mt-8">
              <div
                className="flex items-center justify-between mb-4 cursor-pointer p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                onClick={() => setSecaoAgendadasExpandida(!secaoAgendadasExpandida)}
              >
                <div className="flex items-center gap-3">
                  {secaoAgendadasExpandida ? (
                    <ChevronDown size={20} className="text-gray-600 dark:text-gray-300" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
                  )}
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    PARTIDAS AGENDADAS
                  </h2>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {secaoAgendadasExpandida ? 'Clique para minimizar' : 'Clique para expandir'}
                </div>
              </div>

              {secaoAgendadasExpandida && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                  {/* Filtros para Partidas Agendadas */}
                  <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Filter size={16} />
                        Filtros
                      </h3>
                      <Button
                        onClick={limparFiltrosAgendadas}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <X size={14} />
                        Limpar
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        value={filtrosAgendadas.modalidade}
                        onChange={(e) => setFiltrosAgendadas({ ...filtrosAgendadas, modalidade: e.target.value })}
                        className="w-full"
                      >
                        <option value="">Todas as modalidades</option>
                        {modalidades.map(modalidade => (
                          <option key={modalidade.id} value={modalidade.id}>{modalidade.nome}</option>
                        ))}
                      </Select>
                      <Select
                        value={filtrosAgendadas.genero}
                        onChange={(e) => setFiltrosAgendadas({ ...filtrosAgendadas, genero: e.target.value })}
                        className="w-full"
                      >
                        <option value="">Todos os gêneros</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                      </Select>
                      <Select
                        value={filtrosAgendadas.local}
                        onChange={(e) => setFiltrosAgendadas({ ...filtrosAgendadas, local: e.target.value })}
                        className="w-full"
                      >
                        <option value="">Todos os locais</option>
                        {locais.map(local => (
                          <option key={local.id} value={local.id}>{local.nome}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Tabela de Partidas Agendadas */}
                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                    <div className="min-w-full">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="p-3 md:p-4 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Partida</th>
                            <th className="p-3 md:p-4 text-center font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">#</th>
                            <th className="p-3 md:p-4 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Esporte</th>
                            <th className="p-3 md:p-4 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Categoria</th>
                            <th className="p-3 md:p-4 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Local</th>
                            <th className="p-3 md:p-4 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Status</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {carregandoAgendadas ? (
                            <tr>
                              <td colSpan="6" className="p-6 text-center text-gray-600 dark:text-gray-400">Carregando partidas agendadas...</td>
                            </tr>
                          ) : partidasAgendadas.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-6 text-center text-gray-500 dark:text-gray-400">Nenhuma partida agendada encontrada.</td>
                            </tr>
                          ) : (
                            partidasAgendadas.map((match, index) => (
                              <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="p-3 md:p-4 text-gray-800 dark:text-gray-200 font-semibold whitespace-nowrap">
                                  <div className="min-w-[120px]">{match.team1} VS {match.team2}</div>
                                </td>
                                <td className="p-3 md:p-4 text-center text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                                  #{match.ordem || index + 1}
                                </td>
                                <td className="p-3 md:p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                  <div className="min-w-[80px]">{match.modality}</div>
                                </td>
                                <td className="p-3 md:p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                  <div className="min-w-[80px]">{match.category}</div>
                                </td>
                                <td className="p-3 md:p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                  <div className="min-w-[100px]">{match.location}</div>
                                </td>
                                <td className="p-3 md:p-4 whitespace-nowrap">
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap">
                                    {match.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SEÇÃO: PARTIDAS FINALIZADAS (SÚMULAS) */}
            <div className="mt-8">
              <div
                className="flex items-center justify-between mb-4 cursor-pointer p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                onClick={() => setSecaoFinalizadasExpandida(!secaoFinalizadasExpandida)}
              >
                <div className="flex items-center gap-3">
                  {secaoFinalizadasExpandida ? (
                    <ChevronDown size={20} className="text-gray-600 dark:text-gray-300" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
                  )}
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    SÚMULAS - PARTIDAS FINALIZADAS
                  </h2>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {secaoFinalizadasExpandida ? 'Clique para minimizar' : 'Clique para expandir'}
                </div>
              </div>

              {secaoFinalizadasExpandida && (

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                  {/* Filtros para Partidas Finalizadas */}
                  <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Filter size={16} />
                        Filtros
                      </h3>
                      <Button
                        onClick={limparFiltrosFinalizadas}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <X size={14} />
                        Limpar
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        value={filtrosFinalizadas.modalidade}
                        onChange={(e) => setFiltrosFinalizadas({ ...filtrosFinalizadas, modalidade: e.target.value })}
                        className="w-full"
                      >
                        <option value="">Todas as modalidades</option>
                        {modalidades.map(modalidade => (
                          <option key={modalidade.id} value={modalidade.id}>{modalidade.nome}</option>
                        ))}
                      </Select>
                      <Select
                        value={filtrosFinalizadas.genero}
                        onChange={(e) => setFiltrosFinalizadas({ ...filtrosFinalizadas, genero: e.target.value })}
                        className="w-full"
                      >
                        <option value="">Todos os gêneros</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                      </Select>
                      <Select
                        value={filtrosFinalizadas.local}
                        onChange={(e) => setFiltrosFinalizadas({ ...filtrosFinalizadas, local: e.target.value })}
                        className="w-full"
                      >
                        <option value="">Todos os locais</option>
                        {locais.map(local => (
                          <option key={local.id} value={local.id}>{local.nome}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Container com scroll horizontal otimizado */}
                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                    <div className="min-w-full">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="p-3 md:p-4 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Partida</th>
                            <th className="p-3 md:p-4 text-center font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">#</th>
                            <th className="p-3 md:p-4 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Esporte</th>
                            <th className="p-3 md:p-4 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Categoria</th>
                            <th className="p-3 md:p-4 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Local</th>
                            <th className="p-3 md:p-4 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Status</th>
                            <th className="p-3 md:p-4 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Ação</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {carregandoFinalizadas ? (
                            <tr>
                              <td colSpan="7" className="p-6 text-center text-gray-600 dark:text-gray-400">Carregando súmulas...</td>
                            </tr>
                          ) : partidasFinalizadas.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-6 text-center text-gray-500 dark:text-gray-400">Nenhuma súmula encontrada.</td>
                            </tr>
                          ) : (
                            partidasFinalizadas.map((match, index) => (
                              <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="p-3 md:p-4 text-gray-800 dark:text-gray-200 font-semibold whitespace-nowrap">
                                  <div className="min-w-[120px]">{match.team1} VS {match.team2}</div>
                                </td>
                                <td className="p-3 md:p-4 text-center text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                                  #{match.ordem || index + 1}
                                </td>
                                <td className="p-3 md:p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                  <div className="min-w-[80px]">{match.modality}</div>
                                </td>
                                <td className="p-3 md:p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                  <div className="min-w-[80px]">{match.category}</div>
                                </td>
                                <td className="p-3 md:p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                  <div className="min-w-[100px]">{match.location}</div>
                                </td>
                                <td className="p-3 md:p-4 whitespace-nowrap">
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 whitespace-nowrap">
                                    {match.status}
                                  </span>
                                </td>
                                <td className="p-3 md:p-4 text-right whitespace-nowrap">
                                  <div className="min-w-[100px]">
                                    <Button
                                      onClick={() => setPartidaSelecionada(match)}
                                      size="sm"
                                      className="whitespace-nowrap"
                                    >
                                      Ver Súmula
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Indicador de scroll para mobile */}
                  <div className="md:hidden bg-gray-50 dark:bg-gray-700 px-4 py-2 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Arraste horizontalmente para navegar
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {partidaSelecionada && (
            <SumulaModal
              key={`sumula-dashboard-${partidaSelecionada.id}`}
              isOpen={true}
              onClose={() => {
                setPartidaSelecionada(null);
                if (secaoFinalizadasExpandida) carregarPartidasFinalizadas();
                if (secaoAgendadasExpandida) carregarPartidasAgendadas();
                carregarProximasPartidas();
                carregarJogadoresDestaque();
              }}
              match={partidaSelecionada}
              mode="final"
              onSumulaEnviada={(id) => tratarSumulaEnviada(id)}
            />
          )}

          <TournamentSelector
            isOpen={showTournamentSelector}
            onClose={() => setShowTournamentSelector(false)}
            tournaments={tournaments}
            selectedTournament={selectedTournament}
            onSelectTournament={selectTournament}
          />
        </>
      )}
    </div>
  );
};