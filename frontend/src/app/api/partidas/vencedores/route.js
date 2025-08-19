import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/partidas/vencedores
 * Retorna os vencedores de todas as partidas finalizadas por torneio/modalidade/gênero
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const torneioId = searchParams.get('torneioId');
        const modalidadeId = searchParams.get('modalidadeId');
        const genero = searchParams.get('genero');
        const fase = searchParams.get('fase') || 'Grupos';

        if (!torneioId) {
            return Response.json({ error: 'torneioId é obrigatório' }, { status: 400 });
        }

        const whereClause = {
            torneioId: parseInt(torneioId),
            statusPartida: 'FINALIZADA',
            fase: fase,
            vencedorId: { not: null } // Apenas partidas com vencedor definido
        };

        // Filtros opcionais
        if (modalidadeId && genero) {
            whereClause.grupo = {
                modalidadeId: parseInt(modalidadeId)
            };
            // Adicionar filtro por gênero através dos times
            whereClause.times = {
                some: {
                    time: {
                        categoria: {
                            genero: genero
                        }
                    }
                }
            };
        }

        const partidas = await prisma.partida.findMany({
            where: whereClause,
            include: {
                times: {
                    include: {
                        time: {
                            include: {
                                curso: true,
                                categoria: {
                                    include: {
                                        modalidade: true
                                    }
                                }
                            }
                        }
                    }
                },
                grupo: {
                    include: {
                        modalidade: true
                    }
                }
            }
        });

        // Mapear vencedores
        const vencedores = partidas.map(partida => {
            const timeCasa = partida.times.find(pt => pt.ehCasa)?.time;
            const timeVisitante = partida.times.find(pt => !pt.ehCasa)?.time;

            let vencedor = null;
            if (partida.vencedorId === timeCasa?.id) {
                vencedor = timeCasa;
            } else if (partida.vencedorId === timeVisitante?.id) {
                vencedor = timeVisitante;
            }

            return {
                partidaId: partida.id,
                vencedorId: partida.vencedorId,
                vencedor: vencedor ? {
                    id: vencedor.id,
                    nome: vencedor.nome,
                    curso: vencedor.curso?.sigla || '',
                    modalidade: vencedor.categoria?.modalidade?.nome || partida.grupo?.modalidade?.nome,
                    genero: vencedor.categoria?.genero
                } : null,
                resultado: partida.resultado,
                empate: partida.empate,
                grupo: partida.grupo?.nome,
                fase: partida.fase
            };
        }).filter(v => v.vencedor !== null); // Remove partidas sem vencedor

        // Contar por grupo se fase é 'Grupos'
        let estatisticas = {};
        if (fase === 'Grupos') {
            const vencedoresPorGrupo = {};
            vencedores.forEach(v => {
                if (!vencedoresPorGrupo[v.grupo]) {
                    vencedoresPorGrupo[v.grupo] = [];
                }
                vencedoresPorGrupo[v.grupo].push(v.vencedor);
            });

            estatisticas = {
                totalGrupos: Object.keys(vencedoresPorGrupo).length,
                gruposCompletos: Object.values(vencedoresPorGrupo).filter(g => g.length > 0).length,
                vencedoresPorGrupo
            };
        }

        const proximaFase = determinarProximaFase(vencedores.length, fase);

        console.log(`🔍 DEBUG VENCEDORES:`, {
            torneioId,
            modalidadeId,
            genero,
            fase,
            totalVencedores: vencedores.length,
            proximaFase,
            vencedores: vencedores.map(v => ({ partidaId: v.partidaId, vencedor: v.vencedor?.nome }))
        });

        return Response.json({
            vencedores,
            total: vencedores.length,
            fase,
            estatisticas,
            proximaFase
        });

    } catch (error) {
        console.error('Erro ao buscar vencedores:', error);
        return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

/**
 * Determina qual deve ser a próxima fase baseada no número de vencedores
 */
function determinarProximaFase(numeroVencedores, faseAtual) {
    if (faseAtual === 'Grupos') {
        if (numeroVencedores >= 8) return 'Quartas';
        if (numeroVencedores >= 4) return 'Semifinais';
        if (numeroVencedores === 3) return 'Triangular';
        if (numeroVencedores === 2) return 'Final';
    } else if (faseAtual === 'Quartas') {
        if (numeroVencedores === 4) return 'Semifinais';
        if (numeroVencedores === 3) return 'Triangular';
        if (numeroVencedores === 2) return 'Final';
    } else if (faseAtual === 'Semifinais') {
        if (numeroVencedores === 3) return 'Triangular';
        if (numeroVencedores === 2) return 'Final';
    } else if (faseAtual === 'Triangular') {
        return 'Final';
    }

    return null; // Não há próxima fase ou número inválido
}
