import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const locais = await prisma.local.findMany({
      orderBy: { nome: 'asc' }
    });
    
    return Response.json(locais);
  } catch (error) {
    console.error('Erro ao buscar locais:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    
    const local = await prisma.local.create({
      data: {
        nome: name
      }
    });
    
    return Response.json(local, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar local:', error);
    return Response.json({ error: 'Erro ao criar local' }, { status: 500 });
  }
}