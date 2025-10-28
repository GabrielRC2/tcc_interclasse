import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST: Cria um novo usuário
export async function POST(request) {
  try {
    const body = await request.json();
    const { nome_usuario, email_usuario, senha, tipo_usuario } = body;

    // Validação
    if (!nome_usuario || !email_usuario || !senha || !tipo_usuario) {
      return NextResponse.json(
        { message: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    // Gera o hash da senha
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    // Mapear tipo_usuario para o enum correto
    const tipoUsuarioEnum = {
      'admin': 'ADMIN',
      'staff': 'STAFF',
      'representante': 'REPRESENTANTE'
    };

    const tipoUsuarioMapeado = tipoUsuarioEnum[tipo_usuario.toLowerCase()] || 'REPRESENTANTE';

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: nome_usuario,
        email: email_usuario,
        senhaHash: senha_hash,
        tipo: tipoUsuarioMapeado,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
      },
    });

    return NextResponse.json(novoUsuario, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Email já cadastrado." },
        { status: 409 }
      );
    }
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { message: "Não foi possível criar o usuário." },
      { status: 500 }
    );
  }
}

// GET: Retorna todos os usuários
export async function GET() {
  try {
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    if (!users || users.length === 0) {
      console.log("Nenhum usuário encontrado");
      return NextResponse.json([]);
    }

    console.log("Usuários encontrados:", users);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}