import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = parseInt(searchParams.get('torneioId'));

    if (!torneioId) {
      return Response.json({ error: 'torneioId é obrigatório' }, { status: 400 });
    }

    // Buscar modalidades associadas ao torneio via TorneioModalidade
    const torneioModalidades = await prisma.torneioModalidade.findMany({
      where: {
        torneioId: torneioId
      },
      include: {
        modalidade: true
      }
    });

    if (torneioModalidades.length === 0) {
      console.log('⚠️ Nenhuma modalidade associada ao torneio:', torneioId);
      return Response.json([]);
    }

    // Para cada modalidade do torneio, verificar gêneros com times cadastrados
    const modalidadesComGeneros = [];

    for (const tm of torneioModalidades) {
      const modalidade = tm.modalidade;
      
      // Buscar categorias dessa modalidade no torneio
      const categorias = await prisma.categoria.findMany({
        where: {
          modalidadeId: modalidade.id,
          times: {
            some: {
              torneioId: torneioId
            }
          }
        },
        include: {
          times: {
            where: {
              torneioId: torneioId
            }
          }
        }
      });

      // Agrupar por gênero
      const generos = {};
      categorias.forEach(cat => {
        if (!generos[cat.genero]) {
          generos[cat.genero] = {
            modalidadeId: modalidade.id,
            modalidadeNome: modalidade.nome,
            genero: cat.genero,
            totalTimes: 0,
            categoriaId: cat.id
          };
        }
        generos[cat.genero].totalTimes += cat.times.length;
      });

      modalidadesComGeneros.push(...Object.values(generos));
    }

    console.log('✅ Modalidades encontradas para torneio', torneioId, ':', modalidadesComGeneros);
    return Response.json(modalidadesComGeneros.filter(item => item.totalTimes > 0));

  } catch (error) {
    console.error('Erro ao buscar modalidades disponíveis:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}