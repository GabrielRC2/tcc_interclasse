import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = parseInt(searchParams.get('torneioId'));

    if (!torneioId) {
      return Response.json({ error: 'torneioId é obrigatório' }, { status: 400 });
    }

    // Buscar grupos existentes
    const grupos = await prisma.grupo.findMany({
      where: {
        torneioId: torneioId
      },
      include: {
        times: {
          include: {
            time: {
              include: {
                categoria: {
                  include: {
                    modalidade: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Agrupar por modalidade e gênero
    const gruposDisponiveis = new Map();

    grupos.forEach(grupo => {
      if (grupo.times.length > 0) {
        // Pegar a categoria do primeiro time (todos os times do grupo devem ter a mesma categoria)
        const categoria = grupo.times[0].time.categoria;
        const chave = `${categoria.modalidade.id}-${categoria.genero}`;
        
        if (!gruposDisponiveis.has(chave)) {
          gruposDisponiveis.set(chave, {
            modalidadeId: categoria.modalidade.id,
            modalidadeNome: categoria.modalidade.nome,
            genero: categoria.genero,
            totalGrupos: 0,
            totalTimes: 0
          });
        }

        const item = gruposDisponiveis.get(chave);
        item.totalGrupos += 1;
        item.totalTimes += grupo.times.length;
      }
    });

    const resultado = Array.from(gruposDisponiveis.values());

    console.log('Grupos encontrados:', resultado);
    return Response.json(resultado);

  } catch (error) {
    console.error('Erro ao buscar grupos disponíveis:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}