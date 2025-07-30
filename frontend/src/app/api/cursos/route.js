import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cursos = await prisma.curso.findMany();
    return Response.json(cursos);
  } catch (error) {
    return Response.json({ error: 'Erro ao buscar cursos' }, { status: 500 });
  }
}