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
        ordem: 'asc' // Ordenar pela ordem armazenada no banco
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
      const timeCasaData = timesCasa[0];
      const timeVisitanteData = timesVisitante[0];

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

      // Calcular resultado incluindo pênaltis
      let result = null;
      if (partida.pontosCasa !== null && partida.pontosVisitante !== null) {
        result = `${partida.pontosCasa}:${partida.pontosVisitante}`;
        if (partida.temPenaltis && partida.penaltisCasa !== null && partida.penaltisVisitante !== null) {
          result += ` (${partida.penaltisCasa}:${partida.penaltisVisitante} pen)`;
        }
      }

      // Identificar se há WO e qual time deu WO
      // Verifica se a partida tem resultado 0:0 E um dos times está marcado como WO
      // (isso indica que houve WO, seja nesta partida ou em outra do mesmo time)
      const ehWO = (result === '0:0' || (partida.statusPartida === 'FINALIZADA' && !result)) && 
                   (timeCasaData?.resultado === 'WO' || timeVisitanteData?.resultado === 'WO');
      
      const timeWOId = ehWO ? (
        timeCasaData?.resultado === 'WO' ? timeCasa?.id :
        timeVisitanteData?.resultado === 'WO' ? timeVisitante?.id :
        null
      ) : null;

      // Debug: Log para verificar detecção de WO
      if (result === '0:0' && (partida.statusPartida === 'FINALIZADA')) {
        console.log(`Partida ${partida.id} - Resultado 0:0 FINALIZADA:`, {
          timeCasaNome: timeCasa?.nome,
          timeCasaResultado: timeCasaData?.resultado,
          timeVisitanteNome: timeVisitante?.nome,
          timeVisitanteResultado: timeVisitanteData?.resultado,
          ehWO: ehWO,
          timeWOId: timeWOId
        });
      }

      return {
        id: partida.id,
        ordem: partida.ordem || index + 1, // Usar ordem do banco se disponível, senão calcular
        team1: timeCasa?.nome || 'TBD',
        team2: timeVisitante?.nome || 'TBD',
        team1Id: timeCasa.id,
        team2Id: timeVisitante.id,
        team1Course: timeCasa?.curso.sigla || '',
        team2Course: timeVisitante?.curso.sigla || '',
        result: result,
        modality: modalidadeNome,
        category: timeCasa?.categoria?.genero || timeVisitante?.categoria?.genero || 'N/A',
        location: partida.local?.nome || 'TBD',
        status: getStatusPortugues(partida.statusPartida),
        date: partida.dataHora.toISOString().split('T')[0],
        time: partida.dataHora.toTimeString().slice(0, 5),
        grupo: partida.grupo?.nome || partida.fase || 'N/A', // Mostrar fase para eliminatórias
        fase: partida.fase, // Adicionar campo fase separado também
        // Adicionar dados de pênaltis separadamente
        pontosCasa: partida.pontosCasa,
        pontosVisitante: partida.pontosVisitante,
        temPenaltis: partida.temPenaltis,
        penaltisCasa: partida.penaltisCasa,
        penaltisVisitante: partida.penaltisVisitante,
        // Adicionar informação sobre WO
        timeWOId: timeWOId
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

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');

    if (!torneioId) {
      return Response.json({ error: 'ID do torneio é obrigatório' }, { status: 400 });
    }

    console.log(`🗑️ Deletando todas as partidas do torneio ${torneioId}`);

    // Primeiro, deletar todos os eventos das partidas
    const eventosDeleted = await prisma.eventoPartida.deleteMany({
      where: {
        partida: {
          torneioId: parseInt(torneioId)
        }
      }
    });

    // Depois, deletar as relações partida-time
    const partidaTimeDeleted = await prisma.partidaTime.deleteMany({
      where: {
        partida: {
          torneioId: parseInt(torneioId)
        }
      }
    });

    // Por fim, deletar as partidas
    const partidasDeleted = await prisma.partida.deleteMany({
      where: {
        torneioId: parseInt(torneioId)
      }
    });

    console.log(`✅ Deletadas: ${partidasDeleted.count} partidas, ${partidaTimeDeleted.count} relações time-partida, ${eventosDeleted.count} eventos`);

    return Response.json({
      message: 'Partidas deletadas com sucesso',
      partidasDeleted: partidasDeleted.count,
      partidaTimeDeleted: partidaTimeDeleted.count,
      eventosDeleted: eventosDeleted.count
    });

  } catch (error) {
    console.error('Erro ao deletar partidas:', error);
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}