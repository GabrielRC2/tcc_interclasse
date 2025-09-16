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
      location: 'ETEC João Belarmino',
      modalities: t.torneioModalidades.map(tm => tm.modalidade.nome).join(', '),
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
    const { name, location, startDate, endDate, modalities } = await request.json();
    
    // Converter string de modalidades em array
    const modalidadesArray = modalities.split(',').map(m => m.trim());

    // Criar o torneio e as modalidades em uma transação
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Criar o torneio
      const novoTorneio = await tx.torneio.create({
        data: {
          nome: name,
          status: 'PLANEJAMENTO',
          inicio: new Date(startDate),
          fim: new Date(endDate),
        },
      });

      // 2. Para cada modalidade
      for (const modalidadeNome of modalidadesArray) {
        // Verificar se a modalidade já existe
        let modalidade = await tx.modalidade.findFirst({
          where: { nome: modalidadeNome }
        });

        // Se não existe, criar
        if (!modalidade) {
          modalidade = await tx.modalidade.create({
            data: { nome: modalidadeNome }
          });
        }

        // Criar a ligação na tabela TorneioModalidade
        await tx.torneioModalidade.create({
          data: {
            torneioId: novoTorneio.id,
            modalidadeId: modalidade.id
          }
        });
      }

      // Retornar o torneio com suas modalidades
      const torneioCompleto = await tx.torneio.findUnique({
        where: { id: novoTorneio.id },
        include: {
          torneioModalidades: {
            include: {
              modalidade: true
            }
          }
        }
      });

      return torneioCompleto;
    });

    // Formatar resposta
    return Response.json({
      id: resultado.id,
      name: resultado.nome,
      status: resultado.status,
      startDate: resultado.inicio.toISOString().split('T')[0],
      endDate: resultado.fim.toISOString().split('T')[0],
      location: location,
      modalities: resultado.torneioModalidades.map(tm => tm.modalidade.nome).join(', '),
      teamsCount: 0,
      matchesTotal: 0,
      matchesPlayed: 0
    });
  } catch (error) {
    console.error('Erro ao criar torneio:', error);
    return Response.json({ error: 'Erro ao criar torneio' }, { status: 500 });
  }
}