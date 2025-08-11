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
        torneioId: parseInt(torneioId),
        modalidadeId: parseInt(modalidadeId)
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
      },
      orderBy: {
        nome: 'asc'
      }
    });

    // Filtrar apenas grupos que têm times do gênero especificado
    const gruposComTimes = grupos.filter(grupo => grupo.times.length > 0);

    const gruposFormatados = gruposComTimes.map(grupo => ({
      nome: grupo.nome,
      times: grupo.times.map(gt => ({
        id: gt.time.id,
        nome: gt.time.nome,
        curso: gt.time.curso,
        categoria: gt.time.categoria
      }))
    }));

    return Response.json(gruposFormatados);
  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}