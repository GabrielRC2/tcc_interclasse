import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { processarWO, calcularPontosTorneio } from "@/utils/pontuacaoTorneio";

export async function POST(request, { params }) {
  try {
    const { partidaId } = await params;
    const id = parseInt(partidaId);
    const { timeWOId } = await request.json();

    if (isNaN(id) || !timeWOId) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Buscar a partida para obter informações dos times
    const partida = await prisma.partida.findUnique({
      where: { id: id },
      include: {
        times: {
          include: {
            time: true
          }
        }
      }
    });

    if (!partida) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
    }

    // Verificar se o time WO é um dos times da partida
    const timeWO = partida.times.find(pt => pt.timeId === timeWOId);
    const timeVencedor = partida.times.find(pt => pt.timeId !== timeWOId);

    if (!timeWO || !timeVencedor) {
      return NextResponse.json({ error: "Time inválido para esta partida" }, { status: 400 });
    }

    // Usar transação para atualizar os resultados
    const resultado = await prisma.$transaction(async (tx) => {
      // Processar WO na partida atual
      const resultadoWO = await processarWO(tx, id, timeWOId);

      // Atualizar a partida com pontos 0x0 (não há jogo efetivo)
      await tx.partida.update({
        where: { id: id },
        data: {
          statusPartida: 'FINALIZADA',
          pontosCasa: 0, // Não houve jogo, pontos da súmula = 0
          pontosVisitante: 0 // Não houve jogo, pontos da súmula = 0
        }
      });

      // Buscar todas as outras partidas do time que deu WO no mesmo torneio
      const outrasPartidas = await tx.partida.findMany({
        where: {
          torneioId: partida.torneioId,
          times: {
            some: {
              timeId: timeWOId
            }
          },
          statusPartida: {
            in: ['AGENDADA', 'EM_ANDAMENTO']
          },
          id: {
            not: id
          }
        },
        include: {
          times: true
        }
      });

      // Marcar todas as outras partidas como finalizadas com vitória do adversário
      for (const outraPartida of outrasPartidas) {
        const timeAdversario = outraPartida.times.find(pt => pt.timeId !== timeWOId);
        const timeWONaPartida = outraPartida.times.find(pt => pt.timeId === timeWOId);
        
        if (timeAdversario && timeWONaPartida) {
          // Atualizar status da partida - pontos 0x0 (WO, não há jogo)
          await tx.partida.update({
            where: { id: outraPartida.id },
            data: {
              statusPartida: 'FINALIZADA',
              pontosCasa: 0, // Não houve jogo
              pontosVisitante: 0 // Não houve jogo
            }
          });

          // Atualizar resultado do time WO como PERDEDOR (nas outras partidas)
          await tx.partidaTime.update({
            where: {
              partidaId_timeId: {
                partidaId: outraPartida.id,
                timeId: timeWOId
              }
            },
            data: { 
              resultado: 'PERDEDOR',
              pontosTorneio: calcularPontosTorneio('PERDEDOR') // 0 pontos
            }
          });

          // Atualizar resultado do time adversário como VENCEDOR
          await tx.partidaTime.update({
            where: {
              partidaId_timeId: {
                partidaId: outraPartida.id,
                timeId: timeAdversario.timeId
              }
            },
            data: { 
              resultado: 'VENCEDOR',
              pontosTorneio: calcularPontosTorneio('VENCEDOR') // 3 pontos
            }
          });
        }
      }

      return {
        partidasAfetadas: outrasPartidas.length + 1,
        timeWO: resultadoWO.timeWO,
        timeVencedor: resultadoWO.timeVencedor
      };
    });

    return NextResponse.json({
      message: `WO registrado com sucesso. ${resultado.partidasAfetadas} partida(s) afetada(s).`,
      ...resultado
    });

  } catch (error) {
    console.error("Erro ao registrar WO:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}
