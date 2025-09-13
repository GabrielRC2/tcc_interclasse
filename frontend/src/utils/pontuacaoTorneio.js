/**
 * Utilitários para gerenciar pontuação do torneio
 * Separação clara entre pontos da partida (gols) e pontos do torneio (classificação)
 */

// Constantes de pontuação do torneio
export const PONTOS_TORNEIO = {
  VENCEDOR: 3,
  EMPATE: 1,
  PERDEDOR: 0,
  WO: 0, // Time que dá WO não ganha pontos
  PENDENTE: 0
};

/**
 * Calcula os pontos do torneio baseado no resultado
 * @param {string} resultado - VENCEDOR, PERDEDOR, EMPATE, WO, PENDENTE
 * @returns {number} Pontos do torneio (0, 1 ou 3)
 */
export function calcularPontosTorneio(resultado) {
  return PONTOS_TORNEIO[resultado] || 0;
}

/**
 * Determina o resultado baseado nos pontos da partida
 * @param {number} pontosCasa - Pontos/gols do time da casa
 * @param {number} pontosVisitante - Pontos/gols do time visitante
 * @returns {{resultadoCasa: string, resultadoVisitante: string}}
 */
export function determinarResultado(pontosCasa, pontosVisitante) {
  if (pontosCasa > pontosVisitante) {
    return {
      resultadoCasa: 'VENCEDOR',
      resultadoVisitante: 'PERDEDOR'
    };
  } else if (pontosVisitante > pontosCasa) {
    return {
      resultadoCasa: 'PERDEDOR',
      resultadoVisitante: 'VENCEDOR'
    };
  } else {
    return {
      resultadoCasa: 'EMPATE',
      resultadoVisitante: 'EMPATE'
    };
  }
}

/**
 * Atualiza a pontuação do torneio para uma partida
 * @param {object} prisma - Instância do Prisma
 * @param {number} partidaId - ID da partida
 * @param {number} pontosCasa - Pontos da súmula do time da casa
 * @param {number} pontosVisitante - Pontos da súmula do time visitante
 */
export async function atualizarPontuacaoTorneio(prisma, partidaId, pontosCasa, pontosVisitante) {
  // Buscar informações da partida
  const partida = await prisma.partida.findUnique({
    where: { id: partidaId },
    include: {
      times: {
        include: {
          time: true
        }
      }
    }
  });

  if (!partida) {
    throw new Error('Partida não encontrada');
  }

  // Determinar resultados baseados nos pontos
  const { resultadoCasa, resultadoVisitante } = determinarResultado(pontosCasa, pontosVisitante);
  
  const timeCasa = partida.times.find(pt => pt.ehCasa);
  const timeVisitante = partida.times.find(pt => !pt.ehCasa);

  if (!timeCasa || !timeVisitante) {
    throw new Error('Times da partida não encontrados');
  }

  // Calcular pontos do torneio
  const pontosTorneioCasa = calcularPontosTorneio(resultadoCasa);
  const pontosTorneioVisitante = calcularPontosTorneio(resultadoVisitante);

  // Atualizar na base de dados
  await Promise.all([
    prisma.partidaTime.update({
      where: {
        partidaId_timeId: {
          partidaId: partidaId,
          timeId: timeCasa.timeId
        }
      },
      data: {
        resultado: resultadoCasa,
        pontosTorneio: pontosTorneioCasa
      }
    }),
    prisma.partidaTime.update({
      where: {
        partidaId_timeId: {
          partidaId: partidaId,
          timeId: timeVisitante.timeId
        }
      },
      data: {
        resultado: resultadoVisitante,
        pontosTorneio: pontosTorneioVisitante
      }
    })
  ]);

  return {
    timeCasa: {
      nome: timeCasa.time.nome,
      resultado: resultadoCasa,
      pontosTorneio: pontosTorneioCasa
    },
    timeVisitante: {
      nome: timeVisitante.time.nome,
      resultado: resultadoVisitante,
      pontosTorneio: pontosTorneioVisitante
    }
  };
}

/**
 * Processa WO definindo resultados específicos
 * @param {object} prisma - Instância do Prisma
 * @param {number} partidaId - ID da partida
 * @param {number} timeWOId - ID do time que deu WO
 */
export async function processarWO(prisma, partidaId, timeWOId) {
  const partida = await prisma.partida.findUnique({
    where: { id: partidaId },
    include: {
      times: {
        include: {
          time: true
        }
      }
    }
  });

  if (!partida) {
    throw new Error('Partida não encontrada');
  }

  const timeWO = partida.times.find(pt => pt.timeId === timeWOId);
  const timeVencedor = partida.times.find(pt => pt.timeId !== timeWOId);

  if (!timeWO || !timeVencedor) {
    throw new Error('Times da partida não encontrados');
  }

  // Atualizar resultados na partida específica
  await Promise.all([
    prisma.partidaTime.update({
      where: {
        partidaId_timeId: {
          partidaId: partidaId,
          timeId: timeWOId
        }
      },
      data: {
        resultado: 'WO',
        pontosTorneio: calcularPontosTorneio('WO') // 0 pontos
      }
    }),
    prisma.partidaTime.update({
      where: {
        partidaId_timeId: {
          partidaId: partidaId,
          timeId: timeVencedor.timeId
        }
      },
      data: {
        resultado: 'VENCEDOR',
        pontosTorneio: calcularPontosTorneio('VENCEDOR') // 3 pontos
      }
    })
  ]);

  return {
    timeWO: timeWO.time.nome,
    timeVencedor: timeVencedor.time.nome
  };
}

/**
 * Busca classificação do torneio ordenada por pontos
 * @param {object} prisma - Instância do Prisma
 * @param {number} torneioId - ID do torneio
 * @param {object|number} filtro - Objeto de filtro complexo ou grupoId simples (retrocompatibilidade)
 * @returns {Array} Lista de times com pontuação
 */
export async function obterClassificacao(prisma, torneioId, filtro = null) {
  console.log('=== DEBUG CLASSIFICAÇÃO ===');
  console.log('TorneioId:', torneioId);
  console.log('Filtro:', filtro);

  let whereClause;

  if (typeof filtro === 'number') {
    // Retrocompatibilidade: filtro simples por grupoId
    whereClause = {
      partida: {
        torneioId: torneioId,
        grupoId: filtro
      }
    };
  } else if (filtro && typeof filtro === 'object') {
    // Novo formato: objeto de filtro completo
    whereClause = filtro;
  } else {
    // Sem filtro: todos os times do torneio
    whereClause = {
      partida: {
        torneioId: torneioId
      }
    };
  }

  console.log('WhereClause:', JSON.stringify(whereClause, null, 2));

  console.log('🔍 Buscando classificação com whereClause:', JSON.stringify(whereClause, null, 2));

  const resultados = await prisma.partidaTime.findMany({
    where: whereClause,
    include: {
      time: true,
      partida: true
    }
  });

  console.log(`📊 Encontrados ${resultados.length} registros de partidaTime`);
  
  // Log dos primeiros registros para debug
  if (resultados.length > 0) {
    console.log('🎯 Primeiro registro:', {
      timeId: resultados[0].timeId,
      timeNome: resultados[0].time.nome,
      pontosTorneio: resultados[0].pontosTorneio,
      resultado: resultados[0].resultado,
      partidaId: resultados[0].partidaId
    });
  }

  // Agrupar por time e calcular estatísticas
  const classificacao = resultados.reduce((acc, partidaTime) => {
    const timeId = partidaTime.timeId;
    
    console.log(`💫 Processando time ${partidaTime.time.nome}:`, {
      pontosTorneio: partidaTime.pontosTorneio,
      resultado: partidaTime.resultado,
      partidaStatus: partidaTime.partida.statusPartida
    });
    
    if (!acc[timeId]) {
      acc[timeId] = {
        timeId,
        nome: partidaTime.time.nome,
        pontos: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPro: 0,
        golsContra: 0,
        saldoGols: 0
      };
    }

    const team = acc[timeId];
    team.pontos += partidaTime.pontosTorneio || 0; // Garantir que não seja null
    team.jogos += 1;

    // Contar resultados
    switch (partidaTime.resultado) {
      case 'VENCEDOR':
        team.vitorias += 1;
        break;
      case 'EMPATE':
        team.empates += 1;
        break;
      case 'PERDEDOR':
      case 'WO':
        team.derrotas += 1;
        break;
    }

    // Calcular gols (pontos da partida)
    const partida = partidaTime.partida;
    if (partida.pontosCasa !== null && partida.pontosVisitante !== null) {
      if (partidaTime.ehCasa) {
        team.golsPro += partida.pontosCasa;
        team.golsContra += partida.pontosVisitante;
      } else {
        team.golsPro += partida.pontosVisitante;
        team.golsContra += partida.pontosCasa;
      }
    }

    team.saldoGols = team.golsPro - team.golsContra;

    return acc;
  }, {});

  // Converter para array e ordenar
  const classificacaoArray = Object.values(classificacao).sort((a, b) => {
    // Ordenar por: pontos desc, saldo de gols desc, gols pró desc
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
    return b.golsPro - a.golsPro;
  });

  console.log('🏆 Classificação final:', classificacaoArray.map(t => ({
    nome: t.nome,
    pontos: t.pontos,
    vitorias: t.vitorias,
    empates: t.empates,
    derrotas: t.derrotas
  })));

  return classificacaoArray;
}