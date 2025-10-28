import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request) {
    try {
        const { torneioId, modalidadeId, genero } = await request.json();

        console.log('Limpando grupos:', { torneioId, modalidadeId, genero });

        if (!torneioId || !modalidadeId || !genero) {
            return Response.json({
                error: 'torneioId, modalidadeId e genero são obrigatórios'
            }, { status: 400 });
        }

        // 1. Buscar grupos da modalidade/gênero específicos
        const gruposExistentes = await prisma.grupo.findMany({
            where: {
                modalidadeId: parseInt(modalidadeId),
                torneioId: parseInt(torneioId),
                times: {
                    some: {
                        time: {
                            categoria: {
                                genero: genero
                            }
                        }
                    }
                }
            },
            select: { id: true, nome: true }
        });

        const gruposIds = gruposExistentes.map(g => g.id);

        if (gruposIds.length === 0) {
            return Response.json({
                message: 'Nenhum grupo encontrado para limpar',
                gruposLimpos: 0
            });
        }

        console.log(`Encontrados ${gruposIds.length} grupos para limpar:`, gruposExistentes.map(g => g.nome));

        // 2. Deletar em ordem (respeitando foreign keys)

        // 2.1. Deletar EventoPartida primeiro
        await prisma.eventoPartida.deleteMany({
            where: {
                partida: {
                    grupoId: { in: gruposIds }
                }
            }
        });
        console.log('EventosPartida deletados');

        // 2.2. Deletar PartidaTime 
        await prisma.partidaTime.deleteMany({
            where: {
                partida: {
                    grupoId: { in: gruposIds }
                }
            }
        });
        console.log('PartidaTime deletados');

        // 2.3. Deletar Partidas
        const partidasDeletadas = await prisma.partida.deleteMany({
            where: {
                grupoId: { in: gruposIds }
            }
        });
        console.log(`${partidasDeletadas.count} partidas deletadas`);

        // 2.4. Deletar GrupoTime
        const grupoTimeDeletados = await prisma.grupoTime.deleteMany({
            where: {
                grupoId: { in: gruposIds }
            }
        });
        console.log(`${grupoTimeDeletados.count} relações GrupoTime deletadas`);

        // 2.5. Finalmente deletar os grupos
        const gruposDeletados = await prisma.grupo.deleteMany({
            where: {
                id: { in: gruposIds }
            }
        });
        console.log(`${gruposDeletados.count} grupos deletados`);

        return Response.json({
            message: `${gruposDeletados.count} grupos limpos com sucesso`,
            gruposLimpos: gruposDeletados.count,
            partidasLimpas: partidasDeletadas.count,
            gruposNomes: gruposExistentes.map(g => g.nome)
        });

    } catch (error) {
        console.error('Erro ao limpar grupos:', error);
        return Response.json({
            error: 'Erro ao limpar grupos: ' + error.message
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}