import { PrismaClient } from '@prisma/client';
import { obterClassificacao } from "@/utils/pontuacaoTorneio";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');
    const grupoId = searchParams.get('grupoId');
    const modalidadeId = searchParams.get('modalidadeId');
    const genero = searchParams.get('genero');
    const classificacaoGeral = searchParams.get('classificacaoGeral') === 'true';

    if (!torneioId) {
      return Response.json({ error: "torneioId é obrigatório" }, { status: 400 });
    }

    // Para classificação geral, buscar todos os times do torneio
    if (classificacaoGeral) {
      // Se modalidadeId e genero são fornecidos, classificação geral da modalidade específica
      if (modalidadeId && genero) {
        const classificacao = await obterClassificacaoGeralModalidade(
          prisma, 
          parseInt(torneioId), 
          parseInt(modalidadeId), 
          genero
        );
        return Response.json({ classificacao });
      } else {
        // Classificação geral de todo o torneio
        const classificacao = await obterClassificacaoGeral(prisma, parseInt(torneioId));
        return Response.json({ classificacao });
      }
    }

    // Se modalidadeId e genero são fornecidos, filtrar apenas por esses
    let whereClause = {
      partida: {
        torneioId: parseInt(torneioId)
      }
    };

    if (modalidadeId && genero) {
      // Buscar grupos da modalidade/gênero específicos
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
                  categoria: true
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

      const gruposIds = grupos.map(g => g.id);
      whereClause.partida.grupoId = { in: gruposIds };
    } else if (grupoId) {
      whereClause.partida.grupoId = parseInt(grupoId);
      
      // CORREÇÃO: Se gênero foi especificado junto com grupoId, aplicar filtro de gênero
      if (genero) {
        // Buscar times do grupo com o gênero especificado
        const timesDoGrupo = await prisma.grupoTime.findMany({
          where: {
            grupoId: parseInt(grupoId)
          },
          include: {
            time: {
              include: {
                categoria: true
              }
            }
          }
        });
        
        // Filtrar apenas times do gênero especificado
        const timesDoGenero = timesDoGrupo
          .filter(tg => tg.time.categoria.genero === genero)
          .map(tg => tg.timeId);
        
        // Se não há times do gênero especificado neste grupo, retornar array vazio
        if (timesDoGenero.length === 0) {
          return Response.json({ classificacao: [] });
        }
        
        // Adicionar filtro por timeId
        whereClause.timeId = { in: timesDoGenero };
      }
    }

    const classificacao = await obterClassificacao(
      prisma, 
      parseInt(torneioId), 
      whereClause
    );

    return Response.json({ classificacao });

  } catch (error) {
    console.error("Erro ao buscar classificação:", error);
    return Response.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Obter classificação geral do torneio com informações de gênero e modalidade
 */
async function obterClassificacaoGeral(prisma, torneioId) {
  try {
    const resultados = await prisma.partidaTime.findMany({
      where: {
        partida: {
          torneioId: torneioId
        }
      },
      include: {
        time: {
          include: {
            categoria: {
              include: {
                modalidade: true
              }
            }
          }
        },
        partida: true
      }
    });

    // Agrupar por time e calcular estatísticas
    const classificacao = resultados.reduce((acc, partidaTime) => {
      const timeId = partidaTime.timeId;
      
      if (!acc[timeId]) {
        acc[timeId] = {
          timeId,
          nome: partidaTime.time.nome,
          genero: partidaTime.time.categoria.genero,
          modalidade: partidaTime.time.categoria.modalidade.nome,
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
      team.pontos += partidaTime.pontosTorneio || 0;
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

    return classificacaoArray;

  } catch (error) {
    console.error('Erro ao buscar classificação geral:', error);
    throw error;
  }
}

/**
 * Obter classificação geral de uma modalidade específica (todos os grupos da modalidade)
 */
async function obterClassificacaoGeralModalidade(prisma, torneioId, modalidadeId, genero) {
  try {
    // Buscar todos os times da modalidade/gênero no torneio
    const times = await prisma.time.findMany({
      where: {
        torneioId: torneioId,
        categoria: {
          modalidadeId: modalidadeId,
          genero: genero
        }
      },
      include: {
        categoria: {
          include: {
            modalidade: true
          }
        },
        grupos: {
          include: {
            grupo: true
          }
        }
      }
    });

    if (times.length === 0) {
      return [];
    }

    // Buscar classificação para cada time
    const classificacaoPromises = times.map(async (time) => {
      // Reutilizar a função obterClassificacao existente para este time
      const grupoTime = time.grupos[0]; // Pegar o primeiro grupo do time
      if (!grupoTime) return null;

      const classificacaoGrupo = await obterClassificacao(prisma, torneioId, grupoTime.grupoId, genero);
      const timeClassificacao = classificacaoGrupo.find(t => t.timeId === time.id);

      if (timeClassificacao) {
        // Adicionar informações do grupo
        timeClassificacao.grupo = grupoTime.grupo.nome;
        return timeClassificacao;
      }
      return null;
    });

    const resultados = await Promise.all(classificacaoPromises);
    const classificacao = resultados.filter(r => r !== null);

    // Ordenar por pontos, depois saldo de gols
    classificacao.sort((a, b) => {
      if (b.pontos !== a.pontos) {
        return b.pontos - a.pontos;
      }
      if (b.saldoGols !== a.saldoGols) {
        return b.saldoGols - a.saldoGols;
      }
      return b.golsPro - a.golsPro;
    });

    return classificacao;

  } catch (error) {
    console.error('Erro ao buscar classificação geral da modalidade:', error);
    throw error;
  }
}
