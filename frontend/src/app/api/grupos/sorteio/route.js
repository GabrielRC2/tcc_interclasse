import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { torneioId, modalidadeId, genero, quantidadeGrupos } = await request.json();

    console.log('Iniciando sorteio:', { torneioId, modalidadeId, genero, quantidadeGrupos });

    // 1. Buscar times da modalidade e gênero específicos
    const times = await prisma.time.findMany({
      where: {
        torneioId: parseInt(torneioId),
        categoria: {
          modalidadeId: parseInt(modalidadeId),
          genero: genero
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

    // 2. LIMPAR dados existentes APENAS DO GÊNERO ESPECÍFICO
    const gruposExistentes = await prisma.grupo.findMany({
      where: {
        modalidadeId: parseInt(modalidadeId),
        torneioId: parseInt(torneioId),
        times: {
          some: {
            time: {
              categoria: {
                genero: genero
              }
            }
          }
        }
      },
      select: { id: true }
    });
    
    const gruposIds = gruposExistentes.map(g => g.id);
    
    if (gruposIds.length > 0) {
      // Deletar apenas GrupoTime (não precisa deletar partidas pois não criamos elas aqui)
      await prisma.grupoTime.deleteMany({
        where: {
          grupoId: { in: gruposIds }
        }
      });
      console.log('GrupoTime deletados');

      // Deletar grupos específicos
      await prisma.grupo.deleteMany({
        where: {
          id: { in: gruposIds }
        }
      });
      console.log('Grupos deletados');
    }

    // 3. Criar novos grupos
    const numGrupos = parseInt(quantidadeGrupos);
    const gruposCriados = [];
    
    for (let i = 0; i < numGrupos; i++) {
      const nomeGrupo = `${String.fromCharCode(65 + i)}-${genero.charAt(0).toUpperCase()}`;
      
      const grupo = await prisma.grupo.create({
        data: {
          nome: nomeGrupo,
          modalidadeId: parseInt(modalidadeId),
          torneioId: parseInt(torneioId)
        }
      });
      
      gruposCriados.push(grupo);
      console.log(`Grupo ${nomeGrupo} criado com ID ${grupo.id}`);
    }

    // 4. Sortear times nos grupos (distribuição balanceada)
    const timesEmbaralhados = [...times].sort(() => Math.random() - 0.5);
    console.log('Times embaralhados para sorteio');
    
    for (let i = 0; i < timesEmbaralhados.length; i++) {
      const grupoIndex = i % numGrupos;
      
      await prisma.grupoTime.create({
        data: {
          grupoId: gruposCriados[grupoIndex].id,
          timeId: timesEmbaralhados[i].id
        }
      });
      
      console.log(`Time ${timesEmbaralhados[i].nome} adicionado ao Grupo ${gruposCriados[grupoIndex].nome}`);
    }

    console.log('Sorteio e chaveamento concluídos com sucesso!');

    return Response.json({ 
      message: 'Sorteio e chaveamento realizados com sucesso!',
      grupos: numGrupos,
      times: times.length,
      genero: genero,
      distribuicao: gruposCriados.map((g, i) => ({
        grupo: g.nome,
        quantidade: Math.floor(times.length / numGrupos) + (i < times.length % numGrupos ? 1 : 0)
      }))
    });
  } catch (error) {
    console.error('Erro detalhado ao realizar sorteio:', error);
    
    return Response.json({ 
      error: 'Erro ao realizar sorteio: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}