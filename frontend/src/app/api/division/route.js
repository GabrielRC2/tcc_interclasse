import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota GET: Retorna todos os torneios
export async function GET() {
  try {
    const categorias = await prisma.categorias.findMany();
    return NextResponse.json(categorias, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json({ message: "Não foi possível buscar as categorias." }, { status: 500 });
  }
}

// Rota POST: Cria um novo torneio
export async function POST(request) {
  try {
    const body = await request.json();
    const { nome_categoria } = body;

    // 1. Validação
    if (!nome_categoria) {
      return NextResponse.json({ message: "Nome da categoria é obrigatório." }, { status: 400 });
    }

    // 2. Criação do torneio no banco de dados
    const novaCategoria = await prisma.categorias.create({
      data: { nome_categoria, },
    });

    return NextResponse.json(novaCategoria, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Esta categoria já existe." }, { status: 409 });
    }
    console.error("Erro ao criar torneio:", error);
    return NextResponse.json({ message: "Não foi possível criar a categoria." }, { status: 500 });
  }
}