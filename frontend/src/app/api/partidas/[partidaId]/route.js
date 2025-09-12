import { PrismaClient } from '@prisma/client';
import { atualizarPontuacaoTorneio } from "@/utils/pontuacaoTorneio";

const prisma = new PrismaClient();

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

export async function PATCH(request, { params }) {
  try {
    // Next.js app router: params is an async proxy — await before reading
    const { partidaId } = await params || {};
    const partidaIdNum = parseInt(partidaId, 10);

    if (isNaN(partidaIdNum)) {
      return Response.json({ error: 'ID da partida inválido' }, { status: 400 });
    }

    const body = await request.json();

    // Aceitar variantes de nomes de campos para máxima compatibilidade
    const incomingStatus = body.status ?? body.statusPartida ?? body.status_partida;
    const rawPontosCasa = body.pontosCasa ?? body.pontos_casa ?? body.pontos_casa_final;
    const rawPontosVisitante = body.pontosVisitante ?? body.pontos_visitante ?? body.pontos_visitante_final;

    // Converter pontos para números se fornecidos
    const incomingPontosCasa = typeof rawPontosCasa !== 'undefined' && rawPontosCasa !== null
      ? Number(rawPontosCasa)
      : undefined;
    const incomingPontosVisitante = typeof rawPontosVisitante !== 'undefined' && rawPontosVisitante !== null
      ? Number(rawPontosVisitante)
      : undefined;

    // Validar pontos se fornecidos
    if (typeof incomingPontosCasa === 'number' && Number.isNaN(incomingPontosCasa)) {
      return Response.json({ error: 'pontosCasa inválido' }, { status: 400 });
    }
    if (typeof incomingPontosVisitante === 'number' && Number.isNaN(incomingPontosVisitante)) {
      return Response.json({ error: 'pontosVisitante inválido' }, { status: 400 });
    }

    // Buscar a partida com os times para validação e processamento
    const partida = await prisma.partida.findUnique({
      where: { id: partidaIdNum },
      include: {
        times: {
          include: {
            time: {
              include: {
                curso: true,
                categoria: true
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
      }
    });

    if (!partida) {
      return Response.json({ error: "Partida não encontrada" }, { status: 404 });
    }

    // Mapear status amigável -> enum do DB
    const mapStatus = {
      'Agendada': 'AGENDADA',
      'Em andamento': 'EM_ANDAMENTO',
      'Finalizada': 'FINALIZADA',
      'Encerrada': 'FINALIZADA',
      'Cancelada': 'CANCELADA',
      'AGENDADA': 'AGENDADA',
      'EM_ANDAMENTO': 'EM_ANDAMENTO',
      'FINALIZADA': 'FINALIZADA',
      'CANCELADA': 'CANCELADA'
    };

    const dataToUpdate = {};

    // Processar status se fornecido
    if (incomingStatus) {
      const dbStatus = mapStatus[incomingStatus];
      if (!dbStatus) {
        return Response.json({ error: `Status inválido: ${incomingStatus}` }, { status: 400 });
      }
      dataToUpdate.statusPartida = dbStatus;
    }

    // Processar pontos se fornecidos
    if (typeof incomingPontosCasa === 'number') dataToUpdate.pontosCasa = incomingPontosCasa;
    if (typeof incomingPontosVisitante === 'number') dataToUpdate.pontosVisitante = incomingPontosVisitante;

    // Se status finalizada mas pontos não vieram, tentar calcular a partir dos eventos
    if (dataToUpdate.statusPartida === 'FINALIZADA') {
      if (typeof dataToUpdate.pontosCasa !== 'number' || typeof dataToUpdate.pontosVisitante !== 'number') {
        const timesCasa = partida.times.filter(pt => pt.ehCasa === true || pt.ehCasa === 1 || pt.ehCasa === '1');
        const timesVisitante = partida.times.filter(pt => !(pt.ehCasa === true || pt.ehCasa === 1 || pt.ehCasa === '1'));

        const timeCasaId = timesCasa[0]?.timeId ?? null;
        const timeVisitanteId = timesVisitante[0]?.timeId ?? null;

        const calculo = await calcularPlacarAPartirDeEventos(partidaIdNum, timeCasaId, timeVisitanteId);

        if (typeof dataToUpdate.pontosCasa !== 'number' && typeof calculo.pontosCasa === 'number') {
          dataToUpdate.pontosCasa = calculo.pontosCasa;
        }
        if (typeof dataToUpdate.pontosVisitante !== 'number' && typeof calculo.pontosVisitante === 'number') {
          dataToUpdate.pontosVisitante = calculo.pontosVisitante;
        }
      }
    }

    // Validar se há algo para atualizar
    if (Object.keys(dataToUpdate).length === 0) {
      return Response.json({ error: 'Nenhum campo válido para atualização (status/pontosCasa/pontosVisitante)' }, { status: 400 });
    }

    // Usar transação para atualizar partida e resultados dos times
    const resultado = await prisma.$transaction(async (tx) => {
      // Atualizar a partida
      const partidaAtualizada = await tx.partida.update({
        where: { id: partidaIdNum },
        data: dataToUpdate
      });

      // Se pontos foram definidos, usar a função utilitária para atualizar pontuação
      if (typeof dataToUpdate.pontosCasa === 'number' && typeof dataToUpdate.pontosVisitante === 'number') {
        await atualizarPontuacaoTorneio(tx, partidaIdNum, dataToUpdate.pontosCasa, dataToUpdate.pontosVisitante);
      }

      return partidaAtualizada;
    });

    // Formatar resposta com dados completos
    const timesCasa = partida.times.filter(pt => pt.ehCasa === true || pt.ehCasa === 1 || pt.ehCasa === '1');
    const timesVisitante = partida.times.filter(pt => !(pt.ehCasa === true || pt.ehCasa === 1 || pt.ehCasa === '1'));
    const timeCasa = timesCasa[0]?.time;
    const timeVisitante = timesVisitante[0]?.time;

    const partidaFormatada = {
      id: resultado.id,
      ordem: resultado.ordem ?? null,
      team1: timeCasa?.nome || 'TBD',
      team2: timeVisitante?.nome || 'TBD',
      team1Id: timeCasa?.id,
      team2Id: timeVisitante?.id,
      team1Course: timeCasa?.curso?.sigla || '',
      team2Course: timeVisitante?.curso?.sigla || '',
      result: (resultado.pontosCasa !== null && resultado.pontosVisitante !== null)
        ? `${resultado.pontosCasa}:${resultado.pontosVisitante}`
        : null,
      modality: partida.grupo?.modalidade?.nome || 'N/A',
      category: timeCasa?.categoria?.genero || timeVisitante?.categoria?.genero || 'N/A',
      location: partida.local?.nome || 'TBD',
      status: getStatusPortugues(resultado.statusPartida),
      date: resultado.dataHora ? resultado.dataHora.toISOString().split('T')[0] : null,
      time: resultado.dataHora ? resultado.dataHora.toTimeString().slice(0,5) : null,
      grupo: partida.grupo?.nome || 'N/A',
      pontosCasa: resultado.pontosCasa,
      pontosVisitante: resultado.pontosVisitante
    };

    return Response.json(partidaFormatada);

  } catch (error) {
    console.error('Erro ao atualizar partida:', error);
    return Response.json(
      { error: 'Erro ao atualizar partida', details: error.message },
      { status: 500 }
    );
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

function getStatusPortugues(status) {
  const statusMap = {
    'AGENDADA': 'Agendada',
    'EM_ANDAMENTO': 'Em andamento',
    'FINALIZADA': 'Finalizada',
    'CANCELADA': 'Cancelada'
  };
  return statusMap[status] || status;
}

// Placeholder function for calculating score from events
async function calcularPlacarAPartirDeEventos(partidaId, timeCasaId, timeVisitanteId) {
  try {
    // Buscar eventos da partida (adaptar conforme seu modelo de eventos)
    const eventos = await prisma.eventoPartida.findMany({
      where: { partidaId },
      include: {
        jogador: {
          include: {
            times: {
              where: {
                time: {
                  partidas: {
                    some: {
                      partidaId: partidaId
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    let pontosCasa = 0;
    let pontosVisitante = 0;

    eventos.forEach(evento => {
      if (evento.tipo === 'GOL') {
        const pontos = evento.pontosGerados || evento.ponto || 1;
        
        // Determinar se o jogador pertence ao time casa ou visitante
        const jogadorTimeId = evento.jogador?.times?.[0]?.timeId;
        
        if (jogadorTimeId === timeCasaId) {
          pontosCasa += pontos;
        } else if (jogadorTimeId === timeVisitanteId) {
          pontosVisitante += pontos;
        }
      }
    });

    return { pontosCasa, pontosVisitante };
  } catch (error) {
    console.error('Erro ao calcular placar a partir de eventos:', error);
    return { pontosCasa: 0, pontosVisitante: 0 };
  }
}
