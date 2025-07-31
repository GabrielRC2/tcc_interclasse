import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { name } = await request.json();
    const id = parseInt(params.id);
    
    const modalidade = await prisma.modalidade.update({
      where: { id },
      data: { nome: name }
    });
    
    return Response.json(modalidade);
  } catch (error) {
    console.error('Erro ao editar modalidade:', error);
    return Response.json({ error: 'Erro ao editar modalidade' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    await prisma.modalidade.delete({
      where: { id }
    });
    
    return Response.json({ message: 'Modalidade excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir modalidade:', error);
    return Response.json({ error: 'Erro ao excluir modalidade' }, { status: 500 });
  }
}