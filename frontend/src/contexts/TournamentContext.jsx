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
    
    // Só armazena no localStorage se o torneio for válido
    if (tournament && typeof tournament === 'object') {
      try {
        localStorage.setItem('selectedTournament', JSON.stringify(tournament));
      } catch (error) {
        console.error('Erro ao salvar torneio no localStorage:', error);
      }
    } else {
      // Remove do localStorage se o torneio for null/undefined
      localStorage.removeItem('selectedTournament');
    }
  };

  // Recuperar torneio do localStorage com validação
  useEffect(() => {
    const saved = localStorage.getItem('selectedTournament');
    if (saved && saved !== 'undefined' && saved !== 'null') {
      try {
        const parsedTournament = JSON.parse(saved);
        // Verifica se o objeto parseado é válido (não é null ou undefined)
        if (parsedTournament && typeof parsedTournament === 'object') {
          setSelectedTournament(parsedTournament);
        }
      } catch (error) {
        console.error('Erro ao fazer parse do torneio salvo:', error);
        // Remove item inválido do localStorage
        localStorage.removeItem('selectedTournament');
      }
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