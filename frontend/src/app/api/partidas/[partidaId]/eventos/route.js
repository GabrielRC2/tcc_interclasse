import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { partidaId } = params;

    const eventos = await prisma.eventoPartida.findMany({
      where: {
        partidaId: parseInt(partidaId),
      },
      include: {
        jogador: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return NextResponse.json(eventos);
  } catch (error) {
    console.error('Erro ao buscar eventos da partida:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { partidaId } = params;
    const eventosParaCriar = await request.json();

    if (!Array.isArray(eventosParaCriar)) {
      return NextResponse.json({ error: 'O corpo da requisição deve ser um array de eventos' }, { status: 400 });
    }

    // Delete existing events for this match before creating new ones
    await prisma.eventoPartida.deleteMany({
      where: {
        partidaId: parseInt(partidaId),
      },
    });

    const dadosEventos = eventosParaCriar.map(evento => ({
      partidaId: parseInt(partidaId),
      jogadorId: evento.jogador,
      tipo: evento.tipo,
      pontosGerados: evento.ponto,
    }));

    const resultado = await prisma.eventoPartida.createMany({
      data: dadosEventos,
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar eventos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { partidaId } = params;
    const { eventoId } = await request.json();

    await prisma.eventoPartida.delete({ where: { id: eventoId } });

    return NextResponse.json({ message: 'Evento deletado com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}