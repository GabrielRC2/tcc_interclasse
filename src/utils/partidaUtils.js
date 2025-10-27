/**
 * Calcula o resultado de uma partida baseado nos eventos
 * @param {Array} eventos - Lista de eventos da partida
 * @param {Object} match - Objeto com dados da partida 
 * @returns {Object} Objeto com placar e vencedor
 */
export function resultadoPartida(eventos, match) {
  // Inicializa placar
  let placarTimeA = 0;
  let placarTimeB = 0;
  
  if (!eventos?.length) {
    return { 
      placar: "0:0", 
      vencedorId: null, 
      empate: true 
    };
  }
  
  // Filtra apenas eventos de gol e com pontos
  const gols = eventos.filter(evento => 
    evento.tipo === "GOL" && evento.pontosGerados > 0);
  
  // Itera sobre cada gol para somar ao placar correto
  gols.forEach(gol => {
    // Verifica a qual time pertence o jogador que marcou o gol
    // Esta lógica pode precisar ser adaptada conforme sua estrutura de dados
    if (gol.jogador?.time?.nome === match.team1) {
      placarTimeA += gol.pontosGerados;
    } else if (gol.jogador?.time?.nome === match.team2) {
      placarTimeB += gol.pontosGerados;
    }
  });
  
  // Determina resultado
  const placar = `${placarTimeA}:${placarTimeB}`;
  
  // Determina o ID do time vencedor
  // Você precisará adaptar isso para obter os IDs corretos dos times
  let vencedorId = null;
  if (placarTimeA > placarTimeB) {
    vencedorId = match.team1Id;  // ID do time A
  } else if (placarTimeB > placarTimeA) {
    vencedorId = match.team2Id;  // ID do time B
  }
  
  return {
    placar,
    vencedorId,
    empate: placarTimeA === placarTimeB
  };
}