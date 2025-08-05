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
          AND: [
            { modalidadeId: parseInt(modalidadeId) },
            { genero: genero } // USAR CAMPO GENERO DIRETO
          ]
        }
      },
      include: {
        curso: true,
        categoria: {
          include: {
            modalidade: true
          }
        },
        jogadores: {
          include: {
            jogador: true
          }
        }
      }
    });

    return Response.json(times.map(t => ({
      id: t.id,
      nome: t.nome,
      curso: t.curso.nome,
      sala: t.sala,
      jogadoresCount: t.jogadores.length,
      categoria: `${t.categoria.genero} - ${t.categoria.modalidade?.nome || 'N/A'}`
    })));
  } catch (error) {
    console.error('Erro ao buscar times disponíveis:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}