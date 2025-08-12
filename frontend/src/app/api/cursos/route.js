import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cursos = await prisma.curso.findMany({
      orderBy: { nome: 'asc' }
    });
    
    return Response.json(cursos);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, sigla } = await request.json();
    
    const curso = await prisma.curso.create({
      data: {
        nome: name,
        sigla: sigla
      }
    });
    
    return Response.json(curso, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    return Response.json({ error: 'Erro ao criar curso' }, { status: 500 });
  }
}