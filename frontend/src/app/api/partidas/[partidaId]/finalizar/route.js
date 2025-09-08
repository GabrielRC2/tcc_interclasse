import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { atualizarPontuacaoTorneio } from "@/utils/pontuacaoTorneio";

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { partidaId } = params;
    const { pontosCasa, pontosVisitante } = await request.json();

    if (pontosCasa === null || pontosVisitante === null) {
      return NextResponse.json({ error: 'Pontuação é obrigatória' }, { status: 400 });
    }

    // 1. Atualizar a pontuação do torneio (v/e/d, pontos)
    await atualizarPontuacaoTorneio(prisma, parseInt(partidaId), parseInt(pontosCasa), parseInt(pontosVisitante));

    // 2. Atualizar o status da partida para Finalizada
    const partidaAtualizada = await prisma.partida.update({
      where: { id: parseInt(partidaId) },
      data: {
        statusPartida: 'FINALIZADA',
        pontosCasa: parseInt(pontosCasa),
        pontosVisitante: parseInt(pontosVisitante),
      },
    });

    return NextResponse.json(partidaAtualizada);

  } catch (error) {
    console.error('Erro ao finalizar partida:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
