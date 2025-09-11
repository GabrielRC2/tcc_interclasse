import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');

    if (!torneioId) {
      return Response.json([]);
    }

    // Buscar as próximas 4 partidas agendadas (2 quadras x 2 partidas cada)
    const proximasPartidas = await prisma.partida.findMany({
      where: {
        torneioId: parseInt(torneioId),
        statusPartida: 'AGENDADA'
      },
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
        modalidade: true, // Adicionar modalidade diretamente
        local: true
      },
      orderBy: [
        { dataHora: 'asc' },
        { ordem: 'asc' }
      ],
      take: 4
    });

    // Formatar dados para o frontend
    const partidasFormatadas = proximasPartidas.map(partida => {
      const timeCasa = partida.times.find(pt => pt.ehCasa);
      const timeVisitante = partida.times.find(pt => !pt.ehCasa);

      // Buscar modalidade de diferentes formas dependendo do tipo de partida
      let modalidadeNome = 'Modalidade não definida';
      
      if (partida.grupo?.modalidade?.nome) {
        // Partidas de grupos
        modalidadeNome = partida.grupo.modalidade.nome;
      } else if (partida.modalidade?.nome) {
        // Partidas eliminatórias com modalidade direta
        modalidadeNome = partida.modalidade.nome;
      } else if (timeCasa?.time?.categoria?.modalidade?.nome) {
        // Buscar modalidade através da categoria do time
        modalidadeNome = timeCasa.time.categoria.modalidade.nome;
      }

      return {
        id: partida.id,
        team1: timeCasa?.time?.nome || 'Time não definido',
        team2: timeVisitante?.time?.nome || 'Time não definido',
        modality: modalidadeNome,
        category: `${partida.genero}`,
        location: partida.local?.nome || 'Local não definido',
        time: partida.dataHora ? new Date(partida.dataHora).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'Horário não definido',
        status: 'Próxima partida',
        result: 'vs',
        fase: partida.fase,
        tipo: partida.tipo
      };
    });

    return Response.json(partidasFormatadas);

  } catch (error) {
    console.error('Erro ao buscar próximas partidas:', error);
    return Response.json([], { status: 500 });
  }
}
