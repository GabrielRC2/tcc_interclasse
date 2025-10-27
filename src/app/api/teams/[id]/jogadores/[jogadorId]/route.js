import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// PUT - Editar jogador do time (nome e número da camisa)
export async function PUT(request, { params }) {
  try {
    const { id, jogadorId } = await params;
    const timeId = parseInt(id);
    const playerId = parseInt(jogadorId);
    const data = await request.json();

    console.log('Editando jogador:', { timeId, playerId, data });

    // Verificar se o jogador está no time
    const timeJogador = await prisma.timeJogador.findFirst({
      where: {
        timeId: timeId,
        jogadorId: playerId
      }
    });

    if (!timeJogador) {
      return NextResponse.json(
        { error: 'Jogador não encontrado neste time' },
        { status: 404 }
      );
    }

    // Se está mudando o número da camisa, verificar se já existe
    if (data.numero && data.numero !== timeJogador.numeroCamisa) {
      const existingNumber = await prisma.timeJogador.findFirst({
        where: {
          timeId: timeId,
          numeroCamisa: parseInt(data.numero),
          jogadorId: { not: playerId }
        }
      });

      if (existingNumber) {
        return NextResponse.json(
          { error: 'Número da camisa já está em uso neste time' },
          { status: 400 }
        );
      }
    }

    // Atualizar nome do jogador se fornecido
    if (data.name) {
      await prisma.jogador.update({
        where: { id: playerId },
        data: { nome: data.name }
      });
    }

    // Atualizar número da camisa se fornecido
    if (data.numero) {
      await prisma.timeJogador.update({
        where: {
          timeId_jogadorId: {
            timeId: timeId,
            jogadorId: playerId
          }
        },
        data: { numeroCamisa: parseInt(data.numero) }
      });
    }

    return NextResponse.json({ message: 'Jogador editado com sucesso' });
  } catch (error) {
    console.error('Erro ao editar jogador:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover jogador do time
export async function DELETE(request, { params }) {
  try {
    const { id, jogadorId } = await params;
    const timeId = parseInt(id);
    const playerId = parseInt(jogadorId);

    console.log('Removendo jogador do time:', { timeId, playerId });

    // Verificar se o jogador está no time
    const timeJogador = await prisma.timeJogador.findFirst({
      where: {
        timeId: timeId,
        jogadorId: playerId
      }
    });

    if (!timeJogador) {
      return NextResponse.json(
        { error: 'Jogador não encontrado neste time' },
        { status: 404 }
      );
    }

    // Remover jogador do time
    await prisma.timeJogador.delete({
      where: {
        timeId_jogadorId: {
          timeId: timeId,
          jogadorId: playerId
        }
      }
    });

    return NextResponse.json({ message: 'Jogador removido do time com sucesso' });
  } catch (error) {
    console.error('Erro ao remover jogador do time:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
