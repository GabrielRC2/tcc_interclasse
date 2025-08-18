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

    // 2. CORREÇÃO: Deletar apenas partidas da modalidade/gênero específica
    const gruposIds = grupos.map(g => g.id);
    
    // 2.1 Deletar PartidaTime das partidas específicas
    await prisma.partidaTime.deleteMany({
      where: {
        partida: {
          grupoId: { in: gruposIds },
          // ADICIONAR: Filtro por times do gênero específico
          times: {
            some: {
              time: {
                categoria: {
                  genero: genero,
                  modalidadeId: parseInt(modalidadeId)
                }
              }
            }
          }
        }
      }
    });

    // 2.2 Deletar Partidas apenas dos grupos específicos
    await prisma.partida.deleteMany({
      where: {
        grupoId: { in: gruposIds },
        // VERIFICAR: Se o grupo realmente tem times do gênero específico
        grupo: {
          times: {
            some: {
              time: {
                categoria: {
                  genero: genero,
                  modalidadeId: parseInt(modalidadeId)
                }
              }
            }
          }
        }
      }
    });

    console.log(`🗑️ Partidas antigas de ${genero} ${modalidadeId} removidas`);

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

    // 5. Buscar local padrão baseado na modalidade
    const modalidade = await prisma.modalidade.findUnique({
      where: { id: parseInt(modalidadeId) }
    });

    const localPadrao = await prisma.local.findFirst({
      where: {
        nome: getLocalPorModalidade(modalidade?.nome)
      }
    }) || await prisma.local.findFirst();

    if (!localPadrao) {
      return Response.json({ error: 'Nenhum local cadastrado no sistema' }, { status: 400 });
    }

    console.log(`📍 Local selecionado: ${localPadrao.nome} para ${modalidade?.nome}`);

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

    console.log(`✅ ${partidasCriadas.length} partidas de ${genero} criadas com sucesso`);

    return Response.json({ 
      message: 'Chaveamento gerado com sucesso!',
      partidasGeradas: partidasCriadas.length,
      grupos: grupos.length,
      modalidade: modalidade?.nome,
      genero: genero
    });

  } catch (error) {
    console.error('Erro ao gerar chaveamento:', error);
    return Response.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}

// Determinar local baseado na modalidade
function getLocalPorModalidade(modalidade) {
  const configuracao = {
    'Vôlei': 'Quadra de Baixo',
    'Handebol': 'Quadra de Cima',
    'Basquete': 'Quadra de Baixo',
    'Futsal': 'Quadra de Cima'
  };
  return configuracao[modalidade] || 'Quadra de Baixo';
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