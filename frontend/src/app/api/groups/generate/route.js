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

    if (!idTorneio || !idModalidade || !idCategoria || !gruposFormados || !Array.isArray(gruposFormados) || gruposFormados.length === 0) {
      return NextResponse.json({ message: "Dados de formação de grupos incompletos ou inválidos." }, { status: 400 });
    }

    // Usar uma transação para garantir que todas as operações sejam atômicas
    // (ou todas sucedem, ou todas falham)
    await prisma.$transaction(async (prismaTransaction) => {
      for (const grupoData of gruposFormados) {
        // 1. Cria o Grupo no DB
        const novoGrupo = await prismaTransaction.grupos.create({
          data: {
            nome_grupo: grupoData.nome,
            fk_id_torneio: parseInt(idTorneio, 10),
            fk_id_modalidades: parseInt(idModalidade, 10),
            fk_id_categoria: parseInt(idCategoria, 10),
          },
        });

        // 2. Atualiza as Inscrições para vincular ao novo Grupo
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

    return NextResponse.json({ message: "Grupos formados e inscrições atribuídas com sucesso!" }, { status: 201 });

  } catch (error) {
    console.error("Erro ao formar grupos:", error);
    // Erros de foreign key, etc., serão capturados aqui
    return NextResponse.json({ message: "Não foi possível formar os grupos e atribuir inscrições." }, { status: 500 });
  }
}