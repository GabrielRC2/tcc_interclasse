import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota GET: Retorna um grupo específico com seus detalhes relacionados, incluindo os nomes dos times
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const idGrupo = parseInt(id, 10);
    if (isNaN(idGrupo)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }
    const grupo = await prisma.grupos.findUnique({
      where: { id_grupo: idGrupo },
      include: {
        torneio: true,
        modalidade: true,
        categoria: true,
        inscricoes_no_grupo: { // Inclui as inscrições
            include: {
                time: true // E dentro das inscrições, inclui o time
            }
        },
        partidas_no_grupo: true,
      },
    });
    if (!grupo) {
      return NextResponse.json({ message: "Grupo não encontrado." }, { status: 404 });
    }

    // Formatação simplificada para um único grupo
    const nomesDosTimes = grupo.inscricoes_no_grupo.map(inscricao => inscricao.time.nome_time);

    const grupoFormatado = {
        id_grupo: grupo.id_grupo,
        nome_grupo: grupo.nome_grupo,
        nome_torneio: grupo.torneio.nome_torneio,
        nome_modalidade: grupo.modalidade.nome_modalidade,
        nome_categoria: grupo.categoria.nome_categoria,
        nomes_dos_times: nomesDosTimes, // Array com os nomes dos times
        quantidade_partidas: grupo.partidas_no_grupo.length,
        // ... adicione outros campos diretos se desejar
    };
    return NextResponse.json(grupoFormatado, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar grupo:", error);
    return NextResponse.json({ message: "Não foi possível buscar o grupo." }, { status: 500 });
  }
}

// Rota PATCH: Atualiza parcialmente um grupo
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const idGrupo = parseInt(id, 10);
    if (isNaN(idGrupo)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }
    const body = await request.json();
    
    const dataToUpdate = {};
    if (body.nome_grupo !== undefined) dataToUpdate.nome_grupo = body.nome_grupo;
    if (body.fk_id_torneio !== undefined) dataToUpdate.fk_id_torneio = parseInt(body.fk_id_torneio, 10);
    if (body.fk_id_modalidades !== undefined) dataToUpdate.fk_id_modalidades = parseInt(body.fk_id_modalidades, 10);
    if (body.fk_id_categoria !== undefined) dataToUpdate.fk_id_categoria = parseInt(body.fk_id_categoria, 10);

    const updatedGroup = await prisma.grupos.update({
      where: { id_grupo: idGrupo },
      data: dataToUpdate,
    });
    return NextResponse.json(updatedGroup, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') { return NextResponse.json({ message: "Grupo não encontrado." }, { status: 404 }); }
    console.error("Erro ao atualizar parcialmente grupo:", error);
    return NextResponse.json({ message: "Não foi possível atualizar o grupo." }, { status: 500 });
  }
}

// Rota DELETE: Deleta um grupo
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const idGrupo = parseInt(id, 10);
    if (isNaN(idGrupo)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }
    const deletedGroup = await prisma.grupos.delete({
      where: { id_grupo: idGrupo },
    });
    return NextResponse.json(deletedGroup, { message: "Grupo deletado com sucesso." }, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') { return NextResponse.json({ message: "Grupo não encontrado." }, { status: 404 }); }
    console.error("Erro ao deletar grupo:", error);
    return NextResponse.json({ message: "Não foi possível deletar o grupo." }, { status: 500 });
  }
}