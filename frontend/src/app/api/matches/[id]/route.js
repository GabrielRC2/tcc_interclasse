import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota GET: Retorna uma partida específica
export async function GET(request, { params }) {
  try {
    const { id } = await params; // Obtém o ID da partida a partir dos parâmetros da requisição
    const idPartida = parseInt(id, 10);
    if (isNaN(idPartida)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }
    const partida = await prisma.partidas.findUnique({
      where: { id_partidas: idPartida },
      include: {
        local: true,                      // Inclui os dados do local
        torneio: true,                    // Inclui os dados do torneio
        grupo: true,                      // Inclui os dados do grupo
        inscricoes_na_partida: {          // Inclui as inscrições relacionadas à partida
          include: {
            inscricao: {                  // Inclui os detalhes da inscrição
              include: {                  // E os detalhes do time dentro da inscrição
                time: true
              }
            }
          }
        },
        eventos_da_partida: true,         // Inclui os eventos desta partida
      },
    });
    if (!partida) {
      return NextResponse.json({ message: "Partida não encontrada." }, { status: 404 });
    }
    // Opcional: Formatação simplificada para um único objeto de partida
    const partidaFormatada = {
        id_partidas: partida.id_partidas,
        placar_time_A: partida.placar_time_A,
        placar_time_B: partida.placar_time_B,
        status_partida: partida.status_partida,
        nome_local: partida.local ? partida.local.nome_local : null, // Pode ser nulo se o local não for obrigatório
        nome_torneio: partida.torneio.nome_torneio,
        nome_grupo: partida.grupo ? partida.grupo.nome_grupo : null,
        // Mapeia os times inscritos na partida para um formato mais legível
        times_na_partida: partida.inscricoes_na_partida.map(ip => ({
            id_inscricao: ip.fk_id_inscricao,
            nome_time: ip.inscricao.time.nome_time,
            identificador: ip.identificador_time // Ex: "Time_A" ou "Time_B"
        })),
        quantidade_eventos: partida.eventos_da_partida.length
    };
    return NextResponse.json(partidaFormatada, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar partida:", error);
    return NextResponse.json({ message: "Não foi possível buscar a partida." }, { status: 500 });
  }
}

// Rota PATCH: Atualiza parcialmente uma partida
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const idPartida = parseInt(id, 10);
    if (isNaN(idPartida)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }
    const body = await request.json();
    const dataToUpdate = {};
    if (body.placar_time_A !== undefined) dataToUpdate.placar_time_A = body.placar_time_A ? parseInt(body.placar_time_A, 10) : null;
    if (body.placar_time_B !== undefined) dataToUpdate.placar_time_B = body.placar_time_B ? parseInt(body.placar_time_B, 10) : null;
    if (body.status_partida !== undefined) dataToUpdate.status_partida = body.status_partida;
    if (body.fk_id_local !== undefined) dataToUpdate.fk_id_local = body.fk_id_local ? parseInt(body.fk_id_local, 10) : null;
    if (body.fk_id_torneio !== undefined) dataToUpdate.fk_id_torneio = parseInt(body.fk_id_torneio, 10);
    if (body.fk_id_grupo !== undefined) dataToUpdate.fk_id_grupo = body.fk_id_grupo ? parseInt(body.fk_id_grupo, 10) : null;

    const updatedPartida = await prisma.partidas.update({
      where: { id_partidas: idPartida },
      data: dataToUpdate,
    });
    return NextResponse.json(updatedPartida, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') { return NextResponse.json({ message: "Partida não encontrada." }, { status: 404 }); }
    console.error("Erro ao atualizar parcialmente partida:", error);
    return NextResponse.json({ message: "Não foi possível atualizar a partida." }, { status: 500 });
  }
}

// Rota DELETE: Deleta uma partida
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const idPartida = parseInt(id, 10);
    if (isNaN(idPartida)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }
    const deletedPartida = await prisma.partidas.delete({
      where: { id_partidas: idPartida },
    });
    return NextResponse.json(deletedPartida, { message: "Partida deletada com sucesso." }, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') { return NextResponse.json({ message: "Partida não encontrada." }, { status: 404 }); }
    console.error("Erro ao deletar partida:", error);
    return NextResponse.json({ message: "Não foi possível deletar a partida." }, { status: 500 });
  }
}