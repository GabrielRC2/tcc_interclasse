import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { name, sigla } = await request.json();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    const curso = await prisma.curso.update({
      where: { id },
      data: { nome: name, sigla: sigla }
    });
    
    return Response.json(curso);
  } catch (error) {
    console.error('Erro ao editar curso:', error);
    return Response.json({ error: 'Erro ao editar curso' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    await prisma.curso.delete({
      where: { id }
    });
    
    return Response.json({ message: 'Curso excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir curso:', error);
    return Response.json({ error: 'Erro ao excluir curso' }, { status: 500 });
  }
}