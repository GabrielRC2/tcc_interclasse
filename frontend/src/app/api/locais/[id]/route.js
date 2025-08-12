import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { name } = await request.json();
    const id = parseInt(params.id);
    
    const local = await prisma.local.update({
      where: { id },
      data: { nome: name }
    });
    
    return Response.json(local);
  } catch (error) {
    console.error('Erro ao editar local:', error);
    return Response.json({ error: 'Erro ao editar local' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    await prisma.local.delete({
      where: { id }
    });
    
    return Response.json({ message: 'Local excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir local:', error);
    return Response.json({ error: 'Erro ao excluir local' }, { status: 500 });
  }
}