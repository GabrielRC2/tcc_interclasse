import { PrismaClient } from '@prisma/client';
import { atualizarPontuacaoTorneio } from "@/utils/pontuacaoTorneio";

const prisma = new PrismaClient();

// Função auxiliar para traduzir status
function getStatusPortugues(statusIngles) {
  const statusMap = {
    'AGENDADA': 'Agendada',
    'EM_ANDAMENTO': 'Em Andamento',
    'FINALIZADA': 'Finalizada',
    'CANCELADA': 'Cancelada'
  };
  return statusMap[statusIngles] || statusIngles;
}

export async function GET(request, { params }) {
  try {
    const { partidaId } = await params;

    const partida = await prisma.partida.findUnique({
      where: { id: parseInt(partidaId) },
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
      }
    });

    if (!partida) {
      return Response.json({ error: 'Partida não encontrada' }, { status: 404 });
    }

    const timesCasa = partida.times.filter(pt => pt.ehCasa);
    const timesVisitante = partida.times.filter(pt => !pt.ehCasa);
    
    const timeCasa = timesCasa[0]?.time;
    const timeVisitante = timesVisitante[0]?.time;

    // Calcular resultado incluindo pênaltis
    let result = null;
    let temPenaltisDetectado = partida.temPenaltis;
    
    if (partida.pontosCasa !== null && partida.pontosVisitante !== null) {
      result = `${partida.pontosCasa}:${partida.pontosVisitante}`;
      if (partida.temPenaltis && partida.penaltisCasa !== null && partida.penaltisVisitante !== null) {
        result += ` (${partida.penaltisCasa}:${partida.penaltisVisitante} pen)`;
        temPenaltisDetectado = true;
      }
    }
    
    // Se o resultado tem formato de pênaltis mas temPenaltis é null, detectar automaticamente
    if (!temPenaltisDetectado && result && result.includes(' pen')) {
      temPenaltisDetectado = true;
    }

    const partidaFormatada = {
      id: partida.id,
      team1: timeCasa?.nome || 'TBD',
      team2: timeVisitante?.nome || 'TBD',
      team1Id: timesCasa[0]?.timeId,
      team2Id: timesVisitante[0]?.timeId,
      team1Course: timeCasa?.curso.sigla || '',
      team2Course: timeVisitante?.curso.sigla || '',
      result: result,
      // Dados dos pênaltis para a súmula
      penaltisCasa: partida.penaltisCasa,
      penaltisVisitante: partida.penaltisVisitante,
      temPenaltis: temPenaltisDetectado,
      pontosCasa: partida.pontosCasa,
      pontosVisitante: partida.pontosVisitante,
      // Outros dados
      modality: partida.grupo?.modalidade?.nome || 'N/A',
      category: timeCasa?.categoria?.genero || timeVisitante?.categoria?.genero || 'N/A',
      location: partida.local?.nome || 'TBD',
      status: getStatusPortugues(partida.statusPartida),
      date: partida.dataHora.toISOString().split('T')[0],
      time: partida.dataHora.toTimeString().slice(0, 5),
      grupo: partida.grupo?.nome || 'N/A',
      grupoId: partida.grupoId
    };

    return Response.json(partidaFormatada);

  } catch (error) {
    console.error('Erro ao buscar partida:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { partidaId } = await params;
    const data = await request.json();

    // Buscar a partida atual
    const partidaAtual = await prisma.partida.findUnique({
      where: { id: parseInt(partidaId) },
      include: {
        times: {
          include: {
            time: true
          }
        },
        grupo: {
          include: {
            modalidade: true
          }
        }
      }
    });

    if (!partidaAtual) {
      return Response.json({ error: 'Partida não encontrada' }, { status: 404 });
    }

    // Atualizar a partida
    const partidaAtualizada = await prisma.partida.update({
      where: { id: parseInt(partidaId) },
      data: {
        pontosCasa: data.pontosCasa,
        pontosVisitante: data.pontosVisitante,
        penaltisCasa: data.penaltisCasa || null,
        penaltisVisitante: data.penaltisVisitante || null,
        temPenaltis: data.temPenaltis || false,
        statusPartida: data.statusPartida || partidaAtual.statusPartida
      }
    });

    // Se a partida foi finalizada, atualizar pontuação do torneio
    if (data.statusPartida === 'FINALIZADA') {
      try {
        await atualizarPontuacaoTorneio(parseInt(partidaId));
        console.log(`Pontuação do torneio atualizada para partida ${partidaId}`);
      } catch (error) {
        console.error('Erro ao atualizar pontuação do torneio:', error);
      }
    }

    return Response.json({
      success: true,
      partida: partidaAtualizada
    });

  } catch (error) {
    console.error('Erro ao atualizar partida:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
