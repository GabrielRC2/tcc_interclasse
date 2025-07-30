import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const timeId = parseInt(params.id);
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
      number: timeJogador.numeroCamisa,
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