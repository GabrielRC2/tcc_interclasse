import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { torneioId, configuracaoLocais } = await request.json();

    if (!torneioId) {
      return Response.json({ error: 'Torneio é obrigatório' }, { status: 400 });
    }

    console.log('🚀 Iniciando reorganização de eliminatórias...');
    console.log('📍 Configuração de locais recebida:', configuracaoLocais);

    // 1. Buscar apenas partidas eliminatórias existentes
    const partidasEliminatorias = await prisma.partida.findMany({
      where: { 
        torneioId: parseInt(torneioId),
        tipo: 'ELIMINATORIA'
      },
      include: {
        times: {
          include: {
            time: {
              include: {
                categoria: true,
                curso: true
              }
            }
          }
        },
        modalidade: true,
        grupo: {
          include: {
            modalidade: true
          }
        }
      },
      orderBy: { ordem: 'asc' }
    });

    if (partidasEliminatorias.length === 0) {
      return Response.json({ error: 'Nenhuma eliminatória encontrada para reorganizar' }, { status: 404 });
    }

    console.log(`📊 ${partidasEliminatorias.length} eliminatórias encontradas para reorganizar`);

    // 2. Buscar locais
    const locais = await prisma.local.findMany();
    const localMap = {};
    locais.forEach(local => localMap[local.nome] = local.id);

    // 3. Converter partidas existentes para formato de otimização
    const partidasParaOtimizar = partidasEliminatorias.map(partida => {
      const timesCasa = partida.times.filter(pt => pt.ehCasa);
      const timesVisitante = partida.times.filter(pt => !pt.ehCasa);
      
      const timeCasa = timesCasa[0]?.time;
      const timeVisitante = timesVisitante[0]?.time;

      // Buscar modalidade 
      let modalidadeId, modalidadeNome;
      if (partida.grupo?.modalidade) {
        modalidadeId = partida.grupo.modalidade.id;
        modalidadeNome = partida.grupo.modalidade.nome;
      } else if (partida.modalidade) {
        modalidadeId = partida.modalidade.id;
        modalidadeNome = partida.modalidade.nome;
      }

      return {
        id: partida.id,
        time1Id: timeCasa?.id,
        time2Id: timeVisitante?.id,
        time1Nome: timeCasa?.nome || 'TBD',
        time2Nome: timeVisitante?.nome || 'TBD',
        modalidadeId: modalidadeId,
        modalidadeNome: modalidadeNome,
        genero: partida.genero,
        fase: partida.fase,
        status: partida.statusPartida,
        pontosCasa: partida.pontosCasa,
        pontosVisitante: partida.pontosVisitante,
        // Campos necessários para otimização
        grupoId: null, // Eliminatórias não têm grupo
        localAtual: partida.localId
      };
    });

    // 4. Aplicar algoritmo de otimização global
    const partidasOtimizadas = otimizarPartidasGlobalmente(partidasParaOtimizar, configuracaoLocais, localMap);

    console.log('🤖 Otimização global concluída');

    // 5. Atualizar partidas no banco com nova ordem e horários
    const partidasAtualizadas = [];
    
    for (let i = 0; i < partidasOtimizadas.length; i++) {
      const partida = partidasOtimizadas[i];
      
      // Atualizar partida existente
      const partidaAtualizada = await prisma.partida.update({
        where: { id: partida.id },
        data: {
          dataHora: new Date(Date.now() + (partida.slot * 30 * 60 * 1000)), // Slots de 30min
          localId: partida.localId,
          ordem: i + 1 // Nova ordem otimizada
        }
      });

      partidasAtualizadas.push(partidaAtualizada);
    }

    console.log(`✅ ${partidasAtualizadas.length} eliminatórias reorganizadas com sucesso`);

    // Calcular estatísticas de diversidade
    const diversidadeModalidades = calcularDiversidadeModalidades(partidasOtimizadas);
    const alternanciaPorModalidade = calcularAlternanciaPorModalidade(partidasOtimizadas);

    return Response.json({
      message: 'Eliminatórias reorganizadas com sucesso!',
      partidasReorganizadas: partidasAtualizadas.length,
      slots: Math.max(...partidasOtimizadas.map(p => p.slot)) + 1,
      diversidadeModalidades,
      alternanciaPorModalidade
    });

  } catch (error) {
    console.error('Erro ao reorganizar eliminatórias:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ALGORITMO DE OTIMIZAÇÃO GLOBAL - SEMPRE UM JOGO MASCULINO E UM FEMININO + MODALIDADES DIFERENTES + ALTERNÂNCIA POR MODALIDADE
function otimizarPartidasGlobalmente(partidas, configuracaoLocais, localMap) {
  console.log('🤖 Iniciando otimização global...');
  console.log(`Total de partidas para otimizar: ${partidas.length}`);
  
  // Agrupar por modalidade para aplicar alternância
  const partidasPorModalidade = {};
  partidas.forEach(partida => {
    const key = partida.modalidadeNome;
    if (!partidasPorModalidade[key]) {
      partidasPorModalidade[key] = { masculino: [], feminino: [] };
    }
    partidasPorModalidade[key][partida.genero.toLowerCase()].push(partida);
  });

  // Criar sequências alternadas para cada modalidade (5M, 5F, 5M, 5F...)
  const sequenciasModalidades = {};
  Object.keys(partidasPorModalidade).forEach(modalidade => {
    const { masculino, feminino } = partidasPorModalidade[modalidade];
    const sequencia = [];
    
    const maxLength = Math.max(masculino.length, feminino.length);
    const cicloSize = 5; // 5 partidas consecutivas de cada gênero
    
    let indexM = 0, indexF = 0;
    let cicloAtual = 'masculino';
    let contadorCiclo = 0;
    
    while (indexM < masculino.length || indexF < feminino.length) {
      if (cicloAtual === 'masculino' && indexM < masculino.length) {
        sequencia.push(masculino[indexM++]);
        contadorCiclo++;
      } else if (cicloAtual === 'feminino' && indexF < feminino.length) {
        sequencia.push(feminino[indexF++]);
        contadorCiclo++;
      } else {
        // Trocar de ciclo se não há mais partidas do gênero atual
        cicloAtual = cicloAtual === 'masculino' ? 'feminino' : 'masculino';
        contadorCiclo = 0;
        continue;
      }
      
      // Trocar de ciclo após 5 partidas
      if (contadorCiclo >= cicloSize) {
        cicloAtual = cicloAtual === 'masculino' ? 'feminino' : 'masculino';
        contadorCiclo = 0;
      }
    }
    
    sequenciasModalidades[modalidade] = sequencia;
  });

  // Criar pools de partidas organizadas
  const todasPartidasOrganizadas = [];
  Object.values(sequenciasModalidades).forEach(sequencia => {
    todasPartidasOrganizadas.push(...sequencia);
  });

  // Algoritmo de slots: sempre 1 masculino + 1 feminino por slot
  const slots = [];
  const partidasProcessadas = new Set();
  const ultimaPartidaTime = {}; // Rastrear última partida de cada time
  
  // Pool separado por gênero
  const poolMasculino = todasPartidasOrganizadas.filter(p => p.genero.toLowerCase() === 'masculino');
  const poolFeminino = todasPartidasOrganizadas.filter(p => p.genero.toLowerCase() === 'feminino');
  
  let slotAtual = 0;
  
  while (poolMasculino.some(p => !partidasProcessadas.has(p.id)) || 
         poolFeminino.some(p => !partidasProcessadas.has(p.id))) {
    
    const slot = { numero: slotAtual, partidas: [] };
    
    // Escolher partida masculina
    const partidaMasculina = escolherMelhorPartidaComModalidade(
      poolMasculino.filter(p => !partidasProcessadas.has(p.id)),
      ultimaPartidaTime,
      slotAtual,
      slot.partidas
    );
    
    if (partidaMasculina) {
      adicionarPartidaAoSlot(slot, partidaMasculina, configuracaoLocais, localMap, ultimaPartidaTime, slotAtual);
      partidasProcessadas.add(partidaMasculina.id);
    }
    
    // Escolher partida feminina (priorizar modalidade diferente)
    const partidaFeminina = escolherMelhorPartidaComModalidade(
      poolFeminino.filter(p => !partidasProcessadas.has(p.id)),
      ultimaPartidaTime,
      slotAtual,
      slot.partidas
    );
    
    if (partidaFeminina) {
      adicionarPartidaAoSlot(slot, partidaFeminina, configuracaoLocais, localMap, ultimaPartidaTime, slotAtual);
      partidasProcessadas.add(partidaFeminina.id);
    }
    
    if (slot.partidas.length > 0) {
      slots.push(slot);
      slotAtual++;
    } else {
      break; // Evitar loop infinito
    }
  }
  
  // Converter slots para lista linear
  const partidasOtimizadas = [];
  slots.forEach(slot => {
    slot.partidas.forEach(partida => {
      partidasOtimizadas.push(partida);
    });
  });
  
  console.log(`🎯 Otimização concluída: ${partidasOtimizadas.length} partidas em ${slots.length} slots`);
  
  return partidasOtimizadas;
}

// Função para escolher a melhor partida priorizando modalidade diferente
function escolherMelhorPartidaComModalidade(listaPartidas, ultimaPartidaTime, slotAtual, partidasNoSlot) {
  if (listaPartidas.length === 0) return null;
  
  // Se já há partidas no slot, priorizar modalidade diferente
  if (partidasNoSlot.length > 0) {
    const modalidadesNoSlot = new Set(partidasNoSlot.map(p => p.modalidadeNome));
    const partidasModalidadeDiferente = listaPartidas.filter(p => !modalidadesNoSlot.has(p.modalidadeNome));
    
    if (partidasModalidadeDiferente.length > 0) {
      return escolherMelhorPartida(partidasModalidadeDiferente, ultimaPartidaTime, slotAtual);
    }
  }
  
  return escolherMelhorPartida(listaPartidas, ultimaPartidaTime, slotAtual);
}

// Função para escolher a melhor partida baseada no tempo de descanso
function escolherMelhorPartida(listaPartidas, ultimaPartidaTime, slotAtual) {
  if (listaPartidas.length === 0) return null;
  
  let melhorPartida = listaPartidas[0];
  let melhorPontuacao = calcularPontuacaoDescanso(melhorPartida, ultimaPartidaTime, slotAtual);
  
  for (let i = 1; i < listaPartidas.length; i++) {
    const partida = listaPartidas[i];
    const pontuacao = calcularPontuacaoDescanso(partida, ultimaPartidaTime, slotAtual);
    
    if (pontuacao > melhorPontuacao) {
      melhorPartida = partida;
      melhorPontuacao = pontuacao;
    }
  }
  
  return melhorPartida;
}

// Calcular pontuação de descanso para uma partida
function calcularPontuacaoDescanso(partida, ultimaPartidaTime, slotAtual) {
  const temposDescanso = [];
  
  [partida.time1Id, partida.time2Id].forEach(timeId => {
    if (timeId && ultimaPartidaTime[timeId] !== undefined) {
      temposDescanso.push(slotAtual - ultimaPartidaTime[timeId]);
    }
  });
  
  return temposDescanso.length > 0 ? Math.min(...temposDescanso) : 1000; // Priorizar times que nunca jogaram
}

// Adicionar partida ao slot e atualizar configurações
function adicionarPartidaAoSlot(slot, partida, configuracaoLocais, localMap, ultimaPartidaTime, slotAtual) {
  // Determinar local baseado na modalidade
  const localNome = configuracaoLocais[partida.modalidadeNome] || Object.keys(localMap)[0];
  const localId = localMap[localNome] || Object.values(localMap)[0];
  
  partida.slot = slotAtual;
  partida.localId = localId;
  partida.localNome = localNome;
  
  slot.partidas.push(partida);
  
  // Atualizar última partida dos times
  if (partida.time1Id) ultimaPartidaTime[partida.time1Id] = slotAtual;
  if (partida.time2Id) ultimaPartidaTime[partida.time2Id] = slotAtual;
}

// Calcular diversidade de modalidades
function calcularDiversidadeModalidades(partidasOtimizadas) {
  const slotsPorNumero = {};
  
  partidasOtimizadas.forEach(partida => {
    if (!slotsPorNumero[partida.slot]) {
      slotsPorNumero[partida.slot] = [];
    }
    slotsPorNumero[partida.slot].push(partida);
  });
  
  let slotsComModalidadesDiferentes = 0;
  const totalSlots = Object.keys(slotsPorNumero).length;
  
  Object.values(slotsPorNumero).forEach(partidasDoSlot => {
    const modalidades = new Set(partidasDoSlot.map(p => p.modalidadeNome));
    if (modalidades.size > 1) {
      slotsComModalidadesDiferentes++;
    }
  });
  
  return {
    slotsComModalidadesDiferentes,
    totalSlots,
    percentual: totalSlots > 0 ? Math.round((slotsComModalidadesDiferentes / totalSlots) * 100) : 0
  };
}

// Calcular alternância por modalidade
function calcularAlternanciaPorModalidade(partidasOtimizadas) {
  const estatisticasPorModalidade = {};
  
  // Agrupar partidas por modalidade mantendo ordem
  const partidasPorModalidade = {};
  partidasOtimizadas.forEach(partida => {
    const modalidade = partida.modalidadeNome;
    if (!partidasPorModalidade[modalidade]) {
      partidasPorModalidade[modalidade] = [];
    }
    partidasPorModalidade[modalidade].push(partida);
  });
  
  // Analisar padrões de alternância para cada modalidade
  Object.entries(partidasPorModalidade).forEach(([modalidade, partidas]) => {
    let ciclosCompletos = 0;
    let generoAtual = null;
    let contadorGenero = 0;
    
    partidas.forEach(partida => {
      if (partida.genero !== generoAtual) {
        if (contadorGenero >= 5) {
          ciclosCompletos++;
        }
        generoAtual = partida.genero;
        contadorGenero = 1;
      } else {
        contadorGenero++;
      }
    });
    
    if (contadorGenero >= 5) {
      ciclosCompletos++;
    }
    
    estatisticasPorModalidade[modalidade] = {
      totalPartidas: partidas.length,
      ciclosCompletos,
      eficiencia: partidas.length > 0 ? Math.round((ciclosCompletos * 5 / partidas.length) * 100) : 0
    };
  });
  
  return {
    estatisticasModalidades: estatisticasPorModalidade,
    resumo: `${Object.keys(estatisticasPorModalidade).length} modalidades analisadas`
  };
}
