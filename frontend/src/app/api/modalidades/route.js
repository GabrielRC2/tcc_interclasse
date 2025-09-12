import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const modalidades = await prisma.modalidade.findMany({
      orderBy: { nome: 'asc' }
    });
    
    return Response.json(modalidades);
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    
    const modalidade = await prisma.modalidade.create({
      data: {
        nome: name
      }
    });
    
    return Response.json(modalidade, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar modalidade:', error);
    return Response.json({ error: 'Erro ao criar modalidade' }, { status: 500 });
  }
}