'use client';
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Target, Filter, X, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { useTournament } from '@/contexts/TournamentContext';
import { SumulaModal } from '@/components/SumulaModal';
import { TournamentSelector } from '@/components/TournamentSelector';
import { Button, CardSplat, Select } from '@/components/common';
import { HelpModal, HelpButton } from '@/components/HelpModal';

export const Dashboard = ({ isGuest = false }) => {
  const { selectedTournament, tournaments, selectTournament, loading } = useTournament();

  const [partidaSelecionada, setPartidaSelecionada] = useState(null);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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

  // Estados para partidas em andamento
  const [partidasEmAndamento, setPartidasEmAndamento] = useState([]);
  const [carregandoAndamento, setCarregandoAndamento] = useState(false);
  const [primeiraCarregaAndamento, setPrimeiraCarregaAndamento] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  // Estado para armazenar pênaltis temporários (enquanto súmula está aberta)
  const [penaltisTemporarios, setPenaltisTemporarios] = useState({});

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
      carregarPartidasEmAndamento();
      carregarOpcoesFiltragem();
    } else {
      setProximasPartidas([]);
      setJogadoresDestaque({});
      setPartidasFinalizadas([]);
      setPartidasAgendadas([]);
      setPartidasEmAndamento([]);
      setModalidades([]);
      setLocais([]);
      setPrimeiraCarregaAndamento(true); // Reset para mostrar loading na próxima seleção
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
      // Carregar modalidades DO TORNEIO SELECIONADO
      const resModalidades = await fetch(`/api/torneios/${selectedTournament.id}/modalidades`);
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

  // busca partidas em andamento
  const carregarPartidasEmAndamento = async () => {
    if (!selectedTournament) return;

    // Só mostrar loading se for primeira carga ou não tiver dados
    if (primeiraCarregaAndamento || partidasEmAndamento.length === 0) {
      setCarregandoAndamento(true);
    }
    try {
      const res = await fetch(`/api/partidas?torneioId=${selectedTournament.id}`);
      const data = res.ok ? await res.json() : [];
      // filtrar por status em andamento
      const emAndamento = (data || []).filter(p => {
        const s = (p.status || '').toLowerCase();
        return s === 'em andamento' || s === 'andamento' || s === 'jogando' || s === 'iniciada';
      });

      // Para cada partida em andamento, carregar os eventos/pontuação
      const partidasComPontuacao = await Promise.all(
        emAndamento.map(async (partida) => {
          try {
            const eventosRes = await fetch(`/api/partidas/${partida.id}/eventos`);
            const eventos = eventosRes.ok ? await eventosRes.json() : [];

            // Debug: log dos eventos para verificar estrutura
            console.log(`Eventos da partida ${partida.id}:`, eventos);
            console.log(`Team1ID: ${partida.team1Id}, Team2ID: ${partida.team2Id}`);

            // Calcular pontuação por time baseado nos eventos
            const eventosTime1 = eventos.filter(evento => {
              // Verificar se o jogador pertence ao time 1
              const pertenceTime1 = evento.jogador?.times?.some(timeJogador => timeJogador.timeId === partida.team1Id);
              const ehGol = evento.tipo === 'GOL';
              return pertenceTime1 && ehGol;
            });

            const eventosTime2 = eventos.filter(evento => {
              // Verificar se o jogador pertence ao time 2
              const pertenceTime2 = evento.jogador?.times?.some(timeJogador => timeJogador.timeId === partida.team2Id);
              const ehGol = evento.tipo === 'GOL';
              return pertenceTime2 && ehGol;
            });

            const pontuacaoTime1 = eventosTime1.reduce((total, evento) => total + (evento.pontosGerados || 0), 0);
            const pontuacaoTime2 = eventosTime2.reduce((total, evento) => total + (evento.pontosGerados || 0), 0);

            console.log(`Pontuação calculada - Time1: ${pontuacaoTime1}, Time2: ${pontuacaoTime2}`);

            return {
              ...partida,
              pontuacaoTime1,
              pontuacaoTime2,
              eventos
            };
          } catch (err) {
            console.error(`Erro ao carregar eventos da partida ${partida.id}:`, err);
            return {
              ...partida,
              pontuacaoTime1: 0,
              pontuacaoTime2: 0,
              eventos: []
            };
          }
        })
      );

      setPartidasEmAndamento(partidasComPontuacao);
      setUltimaAtualizacao(new Date());

      // Marcar que a primeira carga foi concluída
      if (primeiraCarregaAndamento) {
        setPrimeiraCarregaAndamento(false);
      }
    } catch (err) {
      console.error('Erro ao carregar partidas em andamento:', err);
      setPartidasEmAndamento([]);
    } finally {
      setCarregandoAndamento(false);
    }
  };

  // useEffect para atualizar partidas em andamento em tempo real
  useEffect(() => {
    if (!selectedTournament) return;

    // Atualizar imediatamente se há partidas em andamento
    if (partidasEmAndamento.length > 0) {
      const interval = setInterval(() => {
        carregarPartidasEmAndamento();
      }, 3000); // Atualizar a cada 3 segundos para partidas em andamento

      return () => clearInterval(interval);
    } else {
      // Se não há partidas em andamento, verificar menos frequentemente
      const interval = setInterval(() => {
        carregarPartidasEmAndamento();
      }, 15000); // Atualizar a cada 15 segundos para verificar novas partidas

      return () => clearInterval(interval);
    }
  }, [selectedTournament, partidasEmAndamento.length]);

  // quando a súmula for enviada a partir do modal, recarrega as finalizadas e próximas
  const tratarSumulaEnviada = async (partidaId) => {
    // recarregar listas (a súmula acabou de ser criada e a partida deve aparecer como finalizada)
    if (secaoFinalizadasExpandida) await carregarPartidasFinalizadas();
    if (secaoAgendadasExpandida) await carregarPartidasAgendadas();
    await carregarProximasPartidas(); // Atualizar próximas partidas também
    await carregarJogadoresDestaque(); // Atualizar jogadores em destaque
    await carregarPartidasEmAndamento(); // Atualizar partidas em andamento
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

  // Função para atualizar pênaltis temporários em tempo real
  const atualizarPenaltisTemporarios = (partidaId, penaltisCasa, penaltisVisitante, temPenaltis) => {
    setPenaltisTemporarios(prev => ({
      ...prev,
      [partidaId]: {
        penaltisCasa,
        penaltisVisitante,
        temPenaltis
      }
    }));
  };

  // Função para limpar pênaltis temporários quando súmula é fechada/enviada
  const limparPenaltisTemporarios = (partidaId) => {
    setPenaltisTemporarios(prev => {
      const nova = { ...prev };
      delete nova[partidaId];
      return nova;
    });
  };

  return (
    <div className="flex flex-col gap-6">
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
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard - {selectedTournament.name}
            </h1>
            <HelpButton onClick={() => setShowHelp(true)} />
          </div>

          <div className="flex flex-col gap-8">
            {/* PARTIDAS ATUAIS (partidas em andamento com pontuação em tempo real) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">PARTIDAS ATUAIS</h2>
                {ultimaAtualizacao && partidasEmAndamento.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${carregandoAndamento ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <span>Última atualização: {ultimaAtualizacao.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {partidasEmAndamento.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    {carregandoAndamento && primeiraCarregaAndamento ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Carregando partidas em andamento...</span>
                      </div>
                    ) : (
                      <>
                        Nenhuma partida em andamento no momento.
                        <br />
                        <span className="text-xs text-gray-400">As partidas aparecerão aqui quando iniciadas</span>
                      </>
                    )}
                  </div>
                ) : (
                  partidasEmAndamento.slice(0, 2).map((match) => {
                    // Buscar pênaltis temporários ou usar do banco
                    const penaltisTemp = penaltisTemporarios[match.id];
                    const temPenaltis = penaltisTemp?.temPenaltis ?? match.temPenaltis;
                    const penaltisCasa = penaltisTemp?.penaltisCasa ?? match.penaltisCasa;
                    const penaltisVisitante = penaltisTemp?.penaltisVisitante ?? match.penaltisVisitante;
                    
                    return (
                    <div key={match.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                      <div className="relative z-10">
                        {/* AO VIVO no canto superior esquerdo */}
                        <div className="mb-4">
                          <p className="text-sm text-red-600 dark:text-red-400 font-semibold uppercase flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            AO VIVO
                          </p>
                        </div>

                        {/* Layout com colunas proporcionais */}
                        <div className="mb-4 w-full text-center">
                          {(() => {
                            // Calcular a largura baseada no maior nome
                            const maxLength = Math.max(match.team1.length, match.team2.length);
                            // Definir largura mínima de 80px e máxima de 160px, baseada no comprimento
                            const columnWidth = Math.max(80, Math.min(160, maxLength * 12));

                            return (
                              <div className="grid grid-cols-3 gap-2 items-center justify-center max-w-fit mx-auto">
                                {/* Coluna Time 1 */}
                                <div className="text-center" style={{ minWidth: `${columnWidth}px` }}>
                                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {match.team1}
                                  </p>
                                  <div className="flex flex-col items-center">
                                    <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                                      {match.pontuacaoTime1 || 0}
                                    </span>
                                    {temPenaltis && penaltisCasa !== null && (
                                      <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        ({penaltisCasa})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Coluna separador VS */}
                                <div className="text-center px-3">
                                  <div className="mb-1 h-6"></div>
                                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">x</span>
                                </div>

                                {/* Coluna Time 2 */}
                                <div className="text-center" style={{ minWidth: `${columnWidth}px` }}>
                                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {match.team2}
                                  </p>
                                  <div className="flex flex-col items-center">
                                    <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                                      {match.pontuacaoTime2 || 0}
                                    </span>
                                    {temPenaltis && penaltisVisitante !== null && (
                                      <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        ({penaltisVisitante})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Esporte: {match.modality}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Modalidade: {match.category}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Local: {match.location}</p>
                          {match.fase && <p className="text-sm text-gray-600 dark:text-gray-300">Fase: {match.fase}</p>}
                        </div>
                      </div>
                      <CardSplat />
                    </div>
                    );
                  })
                )}
              </div>

              {/* Mostrar próximas partidas sempre que existirem */}
              {proximasPartidas.length > 0 && (
                <>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-6 mb-4">Próximas Partidas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {proximasPartidas.slice(0, 2).map((match) => (
                      <div key={match.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-red-600 dark:text-red-400 font-semibold uppercase">PRÓXIMA</p>
                          </div>
                          <p className="text-xl font-bold my-2 text-gray-900 dark:text-gray-100">{match.team1} VS {match.team2}</p>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Esporte: {match.modality}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Modalidade: {match.category}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Local: {match.location}</p>
                            {match.fase && <p className="text-sm text-gray-600 dark:text-gray-300">Fase: {match.fase}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* JOGADORES EM DESTAQUE (dados reais do banco) */}
            <div>
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
            <div>
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
                          <option key={modalidade.modalidadeId} value={modalidade.modalidadeId}>{modalidade.nome}</option>
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
            <div>
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
                          <option key={modalidade.modalidadeId} value={modalidade.modalidadeId}>{modalidade.nome}</option>
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
                limparPenaltisTemporarios(partidaSelecionada.id);
                if (secaoFinalizadasExpandida) carregarPartidasFinalizadas();
                if (secaoAgendadasExpandida) carregarPartidasAgendadas();
                carregarProximasPartidas();
                carregarJogadoresDestaque();
              }}
              match={partidaSelecionada}
              mode="final"
              onSumulaEnviada={(id) => {
                tratarSumulaEnviada(id);
                limparPenaltisTemporarios(id);
              }}
              onPenaltisChange={(partidaId, penaltisCasa, penaltisVisitante, temPenaltis) => {
                atualizarPenaltisTemporarios(partidaId, penaltisCasa, penaltisVisitante, temPenaltis);
              }}
            />
          )}

          <TournamentSelector
            isOpen={showTournamentSelector}
            onClose={() => setShowTournamentSelector(false)}
            tournaments={tournaments}
            selectedTournament={selectedTournament}
            onSelectTournament={selectTournament}
          />
          
          <HelpModal
            isOpen={showHelp}
            onClose={() => setShowHelp(false)}
            title="Ajuda - Home"
            sections={[
              {
                title: "O que é a página Home?",
                content: "A Home é o painel principal do sistema, onde você visualiza informações em tempo real sobre as partidas do torneio selecionado. É o centro de controle para acompanhar o andamento de todos os jogos."
              },
              {
                title: "Partidas em Andamento",
                content: [
                  "Mostra as partidas que estão acontecendo neste momento",
                  "Atualiza automaticamente a cada 5 segundos",
                  "Exibe o placar ao vivo de cada jogo",
                  "Permite acessar os eventos da partida clicando no card"
                ]
              },
              {
                title: "Próximas Partidas",
                content: [
                  "Lista as próximas 6 partidas que irão acontecer",
                  "Ordenadas por data e horário mais próximo",
                  "Mostra informações como modalidade, categoria, local e horário",
                  "Útil para saber quando e onde serão os próximos jogos"
                ]
              },
              {
                title: "Jogadores em Destaque",
                content: [
                  "Apresenta os artilheiros do torneio por modalidade",
                  "Top 5 jogadores com mais pontos/gols marcados",
                  "Categorizado por esporte (Futsal, Vôlei, Handebol, Basquete)",
                  "Atualizado conforme as súmulas são finalizadas"
                ]
              },
              {
                title: "Partidas Agendadas",
                content: [
                  "Seção minimizada por padrão para melhor organização",
                  "Contém todas as partidas futuras do torneio",
                  "Permite filtrar por modalidade, gênero e local",
                  "Use os filtros para encontrar jogos específicos rapidamente"
                ]
              },
              {
                title: "Súmulas (Partidas Finalizadas)",
                content: [
                  "Seção minimizada com todas as partidas já concluídas",
                  "Clique em qualquer partida para ver a súmula completa",
                  "Visualize eventos, estatísticas e resultados finais",
                  "Também possui filtros por modalidade, gênero e local"
                ]
              },
              {
                title: "Dicas de Uso",
                content: [
                  "Selecione o torneio ativo no topo da página",
                  "As seções minimizadas podem ser expandidas clicando nelas",
                  "Os dados são atualizados automaticamente",
                  "Use os filtros para encontrar partidas específicas mais facilmente"
                ]
              }
            ]}
          />
        </>
      )}
    </div>
  );
};