import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const torneios = await prisma.torneio.findMany({
      orderBy: { inicio: 'desc' },
      include: {
        grupos: {
          include: {
            times: true
          }
        },
        partidas: true
      }
    });

    const torneiosFormatted = torneios.map(t => ({
      id: t.id,
      name: t.nome,
      status: t.status,
      startDate: t.inicio.toISOString().split('T')[0],
      endDate: t.fim.toISOString().split('T')[0],
      location: 'ETEC João Belarmino', // Fixo por enquanto
      modalities: 'Futsal, Vôlei, Basquete, Handebol', // Pode ser dinâmico depois
      teamsCount: t.grupos.reduce((acc, g) => acc + g.times.length, 0),
      matchesTotal: t.partidas.length,
      matchesPlayed: t.partidas.filter(p => p.statusPartida === 'FINALIZADA').length
    }));

    return Response.json(torneiosFormatted);
  } catch (error) {
    console.error('Erro ao buscar torneios:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, location, startDate, endDate, modalities } = await request.json();

    const torneio = await prisma.torneio.create({
      data: {
        nome: name,
        status: 'PLANEJAMENTO',
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
      modalities: modalities,
      teamsCount: 0,
      matchesTotal: 0,
      matchesPlayed: 0
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar torneio:', error);
    return Response.json({ error: 'Erro ao criar torneio' }, { status: 500 });
  }
}