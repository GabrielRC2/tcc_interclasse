'use client';
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Target, Filter, X, Settings } from 'lucide-react';
import { useTournament } from '@/contexts/TournamentContext';
import { SumulaModal } from '@/components/SumulaModal';
import { TournamentSelector } from '@/components/TournamentSelector';
import { Button, CardSplat, Select } from '@/components/common';
import { mockData } from '@/data';

export const Dashboard = () => {
  const { selectedTournament, tournaments, selectTournament, loading } = useTournament();

  const [filters, setFilters] = useState(['Masculino', 'Feminino', 'Jogos Anteriores']);
  const [partidaSelecionada, setPartidaSelecionada] = useState(null);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);

  // Estados para próximas partidas
  const [proximasPartidas, setProximasPartidas] = useState([]);
  const [carregandoProximas, setCarregandoProximas] = useState(false);

  // Estados para jogadores em destaque
  const [jogadoresDestaque, setJogadoresDestaque] = useState({});
  const [carregandoJogadores, setCarregandoJogadores] = useState(false);

  // novos estados para partidas finalizadas (súmulas)
  const [partidasFinalizadas, setPartidasFinalizadas] = useState([]);
  const [carregandoFinalizadas, setCarregandoFinalizadas] = useState(false);

  const removeFilter = (filterToRemove) => setFilters(filters.filter(f => f !== filterToRemove));

  useEffect(() => {
    if (selectedTournament) {
      carregarProximasPartidas();
      carregarJogadoresDestaque();
      carregarPartidasFinalizadas();
    } else {
      setProximasPartidas([]);
      setJogadoresDestaque({});
      setPartidasFinalizadas([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament]);

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

  // busca partidas finalizadas do backend e guarda em estado
  const carregarPartidasFinalizadas = async () => {
    if (!selectedTournament) return;
    setCarregandoFinalizadas(true);
    try {
      const res = await fetch(`/api/partidas?torneioId=${selectedTournament.id}`);
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

  // quando a súmula for enviada a partir do modal, recarrega as finalizadas e próximas
  const tratarSumulaEnviada = async (partidaId) => {
    // recarregar listas (a súmula acabou de ser criada e a partida deve aparecer como finalizada)
    await carregarPartidasFinalizadas();
    await carregarProximasPartidas(); // Atualizar próximas partidas também
    await carregarJogadoresDestaque(); // Atualizar jogadores em destaque
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Torneio Global */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Torneio Ativo
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedTournament ? `${selectedTournament.name} • ${selectedTournament.status}` : 'Selecione um torneio para visualizar dados específicos'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowTournamentSelector(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings size={16} />
              {selectedTournament ? 'Alterar Torneio' : 'Selecionar Torneio'}
            </Button>
            {selectedTournament && (
              <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
                {selectedTournament.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedTournament && (
        <>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard - {selectedTournament.name}
          </h1>

          <div className="space-y-8">
            {/* PARTIDAS ATUAIS (próximas partidas do banco de dados) */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">PARTIDAS ATUAIS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {carregandoProximas ? (
                  <div className="col-span-2 text-center py-8">Carregando próximas partidas...</div>
                ) : proximasPartidas.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">Nenhuma partida agendada encontrada.</div>
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
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">JOGADORES(AS) EM DESTAQUE</h2>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                {carregandoJogadores ? (
                  <div className="text-center py-8">Carregando jogadores em destaque...</div>
                ) : Object.keys(jogadoresDestaque).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum jogador encontrado para este torneio.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {jogadoresDestaque.futsal && jogadoresDestaque.futsal.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">FUTSAL</h3>
                        {jogadoresDestaque.futsal.map((player, i) => (
                          <p key={i} className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                            <span className="font-medium">{player.name}</span>
                            <br />
                            <span className="text-xs text-gray-500">{player.team} - {player.points} pts</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {jogadoresDestaque.volei && jogadoresDestaque.volei.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">VÔLEI</h3>
                        {jogadoresDestaque.volei.map((player, i) => (
                          <p key={i} className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                            <span className="font-medium">{player.name}</span>
                            <br />
                            <span className="text-xs text-gray-500">{player.team} - {player.points} pts</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {jogadoresDestaque.basquete && jogadoresDestaque.basquete.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">BASQUETE</h3>
                        {jogadoresDestaque.basquete.map((player, i) => (
                          <p key={i} className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                            <span className="font-medium">{player.name}</span>
                            <br />
                            <span className="text-xs text-gray-500">{player.team} - {player.points} pts</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {jogadoresDestaque.handebol && jogadoresDestaque.handebol.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">HANDEBOL</h3>
                        {jogadoresDestaque.handebol.map((player, i) => (
                          <p key={i} className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                            <span className="font-medium">{player.name}</span>
                            <br />
                            <span className="text-xs text-gray-500">{player.team} - {player.points} pts</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {/* Mostrar mensagem se não há modalidades */}
                    {!jogadoresDestaque.futsal && !jogadoresDestaque.volei && !jogadoresDestaque.basquete && !jogadoresDestaque.handebol && (
                      <div className="col-span-4 text-center text-gray-500">
                        Nenhuma modalidade encontrada para este torneio.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* NOVA SEÇÃO: PARTIDAS / SÚMULAS FINALIZADAS */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">SÚMULAS (PARTIDAS FINALIZADAS)</h2>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Partida</th>
                      <th className="p-4 text-center font-semibold text-gray-900 dark:text-gray-100">#</th>
                      <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Esporte</th>
                      <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Categoria</th>
                      <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Local</th>
                      <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Status</th>
                      <th className="p-4 text-right font-semibold text-gray-900 dark:text-gray-100">Ação</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {carregandoFinalizadas ? (
                      <tr>
                        <td colSpan="7" className="p-6 text-center">Carregando súmulas...</td>
                      </tr>
                    ) : partidasFinalizadas.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-6 text-center text-gray-500">Nenhuma súmula encontrada.</td>
                      </tr>
                    ) : (
                      partidasFinalizadas.map((match, index) => (
                        <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="p-4 text-gray-800 dark:text-gray-200 font-semibold">{match.team1} VS {match.team2}</td>
                          <td className="p-4 text-center text-gray-600 dark:text-gray-300 font-medium">#{match.ordem || index + 1}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-300">{match.modality}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-300">{match.category}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-300">{match.location}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {match.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button onClick={() => setPartidaSelecionada(match)}>Ver Súmula</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {partidaSelecionada && (
            <SumulaModal
              key={`sumula-dashboard-${partidaSelecionada.id}`}
              isOpen={true}
              onClose={() => { 
                setPartidaSelecionada(null); 
                carregarPartidasFinalizadas();
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