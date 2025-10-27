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

    console.log('Buscando grupos:', { torneioId, modalidadeId, genero });

    // Buscar grupos com times da modalidade/gênero específicos
    const grupos = await prisma.grupo.findMany({
      where: {
        torneioId: parseInt(torneioId),
        modalidadeId: parseInt(modalidadeId),
        times: {
          some: {
            time: {
              categoria: {
                genero: genero
              }
            }
          }
        }
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
      orderBy: { nome: 'asc' }
    });

    console.log(`Encontrados ${grupos.length} grupos para ${genero}`);

    const gruposFormatados = grupos.map(grupo => ({
      id: grupo.id,
      nome: grupo.nome,
      times: grupo.times.map(gt => ({
        id: gt.time.id,
        nome: gt.time.nome,
        curso: gt.time.curso
      }))
    }));

    return Response.json(gruposFormatados);

  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}