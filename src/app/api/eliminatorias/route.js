import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');
    const modalidadeId = searchParams.get('modalidadeId');
    const genero = searchParams.get('genero');

    if (!torneioId || !modalidadeId || !genero) {
      return Response.json({ error: "torneioId, modalidadeId e genero são obrigatórios" }, { status: 400 });
    }

    // Buscar partidas eliminatórias
    const partidas = await prisma.partida.findMany({
      where: {
        torneioId: parseInt(torneioId),
        tipo: 'ELIMINATORIA',
        modalidadeId: parseInt(modalidadeId),
        genero: genero
      },
      include: {
        times: {
          include: {
            time: true
          }
        },
        modalidade: true
      },
      orderBy: {
        fase: 'asc'
      }
    });

    // Agrupar por fase
    const fases = partidas.reduce((acc, partida) => {
      const fase = partida.fase || 'Eliminatória';
      
      if (!acc[fase]) {
        acc[fase] = {
          fase,
          partidas: []
        };
      }

      const timeCasa = partida.times.find(pt => pt.ehCasa);
      const timeVisitante = partida.times.find(pt => !pt.ehCasa);

      acc[fase].partidas.push({
        id: partida.id,
        time1: timeCasa?.time.nome || 'TBD',
        time2: timeVisitante?.time.nome || 'TBD',
        resultado: partida.pontosCasa !== null && partida.pontosVisitante !== null 
          ? `${partida.pontosCasa} x ${partida.pontosVisitante}` 
          : null,
        status: partida.status,
        modalidade: partida.modalidade.nome
      });

      return acc;
    }, {});

    const eliminatorias = Object.values(fases);

    return Response.json({ eliminatorias });

  } catch (error) {
    console.error("Erro ao buscar eliminatórias:", error);
    return Response.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}
