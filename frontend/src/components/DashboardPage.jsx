'use client';
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Target, Filter, X } from 'lucide-react';
import { useTournament } from '@/contexts/TournamentContext';
import { SumulaModal } from '@/components/SumulaModal';
import { Button, CardSplat, Select } from '@/components/common';
import { mockData } from '@/data';

export const Dashboard = () => {
  const { selectedTournament, tournaments, selectTournament, loading } = useTournament();

  const [filters, setFilters] = useState(['Masculino', 'Feminino', 'Jogos Anteriores']);
  const [partidaSelecionada, setPartidaSelecionada] = useState(null);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMatches: 0,
    completedMatches: 0,
    totalPlayers: 0
  });

  // novos estados para partidas finalizadas (súmulas)
  const [partidasFinalizadas, setPartidasFinalizadas] = useState([]);
  const [carregandoFinalizadas, setCarregandoFinalizadas] = useState(false);

  const removeFilter = (filterToRemove) => setFilters(filters.filter(f => f !== filterToRemove));

  useEffect(() => {
    if (selectedTournament) {
      carregarPartidasFinalizadas();
    } else {
      setPartidasFinalizadas([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament]);

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

  // quando a súmula for enviada a partir do modal, recarrega as finalizadas
  const tratarSumulaEnviada = async (partidaId) => {
    // recarregar lista (a súmula acabou de ser criada e a partida deve aparecer como finalizada)
    await carregarPartidasFinalizadas();
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
              Selecione o torneio para visualizar dados específicos
            </p>
          </div>
          <div className="w-80">
            <Select
              value={selectedTournament?.id || ''}
              onChange={(e) => {
                const tournament = tournaments.find(t => t.id === parseInt(e.target.value));
                selectTournament(tournament);
              }}
            >
              <option value="">Selecione um torneio</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {selectedTournament && (
        <>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard - {selectedTournament.name}
          </h1>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Estatísticas</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Trophy className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total de Equipes</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.totalTeams}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Users className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total de Jogadores</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.totalPlayers}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Calendar className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total de Partidas</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.totalMatches}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Target className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Partidas Concluídas</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.completedMatches}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PARTIDAS ATUAIS (mantém mock data) */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">PARTIDAS ATUAIS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockData.matches.filter(m => m.status === 'Em andamento').slice(0, 2).map(match => (
                  <div key={match.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-red-600 dark:text-red-400 font-semibold uppercase">🔴 AO VIVO</p>
                      </div>
                      <p className="text-2xl font-bold my-2 text-gray-900 dark:text-gray-100">{match.team1} VS {match.team2}</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">{match.result}</p>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Esporte: {match.modality}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Modalidade: {match.category}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Local: {match.location}</p>
                      </div>
                    </div>
                    <CardSplat />
                    <div className="absolute bottom-4 right-4 z-10">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{match.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* JOGADORES EM DESTAQUE (mock) */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">JOGADORES(AS) EM DESTAQUE</h2>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">FUTSAL</h3>
                    {mockData.highlightedPlayers.futsal.map((player, i) => (
                      <p key={i} className="text-gray-600 dark:text-gray-300 text-sm">{player.name} - {player.points} pontos</p>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">VÔLEI</h3>
                    {mockData.highlightedPlayers.volei.map((player, i) => (
                      <p key={i} className="text-gray-600 dark:text-gray-300 text-sm">{player.name} - {player.points} pontos</p>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">BASQUETE</h3>
                    {mockData.highlightedPlayers.basquete.map((player, i) => (
                      <p key={i} className="text-gray-600 dark:text-gray-300 text-sm">{player.name} - {player.points} pontos</p>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">HANDEBOL</h3>
                    {mockData.highlightedPlayers.handebol.map((player, i) => (
                      <p key={i} className="text-gray-600 dark:text-gray-300 text-sm">{player.name} - {player.points} pontos</p>
                    ))}
                  </div>
                </div>
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
                      <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Horário</th>
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
                      partidasFinalizadas.map(match => (
                        <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="p-4 text-gray-800 dark:text-gray-200 font-semibold">{match.team1} VS {match.team2}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-300">{match.time}</td>
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

          <SumulaModal
            isOpen={!!partidaSelecionada}
            onClose={() => { setPartidaSelecionada(null); carregarPartidasFinalizadas(); }}
            match={partidaSelecionada}
            mode="final"
            onSumulaEnviada={(id) => tratarSumulaEnviada(id)}
          />
        </>
      )}
    </div>
  );
};