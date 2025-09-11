import { PrismaClient } from '@prisma/client';

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
        modalidade: true, // Adicionar modalidade diretamente para eliminatórias
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

      // Buscar modalidade de diferentes formas dependendo do tipo de partida
      let modalidadeNome = 'N/A';
      
      if (partida.grupo?.modalidade?.nome) {
        // Partidas de grupos
        modalidadeNome = partida.grupo.modalidade.nome;
      } else if (partida.modalidade?.nome) {
        // Partidas eliminatórias com modalidade direta
        modalidadeNome = partida.modalidade.nome;
      } else if (timeCasa?.categoria?.modalidade?.nome) {
        // Buscar modalidade através da categoria do time
        modalidadeNome = timeCasa.categoria.modalidade.nome;
      }

      return {
        id: partida.id,
        ordem: index + 1,
        team1: timeCasa?.nome || 'TBD',
        team2: timeVisitante?.nome || 'TBD',
        team1Id: timeCasa.id,
        team2Id: timeVisitante.id,
        team1Course: timeCasa?.curso.sigla || '',
        team2Course: timeVisitante?.curso.sigla || '',
        result: partida.pontosCasa !== null && partida.pontosVisitante !== null 
          ? `${partida.pontosCasa}:${partida.pontosVisitante}` 
          : null,
        modality: modalidadeNome,
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