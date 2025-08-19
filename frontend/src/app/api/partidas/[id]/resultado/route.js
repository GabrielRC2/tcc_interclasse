import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const partidaId = parseInt(id, 10);
        const data = await request.json();

        if (isNaN(partidaId)) {
            return Response.json({ error: "ID da partida inválido" }, { status: 400 });
        }

        // Verificar se a partida existe
        const partida = await prisma.partida.findUnique({
            where: { id: partidaId },
            include: {
                times: {
                    include: {
                        time: true
                    }
                }
            }
        });

        if (!partida) {
            return Response.json({ error: "Partida não encontrada" }, { status: 404 });
        }

        // Obter IDs dos times (casa e visitante)
        const timeCasa = partida.times.find(pt => pt.ehCasa)?.time;
        const timeVisitante = partida.times.find(pt => !pt.ehCasa)?.time;

        if (!timeCasa || !timeVisitante) {
            return Response.json({ error: "Times da partida não encontrados" }, { status: 400 });
        }

        // Atualizar resultado da partida
        const partidaAtualizada = await prisma.partida.update({
            where: { id: partidaId },
            data: {
                pontosCasa: data.pontosCasa,
                pontosVisitante: data.pontosVisitante,
                resultado: data.resultado,
                vencedorId: data.vencedorId,
                empate: data.empate
            }
        });

        console.log(`✅ Resultado atualizado: ${timeCasa.nome} ${data.pontosCasa} x ${data.pontosVisitante} ${timeVisitante.nome}`);
        if (data.empate) {
            console.log(`🤝 Resultado: EMPATE`);
        } else if (data.vencedorId === timeCasa.id) {
            console.log(`🏆 Vencedor: ${timeCasa.nome}`);
        } else {
            console.log(`🏆 Vencedor: ${timeVisitante.nome}`);
        }

        return Response.json({
            success: true,
            resultado: data.resultado,
            vencedor: data.empate ? 'Empate' : (data.vencedorId === timeCasa.id ? timeCasa.nome : timeVisitante.nome),
            partida: partidaAtualizada
        });

    } catch (error) {
        console.error("Erro ao atualizar resultado da partida:", error);
        return Response.json(
            { error: "Erro ao atualizar resultado da partida", details: error.message },
            { status: 500 }
        );
    }
}
