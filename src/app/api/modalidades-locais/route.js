import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Buscar modalidades com suas relações com locais
    const modalidades = await prisma.modalidade.findMany({
      include: {
        categorias: true,
        locais: {
          include: {
            local: true
          }
        }
      }
    });

    // Buscar todos os locais disponíveis
    const locais = await prisma.local.findMany({
      include: {
        modalidades: {
          include: {
            modalidade: true
          }
        }
      }
    });

    // Mapear modalidades com seus locais
    const modalidadesComLocal = modalidades.map(modalidade => {
      const locaisDisponiveis = locais.map(local => local.nome);
      const localAtual = modalidade.locais[0]?.local?.nome || '';
      
      return {
        ...modalidade,
        localAtual,
        locaisDisponiveis
      };
    });

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
    
    // Iniciar uma transação para garantir consistência
    await prisma.$transaction(async (tx) => {
      for (const config of configuracoes) {
        const modalidade = await tx.modalidade.findFirst({
          where: { nome: config.modalidade },
          include: {
            locais: true
          }
        });

        const local = await tx.local.findFirst({
          where: { nome: config.local }
        });

        if (!modalidade || !local) continue;

        // Remover quaisquer relações existentes para esta modalidade
        await tx.localModalidade.deleteMany({
          where: { 
            modalidadeId: modalidade.id
          }
        });

        // Criar nova relação
        await tx.localModalidade.create({
          data: {
            localId: local.id,
            modalidadeId: modalidade.id
          }
        });
      }
    });
    
    return Response.json({ message: 'Configurações salvas com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}