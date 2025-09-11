import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');

    if (!torneioId) {
      return Response.json({});
    }

    console.log(`Buscando jogadores em destaque para torneio ${torneioId}`);

    // 1. Buscar modalidades do torneio através da relação TorneioModalidade ou Grupos
    const modalidades = await prisma.modalidade.findMany({
      where: {
        OR: [
          {
            torneioModalidades: {
              some: {
                torneioId: parseInt(torneioId)
              }
            }
          },
          {
            grupos: {
              some: {
                torneioId: parseInt(torneioId)
              }
            }
          }
        ]
      }
    });

    console.log(`Encontradas ${modalidades.length} modalidades para o torneio ${torneioId}:`, modalidades.map(m => m.nome));

    const jogadoresDestaque = {};

    // 2. Para cada modalidade, buscar os top 6 jogadores por gênero
    for (const modalidade of modalidades) {
      console.log(`Processando modalidade: ${modalidade.nome} (ID: ${modalidade.id})`);

      // Primeiro verificar se há partidas para esta modalidade
      const partidasModalidade = await prisma.partida.findMany({
        where: {
          torneioId: parseInt(torneioId),
          OR: [
            { modalidadeId: modalidade.id },
            { grupo: { modalidadeId: modalidade.id } }
          ]
        },
        select: {
          id: true,
          statusPartida: true,
          times: {
            include: {
              time: {
                select: { nome: true }
              }
            }
          }
        }
      });

      console.log(`Encontradas ${partidasModalidade.length} partidas para ${modalidade.nome}:`);
      partidasModalidade.forEach(p => {
        const timeNames = p.times.map(pt => pt.time.nome).join(' vs ');
        console.log(`  Partida ${p.id}: ${timeNames} - Status: ${p.statusPartida}`);
      });

      // Buscar estatísticas de todos os jogadores desta modalidade
      const estatisticas = await prisma.eventoPartida.findMany({
        where: {
          partida: {
            torneioId: parseInt(torneioId),
            // Aceitar diferentes variações do status finalizada
            statusPartida: {
              in: ['FINALIZADA', 'Finalizada', 'finalizada', 'Finalizado', 'FINALIZADO']
            },
            OR: [
              { modalidadeId: modalidade.id },
              { grupo: { modalidadeId: modalidade.id } }
            ]
          }
        },
        include: {
          jogador: {
            include: {
              times: {
                include: {
                  time: {
                    include: {
                      categoria: {
                        include: {
                          modalidade: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      console.log(`Encontrados ${estatisticas.length} eventos para ${modalidade.nome}`);

      // Agrupar por jogador e gênero
      const estatisticasPorJogador = {};
      
      estatisticas.forEach(evento => {
        const jogador = evento.jogador;
        
        // O jogador pode estar em vários times, vamos pegar o primeiro time que encontrarmos
        if (!jogador.times || jogador.times.length === 0) {
          console.log(`Jogador ${jogador.nome} não tem times associados`);
          return;
        }
        
        const timeJogador = jogador.times[0]; // Pegar o primeiro time
        const time = timeJogador.time;
        const genero = time.categoria.genero;
        const jogadorId = jogador.id;

        const chave = `${jogadorId}_${genero}`;

        if (!estatisticasPorJogador[chave]) {
          estatisticasPorJogador[chave] = {
            jogadorId: jogador.id,
            nome: jogador.nome,
            time: time.nome,
            genero: genero,
            pontosTotal: 0,
            eventos: []
          };
        }

        estatisticasPorJogador[chave].pontosTotal += evento.pontosGerados;
        estatisticasPorJogador[chave].eventos.push(evento.tipo);
      });

      // Separar por gênero e pegar top 3 de cada
      const masculino = Object.values(estatisticasPorJogador)
        .filter(j => j.genero === 'Masculino')
        .sort((a, b) => b.pontosTotal - a.pontosTotal)
        .slice(0, 3);

      const feminino = Object.values(estatisticasPorJogador)
        .filter(j => j.genero === 'Feminino')
        .sort((a, b) => b.pontosTotal - a.pontosTotal)
        .slice(0, 3);

      // Combinar e pegar top 6 geral
      const topJogadores = [...masculino, ...feminino]
        .sort((a, b) => b.pontosTotal - a.pontosTotal)
        .slice(0, 6)
        .map(jogador => ({
          name: `${jogador.nome} (${jogador.genero.charAt(0)})`, // Adicionar (M) ou (F)
          points: jogador.pontosTotal,
          team: jogador.time,
          gender: jogador.genero
        }));

      console.log(`Top jogadores para ${modalidade.nome}:`, topJogadores);

      // Normalizar nome da modalidade para match com o design
      const modalidadeNome = modalidade.nome.toLowerCase();
      let chaveModalidade = modalidadeNome;
      
      if (modalidadeNome.includes('futsal')) chaveModalidade = 'futsal';
      else if (modalidadeNome.includes('volei') || modalidadeNome.includes('vôlei')) chaveModalidade = 'volei';
      else if (modalidadeNome.includes('basquet')) chaveModalidade = 'basquete';
      else if (modalidadeNome.includes('hand')) chaveModalidade = 'handebol';

      console.log(`Modalidade ${modalidade.nome} mapeada para chave: ${chaveModalidade}`);

      if (topJogadores.length > 0) {
        jogadoresDestaque[chaveModalidade] = topJogadores;
      }
    }

    console.log('Resultado final dos jogadores em destaque:', jogadoresDestaque);

    return Response.json(jogadoresDestaque);

  } catch (error) {
    console.error('Erro ao buscar jogadores em destaque:', error);
    return Response.json({}, { status: 500 });
  }
}
