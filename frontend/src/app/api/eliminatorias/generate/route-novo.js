import { PrismaClient } from '@prisma/client';
import { obterClassificacao } from "@/utils/pontuacaoTorneio";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { torneioId, modalidadeId, genero, faseEscolhida } = await request.json();

    if (!torneioId || !modalidadeId || !genero) {
      return Response.json({ error: 'Parâmetros torneioId, modalidadeId e genero são obrigatórios' }, { status: 400 });
    }

    console.log('=== GERANDO ELIMINATÓRIAS ===');
    console.log('Torneio:', torneioId, 'Modalidade:', modalidadeId, 'Gênero:', genero, 'Fase escolhida:', faseEscolhida);

    // 1. Buscar grupos da modalidade/gênero específicos
    const grupos = await prisma.grupo.findMany({
      where: {
        torneioId: parseInt(torneioId),
        modalidadeId: parseInt(modalidadeId)
      },
      include: {
        times: {
          include: {
            time: {
              include: { categoria: true }
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
      return Response.json({ error: 'Nenhum grupo encontrado para esta modalidade/gênero' }, { status: 404 });
    }

    // 2. Obter classificação de cada grupo individualmente
    const timesClassificadosPorGrupo = [];
    
    for (const grupo of grupos) {
      const whereClause = { partida: { grupoId: grupo.id } };
      const classificacaoGrupo = await obterClassificacao(prisma, parseInt(torneioId), whereClause);
      
      if (classificacaoGrupo.length > 0) {
        timesClassificadosPorGrupo.push({
          grupo: grupo.nome,
          grupoId: grupo.id,
          classificacao: classificacaoGrupo
        });
      }
    }

    console.log('Times por grupo:', timesClassificadosPorGrupo.map(g => ({
      grupo: g.grupo,
      times: g.classificacao.length
    })));

    // 3. Selecionar times baseado na lógica: 1º de cada grupo, depois 2º de cada grupo, etc.
    const timesClassificados = selecionarTimesPorPosicao(timesClassificadosPorGrupo);

    if (timesClassificados.length < 2) {
      return Response.json({ error: 'Times insuficientes para gerar eliminatórias' }, { status: 400 });
    }

    // 4. Determinar fase baseada na escolha do usuário ou número de times
    const fase = faseEscolhida || determinarFaseAutomatica(timesClassificados.length);
    const timesParaFase = limitarTimesPorFase(timesClassificados, fase);

    console.log(`Fase: ${fase}, Times selecionados: ${timesParaFase.length}`);

    // 5. Limpar partidas eliminatórias existentes
    await prisma.partida.deleteMany({
      where: {
        torneioId: parseInt(torneioId),
        modalidadeId: parseInt(modalidadeId),
        genero: genero,
        tipo: 'ELIMINATORIA'
      }
    });

    // 6. Criar partidas eliminatórias
    const partidasCriadas = await criarPartidasEliminatorias(
      parseInt(torneioId),
      parseInt(modalidadeId),
      genero,
      timesParaFase,
      fase
    );

    return Response.json({
      message: `Eliminatórias geradas! ${partidasCriadas.length} partidas criadas`,
      fase: fase,
      timesClassificados: timesParaFase.length,
      partidasCriadas: partidasCriadas.length,
      detalhes: {
        gruposProcessados: timesClassificadosPorGrupo.length,
        timesDisponiveis: timesClassificados.length
      }
    });

  } catch (error) {
    console.error('Erro ao gerar eliminatórias:', error);
    return Response.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}

// Função para selecionar times baseado na posição nos grupos
function selecionarTimesPorPosicao(timesClassificadosPorGrupo) {
  const timesClassificados = [];
  const maxPosicoesPorGrupo = Math.max(...timesClassificadosPorGrupo.map(g => g.classificacao.length));

  // Primeiro todos os 1º colocados, depois todos os 2º colocados, etc.
  for (let posicao = 0; posicao < maxPosicoesPorGrupo; posicao++) {
    for (const grupoData of timesClassificadosPorGrupo) {
      if (grupoData.classificacao[posicao]) {
        const time = grupoData.classificacao[posicao];
        timesClassificados.push({
          ...time,
          posicaoGrupo: posicao + 1,
          nomeGrupo: grupoData.grupo
        });
      }
    }
  }

  console.log('Times selecionados por posição:', timesClassificados.map(t => `${t.nome} (${t.posicaoGrupo}º do ${t.nomeGrupo})`));
  return timesClassificados;
}

// Função para determinar fase automaticamente
function determinarFaseAutomatica(numTimes) {
  if (numTimes >= 16) return 'Oitavas de Final';
  if (numTimes >= 8) return 'Quartas de Final';
  if (numTimes >= 4) return 'Semifinais';
  if (numTimes >= 2) return 'Final';
  return 'Final';
}

// Função para limitar times por fase
function limitarTimesPorFase(times, fase) {
  const limites = {
    'Oitavas de Final': 16,
    'Quartas de Final': 8,
    'Semifinais': 4,
    'Final': 2
  };
  
  const limite = limites[fase] || times.length;
  return times.slice(0, limite);
}

// Função para criar partidas eliminatórias
async function criarPartidasEliminatorias(torneioId, modalidadeId, genero, times, fase) {
  const partidasCriadas = [];
  const dataBase = new Date();

  // Criar confrontos baseados na classificação
  for (let i = 0; i < times.length; i += 2) {
    if (i + 1 < times.length) {
      const time1 = times[i];
      const time2 = times[i + 1];

      // Buscar local padrão
      const local = await prisma.local.findFirst();
      
      const partida = await prisma.partida.create({
        data: {
          torneioId: torneioId,
          modalidadeId: modalidadeId,
          team1Id: time1.timeId,
          team2Id: time2.timeId,
          genero: genero,
          fase: fase,
          tipo: 'ELIMINATORIA',
          statusPartida: 'AGENDADA',
          dataHora: new Date(dataBase.getTime() + (i * 60 * 60 * 1000)), // Intervalos de 1 hora
          localId: local?.id || 1
        }
      });

      // Criar registros partidaTime
      await Promise.all([
        prisma.partidaTime.create({
          data: {
            partidaId: partida.id,
            timeId: time1.timeId,
            ehCasa: true
          }
        }),
        prisma.partidaTime.create({
          data: {
            partidaId: partida.id,
            timeId: time2.timeId,
            ehCasa: false
          }
        })
      ]);

      partidasCriadas.push(partida);
    }
  }

  return partidasCriadas;
}
