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

    // Calcular estatísticas de diversidade
    const totalSlots = partidasOtimizadas.length > 0 ? Math.max(...partidasOtimizadas.map(p => p.slot)) + 1 : 0;
    const slotsComDuasPartidas = partidasOtimizadas.reduce((acc, partida) => {
      if (!acc[partida.slot]) acc[partida.slot] = [];
      acc[partida.slot].push(partida);
      return acc;
    }, {});
    
    const slotsComModalidadesDiferentes = Object.values(slotsComDuasPartidas).filter(partidas => 
      partidas.length === 2 && partidas[0].modalidade !== partidas[1].modalidade
    ).length;

    // Calcular estatísticas de alternância por modalidade
    const modalidadesUnicas = [...new Set(todasPartidas.map(p => p.modalidade))];
    const estatisticasModalidades = {};
    
    modalidadesUnicas.forEach(modalidade => {
      const partidasModalidade = partidasOtimizadas.filter(p => p.modalidade === modalidade);
      const totalPartidas = partidasModalidade.length;
      const ciclosCompletos = Math.floor(totalPartidas / 5);
      const partidasRestantes = totalPartidas % 5;
      
      estatisticasModalidades[modalidade] = {
        totalPartidas,
        ciclosCompletos,
        partidasRestantes
      };
    });

    return Response.json({ 
      message: 'Partidas otimizadas geradas com sucesso!',
      partidasGeradas: partidasCriadas.length,
      slots: totalSlots,
      modalidades: modalidadesUnicas.length,
      diversidadeModalidades: {
        slotsComModalidadesDiferentes,
        totalSlots,
        percentual: totalSlots > 0 ? Math.round(slotsComModalidadesDiferentes/totalSlots*100) : 0
      },
      alternanciaPorModalidade: {
        estatisticasModalidades,
        totalModalidades: modalidadesUnicas.length
      }
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

// ALGORITMO DE OTIMIZAÇÃO GLOBAL - SEMPRE UM JOGO MASCULINO E UM FEMININO + MODALIDADES DIFERENTES + ALTERNÂNCIA POR MODALIDADE
function otimizarPartidasGlobalmente(partidas, configuracaoLocais, localMap) {
  console.log('🤖 Iniciando otimização global de partidas...');
  console.log('⚽ Regra 1: Sempre um jogo masculino e um feminino por slot');
  console.log('🔄 Regra 2: Priorizar modalidades diferentes no mesmo slot');
  console.log('🔀 Regra 3: Alternar gêneros a cada 5 partidas de cada modalidade');

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

  // Controle de alternância por modalidade
  const contadorModalidades = {};
  const modalidades = [...new Set(partidas.map(p => p.modalidade))];
  
  // Configurar qual gênero cada modalidade deve começar
  const configuracaoInicial = {
    'Handebol': 'Feminino',  // Começa com feminino
    'Vôlei': 'Masculino',    // Começa com masculino
    'Futsal': 'Masculino',   // Começa com masculino
    'Basquete': 'Feminino'   // Começa com feminino
  };
  
  modalidades.forEach(modalidade => {
    const generoInicial = configuracaoInicial[modalidade] || 'Masculino';
    contadorModalidades[modalidade] = {
      masculino: 0,
      feminino: 0,
      ultimoGeneroEscolhido: null,
      generoInicial: generoInicial
    };
    console.log(`🎯 ${modalidade}: Começando com ${generoInicial}`);
  });

  const slots = [];
  let slotAtual = 0;

  // ALGORITMO: SEMPRE 1 MASCULINO + 1 FEMININO POR SLOT (MODALIDADES DIFERENTES + ALTERNÂNCIA POR MODALIDADE)
  while (partidasMasculinas.length > 0 || partidasFemininas.length > 0) {
    const slot = {
      numero: slotAtual,
      partidas: []
    };

    // Primeira partida: Masculina ou Feminina (baseado na disponibilidade)
    let primeiraPartida = null;
    let segundaPartida = null;

    if (partidasMasculinas.length > 0 && partidasFemininas.length > 0) {
      // Escolher baseado na quantidade disponível
      if (partidasMasculinas.length >= partidasFemininas.length) {
        primeiraPartida = escolherMelhorPartidaComAlternancia(partidasMasculinas, ultimaPartidaTime, slotAtual, contadorModalidades, 'Masculino');
        // Para a segunda partida, priorizar modalidade diferente
        segundaPartida = escolherMelhorPartidaComModalidadeDiferenteEAlternancia(partidasFemininas, ultimaPartidaTime, slotAtual, primeiraPartida?.modalidade, contadorModalidades, 'Feminino');
      } else {
        primeiraPartida = escolherMelhorPartidaComAlternancia(partidasFemininas, ultimaPartidaTime, slotAtual, contadorModalidades, 'Feminino');
        // Para a segunda partida, priorizar modalidade diferente
        segundaPartida = escolherMelhorPartidaComModalidadeDiferenteEAlternancia(partidasMasculinas, ultimaPartidaTime, slotAtual, primeiraPartida?.modalidade, contadorModalidades, 'Masculino');
      }
    } else if (partidasMasculinas.length > 0) {
      // Só masculinas restantes
      primeiraPartida = escolherMelhorPartidaComAlternancia(partidasMasculinas, ultimaPartidaTime, slotAtual, contadorModalidades, 'Masculino');
    } else if (partidasFemininas.length > 0) {
      // Só femininas restantes
      primeiraPartida = escolherMelhorPartidaComAlternancia(partidasFemininas, ultimaPartidaTime, slotAtual, contadorModalidades, 'Feminino');
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

      // Atualizar contadores
      ultimaPartidaTime[primeiraPartida.time1Id] = slotAtual;
      ultimaPartidaTime[primeiraPartida.time2Id] = slotAtual;
      contadorModalidades[primeiraPartida.modalidade][primeiraPartida.genero.toLowerCase()]++;
      contadorModalidades[primeiraPartida.modalidade].ultimoGeneroEscolhido = primeiraPartida.genero;
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

      // Atualizar contadores
      ultimaPartidaTime[segundaPartida.time1Id] = slotAtual;
      ultimaPartidaTime[segundaPartida.time2Id] = slotAtual;
      contadorModalidades[segundaPartida.modalidade][segundaPartida.genero.toLowerCase()]++;
      contadorModalidades[segundaPartida.modalidade].ultimoGeneroEscolhido = segundaPartida.genero;
    }

    if (slot.partidas.length > 0) {
      slots.push(slot);
      const partidasDescricao = slot.partidas.map(p => `${p.modalidade} ${p.genero} (${p.localNome})`);
      const modalidadesDiferentes = slot.partidas.length === 2 && slot.partidas[0].modalidade !== slot.partidas[1].modalidade;
      const iconeModalidade = modalidadesDiferentes ? '🔄' : '⚠️';
      
      // Mostrar informações de alternância por modalidade
      const infoAlternancia = slot.partidas.map(p => {
        const contador = contadorModalidades[p.modalidade];
        const totalModalidade = contador.masculino + contador.feminino;
        const cicloAtual = Math.floor((totalModalidade - 1) / 5);
        return `${p.modalidade}: ${totalModalidade}° (ciclo ${cicloAtual})`;
      }).join(', ');
      
      console.log(`⏰ Slot ${slotAtual}: ${partidasDescricao.join(' + ')} ${iconeModalidade} | ${infoAlternancia}`);
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
  
  // Calcular estatísticas de diversidade de modalidades
  const slotsComModalidadesDiferentes = slots.filter(slot => 
    slot.partidas.length === 2 && 
    slot.partidas[0].modalidade !== slot.partidas[1].modalidade
  ).length;
  
  // Calcular estatísticas de alternância por modalidade
  console.log(`🔄 Slots com modalidades diferentes: ${slotsComModalidadesDiferentes}/${slots.length} (${Math.round(slotsComModalidadesDiferentes/slots.length*100)}%)`);
  console.log(`🔀 Estatísticas de alternância por modalidade:`);
  modalidades.forEach(modalidade => {
    const contador = contadorModalidades[modalidade];
    const total = contador.masculino + contador.feminino;
    const ciclosCompletos = Math.floor(total / 5);
    console.log(`   ${modalidade}: ${total} partidas, ${ciclosCompletos} ciclos de 5 completados`);
  });
  
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

// Função para escolher a melhor partida priorizando modalidade diferente
function escolherMelhorPartidaComModalidadeDiferente(listaPartidas, ultimaPartidaTime, slotAtual, modalidadeEvitar) {
  if (listaPartidas.length === 0) return null;

  // Primeiro, tentar encontrar partidas de modalidades diferentes
  const partidasDiferentes = listaPartidas.filter(p => p.modalidade !== modalidadeEvitar);
  
  if (partidasDiferentes.length > 0) {
    // Se há partidas de modalidades diferentes, escolher a melhor entre elas
    let melhorIdx = -1;
    let melhorDescanso = -1;

    partidasDiferentes.forEach((partida, idx) => {
      const descanso1 = slotAtual - ultimaPartidaTime[partida.time1Id];
      const descanso2 = slotAtual - ultimaPartidaTime[partida.time2Id];
      const menorDescanso = Math.min(descanso1, descanso2);

      if (menorDescanso > melhorDescanso) {
        melhorDescanso = menorDescanso;
        melhorIdx = idx;
      }
    });

    if (melhorIdx >= 0) {
      const partidaEscolhida = partidasDiferentes[melhorIdx];
      // Remover da lista original
      const idxOriginal = listaPartidas.findIndex(p => 
        p.time1Id === partidaEscolhida.time1Id && 
        p.time2Id === partidaEscolhida.time2Id && 
        p.modalidade === partidaEscolhida.modalidade
      );
      if (idxOriginal >= 0) {
        return listaPartidas.splice(idxOriginal, 1)[0];
      }
    }
  }

  // Se não há modalidades diferentes disponíveis, escolher normalmente
  console.log(`⚠️ Não foi possível evitar modalidade ${modalidadeEvitar} - usando qualquer partida disponível`);
  return escolherMelhorPartida(listaPartidas, ultimaPartidaTime, slotAtual);
}

// Função para escolher partida considerando alternância por modalidade
function escolherMelhorPartidaComAlternancia(listaPartidas, ultimaPartidaTime, slotAtual, contadorModalidades, generoAtual) {
  if (listaPartidas.length === 0) return null;

  // Separar partidas por modalidade e verificar qual gênero deve ser priorizado
  const partidasPrioritarias = [];
  const partidasNormais = [];

  listaPartidas.forEach(partida => {
    const contador = contadorModalidades[partida.modalidade];
    const totalPartidas = contador.masculino + contador.feminino;
    const cicloAtual = Math.floor(totalPartidas / 5);
    
    // Determinar se deve priorizar este gênero neste momento
    let deveEscolherEsteGenero = false;
    
    // Verificar se deve seguir o gênero inicial ou alternar
    const generoEsperado = (cicloAtual % 2 === 0) 
      ? contador.generoInicial 
      : (contador.generoInicial === 'Masculino' ? 'Feminino' : 'Masculino');
    
    deveEscolherEsteGenero = partida.genero === generoEsperado;

    // Se estamos no começo de um novo ciclo de 5, priorizar o gênero correto
    if (deveEscolherEsteGenero) {
      partidasPrioritarias.push(partida);
    } else {
      partidasNormais.push(partida);
    }
  });

  // Escolher da lista prioritária se disponível, senão da normal
  const listaEscolha = partidasPrioritarias.length > 0 ? partidasPrioritarias : partidasNormais;
  
  if (listaEscolha.length === 0) return null;

  // Encontrar a melhor partida baseada no tempo de descanso
  let melhorIdx = 0;
  let melhorDescanso = -1;

  listaEscolha.forEach((partida, idx) => {
    const descanso1 = slotAtual - ultimaPartidaTime[partida.time1Id];
    const descanso2 = slotAtual - ultimaPartidaTime[partida.time2Id];
    const menorDescanso = Math.min(descanso1, descanso2);

    if (menorDescanso > melhorDescanso) {
      melhorDescanso = menorDescanso;
      melhorIdx = idx;
    }
  });

  const partidaEscolhida = listaEscolha[melhorIdx];
  
  // Log para debug
  const contador = contadorModalidades[partidaEscolhida.modalidade];
  const totalPartidas = contador.masculino + contador.feminino;
  const cicloAtual = Math.floor(totalPartidas / 5);
  const generoEsperado = (cicloAtual % 2 === 0) 
    ? contador.generoInicial 
    : (contador.generoInicial === 'Masculino' ? 'Feminino' : 'Masculino');
  const estaCorreto = partidaEscolhida.genero === generoEsperado ? '✅' : '⚠️';
  console.log(`🔀 ${partidaEscolhida.modalidade} ${partidaEscolhida.genero} - Partida ${totalPartidas + 1}/5 (Ciclo ${cicloAtual}, Esperado: ${generoEsperado}) ${estaCorreto}`);
  
  // Remover da lista original
  const idxOriginal = listaPartidas.findIndex(p => 
    p.time1Id === partidaEscolhida.time1Id && 
    p.time2Id === partidaEscolhida.time2Id && 
    p.modalidade === partidaEscolhida.modalidade
  );
  
  if (idxOriginal >= 0) {
    return listaPartidas.splice(idxOriginal, 1)[0];
  }
  
  return null;
}

// Função para escolher partida com modalidade diferente E considerando alternância
function escolherMelhorPartidaComModalidadeDiferenteEAlternancia(listaPartidas, ultimaPartidaTime, slotAtual, modalidadeEvitar, contadorModalidades, generoAtual) {
  if (listaPartidas.length === 0) return null;

  // Primeiro, filtrar partidas de modalidades diferentes
  const partidasDiferentes = listaPartidas.filter(p => p.modalidade !== modalidadeEvitar);
  
  if (partidasDiferentes.length > 0) {
    // Aplicar a lógica de alternância nas partidas de modalidades diferentes
    const partidasPrioritarias = [];
    const partidasNormais = [];

    partidasDiferentes.forEach(partida => {
      const contador = contadorModalidades[partida.modalidade];
      const totalPartidas = contador.masculino + contador.feminino;
      const cicloAtual = Math.floor(totalPartidas / 5);
      
      // Determinar se deve priorizar este gênero neste momento
      // Verificar se deve seguir o gênero inicial ou alternar
      const generoEsperado = (cicloAtual % 2 === 0) 
        ? contador.generoInicial 
        : (contador.generoInicial === 'Masculino' ? 'Feminino' : 'Masculino');
      
      const deveEscolherEsteGenero = partida.genero === generoEsperado;

      if (deveEscolherEsteGenero) {
        partidasPrioritarias.push(partida);
      } else {
        partidasNormais.push(partida);
      }
    });

    // Escolher da lista prioritária se disponível, senão da normal
    const listaEscolha = partidasPrioritarias.length > 0 ? partidasPrioritarias : partidasNormais;
    
    if (listaEscolha.length > 0) {
      // Encontrar a melhor partida baseada no tempo de descanso
      let melhorIdx = 0;
      let melhorDescanso = -1;

      listaEscolha.forEach((partida, idx) => {
        const descanso1 = slotAtual - ultimaPartidaTime[partida.time1Id];
        const descanso2 = slotAtual - ultimaPartidaTime[partida.time2Id];
        const menorDescanso = Math.min(descanso1, descanso2);

        if (menorDescanso > melhorDescanso) {
          melhorDescanso = menorDescanso;
          melhorIdx = idx;
        }
      });

      const partidaEscolhida = listaEscolha[melhorIdx];
      
      // Log para debug
      const contador = contadorModalidades[partidaEscolhida.modalidade];
      const totalPartidas = contador.masculino + contador.feminino;
      const cicloAtual = Math.floor(totalPartidas / 5);
      const generoEsperado = (cicloAtual % 2 === 0) 
        ? contador.generoInicial 
        : (contador.generoInicial === 'Masculino' ? 'Feminino' : 'Masculino');
      const estaCorreto = partidaEscolhida.genero === generoEsperado ? '✅' : '⚠️';
      console.log(`🔀 ${partidaEscolhida.modalidade} ${partidaEscolhida.genero} (≠${modalidadeEvitar}) - Partida ${totalPartidas + 1}/5 (Ciclo ${cicloAtual}, Esperado: ${generoEsperado}) ${estaCorreto}`);
      
      // Remover da lista original
      const idxOriginal = listaPartidas.findIndex(p => 
        p.time1Id === partidaEscolhida.time1Id && 
        p.time2Id === partidaEscolhida.time2Id && 
        p.modalidade === partidaEscolhida.modalidade
      );
      
      if (idxOriginal >= 0) {
        return listaPartidas.splice(idxOriginal, 1)[0];
      }
    }
  }

  // Se não há modalidades diferentes, usar alternância na lista completa
  console.log(`⚠️ Não foi possível evitar modalidade ${modalidadeEvitar} - aplicando alternância em todas as partidas`);
  return escolherMelhorPartidaComAlternancia(listaPartidas, ultimaPartidaTime, slotAtual, contadorModalidades, generoAtual);
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