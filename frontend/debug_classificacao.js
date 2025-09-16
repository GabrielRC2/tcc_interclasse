// Script de debug para comparar classificações
// Execute este arquivo no console do navegador para comparar os dados

async function debugClassificacao() {
    // Substitua pelos valores corretos do seu teste
    const torneioId = 1; // ID do torneio atual
    const modalidadeId = 1; // ID da modalidade
    const genero = 'Masculino'; // Gênero selecionado
    
    console.log('=== DEBUG CLASSIFICAÇÃO ===');
    
    // 1. Buscar classificação geral
    const responseGeral = await fetch(`/api/classificacao?torneioId=${torneioId}&modalidadeId=${modalidadeId}&genero=${genero}`);
    const dataGeral = await responseGeral.json();
    
    console.log('📊 CLASSIFICAÇÃO GERAL:');
    console.table(dataGeral.classificacao.map(t => ({
        nome: t.nome,
        pontos: t.pontos,
        jogos: t.jogos,
        vitorias: t.vitorias,
        empates: t.empates,
        derrotas: t.derrotas,
        golsPro: t.golsPro,
        golsContra: t.golsContra,
        saldoGols: t.saldoGols
    })));
    
    // 2. Buscar grupos
    const responseGrupos = await fetch(`/api/grupos?torneioId=${torneioId}&modalidadeId=${modalidadeId}&genero=${genero}`);
    const dataGrupos = await responseGrupos.json();
    
    console.log('📋 GRUPOS ENCONTRADOS:');
    console.log(dataGrupos.map(g => ({ id: g.id, nome: g.nome })));
    
    // 3. Buscar classificação por grupo
    const classificacoesPorGrupo = {};
    for (const grupo of dataGrupos) {
        const responseGrupo = await fetch(`/api/classificacao?torneioId=${torneioId}&grupoId=${grupo.id}`);
        const dataGrupo = await responseGrupo.json();
        classificacoesPorGrupo[grupo.nome] = dataGrupo.classificacao;
        
        console.log(`📊 CLASSIFICAÇÃO GRUPO ${grupo.nome}:`);
        console.table(dataGrupo.classificacao.map(t => ({
            nome: t.nome,
            pontos: t.pontos,
            jogos: t.jogos,
            vitorias: t.vitorias,
            empates: t.empates,
            derrotas: t.derrotas,
            golsPro: t.golsPro,
            golsContra: t.golsContra,
            saldoGols: t.saldoGols
        })));
    }
    
    // 4. Comparar resultados
    console.log('🔍 COMPARAÇÃO DE RESULTADOS:');
    
    // Juntar todos os times dos grupos
    const todosTimesGrupos = [];
    for (const nomeGrupo in classificacoesPorGrupo) {
        todosTimesGrupos.push(...classificacoesPorGrupo[nomeGrupo]);
    }
    
    // Comparar cada time
    for (const timeGeral of dataGeral.classificacao) {
        const timeGrupo = todosTimesGrupos.find(t => t.timeId === timeGeral.timeId || t.nome === timeGeral.nome);
        
        if (!timeGrupo) {
            console.error(`❌ Time ${timeGeral.nome} não encontrado nos grupos!`);
            continue;
        }
        
        const diferencas = [];
        if (timeGeral.pontos !== timeGrupo.pontos) diferencas.push(`pontos: ${timeGeral.pontos} vs ${timeGrupo.pontos}`);
        if (timeGeral.jogos !== timeGrupo.jogos) diferencas.push(`jogos: ${timeGeral.jogos} vs ${timeGrupo.jogos}`);
        if (timeGeral.vitorias !== timeGrupo.vitorias) diferencas.push(`vitorias: ${timeGeral.vitorias} vs ${timeGrupo.vitorias}`);
        if (timeGeral.empates !== timeGrupo.empates) diferencas.push(`empates: ${timeGeral.empates} vs ${timeGrupo.empates}`);
        if (timeGeral.derrotas !== timeGrupo.derrotas) diferencas.push(`derrotas: ${timeGeral.derrotas} vs ${timeGrupo.derrotas}`);
        if (timeGeral.golsPro !== timeGrupo.golsPro) diferencas.push(`golsPro: ${timeGeral.golsPro} vs ${timeGrupo.golsPro}`);
        if (timeGeral.golsContra !== timeGrupo.golsContra) diferencas.push(`golsContra: ${timeGeral.golsContra} vs ${timeGrupo.golsContra}`);
        if (timeGeral.saldoGols !== timeGrupo.saldoGols) diferencas.push(`saldoGols: ${timeGeral.saldoGols} vs ${timeGrupo.saldoGols}`);
        
        if (diferencas.length > 0) {
            console.error(`❌ DIFERENÇAS ENCONTRADAS para ${timeGeral.nome}:`);
            console.error(`   Geral vs Grupo: ${diferencas.join(', ')}`);
        } else {
            console.log(`✅ ${timeGeral.nome} - dados consistentes`);
        }
    }
    
    return {
        geral: dataGeral.classificacao,
        grupos: classificacoesPorGrupo,
        todosTimesGrupos
    };
}

// Para executar no console:
// debugClassificacao().then(result => console.log('Resultado completo:', result));