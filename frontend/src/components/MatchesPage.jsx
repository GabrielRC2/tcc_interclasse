'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Trophy, Filter, Play, Settings } from 'lucide-react';
import { Button, Select } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';
import { SumulaModal } from '@/components/SumulaModal';

export const MatchesPage = () => {
  const { selectedTournament } = useTournament();

  // estados (nomes em português)
  const [partidas, setPartidas] = useState([]);
  const [partidasFiltradas, setPartidasFiltradas] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState('');
  const [generoSelecionado, setGeneroSelecionado] = useState('');
  const [statusSelecionado, setStatusSelecionado] = useState('');
  const [generos] = useState(['Masculino', 'Feminino']);
  const [partidaSelecionada, setPartidaSelecionada] = useState(null);
  const [opcoesStatus] = useState(['Agendada', 'Em andamento', 'Finalizada', 'Cancelada']);
  const [carregando, setCarregando] = useState(true);
  const [configuracaoLocais, setConfiguracaoLocais] = useState({});
  const [modalidadesDisponiveis, setModalidadesDisponiveis] = useState([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Estados para sistema de fases
  const [vencedores, setVencedores] = useState([]);
  const [proximaFase, setProximaFase] = useState(null);
  const [avancandoFase, setAvancandoFase] = useState(false);

  useEffect(() => {
    carregarDadosIniciais();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carregarPartidas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament, modalidadeSelecionada, generoSelecionado]);

  useEffect(() => {
    aplicarFiltros();
  }, [partidas, statusSelecionado]);

  useEffect(() => {
    loadConfiguracaoLocais();
  }, []);

  // carrega modalidades (exemplo)
  const carregarDadosIniciais = async () => {
    try {
      const res = await fetch('/api/modalidades');
      const data = res.ok ? await res.json() : [];
      setModalidades(data);
    } catch (err) {
      console.error('Erro ao carregar modalidades:', err);
    } finally {
      setCarregando(false);
    }
  };

  // carrega partidas do torneio
  const carregarPartidas = async () => {
    if (!selectedTournament) {
      setPartidas([]);
      return;
    }
    try {
      let url = `/api/partidas?torneioId=${selectedTournament.id}`;
      if (modalidadeSelecionada) url += `&modalidadeId=${modalidadeSelecionada}`;
      if (generoSelecionado) url += `&genero=${generoSelecionado}`;
      const res = await fetch(url);
      const data = res.ok ? await res.json() : [];
      setPartidas(data);

      // Carregar vencedores se modalidade e gênero estão selecionados
      if (modalidadeSelecionada && generoSelecionado) {
        await carregarVencedores();
      }
    } catch (err) {
      console.error('Erro ao carregar partidas:', err);
      setPartidas([]);
    }
  };

  // carrega vencedores das partidas finalizadas
  const carregarVencedores = async () => {
    if (!selectedTournament || !modalidadeSelecionada || !generoSelecionado) {
      setVencedores([]);
      setProximaFase(null);
      return;
    }

    try {
      const url = `/api/partidas/vencedores?torneioId=${selectedTournament.id}&modalidadeId=${modalidadeSelecionada}&genero=${generoSelecionado}`;
      const res = await fetch(url);
      const data = res.ok ? await res.json() : { vencedores: [], proximaFase: null };

      setVencedores(data.vencedores || []);
      setProximaFase(data.proximaFase);

      console.log(`🏆 ${data.vencedores?.length || 0} vencedores encontrados, próxima fase: ${data.proximaFase || 'N/A'}`);
      console.log('🔍 DEBUG FRONTEND:', {
        modalidadeSelecionada,
        generoSelecionado,
        selectedTournament: selectedTournament?.id,
        vencedoresLength: data.vencedores?.length,
        proximaFase: data.proximaFase,
        condicoesBotao: {
          proximaFase: !!data.proximaFase,
          vencedoresLength: (data.vencedores?.length || 0) > 0,
          modalidadeSelecionada: !!modalidadeSelecionada,
          generoSelecionado: !!generoSelecionado
        }
      });
    } catch (err) {
      console.error('Erro ao carregar vencedores:', err);
      setVencedores([]);
      setProximaFase(null);
    }
  };

  // aplica filtros (agora mantém partidas finalizadas)
  const aplicarFiltros = () => {
    let lista = [...partidas];
    // Aplicar filtro apenas se um status específico for selecionado
    if (statusSelecionado) {
      lista = lista.filter(p => p.status === statusSelecionado);
    }
    setPartidasFiltradas(lista);
  };

  // cor para badge de status
  const obterCorStatus = (status) => {
    switch (status) {
      case 'Finalizada':
      case 'Encerrada':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Em andamento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Agendada':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // mapeia status de exibição para valor aceito pelo servidor
  const mapearStatusParaServidor = (statusPortugues) => {
    const m = {
      'Agendada': 'AGENDADA',
      'Em andamento': 'EM_ANDAMENTO',
      'Finalizada': 'FINALIZADA',
      'Encerrada': 'FINALIZADA', // enviar FINALIZADA quando usuário quer "Encerrada"
      'Cancelada': 'CANCELADA'
    };
    return m[statusPortugues] ?? statusPortugues;
  };

  // avança para a próxima fase do torneio
  const avancarFase = async () => {
    if (!proximaFase || !modalidadeSelecionada || !generoSelecionado) {
      alert('Não é possível avançar fase no momento');
      return;
    }

    const mensagem = `Avançar para ${proximaFase}?\n\nIsto criará ${getNumeroPartidas(proximaFase)} partidas da fase ${proximaFase} com os ${vencedores.length} vencedores atuais.`;

    if (!confirm(mensagem)) return;

    setAvancandoFase(true);
    try {
      const res = await fetch('/api/partidas/avancar-fase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          torneioId: selectedTournament.id,
          modalidadeId: modalidadeSelecionada,
          genero: generoSelecionado,
          faseAtual: 'Grupos' // Por enquanto assumindo que avançamos sempre dos grupos
        })
      });

      if (res.ok) {
        const result = await res.json();
        alert(`✅ ${result.message}`);

        // Recarregar partidas e vencedores
        await carregarPartidas();
        await carregarVencedores();
      } else {
        const error = await res.json();
        alert(`❌ Erro: ${error.error || 'Erro ao avançar fase'}`);
      }
    } catch (error) {
      console.error('Erro ao avançar fase:', error);
      alert('❌ Erro ao avançar fase');
    } finally {
      setAvancandoFase(false);
    }
  };

  // retorna o número de partidas para uma fase
  const getNumeroPartidas = (fase) => {
    if (fase === 'Quartas') return Math.floor(vencedores.length / 2);
    if (fase === 'Semifinais') return Math.floor(vencedores.length / 2);
    if (fase === 'Final') return 1;
    if (fase === 'Triangular') return 3;
    return 0;
  };

  // atualiza status no servidor (envia valor que o servidor espera)
  const atualizarStatusNoServidor = async (partidaId, statusPortugues) => {
    try {
      const servidorStatus = (() => {
        // servidor PATCH handler aceita várias formas mas usamos português mapeado
        if (statusPortugues === 'Encerrada') return 'Finalizada';
        return statusPortugues;
      })();
      const res = await fetch(`/api/partidas/${partidaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: servidorStatus })
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Falha ao atualizar status (${res.status})`);
      }
      const atualizado = await res.json().catch(() => null);
      return atualizado;
    } catch (err) {
      console.warn('Falha ao atualizar status no servidor:', err);
      return null;
    }
  };

  // clique no badge de status: alterna entre Agendada <-> Em andamento (ou escolhe)
  const tratarCliqueStatus = async (partida) => {
    if (!partida) return;
    const atual = partida.status || 'Agendada';
    let desejado = atual === 'Agendada' ? 'Em andamento' : (atual === 'Em andamento' ? 'Agendada' : null);

    if (!desejado) {
      const escolha = window.confirm('Definir status como "Em andamento"? OK = Em andamento, Cancel = Agendada');
      desejado = escolha ? 'Em andamento' : 'Agendada';
    } else {
      const msg = desejado === 'Em andamento'
        ? 'Deseja iniciar a partida e abrir a súmula em modo AO VIVO?'
        : 'Deseja marcar a partida como AGENDADA?';
      if (!window.confirm(msg)) return;
    }

    // atualização otimista na UI
    setPartidas(prev => prev.map(p => p.id === partida.id ? { ...p, status: desejado } : p));
    setPartidasFiltradas(prev => prev.map(p => p.id === partida.id ? { ...p, status: desejado } : p));

    // tentar persistir no servidor (convertendo 'Encerrada' local para 'Finalizada' para o servidor)
    const servidorRes = await atualizarStatusNoServidor(partida.id, desejado);
    if (servidorRes) {
      setPartidas(prev => prev.map(p => p.id === partida.id ? { ...p, ...(servidorRes || {}) } : p));
      setPartidasFiltradas(prev => prev.map(p => p.id === partida.id ? { ...p, ...(servidorRes || {}) } : p));
    }

    // se virou Em andamento, abrir modal em modo live
    if (desejado === 'Em andamento') {
      setPartidaSelecionada({ ...partida, status: 'Em andamento' });
    } else {
      // se voltou para agendada e modal aberto para essa partida, fechar
      if (partidaSelecionada?.id === partida.id) setPartidaSelecionada(null);
    }
  };

  // quando a súmula é enviada (SumulaModal -> onSumulaEnviada)
  // atualizamos status local para "Finalizada" e persistimos no servidor
  const tratarSumulaEnviada = async (partidaId) => {
    // atualização otimista local: marcar como "Finalizada"
    setPartidas(prev => prev.map(p => p.id === partidaId ? { ...p, status: 'Finalizada' } : p));
    setPartidasFiltradas(prev => prev.map(p => p.id === partidaId ? { ...p, status: 'Finalizada' } : p));

    // enviar como "Finalizada" ao servidor
    await atualizarStatusNoServidor(partidaId, 'Finalizada');

    // recarregar partidas para garantir consistência em dashboard
    await carregarPartidas();
  };

  const loadConfiguracaoLocais = async () => {
    try {
      const response = await fetch('/api/modalidades-locais');
      const data = await response.json();

      setModalidadesDisponiveis(data.modalidades);

      // Configuração padrão
      const configPadrao = {};
      data.modalidades.forEach(modalidade => {
        configPadrao[modalidade.nome] = modalidade.localPadrao;
      });
      setConfiguracaoLocais(configPadrao);
    } catch (error) {
      console.error('Erro ao carregar configuração de locais:', error);
    }
  };

  const gerarPartidasOtimizadas = async () => {
    if (!selectedTournament) {
      alert('Selecione um torneio primeiro');
      return;
    }

    if (!confirm('Gerar partidas otimizadas? Esta ação criará TODAS as partidas de TODAS as modalidades de forma otimizada e simultânea.')) {
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/partidas/gerar-otimizadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          torneioId: selectedTournament.id,
          configuracaoLocais
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.partidasGeradas} partidas geradas em ${result.slots} slots de tempo! ${result.modalidades} modalidades otimizadas.`);
        carregarPartidas(); // Recarregar partidas
      } else {
        const error = await response.json();
        alert('❌ ' + (error.error || 'Erro ao gerar partidas'));
      }
    } catch (error) {
      console.error('Erro ao gerar partidas:', error);
      alert('❌ Erro ao gerar partidas');
    } finally {
      setGenerating(false);
    }
  };

  if (carregando) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">PARTIDAS</h1>
          {selectedTournament && (
            <p className="text-gray-500 dark:text-gray-400">
              Torneio: {selectedTournament.name} • {partidasFiltradas.length} partidas
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowConfigModal(true)}
            variant="outline"
            disabled={!selectedTournament}
          >
            <Settings size={16} className="mr-2" />
            Configurar Locais
          </Button>
          <Button
            onClick={gerarPartidasOtimizadas}
            disabled={!selectedTournament || generating}
          >
            <Play size={16} className="mr-2" />
            {generating ? 'Gerando...' : 'Gerar Partidas Otimizadas'}
          </Button>

          {/* Botão Avançar Fase - aparece quando há vencedores prontos */}
          {proximaFase && vencedores.length > 0 && modalidadeSelecionada && generoSelecionado && (
            <Button
              onClick={avancarFase}
              disabled={avancandoFase}
              variant="primary"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Trophy size={16} className="mr-2" />
              {avancandoFase ? 'Avançando...' : `Avançar para ${proximaFase}`}
            </Button>
          )}
        </div>
      </div>

      {!selectedTournament ? (
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Selecione um torneio no Dashboard primeiro</p>
        </div>
      ) : (
        <>
          {/* filtros */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Modalidade"
                value={modalidadeSelecionada}
                onChange={(e) => { setModalidadeSelecionada(e.target.value); setGeneroSelecionado(''); }}
              >
                <option value="">Todas as modalidades</option>
                {modalidades.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </Select>

              <Select
                label="Gênero"
                value={generoSelecionado}
                onChange={(e) => setGeneroSelecionado(e.target.value)}
                disabled={!modalidadeSelecionada}
              >
                <option value="">Todos os gêneros</option>
                {generos.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>

              <Select
                label="Status"
                value={statusSelecionado}
                onChange={(e) => setStatusSelecionado(e.target.value)}
              >
                <option value="">Todos os status</option>
                {opcoesStatus.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>

              <div className="flex items-end">
                <Button
                  onClick={() => { setModalidadeSelecionada(''); setGeneroSelecionado(''); setStatusSelecionado(''); }}
                  variant="outline"
                  className="w-full"
                >
                  <Filter size={16} className="mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </div>

          {/* Painel de Vencedores e Próxima Fase */}
          {modalidadeSelecionada && generoSelecionado && vencedores.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Trophy size={20} />
                  Vencedores Atuais
                </h3>
                <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                  {vencedores.length} vencedores
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                {vencedores.slice(0, 6).map((v, i) => ( // Mostrar apenas os primeiros 6
                  <div key={i} className="bg-white dark:bg-gray-800 rounded px-3 py-2 text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{v.vencedor.nome}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">({v.vencedor.curso})</span>
                  </div>
                ))}
                {vencedores.length > 6 && (
                  <div className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-sm text-center text-gray-600 dark:text-gray-300">
                    +{vencedores.length - 6} mais
                  </div>
                )}
              </div>

              {proximaFase && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                  <span>🏆</span>
                  <span>
                    Pronto para avançar para <strong>{proximaFase}</strong>
                    {getNumeroPartidas(proximaFase) > 0 && ` (${getNumeroPartidas(proximaFase)} partidas)`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* lista de partidas */}
          {partidasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {partidas.length === 0 ? 'Nenhuma partida encontrada. Gere o chaveamento primeiro.' : 'Nenhuma partida corresponde aos filtros selecionados.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Ordem Otimizada de Partidas</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">As partidas abaixo foram organizadas automaticamente para maximizar o tempo de descanso entre jogos dos times, garantindo uma distribuição equilibrada ao longo do torneio.</p>
              </div>

              {partidasFiltradas.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Partida #{p.ordem}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Grupo {p.grupo}</span>

                        <span
                          onClick={() => tratarCliqueStatus(p)}
                          className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${obterCorStatus(p.status)}`}
                          title="Clique para alternar Agendada / Em andamento"
                        >
                          {p.status || 'Agendada'}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="text-center">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{p.team1}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{p.team1Course}</p>
                        </div>

                        <div className="text-center px-4">
                          {p.result ? (
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{p.result}</div>
                          ) : (
                            <div className="text-xl font-bold text-gray-400">VS</div>
                          )}

                          {/* Mostrar vencedor se partida finalizada */}
                          {p.status === 'Finalizada' && p.vencedor && (
                            <div className="mt-2">
                              {p.empate ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                  🤝 EMPATE
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                                  🏆 {p.vencedor}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-center">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{p.team2}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{p.team2Course}</p>
                        </div>

                        {/* botão acessar eventos aparece somente se Em andamento */}
                        {p.status === 'Em andamento' && (
                          <Button onClick={() => setPartidaSelecionada(p)}>Acessar Eventos</Button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Trophy size={14} />
                          <span>{p.modality} • {p.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{p.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{p.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{p.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SumulaModal
            isOpen={!!partidaSelecionada}
            onClose={() => setPartidaSelecionada(null)}
            match={partidaSelecionada}
            mode={partidaSelecionada?.status === 'Em andamento' ? 'live' : 'final'}
            onSumulaEnviada={(id) => tratarSumulaEnviada(id)}
          />

          {showConfigModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Configurar Locais por Modalidade</h3>

                <div className="space-y-4">
                  {modalidadesDisponiveis.map(modalidade => (
                    <div key={modalidade.id}>
                      <label className="block text-sm font-medium mb-1">
                        {modalidade.nome}
                      </label>
                      <select
                        className="w-full p-2 border rounded"
                        value={configuracaoLocais[modalidade.nome] || modalidade.localPadrao}
                        onChange={(e) => setConfiguracaoLocais(prev => ({
                          ...prev,
                          [modalidade.nome]: e.target.value
                        }))}
                      >
                        <option value="Quadra de Baixo">Quadra de Baixo</option>
                        <option value="Quadra de Cima">Quadra de Cima</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={() => setShowConfigModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      setShowConfigModal(false);
                      // Salvar configurações se necessário
                    }}
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};