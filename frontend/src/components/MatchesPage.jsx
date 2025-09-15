'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Trophy, Filter, Play, Settings, Shuffle } from 'lucide-react';
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
    } catch (err) {
      console.error('Erro ao carregar partidas:', err);
      setPartidas([]);
    }
  };

  // aplica filtros - partidas finalizadas permanecem visíveis
  const aplicarFiltros = () => {
    let lista = [...partidas];
    if (statusSelecionado) {
      lista = lista.filter(p => p.status === statusSelecionado);
    }
    setPartidasFiltradas(lista);
  };

  // cor para badge de status
  const obterCorStatus = (status) => {
    switch (status) {
      case 'Finalizada':
      case 'Finalizada':
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
      'Cancelada': 'CANCELADA'
    };
    return m[statusPortugues] ?? statusPortugues;
  };

  // atualiza status no servidor (envia valor que o servidor espera)
  const atualizarStatusNoServidor = async (partidaId, statusPortugues) => {
    try {
      const servidorStatus = (() => {
        // servidor PATCH handler aceita várias formas mas usamos português mapeado
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

    // tentar persistir no servidor
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
  const tratarSumulaEnviada = async (partidaId) => {
    // Apenas recarrega as partidas para garantir consistência.
    // A API de finalização já atualizou o status e os pontos.
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
      console.log('📍 Configuração de locais carregada:', configPadrao);
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

  // gerar pontuações aleatórias para partidas agendadas
  const gerarPontuacoesAleatorias = async () => {
    const partidasAgendadas = partidas.filter(p => p.status === 'Agendada');
    
    if (partidasAgendadas.length === 0) {
      alert('❌ Nenhuma partida agendada encontrada');
      return;
    }

    const confirmar = window.confirm(`Finalizar ${partidasAgendadas.length} partidas com pontuações aleatórias?`);
    if (!confirmar) return;

    try {
      const response = await fetch('/api/partidas/pontuacoes-aleatorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ torneioId: selectedTournament.id })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.partidasFinalizadas} partidas finalizadas!`);
        // Recarregar partidas do servidor para mostrar as pontuações
        await carregarPartidas();
      } else {
        const error = await response.json();
        alert('❌ ' + (error.error || 'Erro ao gerar pontuações'));
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao gerar pontuações');
    }
  };

  // gerar eliminatórias baseadas na classificação dos grupos
  // gerar eliminatórias baseadas na classificação dos grupos
  const gerarEliminatorias = async () => {
    if (!selectedTournament?.id) {
      alert('❌ Selecione um torneio primeiro');
      return;
    }

    if (!modalidadeSelecionada || !generoSelecionado) {
      alert('❌ Selecione uma modalidade e gênero para gerar as eliminatórias.');
      return;
    }

    const confirmar = window.confirm('Gerar eliminatórias baseadas na classificação atual dos grupos?');
    if (!confirmar) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/eliminatorias/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          torneioId: selectedTournament.id,
          modalidadeId: modalidadeSelecionada,
          genero: generoSelecionado,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Eliminatórias geradas! ${result.partidasCriadas} partidas criadas na fase: ${result.fase}`);
        await carregarPartidas();
      } else {
        const error = await response.json();
        alert('❌ ' + (error.error || 'Erro ao gerar eliminatórias'));
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao gerar eliminatórias');
    } finally {
      setGenerating(false);
    }
  };

  // Função para determinar o vencedor
  const obterVencedor = (partida) => {
    if (!partida.result) return null;
    
    const [golsCasa, golsVisitante] = partida.result.split(':').map(Number);
    
    if (golsCasa > golsVisitante) {
      return { vencedor: partida.team1, tipo: 'casa' };
    } else if (golsVisitante > golsCasa) {
      return { vencedor: partida.team2, tipo: 'visitante' };
    } else {
      return { vencedor: 'Empate', tipo: 'empate' };
    }
  };

  // Função para determinar a próxima ação do torneio
  const proximaAcao = (() => {
    if (!selectedTournament) return '';
    
    // Se não há partidas, pode gerar grupos ou eliminatórias
    if (!partidas.length) {
      return 'GERAR_GRUPOS';
    }
    
    // Verificar se há partidas de grupos pendentes
    const partidasGrupos = partidas.filter(p => p.fase === 'Grupos' || p.fase === 'Fase de Grupos' || !p.fase);
    const partidasGruposPendentes = partidasGrupos.filter(p => p.status !== 'FINALIZADA');
    
    if (partidasGruposPendentes.length > 0) {
      return 'AGUARDAR_GRUPOS';
    }
    
    // Verificar se já existem eliminatórias
    const partidasEliminatorias = partidas.filter(p => 
      p.fase && ['Oitavas de Final', 'Quartas de Final', 'Semifinais', 'Final', 'Triangular Final', 'Partida Extra'].includes(p.fase)
    );
    
    // Se há partidas de grupos finalizadas mas não há eliminatórias, pode gerar eliminatórias
    if (partidasGrupos.length > 0 && partidasEliminatorias.length === 0) {
      return 'GERAR_ELIMINATORIAS';
    }
    
    return '';
  })();

  // Função para obter texto do botão de gerar partidas
  const getBotaoGerarPartidasTexto = () => {
    if (proximaAcao === 'GERAR_GRUPOS') {
      return 'Gerar Partidas de Grupos';
    }
    if (proximaAcao === 'GERAR_ELIMINATORIAS') {
      return 'Gerar Eliminatórias';
    }
    return 'Gerar Partidas';
  };

  // Função para lidar com geração de partidas
  const handleGerarPartidas = async () => {
    if (!selectedTournament) return;
    
    if (proximaAcao === 'GERAR_GRUPOS') {
      await gerarPartidasDeGrupos();
    } else if (proximaAcao === 'GERAR_ELIMINATORIAS') {
      await gerarEliminatorias();
    } else {
      alert('Funcionalidade em desenvolvimento');
    }
  };

  // Função para gerar partidas de grupos
  const gerarPartidasDeGrupos = async () => {
    if (!selectedTournament) return;
    
    const confirmar = window.confirm('Deseja gerar todas as partidas de grupos para todas as modalidades e gêneros do torneio?\n\n📋 Regra aplicada: Sempre um jogo masculino e um feminino simultaneamente, um em cada quadra.\n🏟️ As partidas serão distribuídas entre as quadras conforme a configuração de locais.');
    if (!confirmar) return;

    setGenerating(true);
    try {
      console.log('🚀 Enviando configuração de locais:', configuracaoLocais);
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
        alert(`✅ ${result.partidasGeradas} partidas geradas em ${result.slots} slots de tempo!\n⚽ Cada slot contém 1 jogo masculino + 1 feminino simultâneos.\n🏟️ ${result.modalidades} modalidades distribuídas entre as quadras.`);
        await carregarPartidas();
      } else {
        const error = await response.json();
        alert('❌ ' + (error.error || 'Erro ao gerar partidas'));
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao gerar partidas');
    } finally {
      setGenerating(false);
    }
  };  if (carregando) {
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
          {proximaAcao && proximaAcao.startsWith('GERAR') && (
            <Button 
              onClick={handleGerarPartidas}
              disabled={!selectedTournament || generating}
            >
              <Play size={16} className="mr-2" />
              {generating ? 'Gerando...' : getBotaoGerarPartidasTexto()}
            </Button>
          )}
          <Button 
            onClick={gerarPontuacoesAleatorias} 
            disabled={partidas.filter(p => p.status === 'Agendada').length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Shuffle size={16} className="mr-2" />
            Gerar Pontuações Aleatórias
          </Button>
          
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
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Organização Otimizada de Partidas</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ⚽ <strong>Regra aplicada:</strong> Sempre um jogo masculino e um feminino simultâneos, um em cada quadra.<br/>
                  🏟️ <strong>Distribuição:</strong> Locais definidos pela configuração de modalidades.<br/>
                  ⏱️ <strong>Otimização:</strong> Maximiza o tempo de descanso entre jogos dos times.
                </p>
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
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{p.result}</div>
                              {(() => {
                                const resultado = obterVencedor(p);
                                if (resultado?.tipo === 'empate') {
                                  return <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">EMPATE</div>;
                                } else if (resultado?.vencedor) {
                                  return <div className="text-sm font-semibold text-green-600 dark:text-green-400">🏆 {resultado.vencedor}</div>;
                                }
                                return null;
                              })()}
                            </div>
                          ) : (
                            <div className="text-xl font-bold text-gray-400">VS</div>
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
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Configurar Locais por Modalidade</h3>
                
                <div className="space-y-4">
                  {modalidadesDisponiveis.map(modalidade => (
                    <div key={modalidade.id}>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {modalidade.nome}
                      </label>
                      <select 
                        className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
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