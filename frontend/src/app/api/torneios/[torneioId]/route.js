import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const torneioId = parseInt(params.torneioId);
    
    const torneio = await prisma.torneio.findUnique({
      where: { id: torneioId },
      include: {
        torneioModalidades: {
          include: {
            modalidade: true
          }
        },
        grupos: {
          include: {
            modalidade: true
          }
        }
      }
    });

    if (!torneio) {
      return new Response('Torneio não encontrado', { status: 404 });
    }

    // Formatar resposta
    return Response.json({
      id: torneio.id,
      name: torneio.nome,
      status: torneio.status,
      startDate: torneio.inicio.toISOString().split('T')[0],
      endDate: torneio.fim.toISOString().split('T')[0],
      modalities: torneio.torneioModalidades.map(tm => tm.modalidade.nome).join(' e '),
      grupos: torneio.grupos.map(g => ({
        nome: g.nome,
        modalidadeId: g.modalidadeId,
        modalidadeNome: g.modalidade.nome
      }))
    });

  } catch (error) {
    console.error('Erro ao buscar torneio:', error);
    return new Response('Erro interno do servidor', { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { name, location, startDate, endDate, modalities } = await request.json();
    const id = parseInt(params.torneioId);

    const torneio = await prisma.torneio.update({
      where: { id },
      data: {
        nome: name,
        inicio: new Date(startDate),
        fim: new Date(endDate)
      }
    });

    return NextResponse.json({
      id: torneio.id,
      name: torneio.nome,
      status: torneio.status,
      startDate: torneio.inicio.toISOString().split('T')[0],
      endDate: torneio.fim.toISOString().split('T')[0],
      location: location,
      modalities: modalities
    });
  } catch (error) {
    console.error('Erro ao editar torneio:', error);
    return NextResponse.json({ error: 'Erro ao editar torneio' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.torneioId);

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
    const { torneioId } = params;
    const { searchParams } = new URL(request.url);
    const modalidadeId = searchParams.get('modalidadeId');
    const genero = searchParams.get('genero');

    if (!modalidadeId || !genero) {
      return NextResponse.json({ error: 'modalidadeId e genero são obrigatórios' }, { status: 400 });
    }

    const proximaAcao = await getProximaAcao(parseInt(torneioId), parseInt(modalidadeId), genero);

    return NextResponse.json(proximaAcao);

  } catch (error) {
    console.error('Erro ao buscar status do torneio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
