import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const modalidades = await prisma.modalidade.findMany();
    return Response.json(modalidades);
  } catch (error) {
    return Response.json({ error: 'Erro ao buscar modalidades' }, { status: 500 });
  }
}