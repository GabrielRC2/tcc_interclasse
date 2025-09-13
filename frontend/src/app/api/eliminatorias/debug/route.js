import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');

    if (!torneioId) {
      return Response.json({ error: 'Parâmetro torneioId é obrigatório' }, { status: 400 });
    }

    // Verificar modalidades do torneio através da relação TorneioModalidade
    const torneioModalidades = await prisma.torneioModalidade.findMany({
      where: { torneioId: parseInt(torneioId) },
      include: {
        modalidade: true
      }
    });

    const modalidades = torneioModalidades.map(tm => tm.modalidade);

    // Verificar grupos
    const grupos = await prisma.grupo.findMany({
      where: { torneioId: parseInt(torneioId) },
      include: {
        modalidade: true
      }
    });

    // Verificar partidas
    const partidas = await prisma.partida.findMany({
      where: { torneioId: parseInt(torneioId) },
      include: {
        modalidade: true
      }
    });

    // Verificar partidas finalizadas
    const partidasFinalizadas = partidas.filter(p => p.status === 'Finalizada');

    // Verificar times por grupo
    const timesGrupos = await prisma.grupoTime.findMany({
      where: {
        grupo: {
          torneioId: parseInt(torneioId)
        }
      },
      include: {
        time: true,
        grupo: {
          include: {
            modalidade: true
          }
        }
      }
    });

    return Response.json({
      torneioId: parseInt(torneioId),
      modalidades: modalidades.length,
      grupos: grupos.length,
      partidas: partidas.length,
      partidasFinalizadas: partidasFinalizadas.length,
      timesInscritos: timesGrupos.length,
      detalhes: {
        modalidades: modalidades.map(m => ({ id: m.id, nome: m.nome })),
        grupos: grupos.map(g => ({ 
          id: g.id, 
          nome: g.nome, 
          modalidade: g.modalidade.nome,
          genero: g.genero 
        })),
        partidasFinalizadas: partidasFinalizadas.map(p => ({
          id: p.id,
          modalidade: p.modalidade.nome,
          genero: p.genero,
          result: p.result
        })),
        timesGrupos: timesGrupos.map(tg => ({
          time: tg.time.nome,
          grupo: tg.grupo.nome,
          modalidade: tg.grupo.modalidade.nome,
          genero: tg.grupo.genero
        }))
      }
    });

  } catch (error) {
    console.error('Erro no debug:', error);
    return Response.json({ error: 'Erro interno: ' + error.message }, { status: 500 });
  }
}