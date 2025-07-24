import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
      try {
    // 1. Usa o Prisma para buscar todos os registros na tabela 'times'.
    // O 'findMany()' retorna uma lista de todos os times encontrados.
    const locais = await prisma.locais.findMany();

    // 2. Retorna os times encontrados como uma resposta JSON com status 200 (OK).
    // NextResponse.json() é a forma padrão do Next.js de criar respostas de API.
    return NextResponse.json(locais, { status: 200 });

  } catch (error) {
    // 3. Se ocorrer qualquer erro no bloco 'try', o 'catch' é executado.
    console.error("Erro ao buscar locais:", error); // Mostra o erro no console do servidor para depuração.
    
    // Retorna uma mensagem de erro com status 500 (Erro Interno do Servidor).
    return NextResponse.json({ message: "Não foi possível buscar os locais." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    // A página RegistrationsPage.jsx tem um campo de nome e descrição
    // A tabela Locais no banco de dados tem um campo de nome_local
    // O campo de descrição não existe, então vamos pegar apenas o nome.
    const { nome_local } = body;

    // Validação básica para garantir que o nome foi fornecido
    if (!nome_local) {
      return NextResponse.json({ message: "O nome do local é obrigatório." }, { status: 400 });
    }

    // Tenta criar o novo local no banco de dados
    const novoLocal = await prisma.locais.create({
      data: {
        nome_local: nome_local,
      },
    });

    // Retorna uma resposta de sucesso
    return NextResponse.json(novoLocal, { status: 201 });

  } catch (error) {
    // Verifica se o erro é por causa de um nome duplicado
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Este local já existe." }, { status: 409 });
    }
    
    console.error("Erro ao cadastrar local:", error);
    return NextResponse.json({ message: "Não foi possível cadastrar o local." }, { status: 500 });
  }
}