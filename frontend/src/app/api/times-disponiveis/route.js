import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const modalidadeId = searchParams.get('modalidadeId');
    const genero = searchParams.get('genero');
    const torneioId = searchParams.get('torneioId');

    if (!modalidadeId || !genero || !torneioId) {
      return Response.json([]);
    }

    const times = await prisma.time.findMany({
      where: {
        torneioId: parseInt(torneioId),
        categoria: {
          modalidadeId: parseInt(modalidadeId),
          genero: genero
        }
      },
      include: {
        curso: true,
        categoria: true,
        jogadores: true
      }
    });

    const timesFormatados = times.map(time => ({
      id: time.id,
      nome: time.nome,
      curso: time.curso.sigla,
      jogadoresCount: time.jogadores.length
    }));

    return Response.json(timesFormatados);
  } catch (error) {
    console.error('Erro ao buscar times disponíveis:', error);
    return Response.json([], { status: 500 });
  }
}