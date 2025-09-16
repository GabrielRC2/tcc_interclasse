import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');

    if (!torneioId) {
      return NextResponse.json({ error: 'ID do torneio é obrigatório' }, { status: 400 });
    }

    // Buscar jogadores em destaque baseado nas estatísticas das partidas
    const jogadoresDestaque = await prisma.jogadorPartida.groupBy({
      by: ['jogadorId'],
      where: {
        partida: {
          torneioId: parseInt(torneioId)
        }
      },
      _sum: {
        gols: true,
        assistencias: true,
        cartaoAmarelo: true,
        cartaoVermelho: true
      },
      _count: {
        jogadorId: true
      },
      orderBy: {
        _sum: {
          gols: 'desc'
        }
      },
      take: 10
    });

    // Buscar detalhes dos jogadores
    const jogadoresDetalhados = await Promise.all(
      jogadoresDestaque.map(async (stats) => {
        const jogador = await prisma.jogador.findUnique({
          where: { id: stats.jogadorId },
          include: {
            time: true
          }
        });

        return {
          id: jogador?.id,
          nome: jogador?.nome,
          time: jogador?.time?.nome,
          gols: stats._sum.gols || 0,
          assistencias: stats._sum.assistencias || 0,
          cartaoAmarelo: stats._sum.cartaoAmarelo || 0,
          cartaoVermelho: stats._sum.cartaoVermelho || 0,
          partidas: stats._count.jogadorId
        };
      })
    );

    return NextResponse.json(jogadoresDetalhados.filter(j => j.id));
  } catch (error) {
    console.error('Erro ao buscar jogadores em destaque:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}