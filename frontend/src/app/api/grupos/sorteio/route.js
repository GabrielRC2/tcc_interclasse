import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { torneioId, modalidadeId, genero, quantidadeGrupos } = await request.json();

    // 1. Buscar times da modalidade e gênero específicos
    const times = await prisma.time.findMany({
      where: {
        torneioId: parseInt(torneioId),
        categoria: {
          AND: [
            { modalidadeId: parseInt(modalidadeId) },
            { genero: genero }
          ]
        }
      },
      include: {
        curso: true,
        categoria: true
      }
    });

    console.log(`Times encontrados para ${genero}:`, times.length);

    if (times.length < quantidadeGrupos) {
      return Response.json({ 
        error: `Número insuficiente de times. Encontrados ${times.length} times para ${quantidadeGrupos} grupos.` 
      }, { status: 400 });
    }

    // 2. LIMPAR todos os grupos existentes da modalidade/torneio
    // Primeiro remover todas as associações grupo-time
    await prisma.grupoTime.deleteMany({
      where: {
        grupo: {
          modalidadeId: parseInt(modalidadeId),
          torneioId: parseInt(torneioId)
        }
      }
    });

    // Depois remover todos os grupos
    await prisma.grupo.deleteMany({
      where: {
        modalidadeId: parseInt(modalidadeId),
        torneioId: parseInt(torneioId)
      }
    });

    // 3. Usar quantidade específica de grupos
    const numGrupos = parseInt(quantidadeGrupos);

    // 4. Criar novos grupos
    const gruposCriados = [];
    for (let i = 0; i < numGrupos; i++) {
      const nomeGrupo = String.fromCharCode(65 + i); // A, B, C, D...
      
      const grupo = await prisma.grupo.create({
        data: {
          nome: nomeGrupo,
          modalidadeId: parseInt(modalidadeId),
          torneioId: parseInt(torneioId)
        }
      });
      
      gruposCriados.push(grupo);
    }

    // 5. Sortear times nos grupos (distribuição balanceada)
    const timesEmbaralhados = [...times].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < timesEmbaralhados.length; i++) {
      const grupoIndex = i % numGrupos;
      const grupo = gruposCriados[grupoIndex];
      
      await prisma.grupoTime.create({
        data: {
          grupoId: grupo.id,
          timeId: timesEmbaralhados[i].id
        }
      });
    }

    return Response.json({ 
      message: 'Sorteio realizado com sucesso!',
      grupos: numGrupos,
      times: times.length,
      distribuicao: gruposCriados.map((g, i) => ({
        grupo: g.nome,
        quantidade: Math.floor(times.length / numGrupos) + (i < times.length % numGrupos ? 1 : 0)
      }))
    });
  } catch (error) {
    console.error('Erro ao realizar sorteio:', error);
    return Response.json({ error: 'Erro ao realizar sorteio' }, { status: 500 });
  }
}