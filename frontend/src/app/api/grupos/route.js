import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');
    const modalidadeId = searchParams.get('modalidadeId');
    const genero = searchParams.get('genero');

    if (!torneioId || !modalidadeId || !genero) {
      return Response.json([]);
    }

    const grupos = await prisma.grupo.findMany({
      where: {
        modalidadeId: parseInt(modalidadeId),
        torneioId: parseInt(torneioId)
      },
      include: {
        times: {
          include: {
            time: {
              include: {
                curso: true,
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

    return Response.json(grupos.map(g => ({
      nome: g.nome,
      times: g.times.map(gt => gt.time)
    })));
  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}