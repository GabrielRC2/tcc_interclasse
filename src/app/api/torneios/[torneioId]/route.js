import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { name, location, startDate, endDate, modalities, status } = await request.json();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.torneioId);

    // Extrair o ano da data de início se necessário
    const startYear = new Date(startDate).getFullYear();
    const nomeComAno = name.includes(startYear.toString()) ? name : `${name} ${startYear}`;

    const torneio = await prisma.torneio.update({
      where: { id },
      data: {
        nome: nomeComAno,
        local: location || 'ETEC João Belarmino',
        inicio: new Date(startDate),
        fim: new Date(endDate),
        status: status || 'PLANEJAMENTO'
      }
    });

    return NextResponse.json({
      id: torneio.id,
      name: torneio.nome,
      status: torneio.status,
      startDate: torneio.inicio.toISOString().split('T')[0],
      endDate: torneio.fim.toISOString().split('T')[0],
      location: torneio.local,
      modalities: modalities
    });
  } catch (error) {
    console.error('Erro ao editar torneio:', error);
    return NextResponse.json({ error: 'Erro ao editar torneio' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.torneioId);

    // Verificar se tem dados relacionados
    const torneioComDados = await prisma.torneio.findUnique({
      where: { id },
      include: {
        grupos: true,
        partidas: true
      }
    });

    if (torneioComDados.grupos.length > 0 || torneioComDados.partidas.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir torneio com grupos ou partidas cadastradas' 
      }, { status: 400 });
    }

    await prisma.torneio.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Torneio excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir torneio:', error);
    return NextResponse.json({ error: 'Erro ao excluir torneio' }, { status: 500 });
  }
}

async function getProximaAcao(torneioId, modalidadeId, genero) {
  // 1. Verificar se existem grupos
  const grupos = await prisma.grupo.findMany({
    where: { torneioId, modalidadeId, time: { categoria: { genero: genero } } },
  });

  if (grupos.length === 0) {
    return { proximaAcao: 'CRIAR_GRUPOS' };
  }

  // 2. Verificar se existem partidas da fase de grupos
  const partidasFaseDeGrupos = await prisma.partida.findMany({
    where: { torneioId, modalidadeId, genero, tipo: 'GRUPO' },
  });

  if (partidasFaseDeGrupos.length === 0) {
    return { proximaAcao: 'GERAR_FASE_DE_GRUPOS' };
  }

  // 3. Verificar se todas as partidas da fase de grupos estão finalizadas
  const todasFinalizadas = partidasFaseDeGrupos.every(p => p.statusPartida === 'FINALIZADA');

  if (!todasFinalizadas) {
    return { proximaAcao: 'AGUARDANDO_FINAL_FASE_DE_GRUPOS' };
  }

  // 4. Verificar fases eliminatórias
  const fasesEliminatorias = await prisma.partida.findMany({
    where: { torneioId, modalidadeId, genero, tipo: 'ELIMINATORIA' },
    orderBy: { dataHora: 'desc' },
    distinct: ['fase'],
  });

  if (fasesEliminatorias.length === 0) {
    return { proximaAcao: 'GERAR_OITAVAS' };
  }

  const ultimaFase = fasesEliminatorias[0].fase;

  const partidasUltimaFase = await prisma.partida.findMany({
    where: { torneioId, modalidadeId, genero, fase: ultimaFase },
  });

  const todasFinalizadasUltimaFase = partidasUltimaFase.every(p => p.statusPartida === 'FINALIZADA');

  if (!todasFinalizadasUltimaFase) {
    return { proximaAcao: `AGUARDANDO_FINAL_${ultimaFase.toUpperCase()}` };
  }

  // Determinar a próxima fase
  switch (ultimaFase) {
    case 'Oitavas de Final':
      return { proximaAcao: 'GERAR_QUARTAS' };
    case 'Quartas de Final':
      return { proximaAcao: 'GERAR_SEMIFINAL' };
    case 'Semifinal':
      return { proximaAcao: 'GERAR_FINAL' };
    case 'Final':
      return { proximaAcao: 'TORNEIO_FINALIZADO' };
    default:
      return { proximaAcao: 'UNKNOWN' };
  }
}

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const modalidadeId = searchParams.get('modalidadeId');
    const genero = searchParams.get('genero');
    const resolvedParams = await params;
    const torneioId = parseInt(resolvedParams.torneioId);

    // Se modalidadeId e genero estão presentes, usar a lógica antiga de próxima ação
    if (modalidadeId && genero) {
      const proximaAcao = await getProximaAcao(torneioId, parseInt(modalidadeId), genero);
      return NextResponse.json(proximaAcao);
    }

    // Caso contrário, buscar dados completos do torneio para edição
    const torneio = await prisma.torneio.findUnique({
      where: { id: torneioId },
      include: {
        times: true,
        grupos: {
          include: {
            times: true
          }
        },
        partidas: true
      }
    });

    if (!torneio) {
      return NextResponse.json({ error: 'Torneio não encontrado' }, { status: 404 });
    }

    // Função helper para determinar modalidades
    function getModalitiesByName(nome) {
      if (nome.includes('Meio do Ano')) return 'Vôlei, Handebol';
      if (nome.includes('Fim de Ano')) return 'Futsal, Basquete';
      return 'Futsal, Vôlei, Basquete, Handebol';
    }

    const torneioFormatted = {
      id: torneio.id,
      name: torneio.nome.replace(/\s\d{4}$/, ''), // Remove o ano do final para exibição no form
      status: torneio.status,
      startDate: torneio.inicio.toISOString().split('T')[0],
      endDate: torneio.fim.toISOString().split('T')[0],
      location: torneio.local || 'ETEC João Belarmino',
      modalities: getModalitiesByName(torneio.nome),
      teamsCount: torneio.times?.length || 0,
      matchesTotal: torneio.partidas?.length || 0,
      matchesPlayed: torneio.partidas?.filter(p => p.statusPartida === 'FINALIZADA').length || 0
    };

    return NextResponse.json(torneioFormatted);

  } catch (error) {
    console.error('Erro ao buscar torneio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
