import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ====================================
// === FUNÇÕES DE GERAÇÃO DE PARTIDAS (Mantidas as mesmas) ===
// ====================================

// === Gerar rodízio de partidas por grupo ===
// Recebe um objeto onde as chaves são nomes de grupo e os valores são arrays de IDs de Inscrição (times).
function rodizio(gruposComInscricoes) {
    const todas_partidas_por_grupo = {};

    for (const grupoNome in gruposComInscricoes) {
        let inscricoes = [...gruposComInscricoes[grupoNome]]; // Copia a array para não modificar o original

        // Se o número de times no grupo for ímpar, adiciona uma "folga" temporária.
        if (inscricoes.length % 2 === 1) {
            inscricoes.push(null); // Usamos null para representar a folga
        }

        const n = inscricoes.length;
        const num_rodadas = n - 1;
        const jogos_por_rodada = n / 2;

        todas_partidas_por_grupo[grupoNome] = [];

        for (let rodada = 0; rodada < num_rodadas; rodada++) {
            const rodada_partidas = [];

            for (let i = 0; i < jogos_por_rodada; i++) {
                const inscricao1 = inscricoes[i];
                const inscricao2 = inscricoes[n - 1 - i];

                // Apenas adiciona a partida se ambos os "times" não forem folga
                if (inscricao1 !== null && inscricao2 !== null) {
                    rodada_partidas.push({ time_A_inscricao_id: inscricao1, time_B_inscricao_id: inscricao2 });
                }
            }

            todas_partidas_por_grupo[grupoNome].push(rodada_partidas);

            // Rotaciona as inscrições (exceto a primeira)
            const fixo = inscricoes.shift();
            const segundo = inscricoes.shift();
            inscricoes.push(segundo);
            inscricoes.unshift(fixo);
        }
    }

    return todas_partidas_por_grupo;
}

// === Achatar as partidas em lista única ===
// Recebe o resultado de rodizio() e retorna uma lista plana de partidas.
function achatarPartidas(todas_partidas_por_grupo) {
    const lista = [];
    for (const grupo in todas_partidas_por_grupo) {
        for (const rodada of todas_partidas_por_grupo[grupo]) {
            for (const jogo of rodada) {
                // Adiciona o nome do grupo à partida para referência futura
                lista.push({ ...jogo, grupo_nome: grupo });
            }
        }
    }
    return lista;
}

// === Organizar partidas com melhor distribuição de descanso ===
// Adaptada para usar IDs de Inscrição
function ordenarPartidasComDescanso(partidas) {
    const todas_inscricoes_ids = new Set();
    for (const jogo of partidas) {
        todas_inscricoes_ids.add(jogo.time_A_inscricao_id);
        todas_inscricoes_ids.add(jogo.time_B_inscricao_id);
    }

    const ultimaPosicao = {};
    const carga = {};
    for (const inscricaoId of todas_inscricoes_ids) {
        ultimaPosicao[inscricaoId] = 0;
        carga[inscricaoId] = 0;
    }

    let remanescentes = [...partidas];
    const sequencia = [];
    let pos = 1;

    while (remanescentes.length > 0) {
        let bestIndex = -1;
        let bestMinGap = -1;
        let bestSumGap = -1;
        let bestCargaSum = Infinity;

        for (let idx = 0; idx < remanescentes.length; idx++) {
            const jogo = remanescentes[idx];
            const t1_id = jogo.time_A_inscricao_id;
            const t2_id = jogo.time_B_inscricao_id;

            const gap1 = (ultimaPosicao[t1_id] === 0) ? Infinity : (pos - ultimaPosicao[t1_id]);
            const gap2 = (ultimaPosicao[t2_id] === 0) ? Infinity : (pos - ultimaPosicao[t2_id]);
            
            const minGap = Math.min(gap1, gap2);
            const sumGap = gap1 + gap2;
            const cargaSum = carga[t1_id] + carga[t2_id];

            if (
                bestIndex === -1 ||
                minGap > bestMinGap ||
                (minGap === bestMinGap && sumGap > bestSumGap) ||
                (minGap === bestMinGap && sumGap === bestSumGap && cargaSum < bestCargaSum)
            ) {
                bestIndex = idx;
                bestMinGap = minGap;
                bestSumGap = sumGap;
                bestCargaSum = cargaSum;
            }
        }

        const jogoEscolhido = remanescentes[bestIndex];
        remanescentes.splice(bestIndex, 1);

        const t1_id = jogoEscolhido.time_A_inscricao_id;
        const t2_id = jogoEscolhido.time_B_inscricao_id;

        const gap1Atual = (ultimaPosicao[t1_id] === 0) ? Infinity : (pos - ultimaPosicao[t1_id]);
        const gap2Atual = (ultimaPosicao[t2_id] === 0) ? Infinity : (pos - ultimaPosicao[t2_id]);

        if (gap1Atual <= 1) {
            carga[t1_id]++;
        } else {
            carga[t1_id] = 0;
        }
        if (gap2Atual <= 1) {
            carga[t2_id]++;
        } else {
            carga[t2_id] = 0;
        }

        ultimaPosicao[t1_id] = pos;
        ultimaPosicao[t2_id] = pos;

        sequencia.push(jogoEscolhido);
        pos++;
    }

    return sequencia;
}


// Rota POST: Gera a ordem das partidas para TODOS os grupos de um torneio e as persiste no banco de dados
export async function POST(request) {
  try {
    const body = await request.json();
    // Agora, espera apenas o ID do torneio
    // {
    //   idTorneio: <ID_DO_TORNEIO>,
    // }
    const { idTorneio } = body;

    if (!idTorneio) {
      return NextResponse.json({ message: "O ID do Torneio é obrigatório." }, { status: 400 });
    }

    const parsedTournamentId = parseInt(idTorneio, 10);
    if (isNaN(parsedTournamentId)) {
        return NextResponse.json({ message: "ID do Torneio inválido." }, { status: 400 });
    }

    // 1. Buscar TODOS os grupos associados a este torneio
    const gruposDoTorneio = await prisma.grupos.findMany({
        where: {
            fk_id_torneio: parsedTournamentId
        },
        include: {
            inscricoes_no_grupo: {
                select: {
                    id_inscricao: true
                }
            }
        }
    });

    if (gruposDoTorneio.length === 0) {
        return NextResponse.json({ message: "Nenhum grupo encontrado para o torneio especificado. Certifique-se de que os grupos foram formados e atribuídos." }, { status: 404 });
    }

    const gruposParaAlgoritmo = {};
    const grupoIdMap = {}; // Para mapear nome do grupo de volta para ID do grupo
    for (const grupo of gruposDoTorneio) {
        gruposParaAlgoritmo[grupo.nome_grupo] = grupo.inscricoes_no_grupo.map(inc => inc.id_inscricao);
        grupoIdMap[grupo.nome_grupo] = grupo.id_grupo;
    }
    
    // 2. Executar os algoritmos de geração de partidas
    const todas_partidas_por_grupo = rodizio(gruposParaAlgoritmo);
    const lista_bruta = achatarPartidas(todas_partidas_por_grupo);
    const lista_ordenada_final = ordenarPartidasComDescanso(lista_bruta);

    // 3. Persistir as partidas geradas no banco de dados
    const partidasCriadas = await prisma.$transaction(
        lista_ordenada_final.map(jogo => 
            prisma.partidas.create({
                data: {
                    // O local ainda não é definido na geração da ordem, pode ser null ou um ID padrão
                    fk_id_local: null,
                    fk_id_torneio: parsedTournamentId,
                    // Agora usamos o grupoIdMap para associar a partida ao ID do grupo correto
                    fk_id_grupo: grupoIdMap[jogo.grupo_nome],
                    
                    inscricoes_na_partida: {
                        create: [
                            { 
                                fk_id_inscricao: jogo.time_A_inscricao_id,
                                identificador_time: "Time_A" 
                            },
                            { 
                                fk_id_inscricao: jogo.time_B_inscricao_id,
                                identificador_time: "Time_B" 
                            }
                        ]
                    }
                }
            })
        )
    );

    return NextResponse.json({ 
        message: "Ordem de partidas gerada e salva com sucesso para todos os grupos do torneio!",
        partidasGeradas: partidasCriadas.length
    }, { status: 201 });

  } catch (error) {
    console.error("Erro ao gerar ordem de partidas:", error);
    return NextResponse.json({ message: "Não foi possível gerar a ordem de partidas." }, { status: 500 });
  }
}