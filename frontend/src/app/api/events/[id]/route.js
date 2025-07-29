import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Rota GET: Retorna um evento específico
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const eventoId = parseInt(id, 10);
    
    if (isNaN(eventoId)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    const evento = await prisma.eventos_Partida.findUnique({
      where: { id_evento: eventoId },
      include: {
        partida: {
          include: {
            torneio: true,
            grupo: true,
            inscricoes_na_partida: {
              include: {
                inscricao: {
                  include: {
                    time: true
                  }
                }
              }
            }
          }
        },
        jogador: true,
        time: true
      }
    });

    if (!evento) {
      return NextResponse.json({ message: "Evento não encontrado." }, { status: 404 });
    }

    const eventoFormatado = {
      id_evento: evento.id_evento,
      tempo_partida: evento.tempo_partida,
      tipo_evento: evento.tipo_evento,
      pontos_gerados: evento.pontos_gerados,
      nome_jogador: evento.jogador.nome_jogador,
      nome_time: evento.time.nome_time,
      partida: {
        id: evento.partida.id_partidas,
        status: evento.partida.status_partida,
        nome_torneio: evento.partida.torneio.nome_torneio,
        nome_grupo: evento.partida.grupo?.nome_grupo || null,
        times: evento.partida.inscricoes_na_partida.map(ip => ({
          nome_time: ip.inscricao.time.nome_time,
          identificador: ip.identificador_time
        }))
      }
    };

    return NextResponse.json(eventoFormatado, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar evento:", error);
    return NextResponse.json({ message: "Não foi possível buscar o evento." }, { status: 500 });
  }
}

/**
 * Rota PUT: Atualiza um evento
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const eventoId = parseInt(id, 10);
    
    if (isNaN(eventoId)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    const body = await request.json();
    const { tempo_partida, tipo_evento, pontos_gerados } = body;

    const eventoAtualizado = await prisma.eventos_Partida.update({
      where: { id_evento: eventoId },
      data: {
        ...(tempo_partida !== undefined && { tempo_partida: parseInt(tempo_partida, 10) }),
        ...(tipo_evento && { tipo_evento }),
        ...(pontos_gerados !== undefined && { pontos_gerados: parseInt(pontos_gerados, 10) })
      },
      include: {
        partida: true,
        jogador: true,
        time: true
      }
    });

    return NextResponse.json(eventoAtualizado, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    return NextResponse.json({ message: "Não foi possível atualizar o evento." }, { status: 500 });
  }
}

/**
 * Rota DELETE: Remove um evento
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const eventoId = parseInt(id, 10);
    
    if (isNaN(eventoId)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    await prisma.eventos_Partida.delete({
      where: { id_evento: eventoId }
    });

    return NextResponse.json({ message: "Evento removido com sucesso." }, { status: 200 });
  } catch (error) {
    console.error("Erro ao remover evento:", error);
    return NextResponse.json({ message: "Não foi possível remover o evento." }, { status: 500 });
  }
}