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

// Função para retry automático em caso de deadlock
async function executeWithRetry(operation, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Se é erro de deadlock/write conflict e ainda temos tentativas
      if (error.code === 'P2034' && attempt < maxRetries) {
        console.log(`🔄 Tentativa ${attempt}/${maxRetries} falhou com deadlock (P2034), tentando novamente...`);
        // Backoff exponencial com jitter: 200ms * 2^(attempt-1) + random(0-200ms)
        const backoffTime = 200 * Math.pow(2, attempt - 1) + Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }
      // Log do erro para debug
      console.error(`❌ Erro na tentativa ${attempt}:`, error.code, error.message);
      // Se não é deadlock ou esgotamos as tentativas, relança o erro
      throw error;
    }
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

    // Executar com retry automático para evitar deadlocks
    const resultado = await executeWithRetry(async () => {
      return await prisma.$transaction(async (tx) => {
        // Verificar eventos existentes para otimização
        const eventosExistentes = await tx.eventoPartida.findMany({
          where: { partidaId: partidaIdInt },
          select: { tipo: true, pontosGerados: true, jogadorId: true }
        });

        // Verificar se há mudanças reais (comparar eventos existentes vs novos)
        const eventosExistentesStr = JSON.stringify(eventosExistentes.sort((a, b) => 
          a.jogadorId - b.jogadorId || a.tipo.localeCompare(b.tipo)
        ));
        const novosEventosStr = JSON.stringify(novosEventos.map(e => ({
          tipo: e.tipo, pontosGerados: e.pontosGerados, jogadorId: e.jogadorId
        })).sort((a, b) => 
          a.jogadorId - b.jogadorId || a.tipo.localeCompare(b.tipo)
        ));

        // Se não há mudanças, retornar eventos existentes sem fazer nada
        if (eventosExistentesStr === novosEventosStr) {
          console.log('📝 Nenhuma mudança detectada nos eventos, pulando atualização');
          return eventosExistentes;
        }

        console.log('🔄 Atualizando eventos da partida:', partidaIdInt);
        
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
      }, {
        timeout: 10000 // 10 segundos de timeout
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