import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Função auxiliar para processar eventos recebidos
function processarEventos(eventosRecebidos, partidaId) {
  const novosEventos = [];
  const golsPorJogador = new Map();

  eventosRecebidos.forEach(evento => {
    const jogadorId = parseInt(evento.jogador || evento.jogadorId);
    const tipo = evento.tipo;
    const pontos = evento.ponto || evento.pontosGerados || 0;

    if (tipo === 'GOL' && pontos > 0) {
      // Para gols: 1 registro por jogador com total de pontos
      golsPorJogador.set(jogadorId, pontos);
    } else if (tipo === 'CARTAO_AMARELO' || tipo === 'CARTAO_VERMELHO') {
      // Para cartões: adicionar cada evento individual
      novosEventos.push({
        partidaId: parseInt(partidaId),
        jogadorId,
        tipo,
        pontosGerados: 0
      });
    }
  });

  // Adicionar gols processados
  golsPorJogador.forEach((pontos, jogadorId) => {
    novosEventos.push({
      partidaId: parseInt(partidaId),
      jogadorId,
      tipo: 'GOL',
      pontosGerados: pontos
    });
  });

  return novosEventos;
}

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
    const eventosRecebidos = await request.json();

    if (!Array.isArray(eventosRecebidos)) {
      return NextResponse.json({ error: 'O corpo da requisição deve ser um array de eventos' }, { status: 400 });
    }

    const partidaIdInt = parseInt(partidaId);
    const novosEventos = processarEventos(eventosRecebidos, partidaIdInt);

    // Executar em transação: replace all (delete + create)
    const resultado = await prisma.$transaction(async (tx) => {
      // Remover todos os eventos existentes da partida
      await tx.eventoPartida.deleteMany({
        where: { partidaId: partidaIdInt }
      });

      // Criar todos os novos eventos
      if (novosEventos.length > 0) {
        await tx.eventoPartida.createMany({
          data: novosEventos
        });
      }

      // Retornar eventos atualizados
      return await tx.eventoPartida.findMany({
        where: { partidaId: partidaIdInt },
        orderBy: { id: 'asc' }
      });
    });

    return NextResponse.json({
      success: true,
      eventos: resultado
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao salvar eventos:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { partidaId } = await params;
    const body = await request.json();

    // Suportar tanto eventoIds quanto eventoId único
    let idsParaDeletar = [];
    if (body.eventoIds && Array.isArray(body.eventoIds)) {
      idsParaDeletar = body.eventoIds.map(id => parseInt(id));
    } else if (body.eventoId) {
      idsParaDeletar = [parseInt(body.eventoId)];
    } else {
      return NextResponse.json({ error: 'eventoIds ou eventoId deve ser fornecido' }, { status: 400 });
    }

    const resultado = await prisma.eventoPartida.deleteMany({
      where: {
        id: { in: idsParaDeletar },
        partidaId: parseInt(partidaId)
      }
    });

    return NextResponse.json({ 
      message: 'Eventos deletados com sucesso',
      deletados: resultado.count
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao deletar eventos:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  // PATCH usa a mesma lógica do POST (replace all)
  // Isso mantém a simplicidade e consistência
  return await POST(request, { params });
}