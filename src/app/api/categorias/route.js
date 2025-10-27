import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { genero: 'asc' }
    });

    return Response.json(categorias);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}