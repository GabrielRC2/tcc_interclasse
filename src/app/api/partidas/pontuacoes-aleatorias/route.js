import { PrismaClient } from '@prisma/client';
import { atualizarPontuacaoTorneio } from "@/utils/pontuacaoTorneio";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { torneioId } = await request.json();

    if (!torneioId) {
      return Response.json({ error: 'ID do torneio é obrigatório' }, { status: 400 });
    }

    console.log('=== GERANDO PONTUAÇÕES REALISTAS COM EVENTOS ===');
    console.log('Torneio ID:', torneioId);

    // Buscar partidas agendadas com times e jogadores
    const partidas = await prisma.partida.findMany({
      where: {
        torneioId: parseInt(torneioId),
        statusPartida: 'AGENDADA'
      },
      include: {
        times: {
          include: {
            time: {
              include: {
                jogadores: {
                  include: {
                    jogador: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`Encontradas ${partidas.length} partidas agendadas`);

    if (partidas.length === 0) {
      return Response.json({ error: 'Nenhuma partida agendada encontrada' }, { status: 404 });
    }

    let partidasFinalizadas = 0;

    for (const partida of partidas) {
      try {
        console.log(`Processando partida ${partida.id}`);

        // Verificar se há times suficientes
        if (partida.times.length < 2) {
          console.log(`Partida ${partida.id} não tem times suficientes, pulando`);
          continue;
        }

        const time1 = partida.times.find(pt => pt.ehCasa);
        const time2 = partida.times.find(pt => !pt.ehCasa);

        if (!time1 || !time2) {
          console.log(`Partida ${partida.id} não tem times definidos corretamente, pulando`);
          continue;
        }

        console.log(`Time 1 (${time1.time.nome}): ${time1.time.jogadores.length} jogadores`);
        console.log(`Time 2 (${time2.time.nome}): ${time2.time.jogadores.length} jogadores`);

        // Gerar pontuação realista (0-4 gols é mais comum)
        const pontosCasa = Math.floor(Math.random() * 5);
        const pontosVisitante = Math.floor(Math.random() * 5);

        console.log(`Partida ${partida.id}: ${time1.time.nome} ${pontosCasa} x ${pontosVisitante} ${time2.time.nome}`);

        // Gerar eventos individuais dos jogadores
        await gerarEventosJogadores(partida, time1, pontosCasa, 'casa');
        await gerarEventosJogadores(partida, time2, pontosVisitante, 'visitante');

        // Atualizar a partida com resultado
        await prisma.partida.update({
          where: { id: partida.id },
          data: {
            statusPartida: 'FINALIZADA',
            pontosCasa: pontosCasa,
            pontosVisitante: pontosVisitante
          }
        });

        // Atualizar pontuação do torneio (vitórias, empates, derrotas)
        await atualizarPontuacaoTorneio(prisma, partida.id, pontosCasa, pontosVisitante);

        partidasFinalizadas++;

      } catch (error) {
        console.error(`Erro ao processar partida ${partida.id}:`, error);
      }
    }

    console.log(`${partidasFinalizadas} partidas finalizadas com eventos reais`);

    return Response.json({
      message: `${partidasFinalizadas} partidas finalizadas com eventos dos jogadores`,
      partidasFinalizadas,
      detalhes: 'Partidas finalizadas com eventos individuais e pontuação do torneio atualizada'
    });

  } catch (error) {
    console.error('Erro ao gerar pontuações:', error);
    return Response.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}

// Função para gerar eventos realistas dos jogadores
async function gerarEventosJogadores(partida, partidaTime, totalPontos, lado) {
  console.log(`🎯 gerarEventosJogadores - Partida: ${partida.id}, Time: ${partidaTime.time.nome}, Pontos: ${totalPontos}, Lado: ${lado}`);
  
  if (totalPontos === 0) {
    console.log(`❌ Não há pontos para gerar eventos`);
    return; // Não gerar eventos se não há pontos
  }

  const jogadores = partidaTime.time.jogadores;
  console.log(`👥 Jogadores disponíveis: ${jogadores.length}`);
  
  if (jogadores.length === 0) {
    console.log(`❌ Time ${partidaTime.time.nome} não tem jogadores!`);
    return;
  }

  console.log(`🎲 Gerando ${totalPontos} eventos para ${partidaTime.time.nome} (${jogadores.length} jogadores)`);

  // Distribuir os pontos entre os jogadores de forma realista
  for (let i = 0; i < totalPontos; i++) {
    // Escolher jogador aleatório
    const jogadorIndex = Math.floor(Math.random() * jogadores.length);
    const jogadorData = jogadores[jogadorIndex];
    const jogador = jogadorData.jogador; // Acessar o jogador através da relação

    // Determinar tipo de evento baseado na modalidade
    const tipoEvento = obterTipoEventoPorModalidade(partida.modalidadeId);

    console.log(`🏃 Tentando criar evento para jogador: ${jogador.nome} (ID: ${jogador.id}) - Tipo: ${tipoEvento}`);

    try {
      const evento = await prisma.eventoPartida.create({
        data: {
          partidaId: partida.id,
          jogadorId: jogador.id,
          tipo: tipoEvento,
          pontosGerados: 1 // Cada evento vale 1 ponto
        }
      });

      console.log(`✅ Evento criado: ID ${evento.id} - ${jogador.nome} - ${tipoEvento}`);
    } catch (error) {
      console.error(`❌ Erro ao criar evento para jogador ${jogador.nome}:`, error);
    }
  }
}

// Função para determinar tipo de evento baseado na modalidade
function obterTipoEventoPorModalidade(modalidadeId) {
  // Mapear modalidades para tipos de eventos
  // Por simplicidade, usando 'Gol' como padrão
  // Você pode expandir isso baseado nas modalidades
  const tiposEventos = ['Gol', 'Ponto', 'Cesta', 'Ace'];
  return tiposEventos[0]; // Por enquanto sempre 'Gol'
}
