import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET: Busca um usuário específico
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const idUsuario = parseInt(id, 10);

    if (isNaN(idUsuario)) {
      return NextResponse.json(
        { message: "ID inválido." },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: idUsuario },
      select: {
        id_usuario: true,
        nome_usuario: true,
        email_usuario: true,
        tipo_usuario: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { message: "Não foi possível buscar o usuário." },
      { status: 500 }
    );
  }
}

// PUT: Atualiza um usuário
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const idUsuario = parseInt(id, 10);
    const body = await request.json();
    const { nome_usuario, email_usuario, senha, tipo_usuario } = body;

    if (isNaN(idUsuario)) {
      return NextResponse.json(
        { message: "ID inválido." },
        { status: 400 }
      );
    }

    const data = {
      ...(nome_usuario && { nome_usuario }),
      ...(email_usuario && { email_usuario }),
      ...(tipo_usuario && { tipo_usuario }),
    };

    if (senha) {
      const salt = await bcrypt.genSalt(10);
      data.senha_hash = await bcrypt.hash(senha, salt);
    }

    const usuarioAtualizado = await prisma.usuarios.update({
      where: { id_usuario: idUsuario },
      data,
      select: {
        id_usuario: true,
        nome_usuario: true,
        email_usuario: true,
        tipo_usuario: true,
      },
    });

    return NextResponse.json(usuarioAtualizado, { status: 200 });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 }
      );
    }
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { message: "Não foi possível atualizar o usuário." },
      { status: 500 }
    );
  }
}

// DELETE: Remove um usuário
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const idUsuario = parseInt(id, 10);

    if (isNaN(idUsuario)) {
      return NextResponse.json(
        { message: "ID inválido." },
        { status: 400 }
      );
    }

    await prisma.usuarios.delete({
      where: { id_usuario: idUsuario },
    });

    return NextResponse.json(
      { message: "Usuário removido com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 }
      );
    }
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json(
      { message: "Não foi possível deletar o usuário." },
      { status: 500 }
    );
  }
}