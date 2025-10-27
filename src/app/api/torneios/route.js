import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const torneios = await prisma.torneio.findMany({
      orderBy: { inicio: 'desc' },
      include: {
        times: true,
        grupos: {
          include: {
            times: true
          }
        },
        partidas: true,
        torneioModalidades: {
          include: {
            modalidade: true
          }
        }
      }
    });

    const torneiosFormatted = torneios.map(t => ({
      id: t.id,
      name: t.nome,
      status: t.status,
      startDate: t.inicio.toISOString().split('T')[0],
      endDate: t.fim.toISOString().split('T')[0],
      location: t.local || 'ETEC João Belarmino', // Usar o campo do banco
      modalities: t.torneioModalidades?.map(tm => tm.modalidade.nome) || [], // Usar dados reais do banco
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

// Função removida pois agora usamos dados reais do banco

export async function POST(request) {
  try {
    const { name, location, startDate, endDate, modalities, status } = await request.json();

    // Criar o torneio
    const torneio = await prisma.torneio.create({
      data: {
        nome: name,
        local: location || 'ETEC João Belarmino',
        status: status || 'PLANEJAMENTO',
        inicio: new Date(startDate),
        fim: new Date(endDate)
      }
    });

    // Formatar resposta
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
    });
  } catch (error) {
    console.error('Erro ao criar torneio:', error);
    return Response.json({ error: 'Erro ao criar torneio' }, { status: 500 });
  }
}