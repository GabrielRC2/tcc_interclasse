import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // A consulta original permanece a mesma.
    const jogadores = await prisma.jogadores.findMany({
      include: {
        participantes: {
          include: {
            time: true
          }
        }
      }
    });

    // Agora, vamos processar a lista de jogadores para formatar a resposta.
    // Usamos 'map' para criar um novo array com o formato desejado.
    const jogadoresFormatados = jogadores.map(jogador => {
      
      // O jogador pode pertencer a mais de um time, então pegamos o nome do primeiro time
      // Se a array de participantes estiver vazia, o nome do time será null.
      const nomeDoTime = jogador.participantes.length > 0 
        ? jogador.participantes[0].time.nome_time
        : null;

      // Opção 1: Formato "achatado"
      // Retorna um objeto com os dados principais e o nome do time no mesmo nível.
      return {
        id_jogador: jogador.id_jogador,
        nome_jogador: jogador.nome_jogador,
        camisa_jogador: jogador.camisa_jogador, // Note que no seu código o nome do campo é numero_camisa_jogador
        nome_time: nomeDoTime,
      };
    });

    return NextResponse.json(jogadoresFormatados, { status: 200 });

  } catch (error) {
    console.error("Erro ao buscar jogadores:", error);
    return NextResponse.json({ message: "Não foi possível buscar os jogadores." }, { status: 500 });
  }
}

// Rota POST: Cria um novo jogador e o vincula a um time
export async function POST(request) {
  try {
    const body = await request.json();
    const { nome_jogador, camisa_jogador, fk_id_times } = body;

    // 1. Validação
    if (!nome_jogador || !fk_id_times) {
      return NextResponse.json({ message: "Nome do jogador e ID do time são obrigatórios." }, { status: 400 });
    }

    // 2. Cria o jogador usando nested writes para a tabela de relacionamento
    const novoJogador = await prisma.jogadores.create({
      data: {
        nome_jogador,
        // O campo camisa_jogador agora é salvo como uma string
        camisa_jogador: camisa_jogador || null,
        participantes: {
            // Usa 'create' para criar um novo registro na tabela de relacionamento
            create: {
                time: {
                    connect: {
                        id_times: parseInt(fk_id_times, 10)
                    }
                }
            }
        }
      }
    });

    return NextResponse.json(novoJogador, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar jogador:", error);
    return NextResponse.json({ message: "Não foi possível criar o jogador e vincular ao time." }, { status: 500 });
  }
}