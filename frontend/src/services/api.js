const API_BASE = '/api';

export const teamsService = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE}/teams`);
      if (!response.ok) throw new Error('Erro ao carregar times');
      return await response.json();
    } catch (error) {
      console.error('Erro:', error);
      // Retorna mock data temporariamente enquanto a API não está pronta
      return [
        {
          id: 1,
          name: "1º ETIM A",
          course: "1º ETIM",
          year: "1º",
          gender: "Masculino",
          sport: "Futsal",
          playersCount: 12,
          players: [
            { id: 1, name: "João Silva", points: 15, red: 0, yellow: 1 },
            { id: 2, name: "Pedro Santos", points: 8, red: 1, yellow: 0 }
          ]
        }
      ];
    }
  },

  create: async (teamData) => {
    try {
      const response = await fetch(`${API_BASE}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });
      if (!response.ok) throw new Error('Erro ao criar time');
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar time:', error);
      throw error;
    }
  }
};