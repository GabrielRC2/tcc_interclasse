import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { torneioId, modalidadeId, genero } = await request.json();

    if (!torneioId || !modalidadeId || !genero) {
      return Response.json({ error: 'Parâmetros obrigatórios em falta' }, { status: 400 });
    }

    console.log('Gerando partidas para:', { torneioId, modalidadeId, genero });

    // 1. Buscar grupos com times da modalidade/gênero específicos
    const grupos = await prisma.grupo.findMany({
      where: {
        torneioId: parseInt(torneioId),
        modalidadeId: parseInt(modalidadeId)
      },
      include: {
        times: {
          include: {
            time: {
              include: {
                categoria: true,
                curso: true
              }
            }
          },
          where: {
            time: {
              categoria: {
                genero: genero
              }
            }
          }
        }
      }
    });

    if (grupos.length === 0) {
      return Response.json({ error: 'Nenhum grupo encontrado. Realize o sorteio primeiro.' }, { status: 404 });
    }

    // 2. Verificar se já existem partidas e remover
    const gruposIds = grupos.map(g => g.id);
    await prisma.partidaTime.deleteMany({
      where: {
        partida: {
          grupoId: { in: gruposIds }
        }
      }
    });

    await prisma.partida.deleteMany({
      where: {
        grupoId: { in: gruposIds }
      }
    });

    // 3. Gerar partidas para cada grupo
    const todasPartidas = [];
    
    for (const grupo of grupos) {
      const times = grupo.times.map(gt => gt.time);
      console.log(`Grupo ${grupo.nome}: ${times.length} times`);
      
      if (times.length < 2) {
        console.log(`Grupo ${grupo.nome} tem menos de 2 times, pulando`);
        continue;
      }

      const partidasGrupo = gerarRodizioPartidas(times, grupo.id);
      todasPartidas.push(...partidasGrupo);
    }

    // 4. Otimizar ordem das partidas
    const partidasOtimizadas = otimizarOrdemPartidas(todasPartidas);

    // 5. Buscar local padrão
    const localPadrao = await prisma.local.findFirst();
    if (!localPadrao) {
      return Response.json({ error: 'Nenhum local cadastrado no sistema' }, { status: 400 });
    }

    // 6. Salvar partidas no banco
    const partidasCriadas = [];
    
    for (let i = 0; i < partidasOtimizadas.length; i++) {
      const partida = partidasOtimizadas[i];
      
      // Criar partida
      const novaPartida = await prisma.partida.create({
        data: {
          dataHora: new Date(Date.now() + (i * 60 * 60 * 1000)), // Intervalos de 1 hora
          statusPartida: 'AGENDADA',
          grupoId: partida.grupoId,
          localId: localPadrao.id,
          torneioId: parseInt(torneioId)
        }
      });

      // Criar relações com times
      await Promise.all([
        prisma.partidaTime.create({
          data: {
            partidaId: novaPartida.id,
            timeId: partida.time1Id,
            ehCasa: true
          }
        }),
        prisma.partidaTime.create({
          data: {
            partidaId: novaPartida.id,
            timeId: partida.time2Id,
            ehCasa: false
          }
        })
      ]);

      partidasCriadas.push(novaPartida);
    }

    console.log(`${partidasCriadas.length} partidas criadas com sucesso`);

    return Response.json({ 
      message: 'Chaveamento gerado com sucesso!',
      partidasGeradas: partidasCriadas.length,
      grupos: grupos.length
    });

  } catch (error) {
    console.error('Erro ao gerar chaveamento:', error);
    return Response.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}

// Gerar partidas rodízio para um grupo
function gerarRodizioPartidas(times, grupoId) {
  const partidas = [];
  const timesCopy = [...times];

  // Se número ímpar, adicionar folga
  if (timesCopy.length % 2 === 1) {
    timesCopy.push(null); // Folga
  }

  const numRodadas = timesCopy.length - 1;

  for (let r = 0; r < numRodadas; r++) {
    for (let i = 0; i < timesCopy.length / 2; i++) {
      const time1 = timesCopy[i];
      const time2 = timesCopy[timesCopy.length - 1 - i];

      // Não incluir partidas com folga
      if (time1 && time2) {
        partidas.push({
          time1Id: time1.id,
          time2Id: time2.id,
          time1Nome: time1.nome,
          time2Nome: time2.nome,
          grupoId: grupoId,
          rodada: r + 1
        });
      }
    }

    // Rotacionar times (fixar o primeiro)
    const primeiro = timesCopy.shift();
    const segundo = timesCopy.shift();
    timesCopy.push(segundo);
    timesCopy.unshift(primeiro);
  }

  return partidas;
}

// Otimizar ordem das partidas para maximizar descanso
function otimizarOrdemPartidas(partidas) {
  const times = new Set();
  partidas.forEach(p => {
    times.add(p.time1Id);
    times.add(p.time2Id);
  });

  const ultimaPartida = {};
  times.forEach(timeId => ultimaPartida[timeId] = -1);

  const partidasRestantes = [...partidas];
  const resultado = [];
  let posicao = 0;

  while (partidasRestantes.length > 0) {
    let melhorIdx = 0;
    let melhorDescanso = -1;

    partidasRestantes.forEach((partida, idx) => {
      const descanso1 = posicao - ultimaPartida[partida.time1Id];
      const descanso2 = posicao - ultimaPartida[partida.time2Id];
      const menorDescanso = Math.min(descanso1, descanso2);

      if (menorDescanso > melhorDescanso) {
        melhorDescanso = menorDescanso;
        melhorIdx = idx;
      }
    });

    const partidaEscolhida = partidasRestantes.splice(melhorIdx, 1)[0];
    ultimaPartida[partidaEscolhida.time1Id] = posicao;
    ultimaPartida[partidaEscolhida.time2Id] = posicao;
    
    resultado.push({
      ...partidaEscolhida,
      ordem: posicao + 1
    });
    
    posicao++;
  }

  return resultado;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');
    const modalidadeId = searchParams.get('modalidadeId');
    const genero = searchParams.get('genero');

    if (!torneioId) {
      return Response.json([]);
    }

    const whereClause = {
      torneioId: parseInt(torneioId)
    };

    // Filtros opcionais
    if (modalidadeId && genero) {
      whereClause.grupo = {
        modalidadeId: parseInt(modalidadeId)
      };
    }

    const partidas = await prisma.partida.findMany({
      where: whereClause,
      include: {
        times: {
          include: {
            time: {
              include: {
                curso: true,
                categoria: {
                  include: {
                    modalidade: true
                  }
                }
              }
            }
          }
        },
        grupo: {
          include: {
            modalidade: true
          }
        },
        local: true
      },
      orderBy: {
        id: 'asc' // Ordem otimizada
      }
    });

    // Filtrar por gênero se especificado
    let partidasFiltradas = partidas;
    if (genero) {
      partidasFiltradas = partidas.filter(partida => 
        partida.times.some(pt => pt.time.categoria.genero === genero)
      );
    }

    const partidasFormatadas = partidasFiltradas.map((partida, index) => {
      const timesCasa = partida.times.filter(pt => pt.ehCasa);
      const timesVisitante = partida.times.filter(pt => !pt.ehCasa);
      
      const timeCasa = timesCasa[0]?.time;
      const timeVisitante = timesVisitante[0]?.time;

      return {
        id: partida.id,
        ordem: index + 1,
        team1: timeCasa?.nome || 'TBD',
        team2: timeVisitante?.nome || 'TBD',
        team1Course: timeCasa?.curso.sigla || '',
        team2Course: timeVisitante?.curso.sigla || '',
        result: partida.pontosCasa !== null && partida.pontosVisitante !== null 
          ? `${partida.pontosCasa}:${partida.pontosVisitante}` 
          : null,
        modality: partida.grupo?.modalidade?.nome || 'N/A',
        category: timeCasa?.categoria?.genero || timeVisitante?.categoria?.genero || 'N/A',
        location: partida.local?.nome || 'TBD',
        status: getStatusPortugues(partida.statusPartida),
        date: partida.dataHora.toISOString().split('T')[0],
        time: partida.dataHora.toTimeString().slice(0, 5),
        grupo: partida.grupo?.nome || 'N/A'
      };
    });

    return Response.json(partidasFormatadas);

  } catch (error) {
    console.error('Erro ao buscar partidas:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

function getStatusPortugues(status) {
  const statusMap = {
    'AGENDADA': 'Agendada',
    'EM_ANDAMENTO': 'Em andamento',
    'FINALIZADA': 'Finalizada',
    'CANCELADA': 'Cancelada'
  };
  return statusMap[status] || status;
}