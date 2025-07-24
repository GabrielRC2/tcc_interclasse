import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota GET: Retorna uma inscrição específica com seus detalhes relacionados
export async function GET(request, { params }) {
  try {
    const {id} = await params;
    const idInscricao = parseInt(id, 10);
    if (isNaN(idInscricao)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }
    const inscricao = await prisma.inscricoes.findUnique({
      where: { id_inscricao: idInscricao },
      include: {
        torneio: true,
        time: true,
        modalidade: true,
        categoria: true,
        grupo: true,
        partidas_jogadas: {
            include: {
                partida: true
            }
        }
      }
    });
    if (!inscricao) {
      return NextResponse.json({ message: "Inscrição não encontrada." }, { status: 404 });
    }

    // Opcional: Você pode aplicar a mesma lógica de formatação de JSON aqui para o GET ALL
    const inscricoesFormatadas = inscricao.map(inscricao => {
      const nomeDoGrupo = inscricao.grupo ? inscricao.grupo.nome_grupo : null;
      const partidasFormatadas = inscricao.partidas_jogadas.map(pj => ({
        id_partida: pj.partida.id_partidas,
        status_partida: pj.partida.status_partida,
        identificador_time: pj.identificador_time
        // Adicione outros campos da partida se necessário
      }));

      return {
        id_inscricao: inscricao.id_inscricao,
        nome_torneio: inscricao.torneio.nome_torneio,
        nome_time: inscricao.time.nome_time,
        nome_modalidade: inscricao.modalidade.nome_modalidade,
        nome_categoria: inscricao.categoria.nome_categoria,
        nome_grupo: nomeDoGrupo, // Será null se não tiver grupo
        partidas_jogadas: partidasFormatadas, // Array de partidas simplificada
      };
    });

    return NextResponse.json(inscricoesFormatadas, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar inscrição:", error);
    return NextResponse.json({ message: "Não foi possível buscar a inscrição." }, { status: 500 });
  }
}

// Rota PUT: Atualiza uma inscrição por completo
export async function PUT(request, { params }) {
  try {

    const {id} = await params;
    const idInscricao = parseInt(id, 10);
    if (isNaN(idInscricao)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }
    const body = await request.json();
    const { fk_id_torneio, fk_id_times, fk_id_modalidades, fk_id_categoria, fk_id_grupo } = body;
    
    // Validação de todos os campos obrigatórios para PUT
    if (!fk_id_torneio || !fk_id_times || !fk_id_modalidades || !fk_id_categoria) {
        return NextResponse.json({ message: "Todos os IDs (torneio, time, modalidade, categoria) são obrigatórios para PUT." }, { status: 400 });
    }

    const updatedEntry = await prisma.inscricoes.update({
      where: { id_inscricao: idInscricao },
      data: {
        fk_id_torneio: parseInt(fk_id_torneio, 10),
        fk_id_times: parseInt(fk_id_times, 10),
        fk_id_modalidades: parseInt(fk_id_modalidades, 10),
        fk_id_categoria: parseInt(fk_id_categoria, 10),
        fk_id_grupo: fk_id_grupo ? parseInt(fk_id_grupo, 10) : null,
      },
    });
    return NextResponse.json(updatedEntry, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "Inscrição não encontrada." }, { status: 404 });
    }
    console.error("Erro ao atualizar inscrição:", error);
    return NextResponse.json({ message: "Não foi possível atualizar a inscrição." }, { status: 500 });
  }
}

// Rota PATCH: Atualiza parcialmente uma inscrição
export async function PATCH(request, { params }) {
  try {

    const {id} = await params;
    const idInscricao = parseInt(id, 10);
    if (isNaN(idInscricao)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }
    const body = await request.json();
    
    // Converte os IDs do corpo para inteiros se existirem
    const dataToUpdate = {};
    if (body.fk_id_torneio !== undefined) dataToUpdate.fk_id_torneio = parseInt(body.fk_id_torneio, 10);
    if (body.fk_id_times !== undefined) dataToUpdate.fk_id_times = parseInt(body.fk_id_times, 10);
    if (body.fk_id_modalidades !== undefined) dataToUpdate.fk_id_modalidades = parseInt(body.fk_id_modalidades, 10);
    if (body.fk_id_categoria !== undefined) dataToUpdate.fk_id_categoria = parseInt(body.fk_id_categoria, 10);
    if (body.fk_id_grupo !== undefined) dataToUpdate.fk_id_grupo = body.fk_id_grupo ? parseInt(body.fk_id_grupo, 10) : null;

    const updatedEntry = await prisma.inscricoes.update({
      where: { id_inscricao: idInscricao },
      data: dataToUpdate,
    });
    return NextResponse.json(updatedEntry, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "Inscrição não encontrada." }, { status: 404 });
    }
    console.error("Erro ao atualizar parcialmente inscrição:", error);
    return NextResponse.json({ message: "Não foi possível atualizar a inscrição." }, { status: 500 });
  }
}

// Rota DELETE: Deleta uma inscrição
export async function DELETE(request, { params }) {
  try {
    const idInscricao = parseInt(params.id, 10);
    if (isNaN(idInscricao)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }
    const deletedInscricao = await prisma.inscricoes.delete({
      where: { id_inscricao: idInscricao },
    });
    return NextResponse.json(deletedInscricao, { message: "Inscrição deletada com sucesso." }, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "Inscrição não encontrada." }, { status: 404 });
    }
    console.error("Erro ao deletar inscrição:", error);
    return NextResponse.json({ message: "Não foi possível deletar a inscrição." }, { status: 500 });
  }
}