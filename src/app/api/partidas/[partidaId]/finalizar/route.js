import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { atualizarPontuacaoTorneio } from "@/utils/pontuacaoTorneio";

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { partidaId } = await params;
    const { 
      pontosCasa, 
      pontosVisitante, 
      penaltisCasa, 
      penaltisVisitante, 
      temPenaltis 
    } = await request.json();

    if (pontosCasa === null || pontosVisitante === null) {
      return NextResponse.json({ error: 'Pontuação é obrigatória' }, { status: 400 });
    }

    // Atualizar a pontuação do torneio
    await atualizarPontuacaoTorneio(
      prisma, 
      parseInt(partidaId), 
      parseInt(pontosCasa), 
      parseInt(pontosVisitante),
      parseInt(penaltisCasa || 0),
      parseInt(penaltisVisitante || 0),
      Boolean(temPenaltis)
    );

    // Preparar dados para atualização
    const updateData = {
      statusPartida: 'FINALIZADA',
      pontosCasa: parseInt(pontosCasa),
      pontosVisitante: parseInt(pontosVisitante),
      // SEMPRE salvar dados de pênaltis, independente do tipo de partida
      penaltisCasa: penaltisCasa !== undefined && penaltisCasa !== null ? parseInt(penaltisCasa) : null,
      penaltisVisitante: penaltisVisitante !== undefined && penaltisVisitante !== null ? parseInt(penaltisVisitante) : null,
      temPenaltis: Boolean(temPenaltis)
    };

    // Atualizar o status da partida
    const partidaAtualizada = await prisma.partida.update({
      where: { id: parseInt(partidaId) },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Partida finalizada com sucesso',
      partida: partidaAtualizada
    });

  } catch (error) {
    console.error('Erro ao finalizar partida:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}