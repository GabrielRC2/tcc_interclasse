import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota GET: Retorna todas as inscrições OU inscrições filtradas por Torneio, Modalidade e Categoria
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fk_id_torneio = searchParams.get('idTorneio');
    const fk_id_modalidades = searchParams.get('idModalidade');
    const fk_id_categoria = searchParams.get('idCategoria');

    const whereClause = {};

    // Adiciona filtros se os parâmetros forem fornecidos
    if (fk_id_torneio) {
      whereClause.fk_id_torneio = parseInt(fk_id_torneio, 10);
    }
    if (fk_id_modalidades) {
      whereClause.fk_id_modalidades = parseInt(fk_id_modalidades, 10);
    }
    if (fk_id_categoria) {
      whereClause.fk_id_categoria = parseInt(fk_id_categoria, 10);
    }

    const inscricoes = await prisma.inscricoes.findMany({
      where: whereClause, // Aplica os filtros
      include: {
        torneio: true,
        time: true,
        modalidade: true,
        categoria: true,
        grupo: true,
        partidas_jogadas: {
            include: {
                partida: true
            }
        }
      }
    });

    const inscricoesFormatadas = inscricoes.map(inscricao => {
      const nomeDoGrupo = inscricao.grupo ? inscricao.grupo.nome_grupo : null;
      const partidasFormatadas = inscricao.partidas_jogadas.map(pj => ({
        id_partida: pj.partida.id_partidas,
        status_partida: pj.partida.status_partida,
        identificador_time: pj.identificador_time
        // Adicione outros campos da partida se necessário
      }));

      return {
        id_inscricao: inscricao.id_inscricao,
        nome_torneio: inscricao.torneio.nome_torneio,
        nome_time: inscricao.time.nome_time,
        nome_modalidade: inscricao.modalidade.nome_modalidade,
        nome_categoria: inscricao.categoria.nome_categoria,
        nome_grupo: nomeDoGrupo,
        partidas_jogadas: partidasFormatadas,
      };
    });

    return NextResponse.json(inscricoesFormatadas, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar inscrições:", error);
    return NextResponse.json({ message: "Não foi possível buscar as inscrições." }, { status: 500 });
  }
}

// ... (A função POST para inscrições permanece inalterada)

// Rota POST: Cria uma nova inscrição
export async function POST(request) {
  try {
    const body = await request.json();
    const { fk_id_torneio, fk_id_times, fk_id_modalidades, fk_id_categoria, fk_id_grupo } = body;

    // 1. Validação dos campos obrigatórios
    if (!fk_id_torneio || !fk_id_times || !fk_id_modalidades || !fk_id_categoria) {
      return NextResponse.json({ message: "Todos os IDs (torneio, time, modalidade, categoria) são obrigatórios para a inscrição." }, { status: 400 });
    }

    // 2. Converte IDs para inteiros
    const inscricao = {
      fk_id_torneio: parseInt(fk_id_torneio, 10),
      fk_id_times: parseInt(fk_id_times, 10),
      fk_id_modalidades: parseInt(fk_id_modalidades, 10),
      fk_id_categoria: parseInt(fk_id_categoria, 10),
      fk_id_grupo: fk_id_grupo ? parseInt(fk_id_grupo, 10) : null // fk_id_grupo é opcional
    };

    // 3. Cria a nova inscrição no banco de dados
    const novaInscricao = await prisma.inscricoes.create({
      data: inscricao,
    });

    return NextResponse.json(novaInscricao, { status: 201 });
  } catch (error) {
    // Erro de unicidade: uma inscrição para a mesma combinação já existe
    if (error.code === 'P2002' && error.meta?.target === 'inscricao_unica') {
      return NextResponse.json({ message: "Este time já está inscrito neste torneio, modalidade e categoria." }, { status: 409 });
    }
    console.error("Erro ao criar inscrição:", error);
    return NextResponse.json({ message: "Não foi possível criar a inscrição." }, { status: 500 });
  }
}