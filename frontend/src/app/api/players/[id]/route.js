import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota GET: Retorna um jogador específico em um formato simplificado
export async function GET(request, { params }) {
  try {
    const { id } = await params; // Obtém o ID do jogador a partir dos parâmetros da requisição

    const idJogador = parseInt(id, 10); // Converte o ID para um número inteiro
    if (isNaN(idJogador)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    const jogador = await prisma.jogadores.findUnique({
      where: { id_jogador: idJogador },
      include: {
        participantes: {
          include: {
            time: true,
          },
        },
      },
    });

    if (!jogador) {
      return NextResponse.json({ message: "Jogador não encontrado." }, { status: 404 });
    }

    // Processa o resultado para retornar o JSON simplificado
    const nomeDoTime = jogador.participantes.length > 0
      ? jogador.participantes[0].time.nome_time
      : null;

    const jogadorFormatado = {
      id_jogador: jogador.id_jogador,
      nome_jogador: jogador.nome_jogador,
      camisa_jogador: jogador.camisa_jogador,
      nome_time: nomeDoTime,
    };

    return NextResponse.json(jogadorFormatado, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar jogador:", error);
    return NextResponse.json({ message: "Não foi possível buscar o jogador." }, { status: 500 });
  }
}

// Rota PATCH: Atualiza parcialmente os dados de um jogador
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const idJogador = parseInt(id, 10);
    if (isNaN(idJogador)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    const body = await request.json();
    
    // O Prisma automaticamente atualizará apenas os campos que estiverem no 'body'
    const updatedPlayer = await prisma.jogadores.update({
      where: { id_jogador: idJogador },
      data: body,
    });
    
    return NextResponse.json(updatedPlayer, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "Jogador não encontrado." }, { status: 404 });
    }
    console.error("Erro ao atualizar jogador:", error);
    return NextResponse.json({ message: "Não foi possível atualizar o jogador." }, { status: 500 });
  }
}

// Rota DELETE: Deleta um jogador
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const idJogador = parseInt(id, 10);
    if (isNaN(idJogador)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    const deletedPlayer = await prisma.jogadores.delete({
      where: { id_jogador: idJogador },
    });
    
    return NextResponse.json(deletedPlayer, { message: "Jogador deletado com sucesso." }, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "Jogador não encontrado." }, { status: 404 });
    }
    console.error("Erro ao deletar jogador:", error);
    return NextResponse.json({ message: "Não foi possível deletar o jogador." }, { status: 500 });
  }
}