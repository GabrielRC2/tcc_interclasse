import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota POST: Recebe uma lista de grupos formados e os salva no DB, atribuindo inscrições.
export async function POST(request) {
  try {
    const body = await request.json();
    // Espera um corpo como:
    // {
    //   idTorneio: <ID_DO_TORNEIO>,
    //   idModalidade: <ID_DA_MODALIDADE>,
    //   idCategoria: <ID_DA_CATEGORIA>,
    //   gruposFormados: [
    //     { nome: "GRUPO A", idInscricoes: [ID_INSCRICAO_1, ID_INSCRICAO_2] },
    //     { nome: "GRUPO B", idInscricoes: [ID_INSCRICAO_3, ID_INSCRICAO_4] }
    //   ]
    // }
    const { idTorneio, idModalidade, idCategoria, gruposFormados } = body;

    // Validação básica dos dados recebidos
    if (
      !idTorneio ||
      !idModalidade ||
      !idCategoria ||
      !gruposFormados ||
      !Array.isArray(gruposFormados) ||
      gruposFormados.length === 0
    ) {
      // Retorna erro se os dados estiverem incompletos ou inválidos
      return NextResponse.json(
        { message: "Dados de formação de grupos incompletos ou inválidos." },
        { status: 400 }
      );
    }

    // Converte os IDs recebidos para número para garantir comparação correta
    const torneioIdNum = parseInt(idTorneio, 10);
    const modalidadeIdNum = parseInt(idModalidade, 10);
    const categoriaIdNum = parseInt(idCategoria, 10);

    // Usar uma transação para garantir que todas as operações sejam atômicas
    // (ou todas sucedem, ou todas falham)
    await prisma.$transaction(async (prismaTransaction) => {
      for (const grupoData of gruposFormados) {
        // ===================================================================
        // NOVO BLOCO DE VALIDAÇÃO: Inicia aqui
        // ===================================================================

        // Se não houver inscrições para processar, pula para o próximo grupo
        if (!Array.isArray(grupoData.idInscricoes) || grupoData.idInscricoes.length === 0) {
          continue;
        }

        // 1. Busca todas as inscrições que o usuário quer adicionar ao grupo
        const inscricoesParaValidar = await prismaTransaction.inscricoes.findMany({
          where: {
            id_inscricao: {
              in: grupoData.idInscricoes.map(id => parseInt(id, 10)),
            },
          },
        });

        // Garante que todas as inscrições solicitadas foram encontradas
        if (inscricoesParaValidar.length !== grupoData.idInscricoes.length) {
          // Se faltar alguma inscrição, lança erro e cancela a transação
          throw new Error("Uma ou mais IDs de inscrição não foram encontradas no banco de dados.");
        }

        // 2. Verifica cada inscrição individualmente
        for (const inscricao of inscricoesParaValidar) {
          if (
            inscricao.fk_id_torneio !== torneioIdNum ||
            inscricao.fk_id_modalidades !== modalidadeIdNum ||
            inscricao.fk_id_categoria !== categoriaIdNum
          ) {
            // 3. Se UMA inscrição for inválida, lança erro e cancela a transação
            throw new Error(
              `A inscrição com ID ${inscricao.id_inscricao} (Time ID: ${inscricao.fk_id_times}) não pertence ao mesmo torneio, modalidade ou categoria do grupo.`
            );
          }
        }

        // ===================================================================
        // FIM DO BLOCO DE VALIDAÇÃO: Se chegou aqui, todas as inscrições são válidas
        // ===================================================================

        // 4. Cria o Grupo no DB
        const novoGrupo = await prismaTransaction.grupos.create({
          data: {
            nome_grupo: grupoData.nome,
            fk_id_torneio: torneioIdNum,
            fk_id_modalidades: modalidadeIdNum,
            fk_id_categoria: categoriaIdNum,
          },
        });

        // 5. Atualiza as Inscrições para vincular ao novo Grupo
        if (Array.isArray(grupoData.idInscricoes) && grupoData.idInscricoes.length > 0) {
          await prismaTransaction.inscricoes.updateMany({
            where: {
              id_inscricao: {
                in: grupoData.idInscricoes.map(id => parseInt(id, 10)),
              },
            },
            data: {
              fk_id_grupo: novoGrupo.id_grupo, // Atribui o ID do grupo recém-criado
            },
          });
        }
      }
    });

    // Se tudo deu certo, retorna mensagem de sucesso
    return NextResponse.json(
      { message: "Grupos formados e inscrições atribuídas com sucesso!" },
      { status: 201 }
    );

  } catch (error) {
    // Se for erro de validação, retorna status 400 e a mensagem específica do erro
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    // Erros de foreign key, etc., serão capturados aqui
    console.error("Erro ao formar grupos:", error);
    return NextResponse.json(
      { message: "Não foi possível formar os grupos e atribuir inscrições." },
      { status: 500 }
    );
  }
}