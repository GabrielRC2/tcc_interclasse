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
    };

    // Adicionar dados de pênaltis se fornecidos
    if (temPenaltis) {
      updateData.penaltisCasa = parseInt(penaltisCasa || 0);
      updateData.penaltisVisitante = parseInt(penaltisVisitante || 0);
      updateData.temPenaltis = true;
    }

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