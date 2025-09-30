import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const timeId = parseInt(params.id);

    const time = await prisma.time.findUnique({
      where: { id: timeId },
      include: {
        curso: true,
        categoria: {
          include: {
            modalidade: true
          }
        },
        jogadores: {
          include: {
            jogador: {
              include: {
                curso: true
              }
            }
          }
        }
      }
    });

    if (!time) {
      return Response.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    const teamFormatted = {
      id: time.id,
      name: time.nome,
      course: time.curso.nome,
      year: time.sala,
      gender: time.categoria.nome,
      sport: time.categoria.modalidade.nome,
      playersCount: time.jogadores.length,
      players: time.jogadores.map(tj => ({
        id: tj.jogador.id,
        name: tj.jogador.nome,
        numero: tj.numeroCamisa,
        sala: tj.jogador.sala,
        genero: tj.jogador.genero,
        course: tj.jogador.curso?.nome || '',
        points: 0,
        red: 0,
        yellow: 0
      }))
    };

    return Response.json(teamFormatted);
  } catch (error) {
    console.error('Erro ao buscar time:', error);
    return Response.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const timeId = parseInt(params.id);

    // Verificar se o time existe
    const time = await prisma.time.findUnique({
      where: { id: timeId }
    });

    if (!time) {
      return Response.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    // Primeiro, remover todos os jogadores do time
    await prisma.timeJogador.deleteMany({
      where: { timeId: timeId }
    });

    // Depois, deletar o time
    await prisma.time.delete({
      where: { id: timeId }
    });

    return Response.json({ message: 'Time excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir time:', error);
    return Response.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const timeId = parseInt(params.id);
    const data = await request.json();

    console.log('Editando time:', { timeId, data });

    // Buscar ou criar curso
    let curso = await prisma.curso.findFirst({
      where: { nome: data.course }
    });

    if (!curso) {
      curso = await prisma.curso.create({
        data: {
          nome: data.course,
          sigla: data.course.substring(0, 5).toUpperCase()
        }
      });
    }

    // Buscar ou criar modalidade
    let modalidade = await prisma.modalidade.findFirst({
      where: { nome: data.sport }
    });

    if (!modalidade) {
      modalidade = await prisma.modalidade.create({
        data: { nome: data.sport }
      });
    }

    // Buscar ou criar categoria
    let categoria = await prisma.categoria.findFirst({
      where: {
        nome: data.gender,
        modalidadeId: modalidade.id
      }
    });

    if (!categoria) {
      categoria = await prisma.categoria.create({
        data: {
          nome: data.gender,
          modalidadeId: modalidade.id
        }
      });
    }

    // Atualizar o time
    const updatedTime = await prisma.time.update({
      where: { id: timeId },
      data: {
        nome: data.name,
        sala: data.year,
        cursoId: curso.id,
        categoriaId: categoria.id
      },
      include: {
        curso: true,
        categoria: {
          include: {
            modalidade: true
          }
        },
        jogadores: {
          include: {
            jogador: true
          }
        }
      }
    });

    const teamFormatted = {
      id: updatedTime.id,
      name: updatedTime.nome,
      course: updatedTime.curso.nome,
      year: updatedTime.sala,
      gender: updatedTime.categoria.nome,
      sport: updatedTime.categoria.modalidade.nome,
      playersCount: updatedTime.jogadores.length,
      players: updatedTime.jogadores.map(tj => ({
        id: tj.jogador.id,
        name: tj.jogador.nome,
        number: tj.numeroCamisa,
        points: 0,
        red: 0,
        yellow: 0
      }))
    };

    return Response.json(teamFormatted);
  } catch (error) {
    console.error('Erro ao editar time:', error);
    return Response.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}