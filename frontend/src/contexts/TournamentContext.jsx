'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const TournamentContext = createContext();

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};

export const TournamentProvider = ({ children }) => {
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
    
    // Polling para atualizar a lista de torneios a cada 2 minutos
    const interval = setInterval(() => {
      loadTournaments();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await fetch('/api/torneios');
      const data = await response.json();
      
      // Só atualiza se os dados realmente mudaram (para evitar re-renders desnecessários)
      setTournaments(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data)) {
          return prev; // Não atualiza se os dados são iguais
        }
        return data;
      });
      
      // Prioridade para seleção automática:
      // 1. Torneio "Em Andamento" ou "EM_ANDAMENTO"
      // 2. Torneio "ATIVO"
      // 3. Primeiro da lista
      const priorityTournament = 
        data.find(t => t.status.toLowerCase() === 'em andamento' || t.status === 'EM_ANDAMENTO') ||
        data.find(t => t.status === 'ATIVO') ||
        data[0];
        
      // Só seleciona automaticamente se não há torneio selecionado
      if (priorityTournament && !selectedTournament) {
        setSelectedTournament(priorityTournament);
        localStorage.setItem('selectedTournament', JSON.stringify(priorityTournament));
      } else if (selectedTournament) {
        // Atualizar o torneio selecionado com dados mais recentes
        const updatedSelectedTournament = data.find(t => t.id === selectedTournament.id);
        if (updatedSelectedTournament) {
          // Só atualiza se os dados do torneio realmente mudaram
          const hasChanged = JSON.stringify(selectedTournament) !== JSON.stringify(updatedSelectedTournament);
          if (hasChanged) {
            setSelectedTournament(updatedSelectedTournament);
            localStorage.setItem('selectedTournament', JSON.stringify(updatedSelectedTournament));
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar torneios:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTournament = (tournament) => {
    setSelectedTournament(tournament);
    localStorage.setItem('selectedTournament', JSON.stringify(tournament));
  };

  // Recuperar torneio do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedTournament');
    if (saved) {
      setSelectedTournament(JSON.parse(saved));
    }
  }, []);

  return (
    <TournamentContext.Provider value={{
      selectedTournament,
      tournaments,
      loading,
      selectTournament,
      refreshTournaments: loadTournaments
    }}>
      {children}
    </TournamentContext.Provider>
  );
};