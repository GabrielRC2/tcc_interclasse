import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Rota PATCH para atualizar um evento específico da partida
export async function PATCH(request, { params }) {
  try {
    // Await params and destructure named params
    const { partidaId, eventoId } = await params;

    const partidaIdNum = partidaId ? parseInt(partidaId, 10) : null;
    const eventoIdNum = eventoId ? parseInt(eventoId, 10) : null;

    const data = await request.json();

    if (isNaN(eventoIdNum)) {
      return NextResponse.json({ error: 'ID do evento inválido' }, { status: 400 });
    }

    // map possible fields
    const pontosGerados = typeof data.pontosGerados !== 'undefined' ? data.pontosGerados : (data.ponto ?? data.pontos ?? null);
    const updateData = {};
    if (pontosGerados !== null) updateData.pontosGerados = Number(pontosGerados);
    if (typeof data.tipo !== 'undefined') updateData.tipo = data.tipo;
    if (typeof data.jogadorId !== 'undefined') updateData.jogadorId = Number(data.jogadorId);

    const eventoAtualizado = await prisma.eventoPartida.update({
      where: { id: eventoIdNum },
      data: updateData
    });

    return NextResponse.json(eventoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return NextResponse.json({ error: 'Erro ao atualizar evento', details: error.message }, { status: 500 });
  }
}
