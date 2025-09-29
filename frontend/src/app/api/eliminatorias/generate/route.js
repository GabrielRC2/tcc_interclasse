import { PrismaClient } from '@prisma/client';
import { obterClassificacao } from "@/utils/pontuacaoTorneio";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { torneioId, modalidadeId, genero, faseEscolhida } = await request.json();

    if (!torneioId || !modalidadeId || !genero) {
      return Response.json({ error: 'Parâmetros torneioId, modalidadeId e genero são obrigatórios' }, { status: 400 });
    }

    console.log('=== GERANDO ELIMINATÓRIAS ===');
    console.log('Torneio:', torneioId, 'Modalidade:', modalidadeId, 'Gênero:', genero, 'Fase escolhida:', faseEscolhida);

    // 1. Verificar fases eliminatórias já existentes
    const fasesExistentes = await verificarFasesExistentes(parseInt(torneioId), parseInt(modalidadeId), genero);
    console.log('Fases existentes:', fasesExistentes);

    // 2. Determinar a próxima fase a ser criada
    const proximaFase = determinarProximaFase(fasesExistentes, faseEscolhida);
    
    if (!proximaFase) {
      return Response.json({ error: 'Não é possível determinar a próxima fase ou todas as fases já foram criadas' }, { status: 400 });
    }

    console.log('Próxima fase a ser criada:', proximaFase);

    // 3. Obter times para a próxima fase
    let timesClassificados;
    
    if (fasesExistentes.length === 0) {
      // Primeira fase: usar classificação dos grupos
      timesClassificados = await obterTimesDoGrupo(parseInt(torneioId), parseInt(modalidadeId), genero, proximaFase);
    } else {
      // Fases subsequentes: usar vencedores da fase anterior
      const faseAnterior = fasesExistentes[fasesExistentes.length - 1];
      timesClassificados = await obterVencedoresDaFase(parseInt(torneioId), parseInt(modalidadeId), genero, faseAnterior);
      
      if (timesClassificados.length === 0) {
        return Response.json({ 
          error: `A fase "${faseAnterior}" ainda não foi finalizada. Complete todas as partidas antes de gerar a próxima fase.` 
        }, { status: 400 });
      }
    }

    if (timesClassificados.length < 2) {
      return Response.json({ error: 'Times insuficientes para gerar eliminatórias' }, { status: 400 });
    }

    // 4. Validar se há times suficientes para a fase
    const timesNecessarios = obterTimesNecessariosPorFase(proximaFase);
    if (timesClassificados.length < timesNecessarios) {
      return Response.json({ 
        error: `Para ${proximaFase} são necessários ${timesNecessarios} times, mas só há ${timesClassificados.length} disponíveis` 
      }, { status: 400 });
    }

    const timesParaFase = timesClassificados.slice(0, timesNecessarios);
    console.log(`Fase: ${proximaFase}, Times selecionados: ${timesParaFase.length}`);

    // 5. Criar partidas eliminatórias
    const partidasCriadas = await criarPartidasEliminatorias(
      parseInt(torneioId),
      parseInt(modalidadeId),
      genero,
      timesParaFase,
      proximaFase
    );

    return Response.json({
      message: `${proximaFase} gerada! ${partidasCriadas.length} partidas criadas`,
      fase: proximaFase,
      timesClassificados: timesParaFase.length,
      partidasCriadas: partidasCriadas.length,
      detalhes: {
        fasesExistentes: fasesExistentes,
        proximaFase: proximaFase,
        timesDisponiveis: timesClassificados.length
      }
    });

  } catch (error) {
    console.error('Erro ao gerar eliminatórias:', error);
    return Response.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}

// Função para verificar fases eliminatórias existentes
async function verificarFasesExistentes(torneioId, modalidadeId, genero) {
  const partidas = await prisma.partida.findMany({
    where: {
      torneioId: torneioId,
      modalidadeId: modalidadeId,
      genero: genero,
      tipo: 'ELIMINATORIA'
    },
    select: {
      fase: true
    },
    distinct: ['fase'],
    orderBy: {
      id: 'asc'
    }
  });

  return partidas.map(p => p.fase).filter(Boolean);
}

// Função para determinar a próxima fase
function determinarProximaFase(fasesExistentes, faseEscolhida) {
  const ordemFases = [
    'Oitavas de Final',
    'Quartas de Final', 
    'Semifinais',
    'Final'
  ];

  // Se não há fases existentes, usar a escolhida ou começar com a primeira apropriada
  if (fasesExistentes.length === 0) {
    return faseEscolhida || 'Quartas de Final';
  }

  // Se há fase escolhida e ela não existe, usar ela
  if (faseEscolhida && !fasesExistentes.includes(faseEscolhida)) {
    return faseEscolhida;
  }

  // Determinar próxima fase na sequência
  const ultimaFase = fasesExistentes[fasesExistentes.length - 1];
  const indiceUltimaFase = ordemFases.indexOf(ultimaFase);
  
  if (indiceUltimaFase === -1 || indiceUltimaFase === ordemFases.length - 1) {
    return null; // Não há próxima fase ou fase não reconhecida
  }

  return ordemFases[indiceUltimaFase + 1];
}

// Função para obter times necessários por fase
function obterTimesNecessariosPorFase(fase) {
  const limites = {
    'Oitavas de Final': 16,
    'Quartas de Final': 8,
    'Semifinais': 4,
    'Final': 2
  };
  
  return limites[fase] || 8;
}

// Função para obter times dos grupos (primeira fase)
async function obterTimesDoGrupo(torneioId, modalidadeId, genero, fase) {
  console.log(`[obterTimesDoGrupo] Buscando times para T:${torneioId} M:${modalidadeId} G:${genero}`);
  
  // 1. Primeiro, buscar TODOS os grupos da modalidade
  const todosGrupos = await prisma.grupo.findMany({
    where: {
      torneioId: torneioId,
      modalidadeId: modalidadeId
    },
    include: {
      times: {
        include: {
          time: {
            include: { categoria: true }
          }
        }
      }
    }
  });

  console.log(`[obterTimesDoGrupo] Encontrados ${todosGrupos.length} grupos na modalidade`);

  // 2. Filtrar apenas grupos que contêm times do gênero específico
  const gruposDoGenero = todosGrupos.filter(grupo => {
    const timesDoGenero = grupo.times.filter(gt => 
      gt.time.categoria.genero === genero
    );
    return timesDoGenero.length > 0; // Grupo tem pelo menos 1 time do gênero
  });

  console.log(`[obterTimesDoGrupo] Filtrados ${gruposDoGenero.length} grupos do gênero ${genero}`);

  if (gruposDoGenero.length === 0) {
    console.log(`[obterTimesDoGrupo] ERRO: Nenhum grupo encontrado para gênero ${genero}`);
    return [];
  }

  // 3. Para cada grupo válido, filtrar apenas os times do gênero correto
  const gruposLimpos = gruposDoGenero.map(grupo => ({
    ...grupo,
    times: grupo.times.filter(gt => gt.time.categoria.genero === genero)
  }));

  // 4. Obter classificação de cada grupo individualmente
  const timesClassificadosPorGrupo = [];
  
  for (const grupo of gruposLimpos) {
    console.log(`[obterTimesDoGrupo] Processando grupo ${grupo.nome} com ${grupo.times.length} times`);
    
    const whereClause = { partida: { grupoId: grupo.id } };
    const classificacaoGrupo = await obterClassificacao(prisma, torneioId, whereClause);
    
    // Filtrar classificação para incluir apenas times do gênero correto
    const classificacaoFiltrada = classificacaoGrupo.filter(time => {
      const timeObj = grupo.times.find(gt => gt.timeId === time.timeId);
      return timeObj && timeObj.time.categoria.genero === genero;
    });
    
    if (classificacaoFiltrada.length > 0) {
      timesClassificadosPorGrupo.push({
        grupo: grupo.nome,
        grupoId: grupo.id,
        classificacao: classificacaoFiltrada
      });
      console.log(`[obterTimesDoGrupo] Grupo ${grupo.nome}: ${classificacaoFiltrada.length} times classificados`);
    }
  }

  // 3. Selecionar times baseado na lógica: 1º de cada grupo, depois 2º de cada grupo, etc.
  const timesClassificados = selecionarTimesPorPosicao(timesClassificadosPorGrupo);
  
  console.log(`[obterTimesDoGrupo] RESULTADO FINAL: ${timesClassificados.length} times selecionados para ${genero}`);
  timesClassificados.forEach((time, i) => {
    console.log(`[obterTimesDoGrupo] ${i+1}º: ${time.nome} (${time.categoria || 'categoria?'})`);
  });
  
  return limitarTimesPorFase(timesClassificados, fase);
}

// Função para obter vencedores da fase anterior
async function obterVencedoresDaFase(torneioId, modalidadeId, genero, faseAnterior) {
  console.log(`Buscando vencedores da fase: ${faseAnterior}`);

  const partidas = await prisma.partida.findMany({
    where: {
      torneioId: torneioId,
      modalidadeId: modalidadeId,
      genero: genero,
      tipo: 'ELIMINATORIA',
      fase: faseAnterior,
      statusPartida: 'FINALIZADA'
    },
    include: {
      times: {
        include: {
          time: true
        }
      }
    }
  });

  console.log(`Encontradas ${partidas.length} partidas finalizadas da fase ${faseAnterior}`);

  const vencedores = [];
  
  for (const partida of partidas) {
    // Encontrar o vencedor da partida
    const timeVencedor = partida.times.find(pt => pt.resultado === 'VENCEDOR');
    
    if (timeVencedor) {
      vencedores.push({
        timeId: timeVencedor.timeId,
        nome: timeVencedor.time.nome,
        pontos: timeVencedor.pontosTorneio
      });
    }
  }

  console.log(`Vencedores encontrados: ${vencedores.map(v => v.nome).join(', ')}`);
  
  return vencedores;
}

// Função para selecionar times baseado na posição nos grupos
function selecionarTimesPorPosicao(timesClassificadosPorGrupo) {
  const timesClassificados = [];
  const maxPosicoesPorGrupo = Math.max(...timesClassificadosPorGrupo.map(g => g.classificacao.length));

  // Primeiro todos os 1º colocados, depois todos os 2º colocados, etc.
  for (let posicao = 0; posicao < maxPosicoesPorGrupo; posicao++) {
    for (const grupoData of timesClassificadosPorGrupo) {
      if (grupoData.classificacao[posicao]) {
        const time = grupoData.classificacao[posicao];
        timesClassificados.push({
          ...time,
          posicaoGrupo: posicao + 1,
          nomeGrupo: grupoData.grupo
        });
      }
    }
  }

  console.log('Times selecionados por posição:', timesClassificados.map(t => `${t.nome} (${t.posicaoGrupo}º do ${t.nomeGrupo})`));
  return timesClassificados;
}

// Função para determinar fase automaticamente
function determinarFaseAutomatica(numTimes) {
  if (numTimes >= 16) return 'Oitavas de Final';
  if (numTimes >= 8) return 'Quartas de Final';
  if (numTimes >= 4) return 'Semifinais';
  if (numTimes >= 2) return 'Final';
  return 'Final';
}

// Função para limitar times por fase
function limitarTimesPorFase(times, fase) {
  const limites = {
    'Oitavas de Final': 16,
    'Quartas de Final': 8,
    'Semifinais': 4,
    'Final': 2
  };
  
  const limite = limites[fase] || times.length;
  return times.slice(0, limite);
}

// Função para criar partidas eliminatórias
async function criarPartidasEliminatorias(torneioId, modalidadeId, genero, times, fase) {
  const partidasCriadas = [];
  const dataBase = new Date();

  // Buscar a maior ordem de partida existente no torneio para continuar a sequência
  const ultimaPartida = await prisma.partida.findFirst({
    where: { torneioId: torneioId },
    orderBy: { ordem: 'desc' },
    select: { ordem: true }
  });
  
  let proximaOrdem = ultimaPartida?.ordem ? ultimaPartida.ordem + 1 : 1;

  // Buscar todos os locais disponíveis para distribuir as partidas
  const locaisDisponiveis = await prisma.local.findMany({
    orderBy: { id: 'asc' }
  });

  if (locaisDisponiveis.length === 0) {
    throw new Error('Nenhum local disponível para criar partidas');
  }

  console.log(`Distribuindo partidas entre ${locaisDisponiveis.length} locais:`, 
              locaisDisponiveis.map(l => l.nome).join(', '));

  // Criar confrontos baseados na classificação
  for (let i = 0; i < times.length; i += 2) {
    if (i + 1 < times.length) {
      const time1 = times[i];
      const time2 = times[i + 1];

      console.log(`Criando partida: ${time1.nome} vs ${time2.nome}`);

      // Alternar entre os locais disponíveis
      const partidaIndex = Math.floor(i / 2);
      const localSelecionado = locaisDisponiveis[partidaIndex % locaisDisponiveis.length];
      
      console.log(`Partida ${partidaIndex + 1} será no local: ${localSelecionado.nome}`);
      
      const partida = await prisma.partida.create({
        data: {
          torneioId: torneioId,
          modalidadeId: modalidadeId,
          genero: genero,
          fase: fase,
          tipo: 'ELIMINATORIA',
          statusPartida: 'AGENDADA',
          dataHora: new Date(dataBase.getTime() + (i * 60 * 60 * 1000)), // Intervalos de 1 hora
          localId: localSelecionado.id,
          ordem: proximaOrdem++ // Adicionar ordem sequencial
        }
      });

      console.log(`Partida criada com ID: ${partida.id}`);

      // Criar registros partidaTime
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

      console.log(`PartidaTime criados para times ${time1.timeId} e ${time2.timeId}`);

      partidasCriadas.push(partida);
    }
  }

  return partidasCriadas;
}
