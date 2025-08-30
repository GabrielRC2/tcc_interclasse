import { PrismaClient } from '@prisma/client';
import { obterClassificacao } from "@/utils/pontuacaoTorneio";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');
    const grupoId = searchParams.get('grupoId');

    if (!torneioId) {
      return Response.json({ error: "torneioId é obrigatório" }, { status: 400 });
    }

    const classificacao = await obterClassificacao(
      prisma, 
      parseInt(torneioId), 
      grupoId ? parseInt(grupoId) : null
    );

    return Response.json({ classificacao });

  } catch (error) {
    console.error("Erro ao buscar classificação:", error);
    return Response.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}
