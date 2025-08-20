import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');

    console.log(`🔍 Buscando partidas para torneio: ${torneioId}`);

    if (!torneioId) {
      return Response.json([]);
    }

    const partidas = await prisma.partida.findMany({
      where: {
        torneioId: parseInt(torneioId)
      },
      include: {
        grupo: {
          include: {
            modalidade: true
          }
        },
        local: true,
        times: {
          include: {
            time: {
              include: {
                categoria: true,
                curso: true
              }
            }
          }
        }
      },
      orderBy: { dataHora: 'asc' }
    });

    console.log(`📊 Encontradas ${partidas.length} partidas brutas`);

    const partidasFormatadas = partidas.map((partida, index) => {
      const timeCasa = partida.times.find(pt => pt.ehCasa)?.time;
      const timeVisitante = partida.times.find(pt => !pt.ehCasa)?.time;

      const partidaFormatada = {
        id: partida.id,
        ordem: index + 1,
        // Dados dos times
        time1: timeCasa?.nome || 'Time A',
        time2: timeVisitante?.nome || 'Time B',
        team1: timeCasa?.nome || 'Time A',
        team2: timeVisitante?.nome || 'Time B',
        team1Course: timeCasa?.curso?.sigla || 'N/A',
        team2Course: timeVisitante?.curso?.sigla || 'N/A',
        // Modalidade e categoria
        modalidade: {
          id: partida.grupo?.modalidade?.id,
          nome: partida.grupo?.modalidade?.nome
        },
        modality: partida.grupo?.modalidade?.nome || 'N/A',
        category: timeCasa?.categoria?.genero || 'N/A',
        categoria: {
          id: timeCasa?.categoria?.id,
          genero: timeCasa?.categoria?.genero,
          nome: timeCasa?.categoria?.nome
        },
        // Local e horário
        local: partida.local?.nome || 'A definir',
        location: partida.local?.nome || 'A definir',
        dataHora: partida.dataHora,
        date: partida.dataHora ? new Date(partida.dataHora).toLocaleDateString('pt-BR') : 'A definir',
        time: partida.dataHora ? new Date(partida.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'A definir',
        // Status e placar
        status: partida.statusPartida || 'Agendada',
        placarTime1: partida.pontosCasa,
        placarTime2: partida.pontosVisitante,
        result: (partida.pontosCasa !== null && partida.pontosVisitante !== null) 
          ? `${partida.pontosCasa} x ${partida.pontosVisitante}` 
          : null,
        // Grupo
        grupo: partida.grupo?.nome || 'A'
      };

      console.log(`🏆 Partida ${partida.id}:`, partidaFormatada);
      return partidaFormatada;
    });

    console.log(`✅ Retornando ${partidasFormatadas.length} partidas formatadas`);
    return Response.json(partidasFormatadas);
  } catch (error) {
    console.error('❌ Erro na API partidas:', error);
    return Response.json([]);
  }
}