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
      } else {
        console.error('Erro na resposta da API:', response.status);
        setTournaments([]);
      }
    } catch (error) {
      console.error('Erro ao carregar torneios:', error);
      setTournaments([]); // Garantir que seja sempre um array
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