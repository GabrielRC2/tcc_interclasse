import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Rota GET: Retorna todos os eventos de partida
 * Pode filtrar por partida específica usando query parameter ?partidaId=X
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const partidaId = searchParams.get('partidaId');

    const whereClause = {};
    if (partidaId) {
      whereClause.fk_id_partida = parseInt(partidaId, 10);
    }

    const eventos = await prisma.eventos_Partida.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { fk_id_partida: 'asc' },
        { tempo_partida: 'asc' }
      ]
    });

    // Formatação dos eventos para resposta mais legível
    const eventosFormatados = eventos.map(evento => ({
      id_evento: evento.id_evento,
      tempo_partida: evento.tempo_partida,
      tipo_evento: evento.tipo_evento,
      pontos_gerados: evento.pontos_gerados,
      id_partida: evento.fk_id_partida,
      nome_jogador: evento.jogador.nome_jogador,
      nome_time: evento.time.nome_time,
      // Informações da partida
      partida: {
        id: evento.partida.id_partidas,
        status: evento.partida.status_partida,
        placar_time_A: evento.partida.placar_time_A,
        placar_time_B: evento.partida.placar_time_B,
        nome_torneio: evento.partida.torneio.nome_torneio,
        nome_grupo: evento.partida.grupo?.nome_grupo || null,
        times: evento.partida.inscricoes_na_partida.map(ip => ({
          nome_time: ip.inscricao.time.nome_time,
          identificador: ip.identificador_time
        }))
      }
    }));

    return NextResponse.json(eventosFormatados, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return NextResponse.json({ message: "Não foi possível buscar os eventos." }, { status: 500 });
  }
}

/**
 * Rota POST: Cria um novo evento de partida
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      tempo_partida, 
      tipo_evento, 
      pontos_gerados, 
      fk_id_partida, 
      fk_id_jogador, 
      fk_id_time 
    } = body;

    // Validações básicas
    if (!tipo_evento || !fk_id_partida || !fk_id_jogador || !fk_id_time) {
      return NextResponse.json({ 
        message: "Campos obrigatórios: tipo_evento, fk_id_partida, fk_id_jogador, fk_id_time" 
      }, { status: 400 });
    }

    // Verifica se a partida existe
    const partida = await prisma.partidas.findUnique({
      where: { id_partidas: parseInt(fk_id_partida, 10) }
    });

    if (!partida) {
      return NextResponse.json({ message: "Partida não encontrada." }, { status: 404 });
    }

    // Verifica se o jogador existe
    const jogador = await prisma.jogadores.findUnique({
      where: { id_jogador: parseInt(fk_id_jogador, 10) }
    });

    if (!jogador) {
      return NextResponse.json({ message: "Jogador não encontrado." }, { status: 404 });
    }

    // Verifica se o time existe
    const time = await prisma.times.findUnique({
      where: { id_times: parseInt(fk_id_time, 10) }
    });

    if (!time) {
      return NextResponse.json({ message: "Time não encontrado." }, { status: 404 });
    }

    const novoEvento = await prisma.eventos_Partida.create({
      data: {
        tempo_partida: tempo_partida ? parseInt(tempo_partida, 10) : null,
        tipo_evento: tipo_evento,
        pontos_gerados: pontos_gerados ? parseInt(pontos_gerados, 10) : null,
        fk_id_partida: parseInt(fk_id_partida, 10),
        fk_id_jogador: parseInt(fk_id_jogador, 10),
        fk_id_time: parseInt(fk_id_time, 10)
      },
      include: {
        partida: true,
        jogador: true,
        time: true
      }
    });

    return NextResponse.json(novoEvento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return NextResponse.json({ message: "Não foi possível criar o evento." }, { status: 500 });
  }
}