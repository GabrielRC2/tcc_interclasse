import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');
    const jogadorId = searchParams.get('jogadorId');
    const modalidadeId = searchParams.get('modalidadeId');

    if (!torneioId) {
      return Response.json({ error: 'torneioId é obrigatório' }, { status: 400 });
    }

    // Construir filtros
    const whereClause = {
      partida: {
        torneioId: parseInt(torneioId),
        statusPartida: 'FINALIZADA'
      }
    };

    if (jogadorId) {
      whereClause.jogadorId = parseInt(jogadorId);
    }

    if (modalidadeId) {
      whereClause.partida.modalidadeId = parseInt(modalidadeId);
    }

    // Buscar eventos agrupados por jogador e modalidade
    const estatisticas = await prisma.eventoPartida.findMany({
      where: whereClause,
      include: {
        jogador: {
          include: {
            time: {
              include: {
                categoria: {
                  include: {
                    modalidade: true
                  }
                }
              }
            }
          }
        },
        partida: {
          include: {
            modalidade: true,
            grupo: {
              include: {
                modalidade: true
              }
            }
          }
        }
      }
    });

    // Agrupar estatísticas por jogador e modalidade
    const estatisticasAgrupadas = {};

    estatisticas.forEach(evento => {
      const jogador = evento.jogador;
      const jogadorId = jogador.id;
      const jogadorNome = jogador.nome;
      const timeNome = jogador.time.nome;

      // Determinar modalidade
      let modalidade = null;
      if (evento.partida.modalidade) {
        modalidade = evento.partida.modalidade;
      } else if (evento.partida.grupo?.modalidade) {
        modalidade = evento.partida.grupo.modalidade;
      } else if (jogador.time.categoria?.modalidade) {
        modalidade = jogador.time.categoria.modalidade;
      }

      if (!modalidade) return; // Pular se não conseguir determinar modalidade

      const modalidadeId = modalidade.id;
      const modalidadeNome = modalidade.nome;

      // Criar estrutura se não existir
      if (!estatisticasAgrupadas[jogadorId]) {
        estatisticasAgrupadas[jogadorId] = {
          jogadorId,
          jogadorNome,
          timeNome,
          modalidades: {}
        };
      }

      if (!estatisticasAgrupadas[jogadorId].modalidades[modalidadeId]) {
        estatisticasAgrupadas[jogadorId].modalidades[modalidadeId] = {
          modalidadeId,
          modalidadeNome,
          eventos: {
            gol: 0,
            ponto: 0,
            cesta: 0,
            ace: 0,
            bloqueio: 0,
            total: 0
          },
          pontosTotal: 0
        };
      }

      // Contar eventos por tipo
      const tipoEvento = evento.tipo.toLowerCase();
      const modalidadeStats = estatisticasAgrupadas[jogadorId].modalidades[modalidadeId];
      
      if (modalidadeStats.eventos.hasOwnProperty(tipoEvento)) {
        modalidadeStats.eventos[tipoEvento]++;
      }
      
      modalidadeStats.eventos.total++;
      modalidadeStats.pontosTotal += evento.pontosGerados;
    });

    // Converter para array e ordenar
    const resultado = Object.values(estatisticasAgrupadas).map(jogador => ({
      ...jogador,
      modalidades: Object.values(jogador.modalidades)
    }));

    return Response.json(resultado);

  } catch (error) {
    console.error('Erro ao buscar estatísticas de jogadores:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}