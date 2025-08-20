import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');

    if (!torneioId) {
      return Response.json({ error: 'Torneio não especificado' }, { status: 400 });
    }

    const totalTimes = await prisma.time.count({
      where: { torneioId: parseInt(torneioId) }
    });

    const totalJogadores = await prisma.timeJogador.count({
      where: {
        time: { torneioId: parseInt(torneioId) }
      }
    });

    // Usar 0 se tabela partida não existir
    let totalPartidas = 0;
    let partidasFinalizadas = 0;
    try {
      totalPartidas = await prisma.partida.count({
        where: { torneioId: parseInt(torneioId) }
      });
      partidasFinalizadas = await prisma.partida.count({
        where: {
          torneioId: parseInt(torneioId),
          status: 'FINALIZADA'
        }
      });
    } catch (e) {
      console.log('Tabela partida não existe');
    }

    const modalidades = await prisma.modalidade.findMany({
      where: {
        categorias: {
          some: {
            times: {
              some: { torneioId: parseInt(torneioId) }
            }
          }
        }
      }
    });

    const stats = {
      totalTimes,
      totalJogadores,
      totalPartidas,
      partidasFinalizadas,
      partidasPendentes: totalPartidas - partidasFinalizadas,
      modalidades: modalidades.length
    };

    return Response.json(stats);
  } catch (error) {
    console.error('Erro na API stats:', error);
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}