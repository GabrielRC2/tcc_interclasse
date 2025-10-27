import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');
    const modalidadeId = searchParams.get('modalidadeId');
    const genero = searchParams.get('genero');

    if (!torneioId || !modalidadeId || !genero) {
      return Response.json([]);
    }

    // Buscar grupos com times da modalidade/gênero específicos
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
                curso: true,
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
      },
      orderBy: { nome: 'asc' }
    });

    // Gerar rodízio para cada grupo
    const chaveamento = grupos.map(grupo => {
      const times = grupo.times.map(gt => ({
        id: gt.time.id,
        nome: gt.time.nome,
        curso: gt.time.curso.sigla
      }));

      const partidas = gerarRodizio(times);
      
      return {
        grupo: grupo.nome,
        times: times,
        rodadas: partidas
      };
    });

    return Response.json(chaveamento);
  } catch (error) {
    console.error('Erro ao buscar chaveamento:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para gerar rodízio "todos contra todos"
function gerarRodizio(times) {
  if (times.length < 2) return [];
  
  const rodadas = [];
  const timesCopy = [...times];
  
  // Se número ímpar, adicionar "folga"
  if (timesCopy.length % 2 === 1) {
    timesCopy.push({ id: 'folga', nome: 'Folga', curso: '' });
  }
  
  const numRodadas = timesCopy.length - 1;
  
  for (let r = 0; r < numRodadas; r++) {
    const partidasRodada = [];
    
    for (let i = 0; i < timesCopy.length / 2; i++) {
      const time1 = timesCopy[i];
      const time2 = timesCopy[timesCopy.length - 1 - i];
      
      // Não incluir partidas com "folga"
      if (time1.id !== 'folga' && time2.id !== 'folga') {
        partidasRodada.push({
          time1: time1.nome,
          time2: time2.nome,
          time1Curso: time1.curso,
          time2Curso: time2.curso
        });
      }
    }
    
    if (partidasRodada.length > 0) {
      rodadas.push({
        numero: r + 1,
        partidas: partidasRodada
      });
    }
    
    // Rotacionar times (fixar o primeiro)
    const primeiro = timesCopy.shift();
    const segundo = timesCopy.shift();
    timesCopy.push(segundo);
    timesCopy.unshift(primeiro);
  }
  
  return rodadas;
}