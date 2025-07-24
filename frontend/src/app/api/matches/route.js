import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota GET: Retorna todas as partidas com seus detalhes relacionados
export async function GET() {
  try {
    const partidas = await prisma.partidas.findMany({
      include: {
        local: true,
        torneio: true,
        grupo: true,
        inscricoes_na_partida: { include: { inscricao: { include: { time: true } } } }, // Inclui os times inscritos
        eventos_da_partida: true,
      }
    });

    // Opcional: Formatação simplificada para o JSON de saída
    const partidasFormatadas = partidas.map(partida => ({
        id_partidas: partida.id_partidas,
        placar_time_A: partida.placar_time_A,
        placar_time_B: partida.placar_time_B,
        status_partida: partida.status_partida,
        nome_local: partida.local ? partida.local.nome_local : null, // Pode ser nulo se não houver local associado
        nome_torneio: partida.torneio.nome_torneio,
        nome_grupo: partida.grupo ? partida.grupo.nome_grupo : null,
        times_na_partida: partida.inscricoes_na_partida.map(ip => ({
            id_inscricao: ip.fk_id_inscricao,
            nome_time: ip.inscricao.time.nome_time,
            identificador: ip.identificador_time // Time_A ou Time_B
        })),
        quantidade_eventos: partida.eventos_da_partida.length
    }));

    return NextResponse.json(partidasFormatadas, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar partidas:", error);
    return NextResponse.json({ message: "Não foi possível buscar as partidas." }, { status: 500 });
  }
}