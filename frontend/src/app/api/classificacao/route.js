import { PrismaClient } from '@prisma/client';
import { obterClassificacao } from "@/utils/pontuacaoTorneio";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');
    const grupoId = searchParams.get('grupoId');
    const modalidadeId = searchParams.get('modalidadeId');
    const genero = searchParams.get('genero');

    if (!torneioId) {
      return Response.json({ error: "torneioId é obrigatório" }, { status: 400 });
    }

    // Se modalidadeId e genero são fornecidos, filtrar apenas por esses
    let whereClause = {
      partida: {
        torneioId: parseInt(torneioId)
      }
    };

    if (modalidadeId && genero) {
      // Buscar grupos da modalidade/gênero específicos
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

      const gruposIds = grupos.map(g => g.id);
      whereClause.partida.grupoId = { in: gruposIds };
    } else if (grupoId) {
      whereClause.partida.grupoId = parseInt(grupoId);
    }

    const classificacao = await obterClassificacao(
      prisma, 
      parseInt(torneioId), 
      whereClause
    );

    return Response.json({ classificacao });

  } catch (error) {
    console.error("Erro ao buscar classificação:", error);
    return Response.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}
