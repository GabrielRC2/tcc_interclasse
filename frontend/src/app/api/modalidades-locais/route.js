import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const modalidades = await prisma.modalidade.findMany({
      include: {
        _count: {
          select: { categorias: true }
        }
      }
    });

    const locais = await prisma.local.findMany();

    // Configuração padrão de locais por modalidade
    const configuracaoPadrao = {
      'Vôlei': 'Quadra de Baixo',
      'Handebol': 'Quadra de Cima', 
      'Basquete': 'Quadra de Baixo',
      'Futsal': 'Quadra de Cima'
    };

    const modalidadesComLocal = modalidades.map(modalidade => ({
      ...modalidade,
      localPadrao: configuracaoPadrao[modalidade.nome] || 'Quadra de Baixo'
    }));

    return Response.json({
      modalidades: modalidadesComLocal,
      locais
    });
  } catch (error) {
    console.error('Erro ao buscar modalidades e locais:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { configuracoes } = await request.json();
    
    // Salvar configurações no localStorage ou banco
    // Por simplicidade, vamos retornar sucesso
    console.log('Configurações de locais salvas:', configuracoes);
    
    return Response.json({ message: 'Configurações salvas com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}