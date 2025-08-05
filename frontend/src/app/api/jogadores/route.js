import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeId = searchParams.get('timeId');

    if (timeId) {
      // Buscar primeiro o time para saber qual sala e gênero
      const time = await prisma.time.findUnique({
        where: { id: parseInt(timeId) },
        include: { 
          curso: true,
          categoria: true
        }
      });

      if (!time) {
        return Response.json({ error: 'Time não encontrado' }, { status: 404 });
      }

      // Buscar jogadores da MESMA SALA, MESMO CURSO E MESMO GÊNERO que NÃO estão em nenhum time da categoria
      const jogadoresDisponiveis = await prisma.jogador.findMany({
        where: {
          sala: time.sala, // MESMA SALA
          cursoId: time.cursoId, // MESMO CURSO
          genero: time.categoria.genero, // MESMO GÊNERO (usar campo genero direto)
          times: {
            none: {
              time: {
                categoriaId: time.categoriaId // NÃO está em nenhum time da mesma categoria
              }
            }
          }
        },
        include: {
          curso: true
        }
      });

      return Response.json(jogadoresDisponiveis.map(j => ({
        id: j.id,
        name: j.nome,
        sala: j.sala,
        genero: j.genero,
        course: j.curso.nome
      })));
    }

    // Buscar todos os jogadores
    const jogadores = await prisma.jogador.findMany({
      include: {
        curso: true,
        times: {
          include: {
            time: true
          }
        }
      }
    });

    return Response.json(jogadores.map(j => ({
      id: j.id,
      name: j.nome,
      sala: j.sala,
      genero: j.genero,
      course: j.curso.nome,
      teams: j.times.map(tj => tj.time.nome)
    })));

  } catch (error) {
    console.error('Erro na API jogadores:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Criando jogador:', data);

    const newJogador = await prisma.jogador.create({
      data: {
        nome: data.name,
        sala: data.sala,
        genero: data.genero, // ADICIONAR GÊNERO
        cursoId: data.cursoId
      },
      include: {
        curso: true
      }
    });

    return Response.json({
      id: newJogador.id,
      name: newJogador.nome,
      sala: newJogador.sala,
      genero: newJogador.genero,
      course: newJogador.curso.nome
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar jogador:', error);
    return Response.json({ error: 'Erro ao criar jogador' }, { status: 500 });
  }
}