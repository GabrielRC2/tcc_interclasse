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

    console.log('🔍 Buscando grupos:', { torneioId, modalidadeId, genero });

    // ADICIONAR filtro por gênero na query:
    const grupos = await prisma.grupo.findMany({
      where: {
        torneioId: parseInt(torneioId),
        modalidadeId: parseInt(modalidadeId),
        // GARANTIR que o grupo tem times do gênero específico
        times: {
          some: {
            time: {
              categoria: { genero: genero }
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
          // FILTRAR apenas times do gênero específico
          where: {
            time: {
              categoria: { genero: genero }
            }
          }
        }
      },
      orderBy: { nome: 'asc' }
    });

    // Filtrar grupos que realmente têm times do gênero
    const gruposComTimes = grupos.filter(grupo => grupo.times.length > 0);

    console.log(`📊 Grupos encontrados: ${gruposComTimes.length} para ${genero}`);

    return Response.json(gruposComTimes);
  } catch (error) {
    console.error('❌ Erro ao buscar grupos:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}