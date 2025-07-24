import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
      try {
    // 1. Usa o Prisma para buscar todos os registros na tabela 'times'.
    // O 'findMany()' retorna uma lista de todos os times encontrados.
    const esportes = await prisma.modalidades.findMany();

    // 2. Retorna os times encontrados como uma resposta JSON com status 200 (OK).
    // NextResponse.json() é a forma padrão do Next.js de criar respostas de API.
    return NextResponse.json(esportes, { status: 200 });

  } catch (error) {
    // 3. Se ocorrer qualquer erro no bloco 'try', o 'catch' é executado.
    console.error("Erro ao buscar os esportes:", error); // Mostra o erro no console do servidor para depuração.
    
    // Retorna uma mensagem de erro com status 500 (Erro Interno do Servidor).
    return NextResponse.json({ message: "Não foi possível buscar os esportes." }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    const body = await request.json();
    // A página RegistrationsPage.jsx tem um campo de nome e descrição
    // A tabela Modalidades no banco de dados tem um campo de nome_modalidade
    // O campo de descrição não existe, então vamos pegar apenas o nome.
    const { nome_modalidade } = body; 

    // Validação básica para garantir que o nome foi fornecido
    if (!nome_modalidade) {
      return NextResponse.json({ message: "O nome da modalidade é obrigatório." }, { status: 400 });
    }

    // Tenta criar a nova modalidade no banco de dados
    const novaModalidade = await prisma.modalidades.create({
      data: {
        nome_modalidade: nome_modalidade,
      },
    });

    // Retorna uma resposta de sucesso
    return NextResponse.json(novaModalidade, { status: 201 });

  } catch (error) {
    // Verifica se o erro é por causa de um nome duplicado (erro de unicidade do MySQL/Prisma)
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Esta modalidade já existe." }, { status: 409 });
    }
    
    console.error("Erro ao cadastrar modalidade:", error);
    return NextResponse.json({ message: "Não foi possível cadastrar a modalidade." }, { status: 500 });
  }
}