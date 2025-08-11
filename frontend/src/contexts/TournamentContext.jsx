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
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await fetch('/api/torneios');
      const data = await response.json();
      setTournaments(data);
      
      // Selecionar o torneio ativo automaticamente
      const activeTournament = data.find(t => t.status === 'ATIVO') || data[0];
      if (activeTournament && !selectedTournament) {
        setSelectedTournament(activeTournament);
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