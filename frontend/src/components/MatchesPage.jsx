'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Trophy, Filter, AlertCircle, Play, Shuffle } from 'lucide-react';
import { Button, Select } from '@/components/common';
import { useTournament } from '@/contexts/TournamentContext';
import { SumulaModal } from '@/components/SumulaModal';
import { WOModal } from '@/components/WOModal';

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
  const [opcoesStatus] = useState(['Agendada', 'Em andamento', 'Encerrada', 'Cancelada']);
  const [carregando, setCarregando] = useState(true);
  const [woModalAberto, setWoModalAberto] = useState(false);
  const [partidaWO, setPartidaWO] = useState(null);

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
  // atualizamos status local para "Encerrada" e persistimos como "Finalizada" no servidor
  const tratarSumulaEnviada = async (partidaId) => {
    // atualização otimista local: colocar "Encerrada" para exibição
    setPartidas(prev => prev.map(p => p.id === partidaId ? { ...p, status: 'Encerrada' } : p));
    setPartidasFiltradas(prev => prev.map(p => p.id === partidaId ? { ...p, status: 'Encerrada' } : p));

    // enviar como "Finalizada" ao servidor
    await atualizarStatusNoServidor(partidaId, 'Finalizada');

    // recarregar partidas para garantir consistência em dashboard
    await carregarPartidas();
  };

  // abrir modal de WO
  const abrirModalWO = (partida) => {
    setPartidaWO(partida);
    setWoModalAberto(true);
  };

  // fechar modal de WO
  const fecharModalWO = () => {
    setWoModalAberto(false);
    setPartidaWO(null);
  };

  // quando WO é confirmado
  const tratarWOConfirmado = async () => {
    await carregarPartidas(); // recarregar partidas
    fecharModalWO();
  };

  // gerar partidas automaticamente
  const gerarPartidas = async () => {
    if (!selectedTournament || !modalidadeSelecionada || !generoSelecionado) {
      alert('Selecione o torneio, modalidade e gênero primeiro');
      return;
    }

    try {
      const response = await fetch('/api/matches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          torneioId: selectedTournament.id,
          modalidadeId: modalidadeSelecionada,
          genero: generoSelecionado
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${result.partidasGeradas} partidas geradas com sucesso!`);
        await carregarPartidas();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao gerar partidas');
      }
    } catch (error) {
      console.error('Erro ao gerar partidas:', error);
      alert('Erro ao gerar partidas');
    }
  };

  // gerar resultados aleatórios para partidas agendadas
  const gerarResultadosAleatorios = async () => {
    const partidasAgendadas = partidas.filter(p => p.status === 'Agendada');
    
    if (partidasAgendadas.length === 0) {
      alert('Nenhuma partida agendada encontrada para gerar resultados');
      return;
    }

    const confirmar = window.confirm(`Deseja gerar resultados aleatórios para ${partidasAgendadas.length} partidas agendadas?`);
    if (!confirmar) return;

    try {
      let resultadosGerados = 0;

      for (const partida of partidasAgendadas) {
        // Gerar placares realistas (1-5 gols)
        let golsCasa = Math.floor(Math.random() * 5) + 1;
        let golsVisitante = Math.floor(Math.random() * 5) + 1;

        // 15% chance de empate apenas na fase de grupos
        const chanceEmpate = Math.random();
        if (chanceEmpate < 0.15) {
          golsVisitante = golsCasa; // Forçar empate
        } else if (chanceEmpate < 0.575) {
          // 50% das vezes não-empate, garantir vitória da casa
          while (golsCasa <= golsVisitante) {
            golsCasa = Math.floor(Math.random() * 5) + 1;
          }
        } else {
          // 50% das vezes não-empate, garantir vitória visitante
          while (golsVisitante <= golsCasa) {
            golsVisitante = Math.floor(Math.random() * 5) + 1;
          }
        }

        // Atualizar partida com resultado
        const updateResponse = await fetch(`/api/partidas/${partida.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Finalizada',
            pontosCasa: golsCasa,
            pontosVisitante: golsVisitante
          })
        });

        if (updateResponse.ok) {
          resultadosGerados++;
        }
      }

      alert(`${resultadosGerados} resultados aleatórios gerados com sucesso!`);
      await carregarPartidas();
    } catch (error) {
      console.error('Erro ao gerar resultados aleatórios:', error);
      alert('Erro ao gerar resultados aleatórios');
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
            onClick={gerarPartidas} 
            disabled={!selectedTournament || !modalidadeSelecionada || !generoSelecionado}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Gerar Partidas
          </Button>
          <Button 
            onClick={gerarResultadosAleatorios} 
            disabled={partidas.filter(p => p.status === 'Agendada').length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            Resultados Aleatórios
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

                        {/* Ícone de WO */}
                        {(p.status === 'Agendada' || p.status === 'Em andamento') && (
                          <button
                            onClick={() => abrirModalWO(p)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            title="Registrar WO (Walk Over)"
                          >
                            <AlertCircle size={16} />
                          </button>
                        )}
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

          <WOModal
            isOpen={woModalAberto}
            onClose={fecharModalWO}
            match={partidaWO}
            onWOConfirmed={tratarWOConfirmado}
          />
        </>
      )}
    </div>
  );
};