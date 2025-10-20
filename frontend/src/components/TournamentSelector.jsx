'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, MapPin, Users, X, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common';
import { Modal } from '@/components/Modal';
import { useTournament } from '@/contexts/TournamentContext';

export const TournamentSelector = ({
  isOpen,
  onClose,
  tournaments,
  selectedTournament,
  onSelectTournament
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshTournaments } = useTournament();

  // Atualizar lista de torneios quando o modal abre
  useEffect(() => {
    if (isOpen) {
      handleRefreshTournaments();
    }
  }, [isOpen]);

  const handleRefreshTournaments = async () => {
    setIsRefreshing(true);
    try {
      await refreshTournaments();
    } catch (error) {
      console.error('Erro ao atualizar torneios:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen) return null;

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tournament.status.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // Prioridade de ordenação:
    // 1. "Em Andamento" / "EM_ANDAMENTO" primeiro
    // 2. "ATIVO" segundo
    // 3. Outros por nome
    const statusPriority = (status) => {
      const s = status.toLowerCase();
      if (s === 'em andamento' || s === 'em_andamento') return 0;
      if (s === 'ativo') return 1;
      if (s === 'planejamento') return 2;
      return 3;
    };

    const priorityA = statusPriority(a.status);
    const priorityB = statusPriority(b.status);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Se mesmo status, ordenar por nome
    return a.name.localeCompare(b.name);
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'em andamento':
      case 'em_andamento':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'ativo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'planejamento':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'finalizado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleSelectTournament = (tournament) => {
    onSelectTournament(tournament);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="max-w-4xl"
    >
      <div className="max-h-[70vh] flex flex-col -mt-4">
        {/* Header customizado */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="text-red-600 dark:text-red-400" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Selecionar Torneio
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshTournaments}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
              title="Atualizar lista de torneios"
            >
              <RefreshCw size={20} className={`text-gray-500 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              placeholder="Buscar torneio por nome ou status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {isRefreshing && (
              <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                Atualizando...
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Lista atualizada automaticamente. Torneios "Em Andamento" aparecem primeiro.
          </p>
        </div>

        {/* Tournament List */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
          {filteredTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nenhum torneio encontrado com essa busca' : 'Nenhum torneio disponível'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  onClick={() => handleSelectTournament(tournament)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md
                    ${selectedTournament?.id === tournament.id
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {tournament.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                          {tournament.status}
                        </span>
                        {(tournament.status.toLowerCase() === 'em andamento' || tournament.status === 'EM_ANDAMENTO') && (
                          <span className="px-2 py-1 bg-red-600 text-white rounded-full text-xs font-bold">
                            ⭐ PRIORITÁRIO
                          </span>
                        )}
                        {selectedTournament?.id === tournament.id && (
                          <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                            ✓ Selecionado
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>{tournament.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>{tournament.teamsCount} times</span>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>Modalidades: {tournament.modalities}</span>
                        <span className="ml-4">
                          Partidas: {tournament.matchesPlayed}/{tournament.matchesTotal}
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={20} className="text-gray-400 ml-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {selectedTournament && (
            <Button onClick={() => handleSelectTournament(selectedTournament)}>
              Confirmar Seleção
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};