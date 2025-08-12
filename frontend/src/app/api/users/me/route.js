import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// GET: Busca dados do usuário logado atual
export async function GET(request) {
  try {
    // Obter sessão do usuário logado
    const session = await getServerSession();
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Buscar dados do usuário no banco pelo email
    const usuario = await prisma.usuarios.findUnique({
      where: {
        email_usuario: session.user.email
      },
      select: {
        id_usuario: true,
        nome_usuario: true,
        email_usuario: true,
        tipo_usuario: true
      }
    });

    if (!usuario) {
      return NextResponse.json(
        { message: "Usuário não encontrado no banco de dados" },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);

  } catch (error) {
    console.error("Erro ao buscar dados do usuário atual:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
