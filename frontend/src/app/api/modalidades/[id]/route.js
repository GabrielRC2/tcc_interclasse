import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { name } = await request.json();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

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
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    // Deletar em ordem hierárquica para evitar foreign key constraint
    console.log(`🗑️ Iniciando exclusão da modalidade ID ${id}`);

    // 1. Deletar eventos das partidas relacionadas
    const partidas = await prisma.partida.findMany({
      where: { modalidadeId: id }
    });

    for (const partida of partidas) {
      await prisma.eventoPartida.deleteMany({
        where: { partidaId: partida.id }
      });
    }

    // 2. Deletar PartidaTime (relacionamento partida-time)
    await prisma.partidaTime.deleteMany({
      where: {
        partida: { modalidadeId: id }
      }
    });

    // 3. Deletar Partidas
    await prisma.partida.deleteMany({
      where: { modalidadeId: id }
    });

    // 4. Deletar GrupoTime (relacionamento grupo-time)
    await prisma.grupoTime.deleteMany({
      where: {
        grupo: { modalidadeId: id }
      }
    });

    // 5. Deletar Grupos
    await prisma.grupo.deleteMany({
      where: { modalidadeId: id }
    });

    // 6. Deletar Times (via categoria)
    await prisma.timeJogador.deleteMany({
      where: {
        time: {
          categoria: { modalidadeId: id }
        }
      }
    });

    await prisma.time.deleteMany({
      where: {
        categoria: { modalidadeId: id }
      }
    });

    // 7. Deletar Categorias
    await prisma.categoria.deleteMany({
      where: { modalidadeId: id }
    });

    // 8. Deletar relacionamentos auxiliares
    await prisma.torneioModalidade.deleteMany({
      where: { modalidadeId: id }
    });

    await prisma.localModalidade.deleteMany({
      where: { modalidadeId: id }
    });

    // 9. Finalmente, deletar a Modalidade
    await prisma.modalidade.delete({
      where: { id }
    });

    console.log(`✅ Modalidade ${id} excluída com sucesso`);
    return Response.json({ message: 'Modalidade excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir modalidade:', error);
    return Response.json({ error: 'Erro ao excluir modalidade' }, { status: 500 });
  }
}
