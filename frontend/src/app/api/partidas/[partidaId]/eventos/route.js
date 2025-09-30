import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { partidaId } = await params;

    const eventos = await prisma.eventoPartida.findMany({
      where: {
        partidaId: parseInt(partidaId),
      },
      include: {
        jogador: {
          include: {
            times: {
              include: {
                time: true
              }
            }
          }
        },
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
    const { partidaId } = await params;
    const eventosParaCriar = await request.json();

    if (!Array.isArray(eventosParaCriar)) {
      return NextResponse.json({ error: 'O corpo da requisição deve ser um array de eventos' }, { status: 400 });
    }

    const partidaIdInt = parseInt(partidaId);

    // Delete existing events for this match before creating new ones
    await prisma.eventoPartida.deleteMany({
      where: { partidaId: partidaIdInt },
    });

    console.log('Eventos recebidos para criar:', JSON.stringify(eventosParaCriar, null, 2));

    // Processar eventos para garantir apenas 1 evento por tipo por jogador
    const eventosProcessados = new Map();

    eventosParaCriar.forEach(evento => {
      const jogadorId = evento.jogador;
      const tipo = evento.tipo;
      const pontos = evento.ponto || 0;

      console.log(`Processando evento - Jogador: ${jogadorId}, Tipo: ${tipo}, Pontos: ${pontos}`);

      if (tipo === 'GOL' && pontos > 0) {
        // Para gols, manter apenas um evento com a soma total
        eventosProcessados.set(`${jogadorId}-GOL`, {
          partidaId: partidaIdInt,
          jogadorId: jogadorId,
          tipo: 'GOL',
          pontosGerados: pontos,
        });
        console.log(`Evento de GOL criado para jogador ${jogadorId} com ${pontos} gols`);
      } else if (tipo === 'CARTAO_AMARELO' || tipo === 'CARTAO_VERMELHO') {
        // Para cartões, manter apenas um por jogador (priorizar vermelho)
        const existing = eventosProcessados.get(`${jogadorId}-CARTAO`);
        if (!existing || (tipo === 'CARTAO_VERMELHO' && existing.tipo === 'CARTAO_AMARELO')) {
          eventosProcessados.set(`${jogadorId}-CARTAO`, {
            partidaId: partidaIdInt,
            jogadorId: jogadorId,
            tipo: tipo,
            pontosGerados: 0,
          });
          console.log(`Evento de ${tipo} criado para jogador ${jogadorId}`);
        }
      }
    });

    const dadosEventos = Array.from(eventosProcessados.values());
    console.log('Eventos processados para inserir no banco:', JSON.stringify(dadosEventos, null, 2));

    if (dadosEventos.length > 0) {
      const resultado = await prisma.eventoPartida.createMany({
        data: dadosEventos,
      });
      return NextResponse.json(resultado, { status: 201 });
    }

    return NextResponse.json({ count: 0 }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar eventos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}

// No route.js dos eventos
export async function DELETE(request, { params }) {
  try {
    const { partidaId } = await params;
    const { eventoIds } = await request.json(); // Array de IDs para deletar

    if (!Array.isArray(eventoIds)) {
      return NextResponse.json({ error: 'eventoIds deve ser um array' }, { status: 400 });
    }

    await prisma.eventoPartida.deleteMany({
      where: {
        id: { in: eventoIds.map(id => parseInt(id)) },
        partidaId: parseInt(partidaId)
      }
    });

    return NextResponse.json({ message: 'Eventos deletados com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar eventos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}


export async function PATCH(request, { params }) {
  try {
    const { partidaId } = await params;
    const eventosParaAtualizar = await request.json();

    if (!Array.isArray(eventosParaAtualizar)) {
      return NextResponse.json({ error: 'O corpo da requisição deve ser um array de eventos' }, { status: 400 });
    }

    const partidaIdInt = parseInt(partidaId);

    // Para PATCH, usar a mesma lógica do POST: substituir todos os eventos
    // Delete existing events for this match
    await prisma.eventoPartida.deleteMany({
      where: { partidaId: partidaIdInt },
    });

    // Processar eventos para garantir apenas 1 evento por tipo por jogador
    const eventosProcessados = new Map();

    eventosParaAtualizar.forEach(evento => {
      const jogadorId = evento.jogadorId;
      const tipo = evento.tipo;

      if (tipo === 'GOL' && evento.pontosGerados > 0) {
        eventosProcessados.set(`${jogadorId}-GOL`, {
          partidaId: partidaIdInt,
          jogadorId: jogadorId,
          tipo: 'GOL',
          pontosGerados: evento.pontosGerados,
        });
      } else if (tipo === 'CARTAO_AMARELO' || tipo === 'CARTAO_VERMELHO') {
        const existing = eventosProcessados.get(`${jogadorId}-CARTAO`);
        if (!existing || (tipo === 'CARTAO_VERMELHO' && existing.tipo === 'CARTAO_AMARELO')) {
          eventosProcessados.set(`${jogadorId}-CARTAO`, {
            partidaId: partidaIdInt,
            jogadorId: jogadorId,
            tipo: tipo,
            pontosGerados: 0,
          });
        }
      }
    });

    const dadosEventos = Array.from(eventosProcessados.values());

    if (dadosEventos.length > 0) {
      const resultado = await prisma.eventoPartida.createMany({
        data: dadosEventos,
      });
      return NextResponse.json(resultado, { status: 200 });
    }

    return NextResponse.json({ count: 0 }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar eventos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}
