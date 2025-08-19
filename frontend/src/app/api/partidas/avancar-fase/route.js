import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/partidas/avancar-fase
 * Gera partidas da próxima fase baseado nos vencedores da fase atual
 */
export async function POST(request) {
    try {
        const data = await request.json();
        const { torneioId, modalidadeId, genero, faseAtual = 'Grupos' } = data;

        if (!torneioId || !modalidadeId || !genero) {
            return Response.json({
                error: 'torneioId, modalidadeId e genero são obrigatórios'
            }, { status: 400 });
        }

        // Buscar vencedores da fase atual
        const vencedoresRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/partidas/vencedores?torneioId=${torneioId}&modalidadeId=${modalidadeId}&genero=${genero}&fase=${faseAtual}`);
        const vencedoresData = await vencedoresRes.json();

        if (!vencedoresData.vencedores || vencedoresData.vencedores.length === 0) {
            return Response.json({
                error: 'Nenhum vencedor encontrado para a fase atual'
            }, { status: 400 });
        }

        const vencedores = vencedoresData.vencedores;
        const proximaFase = vencedoresData.proximaFase;

        if (!proximaFase) {
            return Response.json({
                error: `Não é possível avançar com ${vencedores.length} vencedores`
            }, { status: 400 });
        }

        // Buscar o grupo da modalidade/gênero
        const grupo = await prisma.grupo.findFirst({
            where: {
                torneioId: parseInt(torneioId),
                modalidadeId: parseInt(modalidadeId)
            }
        });

        if (!grupo) {
            return Response.json({ error: 'Grupo não encontrado' }, { status: 404 });
        }

        // Buscar local padrão
        const local = await prisma.local.findFirst();
        if (!local) {
            return Response.json({ error: 'Nenhum local disponível' }, { status: 404 });
        }

        // Gerar partidas da próxima fase
        const partidas = gerarPartidasFase(vencedores, proximaFase);
        const partidasCriadas = [];

        for (let i = 0; i < partidas.length; i++) {
            const partidaData = partidas[i];

            // Criar partida
            const partida = await prisma.partida.create({
                data: {
                    grupoId: grupo.id,
                    localId: local.id,
                    torneioId: parseInt(torneioId),
                    statusPartida: 'AGENDADA',
                    fase: proximaFase,
                    dataHora: new Date(Date.now() + (i * 30 * 60000)) // 30 min entre partidas
                }
            });

            // Associar times à partida
            await prisma.partidaTime.create({
                data: {
                    partidaId: partida.id,
                    timeId: partidaData.time1.id,
                    ehCasa: true
                }
            });

            await prisma.partidaTime.create({
                data: {
                    partidaId: partida.id,
                    timeId: partidaData.time2.id,
                    ehCasa: false
                }
            });

            partidasCriadas.push({
                id: partida.id,
                time1: partidaData.time1.nome,
                time2: partidaData.time2.nome,
                fase: proximaFase
            });
        }

        console.log(`✅ ${partidasCriadas.length} partidas de ${proximaFase} criadas!`);

        return Response.json({
            success: true,
            fase: proximaFase,
            partidasCriadas: partidasCriadas.length,
            partidas: partidasCriadas,
            message: `${partidasCriadas.length} partidas de ${proximaFase} geradas com sucesso!`
        });

    } catch (error) {
        console.error('Erro ao avançar fase:', error);
        return Response.json({
            error: 'Erro interno do servidor',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Gera as partidas para a próxima fase
 */
function gerarPartidasFase(vencedores, fase) {
    const times = vencedores.map(v => v.vencedor);
    const partidas = [];

    if (fase === 'Quartas') {
        // 8 times -> 4 partidas de quartas
        for (let i = 0; i < times.length; i += 2) {
            if (times[i + 1]) {
                partidas.push({
                    time1: times[i],
                    time2: times[i + 1]
                });
            }
        }
    } else if (fase === 'Semifinais') {
        // 4 times -> 2 partidas de semi
        for (let i = 0; i < times.length; i += 2) {
            if (times[i + 1]) {
                partidas.push({
                    time1: times[i],
                    time2: times[i + 1]
                });
            }
        }
    } else if (fase === 'Final') {
        // 2 times -> 1 partida final
        if (times.length >= 2) {
            partidas.push({
                time1: times[0],
                time2: times[1]
            });
        }
    } else if (fase === 'Triangular') {
        // 3 times -> 3 partidas (todos contra todos)
        if (times.length >= 3) {
            partidas.push({ time1: times[0], time2: times[1] });
            partidas.push({ time1: times[0], time2: times[2] });
            partidas.push({ time1: times[1], time2: times[2] });
        }
    }

    return partidas;
}
