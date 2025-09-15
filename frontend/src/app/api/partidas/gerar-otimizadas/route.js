import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { torneioId, configuracaoLocais } = await request.json();

    if (!torneioId) {
      return Response.json({ error: 'Torneio é obrigatório' }, { status: 400 });
    }

    console.log('🚀 Iniciando geração otimizada de partidas...');
    console.log('📍 Configuração de locais recebida:', configuracaoLocais);

    // 1. Buscar TODOS os grupos do torneio
    const grupos = await prisma.grupo.findMany({
      where: { torneioId: parseInt(torneioId) },
      include: {
        modalidade: true,
        times: {
          include: {
            time: {
              include: {
                categoria: true,
                curso: true
              }
            }
          }
        }
      }
    });

    if (grupos.length === 0) {
      return Response.json({ error: 'Nenhum grupo encontrado. Realize os sorteios primeiro.' }, { status: 404 });
    }

    // 2. Buscar locais
    const locais = await prisma.local.findMany();
    const localMap = {};
    locais.forEach(local => localMap[local.nome] = local.id);

    // 3. Limpar partidas existentes
    await prisma.partidaTime.deleteMany({
      where: {
        partida: {
          torneioId: parseInt(torneioId)
        }
      }
    });

    await prisma.partida.deleteMany({
      where: { torneioId: parseInt(torneioId) }
    });

    console.log('🧹 Partidas antigas removidas');

    // 4. Gerar TODAS as partidas de TODAS as modalidades
    const todasPartidas = [];
    
    for (const grupo of grupos) {
      const times = grupo.times.map(gt => gt.time);
      
      if (times.length < 2) continue;

      const partidasGrupo = gerarRodizioPartidas(times, grupo);
      todasPartidas.push(...partidasGrupo);
    }

    console.log(`📊 Total de partidas geradas: ${todasPartidas.length}`);

    // 5. ALGORITMO DE OTIMIZAÇÃO GLOBAL (TODAS MODALIDADES JUNTAS)
    const partidasOtimizadas = otimizarPartidasGlobalmente(todasPartidas, configuracaoLocais, localMap);

    console.log('🤖 Otimização global concluída');

    // 6. Salvar partidas no banco
    const partidasCriadas = [];
    
    for (let i = 0; i < partidasOtimizadas.length; i++) {
      const partida = partidasOtimizadas[i];
      
      // Criar partida
      const novaPartida = await prisma.partida.create({
        data: {
          dataHora: new Date(Date.now() + (partida.slot * 30 * 60 * 1000)), // Slots de 30min
          statusPartida: 'AGENDADA',
          grupoId: partida.grupoId,
          localId: partida.localId,
          torneioId: parseInt(torneioId),
          modalidadeId: partida.modalidadeId,
          genero: partida.genero,
          ordem: i + 1, // Adicionar a ordem da partida
        }
      });

      // Criar relações com times
      await Promise.all([
        prisma.partidaTime.create({
          data: {
            partidaId: novaPartida.id,
            timeId: partida.time1Id,
            ehCasa: true
          }
        }),
        prisma.partidaTime.create({
          data: {
            partidaId: novaPartida.id,
            timeId: partida.time2Id,
            ehCasa: false
          }
        })
      ]);

      partidasCriadas.push(novaPartida);
    }

    console.log(`✅ ${partidasCriadas.length} partidas criadas com sucesso`);

    return Response.json({ 
      message: 'Partidas otimizadas geradas com sucesso!',
      partidasGeradas: partidasCriadas.length,
      slots: Math.max(...partidasOtimizadas.map(p => p.slot)) + 1,
      modalidades: [...new Set(todasPartidas.map(p => p.modalidade))].length
    });

  } catch (error) {
    console.error('❌ Erro ao gerar partidas otimizadas:', error);
    return Response.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}

// Gerar partidas rodízio para um grupo
function gerarRodizioPartidas(times, grupo) {
  const partidas = [];
  const timesCopy = [...times];

  if (timesCopy.length % 2 === 1) {
    timesCopy.push(null); // Folga
  }

  const numRodadas = timesCopy.length - 1;

  for (let r = 0; r < numRodadas; r++) {
    for (let i = 0; i < timesCopy.length / 2; i++) {
      const time1 = timesCopy[i];
      const time2 = timesCopy[timesCopy.length - 1 - i];

      if (time1 && time2) {
        partidas.push({
          time1Id: time1.id,
          time2Id: time2.id,
          time1Nome: time1.nome,
          time2Nome: time2.nome,
          grupoId: grupo.id,
          modalidade: grupo.modalidade.nome,
          modalidadeId: grupo.modalidadeId,
          genero: time1.categoria.genero,
          rodada: r + 1
        });
      }
    }

    // Rotacionar times
    const primeiro = timesCopy.shift();
    const segundo = timesCopy.shift();
    timesCopy.push(segundo);
    timesCopy.unshift(primeiro);
  }

  return partidas;
}

// ALGORITMO DE OTIMIZAÇÃO GLOBAL - SEMPRE UM JOGO MASCULINO E UM FEMININO
function otimizarPartidasGlobalmente(partidas, configuracaoLocais, localMap) {
  console.log('🤖 Iniciando otimização global de partidas...');
  console.log('⚽ Regra: Sempre um jogo masculino e um feminino por slot');

  // Separar partidas por gênero
  const partidasMasculinas = partidas.filter(p => p.genero === 'Masculino');
  const partidasFemininas = partidas.filter(p => p.genero === 'Feminino');

  console.log(`👨 Partidas masculinas: ${partidasMasculinas.length}`);
  console.log(`👩 Partidas femininas: ${partidasFemininas.length}`);

  // Controle de times e último jogo
  const times = new Set();
  partidas.forEach(p => {
    times.add(p.time1Id);
    times.add(p.time2Id);
  });

  const ultimaPartidaTime = {};
  times.forEach(timeId => ultimaPartidaTime[timeId] = -1);

  const slots = [];
  let slotAtual = 0;

  // ALGORITMO: SEMPRE 1 MASCULINO + 1 FEMININO POR SLOT
  while (partidasMasculinas.length > 0 || partidasFemininas.length > 0) {
    const slot = {
      numero: slotAtual,
      partidas: []
    };

    // Primeira partida: Masculina ou Feminina (a que tiver mais disponível)
    let primeiraPartida = null;
    let segundaPartida = null;

    if (partidasMasculinas.length > 0 && partidasFemininas.length > 0) {
      // Escolher a que tem mais jogos pendentes para balancear
      if (partidasMasculinas.length >= partidasFemininas.length) {
        primeiraPartida = escolherMelhorPartida(partidasMasculinas, ultimaPartidaTime, slotAtual);
        segundaPartida = escolherMelhorPartida(partidasFemininas, ultimaPartidaTime, slotAtual);
      } else {
        primeiraPartida = escolherMelhorPartida(partidasFemininas, ultimaPartidaTime, slotAtual);
        segundaPartida = escolherMelhorPartida(partidasMasculinas, ultimaPartidaTime, slotAtual);
      }
    } else if (partidasMasculinas.length > 0) {
      // Só masculinas restantes
      primeiraPartida = escolherMelhorPartida(partidasMasculinas, ultimaPartidaTime, slotAtual);
    } else if (partidasFemininas.length > 0) {
      // Só femininas restantes
      primeiraPartida = escolherMelhorPartida(partidasFemininas, ultimaPartidaTime, slotAtual);
    }

    // Configurar locais para as partidas
    if (primeiraPartida) {
      const localNome1 = obterLocalParaModalidade(primeiraPartida.modalidade, configuracaoLocais);
      const localId1 = localMap[localNome1];
      
      slot.partidas.push({
        ...primeiraPartida,
        slot: slotAtual,
        localId: localId1,
        localNome: localNome1
      });

      ultimaPartidaTime[primeiraPartida.time1Id] = slotAtual;
      ultimaPartidaTime[primeiraPartida.time2Id] = slotAtual;
    }

    if (segundaPartida) {
      // Para a segunda partida, usar a quadra oposta
      const localNome1 = slot.partidas[0]?.localNome;
      const localNome2 = localNome1 === 'Quadra de Cima' ? 'Quadra de Baixo' : 'Quadra de Cima';
      const localId2 = localMap[localNome2];
      
      slot.partidas.push({
        ...segundaPartida,
        slot: slotAtual,
        localId: localId2,
        localNome: localNome2
      });

      ultimaPartidaTime[segundaPartida.time1Id] = slotAtual;
      ultimaPartidaTime[segundaPartida.time2Id] = slotAtual;
    }

    if (slot.partidas.length > 0) {
      slots.push(slot);
      console.log(`⏰ Slot ${slotAtual}: ${slot.partidas.map(p => `${p.modalidade} ${p.genero} (${p.localNome})`).join(' + ')}`);
    }

    slotAtual++;

    // Proteção contra loop infinito
    if (slotAtual > 1000) {
      console.error('❌ Loop infinito detectado na otimização');
      break;
    }
  }

  const resultado = [];
  slots.forEach(slot => {
    resultado.push(...slot.partidas);
  });

  console.log(`✅ Otimização concluída: ${resultado.length} partidas em ${slots.length} slots`);
  return resultado;
}

// Função para escolher a melhor partida baseada no tempo de descanso
function escolherMelhorPartida(listaPartidas, ultimaPartidaTime, slotAtual) {
  if (listaPartidas.length === 0) return null;

  let melhorIdx = 0;
  let melhorDescanso = -1;

  listaPartidas.forEach((partida, idx) => {
    const descanso1 = slotAtual - ultimaPartidaTime[partida.time1Id];
    const descanso2 = slotAtual - ultimaPartidaTime[partida.time2Id];
    const menorDescanso = Math.min(descanso1, descanso2);

    if (menorDescanso > melhorDescanso) {
      melhorDescanso = menorDescanso;
      melhorIdx = idx;
    }
  });

  return listaPartidas.splice(melhorIdx, 1)[0];
}

// Função para obter o local de uma modalidade
function obterLocalParaModalidade(modalidade, configuracaoLocais) {
  // Configuração padrão inteligente se não foi especificada
  const configuracaoPadrao = {
    'Vôlei': 'Quadra de Baixo',
    'Handebol': 'Quadra de Cima', 
    'Basquete': 'Quadra de Baixo',
    'Futsal': 'Quadra de Cima'
  };
  
  return configuracaoLocais?.[modalidade] || configuracaoPadrao[modalidade] || 'Quadra de Baixo';
}