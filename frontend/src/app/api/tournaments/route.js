import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota GET: Retorna todos os torneios
export async function GET() {
  try {
    const torneios = await prisma.torneio.findMany();
    return NextResponse.json(torneios, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar torneios:", error);
    return NextResponse.json({ message: "Não foi possível buscar os torneios." }, { status: 500 });
  }
}

// Rota POST: Cria um novo torneio
export async function POST(request) {
  try {
    const body = await request.json();
    const { nome_torneio, inicio_torneio, fim_torneio, status_torneio } = body;

    // 1. Validação
    if (!nome_torneio || !inicio_torneio || !fim_torneio) {
      return NextResponse.json({ message: "Nome e datas de início/fim são obrigatórios." }, { status: 400 });
    }

    // 2. Criação do torneio no banco de dados
    const novoTorneio = await prisma.torneio.create({
      data: {
        nome_torneio,
        inicio_torneio: new Date(inicio_torneio), // Converte a string de data para um objeto Date
        fim_torneio: new Date(fim_torneio),     // Converte a string de data para um objeto Date
        status_torneio: status_torneio || "Planejamento", // Usa o status fornecido ou o padrão
      },
    });

    return NextResponse.json(novoTorneio, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Este torneio já existe." }, { status: 409 });
    }
    console.error("Erro ao criar torneio:", error);
    return NextResponse.json({ message: "Não foi possível criar o torneio." }, { status: 500 });
  }
}