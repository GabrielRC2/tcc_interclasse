import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Listar modalidades de um torneio
export async function GET(request, { params }) {
  try {
    const { torneioId } = await params;
    
    const torneioModalidades = await prisma.torneioModalidade.findMany({
      where: { torneioId: parseInt(torneioId) },
      include: {
        modalidade: true
      }
    });

    return Response.json(
      torneioModalidades.map(tm => ({
        id: tm.id,
        modalidadeId: tm.modalidade.id,
        nome: tm.modalidade.nome
      }))
    );
  } catch (error) {
    console.error('Erro ao buscar modalidades do torneio:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Adicionar modalidade ao torneio
export async function POST(request, { params }) {
  try {
    const { torneioId } = await params;
    const { modalidadeId } = await request.json();

    // Verificar se a associação já existe
    const existente = await prisma.torneioModalidade.findFirst({
      where: {
        torneioId: parseInt(torneioId),
        modalidadeId: parseInt(modalidadeId)
      }
    });

    if (existente) {
      return Response.json({ error: 'Esta modalidade já está cadastrada neste torneio' }, { status: 400 });
    }

    // Criar associação
    const torneioModalidade = await prisma.torneioModalidade.create({
      data: {
        torneioId: parseInt(torneioId),
        modalidadeId: parseInt(modalidadeId)
      },
      include: {
        modalidade: true
      }
    });

    return Response.json({
      id: torneioModalidade.id,
      modalidadeId: torneioModalidade.modalidade.id,
      nome: torneioModalidade.modalidade.nome
    });
  } catch (error) {
    console.error('Erro ao adicionar modalidade ao torneio:', error);
    return Response.json({ error: 'Erro ao adicionar modalidade' }, { status: 500 });
  }
}

// DELETE - Remover modalidade do torneio
export async function DELETE(request, { params }) {
  try {
    const { torneioId } = await params;
    const url = new URL(request.url);
    const modalidadeId = url.searchParams.get('modalidadeId');

    if (!modalidadeId) {
      return Response.json({ error: 'ID da modalidade não fornecido' }, { status: 400 });
    }

    // Verificar se existem partidas cadastradas para essa modalidade no torneio
    const partidasExistentes = await prisma.partida.count({
      where: {
        torneioId: parseInt(torneioId),
        modalidadeId: parseInt(modalidadeId)
      }
    });

    if (partidasExistentes > 0) {
      return Response.json({ 
        error: `Não é possível remover esta modalidade. Existem ${partidasExistentes} partida(s) cadastrada(s).` 
      }, { status: 400 });
    }

    // Remover associação
    await prisma.torneioModalidade.deleteMany({
      where: {
        torneioId: parseInt(torneioId),
        modalidadeId: parseInt(modalidadeId)
      }
    });

    return Response.json({ message: 'Modalidade removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover modalidade do torneio:', error);
    return Response.json({ error: 'Erro ao remover modalidade' }, { status: 500 });
  }
}
