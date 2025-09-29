import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const torneios = await prisma.torneio.findMany({
      orderBy: { inicio: 'desc' },
      include: {
        times: true, // INCLUIR TIMES PARA CONTAGEM
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
      location: t.local || 'ETEC João Belarmino', // Usar o campo do banco
      modalities: getModalitiesByName(t.nome), // FUNÇÃO HELPER
      teamsCount: t.times?.length || 0, // CONTAGEM REAL DE TIMES
      matchesTotal: t.partidas?.length || 0,
      matchesPlayed: t.partidas?.filter(p => p.statusPartida === 'FINALIZADA').length || 0
    }));

    return Response.json(torneiosFormatted);
  } catch (error) {
    console.error('Erro ao buscar torneios:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ADICIONAR FUNÇÃO HELPER:
function getModalitiesByName(nome) {
  if (nome === 'Meio do Ano') return 'Vôlei, Handebol';
  if (nome === 'Fim de Ano') return 'Futsal, Basquete';
  return 'Futsal, Vôlei, Basquete, Handebol'; // Fallback
}

export async function POST(request) {
  try {
    const { name, location, startDate, endDate, modalities, status } = await request.json();

    // Extrair o ano da data de início para adicionar ao nome
    const startYear = new Date(startDate).getFullYear();
    const nomeComAno = `${name} ${startYear}`;

    const torneio = await prisma.torneio.create({
      data: {
        nome: nomeComAno,
        local: location || 'ETEC João Belarmino',
        status: status || 'PLANEJAMENTO',
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
      location: torneio.local,
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