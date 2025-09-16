import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const timeId = parseInt(id);

    const jogadoresDoTime = await prisma.timeJogador.findMany({
      where: { timeId },
      include: {
        jogador: {
          include: { curso: true }
        }
      }
    });

    const formattedJogadores = jogadoresDoTime.map(tj => ({
      id: tj.jogador.id,
      nome: tj.jogador.nome,
      numeroCamisa: tj.numeroCamisa, // <-- aqui!
      curso: tj.jogador.curso?.nome || '',
      sala: tj.jogador.sala
    }));

    return NextResponse.json(formattedJogadores);
  } catch (error) {
    console.error('Erro ao buscar jogadores do time:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const {id} = await params;
    const timeId = parseInt(id);
    const data = await request.json();

    console.log('Adicionando jogador ao time:', { timeId, data });

    // Verificar se o número da camisa já existe no time
    const existingPlayer = await prisma.timeJogador.findFirst({
      where: {
        timeId: timeId,
        numeroCamisa: parseInt(data.numeroCamisa)
      }
    });

    if (existingPlayer) {
      return Response.json(
        { error: 'Número da camisa já está em uso neste time' },
        { status: 400 }
      );
    }

    // Verificar se o jogador já está no time
    const playerInTeam = await prisma.timeJogador.findFirst({
      where: {
        timeId: timeId,
        jogadorId: data.jogadorId
      }
    });

    if (playerInTeam) {
      return Response.json(
        { error: 'Jogador já está neste time' },
        { status: 400 }
      );
    }

    // Adicionar jogador ao time
    const timeJogador = await prisma.timeJogador.create({
      data: {
        timeId: timeId,
        jogadorId: data.jogadorId,
        numeroCamisa: parseInt(data.numeroCamisa)
      },
      include: {
        jogador: {
          include: {
            curso: true
          }
        }
      }
    });

    const jogadorFormatted = {
      id: timeJogador.jogador.id,
      name: timeJogador.jogador.nome,
      numero: timeJogador.numeroCamisa, // Usar 'numero' para consistência
      genero: timeJogador.jogador.genero,
      sala: timeJogador.jogador.sala,
      course: timeJogador.jogador.curso.nome,
      points: 0,
      red: 0,
      yellow: 0
    };

    return Response.json(jogadorFormatted, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar jogador ao time:', error);
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const timeId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const jogadorId = searchParams.get('jogadorId');

    if (!jogadorId) {
      return Response.json({ error: 'jogadorId é obrigatório' }, { status: 400 });
    }

    // Verificar se o jogador está no time
    const timeJogador = await prisma.timeJogador.findFirst({
      where: {
        timeId: timeId,
        jogadorId: parseInt(jogadorId)
      }
    });

    if (!timeJogador) {
      return Response.json({ error: 'Jogador não encontrado neste time' }, { status: 404 });
    }

    // Remover jogador do time
    await prisma.timeJogador.delete({
      where: {
        timeId_jogadorId: {
          timeId: timeId,
          jogadorId: parseInt(jogadorId)
        }
      }
    });

    return Response.json({ message: 'Jogador removido do time com sucesso' });
  } catch (error) {
    console.error('Erro ao remover jogador do time:', error);
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const timeId = parseInt(id);
    const data = await request.json();
    const { jogadorId, numeroCamisa } = data;

    if (!jogadorId || !numeroCamisa) {
      return Response.json({ error: 'jogadorId e numeroCamisa são obrigatórios' }, { status: 400 });
    }

    // Verificar se o número da camisa já existe no time (exceto para este jogador)
    const existingPlayer = await prisma.timeJogador.findFirst({
      where: {
        timeId: timeId,
        numeroCamisa: parseInt(numeroCamisa),
        jogadorId: { not: parseInt(jogadorId) }
      }
    });

    if (existingPlayer) {
      return Response.json(
        { error: 'Número da camisa já está em uso por outro jogador neste time' },
        { status: 400 }
      );
    }

    // Atualizar número da camisa
    const timeJogador = await prisma.timeJogador.update({
      where: {
        timeId_jogadorId: {
          timeId: timeId,
          jogadorId: parseInt(jogadorId)
        }
      },
      data: {
        numeroCamisa: parseInt(numeroCamisa)
      },
      include: {
        jogador: {
          include: {
            curso: true
          }
        }
      }
    });

    const jogadorFormatted = {
      id: timeJogador.jogador.id,
      name: timeJogador.jogador.nome,
      numero: timeJogador.numeroCamisa,
      genero: timeJogador.jogador.genero,
      sala: timeJogador.jogador.sala,
      course: timeJogador.jogador.curso.nome
    };

    return Response.json(jogadorFormatted);
  } catch (error) {
    console.error('Erro ao editar jogador:', error);
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}