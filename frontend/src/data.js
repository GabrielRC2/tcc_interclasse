// --- SEED DATA ---
export const courses = ['ETEL', 'ADA', 'DS', 'CNAT', 'EDA', 'ETIQ', 'EVE'];
const years = ['1º', '2º', '3º'];
const sports = ['Futsal', 'Vôlei', 'Basquete', 'Handebol'];
const genders = ['Masculino', 'Feminino'];

let teamIdCounter = 1;
const seededTeams = [];

// Função para gerar nomes de jogadores mais realistas
const generatePlayerName = (gender, course) => {
  const maleNames = ['Carlos', 'João', 'Pedro', 'Lucas', 'Rafael', 'Gabriel', 'Felipe', 'Diego', 'Bruno', 'André'];
  const femaleNames = ['Ana', 'Maria', 'Juliana', 'Carla', 'Fernanda', 'Beatriz', 'Camila', 'Larissa', 'Mariana', 'Gabriela'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Ferreira', 'Costa', 'Alves', 'Pereira', 'Rodrigues'];

  const firstNames = gender === 'Masculino' ? maleNames : femaleNames;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
};

// Gerar times para cada combinação
for (const course of courses) {
  for (const year of years) {
    for (const gender of genders) {
      for (const sport of sports) {
        // Algumas combinações especiais para tornar mais realista
        let teamName = `${year} ${course}`;
        let playersCount = Math.floor(Math.random() * 5) + 8; // 8 to 12 players

        // Times mistos especiais (baseado na sua descrição)
        if (Math.random() > 0.85) {
          if (course === 'EVE' && gender === 'Feminino') {
            teamName = '1/2 EVE';
            playersCount = Math.floor(Math.random() * 8) + 12; // times mistos têm mais jogadores
          } else if (course === 'ETEL' && Math.random() > 0.5) {
            teamName = 'ETEL';
            playersCount = Math.floor(Math.random() * 10) + 15;
          }
        }

        seededTeams.push({
          id: teamIdCounter++,
          name: teamName,
          course: course,
          year: teamName.includes('/') || teamName === 'ETEL' ? 'Misto' : year,
          gender: gender,
          sport: sport,
          playersCount: playersCount,
          players: Array.from({ length: playersCount }, (_, i) => ({
            id: i + 1,
            name: generatePlayerName(gender, course),
            points: Math.floor(Math.random() * 15), // 0-14 pontos
            yellow: Math.floor(Math.random() * 3), // 0-2 cartões amarelos
            red: Math.random() > 0.92 ? 1 : 0, // ~8% chance de cartão vermelho
            position: ['Goleiro', 'Defensor', 'Meio-campo', 'Atacante'][Math.floor(Math.random() * 4)]
          }))
        });
      }
    }
  }
}

// const filteredTeams = seededTeams.filter(team => team.course !== "ADA");

export const mockData = {
  seasons: [
    {
      id: 1,
      name: 'INTERCLASSES - TEMPORADA 7',
      date: '26/05 - 30/05',
      location: 'ETEC JOÃO BELARMINO',
      description: 'A 7ª edição dos jogos interclasses da ETEC João Belarmino, promovendo a integração e o espírito esportivo entre os alunos de todos os cursos.',
      modalities: 'Futsal, Vôlei, Basquete e Handebol',
      status: 'Ativa',
      teamsCount: seededTeams.length,
      matchesPlayed: 45,
      matchesTotal: 120
    },
  ],
  teams: seededTeams, // filteredTeams
  registrations: {
    sports: [
      { id: 1, name: 'Futsal', icon: '⚽', maxPlayers: 12, minPlayers: 8 },
      { id: 2, name: 'Basquete', icon: '🏀', maxPlayers: 10, minPlayers: 8 },
      { id: 3, name: 'Vôlei', icon: '🏐', maxPlayers: 12, minPlayers: 8 },
      { id: 4, name: 'Handebol', icon: '🤾', maxPlayers: 14, minPlayers: 10 },
    ],
    locations: [
      { id: 1, name: 'QUADRA DE CIMA', capacity: 200, sports: ['Futsal', 'Basquete'] },
      { id: 2, name: 'QUADRA DE BAIXO', capacity: 150, sports: ['Vôlei', 'Handebol'] },
    ],
    courses: [
      { id: 1, name: 'Desenvolvimento de Sistemas', sigla: 'DS' },
      { id: 2, name: 'Administração', sigla: 'ADA' },
      { id: 3, name: 'Eventos', sigla: 'EVE' },
      { id: 4, name: 'Eletrônica', sigla: 'ETEL' },
      { id: 5, name: 'Química', sigla: 'ETIQ' },
      { id: 6, name: 'Nutrição', sigla: 'CNAT' }
    ],
    // Nova seção para administradores e staff
    admins: [
      {
        id: 'admin-1',
        name: 'Administradores',
        description: 'Gerenciamento de usuários administradores do sistema.',
        users: [
          { id: 'user-a1', name: 'João Silva', email: 'joao.silva@example.com' },
          { id: 'user-a2', name: 'Maria Souza', email: 'maria.souza@example.com' },
        ]
      },
      {
        id: 'admin-2',
        name: 'Staff',
        description: 'Gerenciamento de membros da equipe e apoio.',
        users: [
          { id: 'user-s1', name: 'Carlos Santos', email: 'carlos.santos@example.com' },
          { id: 'user-s2', name: 'Fernanda Oliveira', email: 'fernanda.oliveira@example.com' },
          { id: 'user-s3', name: 'Lucas Pereira', email: 'lucas.pereira@example.com' },
        ]
      },
    ],
  },
  matches: [
    {
      id: 1,
      team1: '1º DS',
      team2: '1º ADA',
      result: '5:3',
      penaltyResult: null,
      modality: 'Futsal',
      category: 'Masculino',
      location: 'Quadra de Cima',
      status: 'Finalizada',
      date: '2024-05-26',
      time: '08:00'
    },
    {
      id: 2,
      team1: '2º ETEL',
      team2: '2º CNAT',
      result: '2:1',
      penaltyResult: null,
      modality: 'Vôlei',
      category: 'Feminino',
      location: 'Quadra de Baixo',
      status: 'Finalizada',
      date: '2024-05-26',
      time: '09:00'
    },
    // PARTIDAS ATUAIS - EM ANDAMENTO
    {
      id: 7,
      team1: '3º EVE',
      team2: '1º ETIQ',
      result: '15:12',
      penaltyResult: null,
      modality: 'Basquete',
      category: 'Masculino',
      location: 'Quadra de Cima',
      status: 'Em andamento',
      date: '2024-05-27',
      time: '13:00'
    },
    {
      id: 8,
      team1: '2º DS',
      team2: '1/2 EVE',
      result: '18:16',
      penaltyResult: null,
      modality: 'Vôlei',
      category: 'Feminino',
      location: 'Quadra de Baixo',
      status: 'Em andamento',
      date: '2024-05-27',
      time: '13:30'
    },
    // PRÓXIMAS PARTIDAS
    {
      id: 3,
      team1: '1º ADA',
      team2: '3º EDA',
      result: null,
      penaltyResult: null,
      modality: 'Handebol',
      category: 'Masculino',
      location: 'Quadra de Baixo',
      status: 'Próxima',
      date: '2024-05-27',
      time: '14:00'
    },
    {
      id: 4,
      team1: '2º CNAT',
      team2: '1º ETEL',
      result: null,
      penaltyResult: null,
      modality: 'Futsal',
      category: 'Feminino',
      location: 'Quadra de Cima',
      status: 'Próxima',
      date: '2024-05-27',
      time: '15:00'
    },
    {
      id: 5,
      team1: '3º ADA',
      team2: 'ETEL',
      result: '10:10',
      penaltyResult: '3:2',
      modality: 'Basquete',
      category: 'Masculino',
      location: 'Quadra de Baixo',
      status: 'Finalizada',
      date: '2024-05-26',
      time: '16:00'
    },
    {
      id: 6,
      team1: '1º EVE',
      team2: '2º EDA',
      result: '25:23',
      penaltyResult: null,
      modality: 'Vôlei',
      category: 'Feminino',
      location: 'Quadra de Baixo',
      status: 'Finalizada',
      date: '2024-05-26',
      time: '17:00'
    }
  ],
  highlightedPlayers: {
    futsal: [
      { name: 'Carlos Silva (1º DS)', points: 12, goals: 8, team: '1º DS' },
      { name: 'Mariana Lima (1º ADA)', points: 10, goals: 6, team: '1º ADA' },
      { name: 'Rafael Santos (ETEL)', points: 9, goals: 5, team: 'ETEL' }
    ],
    volei: [
      { name: 'Juliana Alves (2º ETEL)', points: 18, aces: 15, team: '2º ETEL' },
      { name: 'Ricardo Souza (2º CNAT)', points: 15, aces: 12, team: '2º CNAT' },
      { name: 'Ana Costa (1/2 EVE)', points: 14, aces: 10, team: '1/2 EVE' }
    ],
    basquete: [
      { name: 'Felipe Oliveira (3º ADA)', points: 22, baskets: 11, team: '3º ADA' },
      { name: 'Camila Ferreira (1º ETEL)', points: 20, baskets: 10, team: '1º ETEL' },
      { name: 'Bruno Pereira (3º EVE)', points: 18, baskets: 9, team: '3º EVE' }
    ],
    handebol: [
      { name: 'Diego Rodrigues (1º ETIQ)', points: 16, goals: 12, team: '1º ETIQ' },
      { name: 'Beatriz Alves (2º DS)', points: 14, goals: 10, team: '2º DS' },
      { name: 'Gabriel Lima (2º CNAT)', points: 13, goals: 9, team: '2º CNAT' }
    ]
  },
  statistics: {
    totalTeams: seededTeams.length,
    totalPlayers: seededTeams.reduce((sum, team) => sum + team.playersCount, 0),
    totalMatches: 120,
    matchesPlayed: 45,
    upcomingMatches: 75,
    topScoringTeam: { name: '1º DS', points: 45 },
    fairPlayTeam: { name: '2º ETEL', yellowCards: 2, redCards: 0 }
  }
};