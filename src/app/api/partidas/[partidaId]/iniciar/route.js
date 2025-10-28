import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { partidaId } = await params;

    // Verificar se a partida existe e se pode ser iniciada
    const partida = await prisma.partida.findUnique({
      where: { id: parseInt(partidaId) },
    });

    if (!partida) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 });
    }

    // Verificar se a partida não está finalizada
    if (partida.statusPartida === 'FINALIZADA') {
      return NextResponse.json({ error: 'Partida já foi finalizada' }, { status: 400 });
    }

    // Atualizar o status da partida para "EM_ANDAMENTO"
    const partidaAtualizada = await prisma.partida.update({
      where: { id: parseInt(partidaId) },
      data: {
        statusPartida: 'EM_ANDAMENTO',
      },
      include: {
        times: {
          include: {
            time: {
              include: {
                curso: true,
                categoria: {
                  include: {
                    modalidade: true
                  }
                }
              }
            }
          }
        },
        grupo: {
          include: {
            modalidade: true
          }
        },
        modalidade: true,
        local: true
      }
    });

    return NextResponse.json(partidaAtualizada, { status: 200 });
  } catch (error) {
    console.error('Erro ao iniciar partida:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}
