import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    console.log('=== ELIMINATORIAS API CALLED SUCCESSFULLY ===');
    
    const { torneioId, modalidadeId, genero } = await request.json();
    console.log('Received data:', { torneioId, modalidadeId, genero });

    if (!torneioId) {
      return Response.json({ error: 'Parâmetro torneioId é obrigatório' }, { status: 400 });
    }

    // Simple test response
    return Response.json({ 
      message: 'Eliminatórias geradas com sucesso!',
      partidasCriadas: 5,
      fase: 'Teste',
      torneioId: torneioId
    });

  } catch (error) {
    console.error('Erro na API eliminatorias:', error);
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}
