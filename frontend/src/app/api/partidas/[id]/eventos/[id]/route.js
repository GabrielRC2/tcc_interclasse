import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Rota PATCH para atualizar um evento específico da partida
export async function PATCH(request, { params }) {
  try {
    // params may be an async proxy and can be an array when dynamic segments share the same name
    const raw = await params;
    const idParam = raw.id;

    let partidaId = null;
    let eventoId = null;
    if (Array.isArray(idParam)) {
      partidaId = parseInt(idParam[0], 10);
      eventoId = parseInt(idParam[1], 10);
    } else {
      // fallback: only evento id provided
      eventoId = parseInt(idParam, 10);
    }

    const data = await request.json();

    if (isNaN(eventoId)) {
      return NextResponse.json({ error: 'ID do evento inválido' }, { status: 400 });
    }

    // map possible fields
    const pontosGerados = typeof data.pontosGerados !== 'undefined' ? data.pontosGerados : (data.ponto ?? data.pontos ?? null);
    const updateData = {};
    if (pontosGerados !== null) updateData.pontosGerados = Number(pontosGerados);
    if (typeof data.tipo !== 'undefined') updateData.tipo = data.tipo;
    if (typeof data.jogadorId !== 'undefined') updateData.jogadorId = Number(data.jogadorId);

    const eventoAtualizado = await prisma.eventoPartida.update({
      where: { id: eventoId },
      data: updateData
    });

    return NextResponse.json(eventoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return NextResponse.json({ error: 'Erro ao atualizar evento', details: error.message }, { status: 500 });
  }
}