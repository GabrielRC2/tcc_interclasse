import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');

    let whereClause = {};
    if (torneioId) {
      whereClause.torneioId = parseInt(torneioId);
    }

    const times = await prisma.time.findMany({
      where: whereClause,
      include: {
        curso: true,
        categoria: {
          include: {
            modalidade: true
          }
        },
        torneio: true,
        jogadores: {
          include: {
            jogador: true
          }
        }
      },
      orderBy: { nome: 'asc' }
    });

    const timesFormatted = times.map(t => ({
      id: t.id,
      name: t.nome,
      course: t.curso.nome,
      year: t.sala,
      gender: t.categoria.nome.includes('Masculino') ? 'Masculino' : 'Feminino',
      sport: t.categoria.modalidade?.nome || 'N/A',
      playersCount: t.jogadores.length,
      torneio: t.torneio.nome,
      players: t.jogadores.map(tj => ({
        id: tj.jogador.id,
        name: tj.jogador.nome,
        numero: tj.numeroCamisa,
        genero: tj.jogador.genero,
        sala: tj.jogador.sala
      }))
    }));

    return Response.json(timesFormatted);
  } catch (error) {
    console.error('Erro ao buscar times:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Dados recebidos para criar time:', data);

    const { course, year, gender, sport, torneioId } = data;

    if (!torneioId) {
      return Response.json({ error: 'Torneio é obrigatório' }, { status: 400 });
    }

    // Buscar curso
    let curso = await prisma.curso.findFirst({
      where: {
        OR: [
          { nome: course },
          { sigla: course }
        ]
      }
    });

    if (!curso) {
      // Se não encontrar, criar com sigla baseada no nome
      const sigla = course.length > 5 ? course.substring(0, 5).toUpperCase() : course.toUpperCase();
      curso = await prisma.curso.create({
        data: {
          nome: course,
          sigla: sigla
        }
      });
    }

    // Buscar modalidade
    let modalidade = await prisma.modalidade.findFirst({
      where: { nome: sport }
    });

    if (!modalidade) {
      modalidade = await prisma.modalidade.create({
        data: { nome: sport }
      });
    }

    // Buscar ou criar categoria
    let categoria = await prisma.categoria.findFirst({
      where: {
        modalidadeId: modalidade.id,
        genero: gender
      }
    });

    if (!categoria) {
      categoria = await prisma.categoria.create({
        data: {
          nome: `${gender} - ${sport}`,
          genero: gender,
          modalidadeId: modalidade.id
        }
      });
    }

    // Gerar nome do time
    const teamName = `${year}${curso.sigla}`;

    // Verificar se time já existe neste torneio
    const existingTeam = await prisma.time.findFirst({
      where: {
        nome: teamName,
        categoriaId: categoria.id,
        torneioId: parseInt(torneioId)
      }
    });

    if (existingTeam) {
      return Response.json({ error: 'Time já existe neste torneio' }, { status: 400 });
    }

    // Criar time
    const time = await prisma.time.create({
      data: {
        nome: teamName,
        sala: year,
        cursoId: curso.id,
        categoriaId: categoria.id,
        torneioId: parseInt(torneioId)
      },
      include: {
        curso: true,
        categoria: {
          include: {
            modalidade: true
          }
        },
        torneio: true
      }
    });

    return Response.json({
      id: time.id,
      name: time.nome,
      course: time.curso.nome,
      year: time.sala,
      gender: time.categoria.genero,
      sport: time.categoria.modalidade.nome,
      playersCount: 0,
      torneio: time.torneio.nome
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar time:', error);
    return Response.json({ error: 'Erro ao criar time' }, { status: 500 });
  }
}