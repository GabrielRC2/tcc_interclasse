import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { torneioId } = await request.json();

    if (!torneioId) {
      return Response.json({ error: 'ID do torneio é obrigatório' }, { status: 400 });
    }

    console.log('=== INICIANDO GERAÇÃO DE PONTUAÇÕES ===');
    console.log('Torneio ID:', torneioId);

    // Primeiro, vamos ver quantas partidas agendadas existem
    const count = await prisma.partida.count({
      where: {
        torneioId: parseInt(torneioId),
        statusPartida: 'AGENDADA'
      }
    });

    console.log('Partidas AGENDADAS encontradas:', count);

    if (count === 0) {
      return Response.json({ error: 'Nenhuma partida agendada encontrada' }, { status: 404 });
    }

    // Usar SQL bruto para atualização rápida - sem eventos primeiro, só pontuação
    const result = await prisma.$executeRaw`
      UPDATE Partida 
      SET 
        status_partida = 'FINALIZADA',
        pontos_casa = FLOOR(RAND() * 5),
        pontos_visitante = FLOOR(RAND() * 5)
      WHERE fk_id_torneio = ${parseInt(torneioId)} 
        AND status_partida = 'AGENDADA'
    `;

    console.log('Partidas atualizadas via SQL:', result);

    // Verificar se realmente funcionou
    const finalCount = await prisma.partida.count({
      where: {
        torneioId: parseInt(torneioId),
        statusPartida: 'FINALIZADA'
      }
    });

    console.log('Partidas FINALIZADAS após update:', finalCount);

    return Response.json({ 
      message: 'Pontuações aleatórias geradas com sucesso!',
      partidasFinalizadas: result,
      partidasAgendadasAntes: count,
      partidasFinalizadasDepois: finalCount
    });

  } catch (error) {
    console.error('ERRO COMPLETO:', error);
    return Response.json({ error: 'Erro: ' + error.message }, { status: 500 });
  }
}
