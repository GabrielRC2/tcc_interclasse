import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Buscar dados completos de uma partida específica incluindo resultados dos times
export async function GET(request, { params }) {
  try {
    const { partidaId } = await params;
    const id = parseInt(partidaId);

    if (isNaN(id)) {
      return Response.json({ error: "ID da partida inválido" }, { status: 400 });
    }

    const partida = await prisma.partida.findUnique({
      where: { id: id },
      include: {
        times: {
          include: {
            time: {
              include: {
                curso: true,
                categoria: {
                  include: {
                    modalidade: true
                  }
                }
              }
            }
          }
        },
        grupo: {
          include: {
            modalidade: true
          }
        },
        local: true
      }
    });

    if (!partida) {
      return Response.json({ error: "Partida não encontrada" }, { status: 404 });
    }

    return Response.json(partida);
  } catch (error) {
    console.error("Erro ao buscar partida:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
