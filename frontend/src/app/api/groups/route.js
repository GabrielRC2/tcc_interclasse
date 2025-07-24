import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota GET: Retorna todos os grupos com seus detalhes relacionados, incluindo os nomes dos times
export async function GET() {
  try {
    const grupos = await prisma.grupos.findMany({
      include: {
        torneio: true,      // Inclui os dados do torneio
        modalidade: true,   // Inclui os dados da modalidade
        categoria: true,    // Inclui os dados da categoria
        // Ajuste no include: Inclui as inscrições, e dentro de cada inscrição, inclui o time
        inscricoes_no_grupo: {
            include: {
                time: true // ESSENCIAL: para ter acesso ao nome do time
            }
        },
        partidas_no_grupo: true,   // Inclui as partidas relacionadas
      }
    });

    // Formatação simplificada para o JSON de saída
    const gruposFormatados = grupos.map(grupo => {
        // Mapeia as inscrições para extrair apenas o nome do time
        const nomesDosTimes = grupo.inscricoes_no_grupo.map(inscricao => inscricao.time.nome_time);

        return {
            id_grupo: grupo.id_grupo,
            nome_grupo: grupo.nome_grupo,
            nome_torneio: grupo.torneio.nome_torneio,
            nome_modalidade: grupo.modalidade.nome_modalidade,
            nome_categoria: grupo.categoria.nome_categoria,
            nomes_dos_times: nomesDosTimes, // NOVA ARRAY COM OS NOMES DOS TIMES
            quantidade_partidas: grupo.partidas_no_grupo.length // Mantém a contagem de partidas
        };
    });

    return NextResponse.json(gruposFormatados, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar grupos:", error);
    return NextResponse.json({ message: "Não foi possível buscar os grupos." }, { status: 500 });
  }
}
