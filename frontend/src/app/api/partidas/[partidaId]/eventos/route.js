import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, {params}) {
  try {
    // Next.js 14+: params precisa ser await
    const { partidaId } = await params;

    const partidaIdNum = parseInt(partidaId);

    // Buscar eventos da partida, incluindo o jogador
    const eventos = await prisma.eventoPartida.findMany({
      where: { partidaId: partidaIdNum },
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
 * ENDPOINT: POST /api/partidas/:partidaId/eventos
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
        const { partidaId } = await params;
        const partidaIdNum = parseInt(partidaId, 10);
        
        if (isNaN(partidaIdNum)) {
            return NextResponse.json({ error: "ID da partida inválido" }, { status: 400 });
        }
        
        // Verificar se a partida existe
        const partida = await prisma.partida.findUnique({
            where: { id: partidaIdNum }
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
                partidaId: partidaIdNum,
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
                partidaId: partidaIdNum,
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
