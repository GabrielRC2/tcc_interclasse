import { PrismaClient } from '@prisma/client';
import { obterClassificacao } from "@/utils/pontuacaoTorneio";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { torneioId, modalidadeId, genero } = await request.json();

    if (!torneioId || !modalidadeId || !genero) {
      return Response.json({ error: 'Parâmetros obrigatórios em falta' }, { status: 400 });
    }

    console.log('Gerando eliminatórias para:', { torneioId, modalidadeId, genero });

    // 1. Buscar classificação dos times
    const grupos = await prisma.grupo.findMany({
      where: {
        torneioId: parseInt(torneioId),
        modalidadeId: parseInt(modalidadeId)
      },
      include: {
        times: {
          include: {
            time: {
              include: {
                categoria: true
              }
            }
          },
          where: {
            time: {
              categoria: {
                genero: genero
              }
            }
          }
        }
      }
    });

    const gruposIds = grupos.map(g => g.id);
    
    const whereClause = {
      partida: {
        torneioId: parseInt(torneioId),
        grupoId: { in: gruposIds }
      }
    };

    const classificacao = await obterClassificacao(prisma, parseInt(torneioId), whereClause);

    if (classificacao.length === 0) {
      return Response.json({ error: 'Nenhuma classificação encontrada. Complete a fase de grupos primeiro.' }, { status: 404 });
    }

    // 2. Determinar quantos times classificar baseado no total
    const totalTimes = classificacao.length;
    let timesClassificados = Math.min(16, totalTimes); // Máximo 16 times

    if (totalTimes <= 4) {
      timesClassificados = totalTimes; // Todos classificam
    } else if (totalTimes <= 8) {
      timesClassificados = totalTimes; // Todos classificam
    } else {
      timesClassificados = 16; // Top 16
    }

    const classificados = classificacao.slice(0, timesClassificados);

    // 3. Remover eliminatórias existentes
    await prisma.partida.deleteMany({
      where: {
        torneioId: parseInt(torneioId),
        tipo: 'ELIMINATORIA',
        modalidadeId: parseInt(modalidadeId),
        genero: genero
      }
    });

    // 4. Determinar fase inicial
    let faseInicial;
    if (timesClassificados >= 9) {
      faseInicial = 'Oitavas de Final';
    } else if (timesClassificados >= 5) {
      faseInicial = 'Quartas de Final';
    } else if (timesClassificados === 4) {
      faseInicial = 'Semifinal';
    } else if (timesClassificados === 3) {
      faseInicial = 'Triangular Final';
    } else {
      faseInicial = 'Final';
    }

    // 5. Buscar local padrão
    const localPadrao = await prisma.local.findFirst();
    if (!localPadrao) {
      return Response.json({ error: 'Nenhum local encontrado' }, { status: 404 });
    }

    // 6. Criar partidas eliminatórias
    const partidasCriadas = [];
    let partidasGeradas = 0;

    if (faseInicial === 'Triangular Final') {
      // Caso especial: 3 times - criar 3 partidas triangulares
      const times = classificados;
      for (let i = 0; i < 3; i++) {
        const time1 = times[i % 3];
        const time2 = times[(i + 1) % 3];

        const partida = await prisma.partida.create({
          data: {
            torneioId: parseInt(torneioId),
            modalidadeId: parseInt(modalidadeId),
            genero: genero,
            localId: localPadrao.id,
            data: new Date(),
            horario: new Date(),
            status: 'AGENDADA',
            tipo: 'ELIMINATORIA',
            fase: faseInicial,
            ordem: i + 1
          }
        });

        // Criar relações com times
        await Promise.all([
          prisma.partidaTime.create({
            data: {
              partidaId: partida.id,
              timeId: time1.timeId,
              ehCasa: true
            }
          }),
          prisma.partidaTime.create({
            data: {
              partidaId: partida.id,
              timeId: time2.timeId,
              ehCasa: false
            }
          })
        ]);

        partidasGeradas++;
      }
    } else {
      // Chaveamento eliminatório tradicional
      for (let i = 0; i < classificados.length; i += 2) {
        if (i + 1 < classificados.length) {
          const time1 = classificados[i];
          const time2 = classificados[i + 1];

          const partida = await prisma.partida.create({
            data: {
              torneioId: parseInt(torneioId),
              modalidadeId: parseInt(modalidadeId),
              genero: genero,
              localId: localPadrao.id,
              data: new Date(),
              horario: new Date(),
              status: 'AGENDADA',
              tipo: 'ELIMINATORIA',
              fase: faseInicial,
              ordem: Math.floor(i / 2) + 1
            }
          });

          // Criar relações com times
          await Promise.all([
            prisma.partidaTime.create({
              data: {
                partidaId: partida.id,
                timeId: time1.timeId,
                ehCasa: true
              }
            }),
            prisma.partidaTime.create({
              data: {
                partidaId: partida.id,
                timeId: time2.timeId,
                ehCasa: false
              }
            })
          ]);

          partidasGeradas++;
        }
      }
    }

    console.log(`${partidasGeradas} partidas eliminatórias criadas com sucesso`);

    return Response.json({ 
      message: 'Eliminatórias geradas com sucesso!',
      partidasGeradas,
      faseInicial,
      timesClassificados: classificados.length
    });

  } catch (error) {
    console.error('Erro ao gerar eliminatórias:', error);
    return Response.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}
