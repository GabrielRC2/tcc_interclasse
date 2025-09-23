import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = parseInt(searchParams.get('torneioId'));

    if (!torneioId) {
      return Response.json({ error: 'torneioId é obrigatório' }, { status: 400 });
    }

    // Buscar times agrupados por categoria
    const timesGrouped = await prisma.time.groupBy({
      by: ['categoriaId'],
      where: {
        torneioId: torneioId
      },
      _count: {
        id: true
      }
    });

    // Buscar detalhes das categorias
    const categorias = await prisma.categoria.findMany({
      where: {
        id: {
          in: timesGrouped.map(t => t.categoriaId)
        }
      },
      include: {
        modalidade: true
      }
    });

    // Montar resultado
    const resultado = timesGrouped.map(timeGroup => {
      const categoria = categorias.find(c => c.id === timeGroup.categoriaId);
      
      return {
        modalidadeId: categoria.modalidade.id,
        modalidadeNome: categoria.modalidade.nome,
        genero: categoria.genero,
        totalTimes: timeGroup._count.id,
        categoriaId: categoria.id
      };
    }).filter(item => item.totalTimes > 0);

    console.log('Modalidades encontradas:', resultado);
    return Response.json(resultado);

  } catch (error) {
    console.error('Erro ao buscar modalidades disponíveis:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}