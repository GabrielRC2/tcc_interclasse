import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Importa o cliente Prisma para interagir com o banco de dados

/**
 * Função para lidar com requisições GET
 * Objetivo: Buscar todos os times do banco de dados, incluindo os nomes dos participantes.
 */
export async function GET() {
  try {
    const times = await prisma.times.findMany({
      include: {
        // CORRIGIDO: O nome do relacionamento no model Times é 'participantes'
        participantes: {
          include: {
            // Inclui o modelo 'Jogador' que está relacionado via a tabela pivô 'Jogadores_times'
            jogador: {
              select: {
                nome_jogador: true, // Seleciona apenas o nome do jogador
                // Adicione outros campos do jogador se precisar, ex: numero_camisa_jogador
              },
            },
          },
        },
      },
    });

    // Formata a resposta para incluir uma lista simples de nomes de participantes por time.
    const timesFormatados = times.map(time => ({
      id_times: time.id_times, // Note que o campo no banco é id_times
      nome_time: time.nome_time,
      // Mapeia os participantes do time para extrair apenas os nomes dos jogadores
      nomes_participantes: time.participantes.map(
        // Aqui 'p' é um registro da tabela Jogadores_times
        p => p.jogador.nome_jogador // Acessa o jogador relacionado e seu nome
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
 * Função para lidar com requisições POST
 * Objetivo: Criar um novo time no banco de dados.
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Mudança aqui: Pegamos apenas o nome_time do corpo da requisição.
    const { nome_time } = body;

    // 2. Mudança aqui: Validamos apenas se o nome_time foi enviado.
    if (!nome_time) {
      return NextResponse.json({ message: "Nome do time é obrigatório." }, { status: 400 });
    }

    // 3. Mudança aqui: Criamos o time no banco de dados apenas com o nome_time.
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