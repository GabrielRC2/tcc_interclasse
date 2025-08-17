import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, {params}) {
  try {
    // Next.js 14+: params precisa ser await
    const { id } = await params;

    const partidaId = parseInt(id);

    // Buscar eventos da partida, incluindo o jogador
    const eventos = await prisma.eventoPartida.findMany({
      where: { partidaId },
      include: {
        jogador: true // Não existe 'time' aqui!
      }
    });

    return Response.json(eventos);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * ENDPOINT: POST /api/partidas/:id/eventos
 * 
 * DESCRIÇÃO:
 * Registra múltiplos eventos em uma partida (gols, cartões, etc.)
 * 
 * CORPO DA REQUISIÇÃO (envie um array de eventos):
 * [
 *   {
 *     "tipo": "GOL",              // Tipo do evento (GOL, CARTAO_AMARELO, etc)
 *     "ponto": 1,                 // Pontos que este evento adiciona ao placar
 *     "jogador": 1,               // ID do jogador
 *     "tempo": "2023-08-14T15:30:00Z"  // Tempo no formato ISO (campo opcional)
 *   }
 * ]
 */
export async function POST(request, { params }) {
    try {
        const data = await request.json();
        
        // Corrigido: Aguardar params antes de usar suas propriedades
        const { id } = params;
        const partidaId = parseInt(id, 10);
        
        if (isNaN(partidaId)) {
            return NextResponse.json({ error: "ID da partida inválido" }, { status: 400 });
        }
        
        // Verificar se a partida existe
        const partida = await prisma.partida.findUnique({
            where: { id: partidaId }
        });
        
        if (!partida) {
            return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
        }
        
        // Garante que temos um array de eventos
        const eventos = Array.isArray(data) ? data : [data];
        
        // Prepara todos os eventos com o partidaId da URL
        const eventosData = eventos.map(evento => {            
            return {
                tipo: evento.tipo,
                pontosGerados: evento.ponto,
                jogadorId: evento.jogador,
                partidaId: partidaId,
                // Só inclua tempoPartida se for fornecido e estiver formatado corretamente
                // ...(tempoFormatado && { tempoPartida: tempoFormatado })
            };
        });
        
        // Cria múltiplos eventos eficientemente
        const result = await prisma.eventoPartida.createMany({
            data: eventosData
        });
        
        // Busca os eventos recém-criados com relacionamentos
        const eventosCompletos = await prisma.eventoPartida.findMany({
            where: {
                partidaId: partidaId,
            },
            include: {
                partida: {
                    include: {
                        grupo: true,
                        torneio: true
                    }
                },
                jogador: {
                    include: {
                        curso: true
                    }
                }
            },
            orderBy: {
                id: 'desc'
            },
            take: eventos.length
        });
        
        return NextResponse.json({
            message: `${result.count} eventos criados com sucesso`,
            eventos: eventosCompletos
        }, { status: 201 });
        
    } catch (error) {
        console.error("Erro ao criar eventos:", error);
        return NextResponse.json(
            { error: "Erro ao criar eventos", details: error.message },
            { status: 500 }
        );
    }
}

// Rota PATCH para atualizar resultado
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const partidaId = parseInt(id, 10);
    const data = await request.json();
    
    if (isNaN(partidaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    
    // Atualiza resultado da partida
    const partidaAtualizada = await prisma.partida.update({
      where: { id: partidaId },
      data: {
        resultado: data.resultado,
        vencedorId: data.vencedorId,
        empate: data.empate
      }
    });
    
    return NextResponse.json(partidaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar partida:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar partida", details: error.message },
      { status: 500 }
    );
  }
}