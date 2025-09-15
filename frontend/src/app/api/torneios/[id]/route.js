import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { name, location, startDate, endDate, modalities } = await request.json();
    const id = parseInt(params.id);

    const torneio = await prisma.torneio.update({
      where: { id },
      data: {
        nome: name,
        inicio: new Date(startDate),
        fim: new Date(endDate)
      }
    });

    return Response.json({
      id: torneio.id,
      name: torneio.nome,
      status: torneio.status,
      startDate: torneio.inicio.toISOString().split('T')[0],
      endDate: torneio.fim.toISOString().split('T')[0],
      location: location,
      modalities: modalities
    });
  } catch (error) {
    console.error('Erro ao editar torneio:', error);
    return Response.json({ error: 'Erro ao editar torneio' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);

    // Verificar se tem dados relacionados
    const torneioComDados = await prisma.torneio.findUnique({
      where: { id },
      include: {
        grupos: true,
        partidas: true
      }
    });

    if (torneioComDados.grupos.length > 0 || torneioComDados.partidas.length > 0) {
      return Response.json({ 
        error: 'Não é possível excluir torneio com grupos ou partidas cadastradas' 
      }, { status: 400 });
    }

    await prisma.torneio.delete({
      where: { id }
    });

    return Response.json({ message: 'Torneio excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir torneio:', error);
    return Response.json({ error: 'Erro ao excluir torneio' }, { status: 500 });
  }
}