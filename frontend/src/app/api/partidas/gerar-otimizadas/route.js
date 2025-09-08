import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { torneioId, configuracaoLocais } = await request.json();

    if (!torneioId) {
      return Response.json({ error: 'Torneio é obrigatório' }, { status: 400 });
    }

    console.log('🚀 Iniciando geração otimizada de partidas...');

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
          torneioId: parseInt(torneioId)
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

// ALGORITMO DE OTIMIZAÇÃO GLOBAL - MISTURA TODAS AS MODALIDADES
function otimizarPartidasGlobalmente(partidas, configuracaoLocais, localMap) {
  console.log('🤖 Iniciando otimização global de partidas...');

  // Agrupar partidas por modalidade e local
  const partidasPorModalidade = {};
  partidas.forEach(partida => {
    const key = `${partida.modalidade}_${partida.genero}`;
    if (!partidasPorModalidade[key]) {
      partidasPorModalidade[key] = [];
    }
    partidasPorModalidade[key].push(partida);
  });

  // Controle de slots e locais
  const slots = [];
  const times = new Set();
  partidas.forEach(p => {
    times.add(p.time1Id);
    times.add(p.time2Id);
  });

  const ultimaPartidaTime = {};
  times.forEach(timeId => ultimaPartidaTime[timeId] = -1);

  const modalidadesKeys = Object.keys(partidasPorModalidade);
  let slotAtual = 0;

  // ALGORITMO: 2 PARTIDAS SIMULTÂNEAS
  while (modalidadesKeys.some(key => partidasPorModalidade[key].length > 0)) {
    const slot = {
      numero: slotAtual,
      partidas: []
    };

    // Tentar agendar 2 partidas simultâneas (uma por quadra)
    const locaisUsados = new Set();
    
    for (const modalidadeKey of modalidadesKeys) {
      if (slot.partidas.length >= 2) break; // Máximo 2 partidas simultâneas
      
      const partidasDisp = partidasPorModalidade[modalidadeKey];
      if (partidasDisp.length === 0) continue;

      const [modalidade, genero] = modalidadeKey.split('_');
      const localNome = configuracaoLocais?.[modalidade] || 'Quadra de Baixo';
      const localId = localMap[localNome];

      // Verificar se o local já está sendo usado neste slot
      if (locaisUsados.has(localId)) continue;

      // Encontrar a melhor partida para este slot
      let melhorIdx = 0;
      let melhorDescanso = -1;

      partidasDisp.forEach((partida, idx) => {
        const descanso1 = slotAtual - ultimaPartidaTime[partida.time1Id];
        const descanso2 = slotAtual - ultimaPartidaTime[partida.time2Id];
        const menorDescanso = Math.min(descanso1, descanso2);

        if (menorDescanso > melhorDescanso) {
          melhorDescanso = menorDescanso;
          melhorIdx = idx;
        }
      });

      // Agendar a partida
      const partidaEscolhida = partidasDisp.splice(melhorIdx, 1)[0];
      ultimaPartidaTime[partidaEscolhida.time1Id] = slotAtual;
      ultimaPartidaTime[partidaEscolhida.time2Id] = slotAtual;
      
      slot.partidas.push({
        ...partidaEscolhida,
        slot: slotAtual,
        localId: localId,
        localNome: localNome
      });

      locaisUsados.add(localId);
    }

    if (slot.partidas.length > 0) {
      slots.push(slot);
      console.log(`⏰ Slot ${slotAtual}: ${slot.partidas.length} partidas agendadas`);
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