import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { partidaId } = await params;

    const eventos = await prisma.eventoPartida.findMany({
      where: {
        partidaId: parseInt(partidaId)
      },
      include: {
        jogador: {
          include: {
            curso: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    return NextResponse.json(eventos);

  } catch (error) {
    console.error('Erro ao buscar eventos da partida:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { partidaId } = await params;
    const eventos = await request.json();

    if (!Array.isArray(eventos)) {
      return NextResponse.json({ error: 'Eventos devem ser um array' }, { status: 400 });
    }

    // Validar e criar eventos em batch
    const eventosParaCriar = eventos.map((evento, index) => {
      const jogadorId = parseInt(evento.jogador || evento.jogadorId);
      const partidaIdInt = parseInt(partidaId);
      
      if (isNaN(jogadorId)) {
        throw new Error(`Evento ${index}: jogadorId inválido: ${evento.jogador || evento.jogadorId}`);
      }
      
      if (isNaN(partidaIdInt)) {
        throw new Error(`PartidaId inválido: ${partidaId}`);
      }

      return {
        tipo: evento.tipo,
        pontosGerados: evento.ponto || evento.pontosGerados || 0,
        jogadorId: jogadorId,
        partidaId: partidaIdInt
      };
    });

    const eventosCreated = await prisma.eventoPartida.createMany({
      data: eventosParaCriar
    });

    return NextResponse.json(eventosCreated);

  } catch (error) {
    console.error('Erro ao criar eventos da partida:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { partidaId } = params;
    const updates = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates devem ser um array' }, { status: 400 });
    }

    // Atualizar eventos em batch
    const updatePromises = updates.map(update => 
      prisma.eventoPartida.update({
        where: { id: update.id },
        data: {
          pontosGerados: update.body.pontosGerados || update.body.ponto,
          tipo: update.body.tipo
        }
      })
    );

    const updatedEventos = await Promise.all(updatePromises);

    return NextResponse.json(updatedEventos);

  } catch (error) {
    console.error('Erro ao atualizar eventos da partida:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}