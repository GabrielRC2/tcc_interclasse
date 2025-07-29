import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Importa o cliente Prisma para interagir com o banco de dados

export async function GET() {
  try {
    const times = await prisma.times.findMany({
      include: {
        
        participantes: {
          include: {
            // Inclui a tabela 'Jogador' que está relacionada via a tabela pivô 'Jogadores_times'
            jogador: {
              select: {
                nome_jogador: true,
              },
            },
          },
        },
      },
    });

    const timesFormatados = times.map(time => ({
      id_times: time.id_times,
      nome_time: time.nome_time,
      // Mapeia os participantes do time para extrair apenas os nomes dos jogadores
      nomes_participantes: time.participantes.map(
        p => p.jogador.nome_jogador 
      ),
    }));

    return NextResponse.json(timesFormatados, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar times e participantes:", error);
    return NextResponse.json(
      { message: "Não foi possível buscar os times e seus participantes." },
      { status: 500 }
    );
  }
}

/**
 * Objetivo: Criar um novo time no banco de dados.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { nome_time } = body;

    if (!nome_time) {
      return NextResponse.json({ message: "Nome do time é obrigatório." }, { status: 400 });
    }

    const novoTime = await prisma.times.create({
      data: {
        nome_time,
      },
    });

    return NextResponse.json(novoTime, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar time:", error);
    return NextResponse.json({ message: "Não foi possível criar o time." }, { status: 500 });
  }
}