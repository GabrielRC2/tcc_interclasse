import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('Tentando buscar times...');
    
    const times = await prisma.time.findMany({
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

    console.log('Times encontrados:', times.length);

    if (times.length === 0) {
      return Response.json([]);
    }

    const teamsFormatted = times.map(time => ({
      id: time.id,
      name: time.nome,
      course: time.curso?.nome || 'Curso não definido',
      year: time.sala || "1º", // CORRIGIDO: usar sala do time
      gender: time.categoria?.nome || 'Categoria não definida',
      sport: time.categoria?.modalidade?.nome || 'Modalidade não definida',
      playersCount: time.jogadores?.length || 0,
      players: time.jogadores?.map(tj => ({
        id: tj.jogador.id,
        name: tj.jogador.nome,
        number: tj.numeroCamisa, // ADICIONADO: número da camisa
        points: 0,
        red: 0,
        yellow: 0
      })) || []
    }));

    return Response.json(teamsFormatted);
  } catch (error) {
    console.error('Erro detalhado na API teams:', error);
    
    if (error.code === 'P1001' || error.code === 'P1000') {
      console.log('Problema de conexão com banco - retornando array vazio');
      return Response.json([]);
    }
    
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Dados recebidos para criar time:', data);
    
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
      console.log('Curso criado:', curso);
    }

    // Buscar ou criar modalidade
    let modalidade = await prisma.modalidade.findFirst({
      where: { nome: data.sport }
    });
    
    if (!modalidade) {
      modalidade = await prisma.modalidade.create({
        data: { nome: data.sport }
      });
      console.log('Modalidade criada:', modalidade);
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
      console.log('Categoria criada:', categoria);
    }

    // Criar time
    const newTime = await prisma.time.create({
      data: {
        nome: data.name,
        sala: data.year, // Ex: "3º", "2º", "1º"
        cursoId: curso.id,
        categoriaId: categoria.id
      },
      include: {
        curso: true,
        categoria: {
          include: {
            modalidade: true
          }
        }
      }
    });

    console.log('Time criado com sucesso:', newTime);

    const teamFormatted = {
      id: newTime.id,
      name: newTime.nome,
      course: newTime.curso.nome,
      year: data.year,
      gender: newTime.categoria.nome,
      sport: newTime.categoria.modalidade.nome,
      playersCount: 0,
      players: []
    };

    return Response.json(teamFormatted, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar time:', error);
    return Response.json({ 
      error: 'Erro ao criar time',
      details: error.message 
    }, { status: 500 });
  }
}