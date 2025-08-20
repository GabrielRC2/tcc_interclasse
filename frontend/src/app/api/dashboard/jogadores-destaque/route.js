import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');

    if (!torneioId) {
      return Response.json({});
    }

    // Buscar modalidades do torneio
    const modalidades = await prisma.modalidade.findMany({
      where: {
        torneioModalidades: {
          some: {
            torneioId: parseInt(torneioId)
          }
        }
      }
    });

    const jogadoresDestaque = {};
    
    for (const modalidade of modalidades) {
      // Por enquanto, retornar estrutura vazia até ter dados de estatísticas
      jogadoresDestaque[modalidade.nome.toUpperCase()] = [];
    }

    return Response.json(jogadoresDestaque);
  } catch (error) {
    console.error('Erro na API jogadores-destaque:', error);
    return Response.json({});
  }
}