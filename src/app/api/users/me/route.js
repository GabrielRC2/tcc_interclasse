import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET: Busca dados do usuário logado atual
export async function GET(request) {
  try {
    // Obter sessão do usuário logado
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Buscar dados do usuário no banco pelo email
    const usuario = await prisma.usuario.findUnique({
      where: {
        email: session.user.email
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true
      }
    });

    if (!usuario) {
      return NextResponse.json(
        { message: "Usuário não encontrado no banco de dados" },
        { status: 404 }
      );
    }

    const usuarioFormatado = {
      id_usuario: usuario.id,
      nome_usuario: usuario.nome,
      email_usuario: usuario.email,
      tipo_usuario: usuario.tipo?.toLowerCase() ?? null
    };

    return NextResponse.json(usuarioFormatado);

  } catch (error) {
    console.error("Erro ao buscar dados do usuário atual:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
