import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');

    if (!torneioId) {
      return NextResponse.json({ error: 'ID do torneio é obrigatório' }, { status: 400 });
    }

    // Buscar próximas partidas do torneio (não finalizadas)
    const proximasPartidas = await prisma.partida.findMany({
      where: {
        torneioId: parseInt(torneioId),
        status: {
          not: 'FINALIZADA'
        }
      },
      include: {
        time1: true,
        time2: true,
        modalidade: true,
        categoria: true,
        local: true
      },
      orderBy: {
        dataPartida: 'asc'
      },
      take: 10
    });

    // Formatar dados para o frontend
    const partidasFormatadas = proximasPartidas.map(partida => ({
      id: partida.id,
      team1: partida.time1?.nome || 'Time 1',
      team2: partida.time2?.nome || 'Time 2',
      date: partida.dataPartida?.toISOString() || null,
      time: partida.horaPartida || '00:00',
      location: partida.local?.nome || 'Local não definido',
      modalidade: partida.modalidade?.nome || 'Modalidade',
      categoria: partida.categoria?.nome || 'Categoria',
      status: partida.status || 'AGENDADA',
      fase: partida.fase || 'GRUPOS'
    }));

    return NextResponse.json(partidasFormatadas);
  } catch (error) {
    console.error('Erro ao buscar próximas partidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}