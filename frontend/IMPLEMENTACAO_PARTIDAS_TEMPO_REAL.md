# Implementação de Partidas em Andamento com Pontuação em Tempo Real

## Resumo
Este documento descreve as mudanças implementadas para exibir partidas em andamento na seção "PARTIDAS ATUAIS" do Dashboard, com atualização da pontuação em tempo real baseada nos eventos das partidas.

## Arquivos Modificados

### 1. **DashboardPage.jsx**
**Localização:** `src/components/DashboardPage.jsx`

#### Mudanças Principais:

##### 1.1 Novos Estados
```jsx
// Estados para partidas em andamento
const [partidasEmAndamento, setPartidasEmAndamento] = useState([]);
const [carregandoAndamento, setCarregandoAndamento] = useState(false);
const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
```

##### 1.2 Nova Função para Carregar Partidas em Andamento
```jsx
// busca partidas em andamento
const carregarPartidasEmAndamento = async () => {
  if (!selectedTournament) return;
  setCarregandoAndamento(true);
  try {
    const res = await fetch(`/api/partidas?torneioId=${selectedTournament.id}`);
    const data = res.ok ? await res.json() : [];
    // filtrar por status em andamento
    const emAndamento = (data || []).filter(p => {
      const s = (p.status || '').toLowerCase();
      return s === 'em andamento' || s === 'andamento' || s === 'jogando' || s === 'iniciada';
    });
    
    // Para cada partida em andamento, carregar os eventos/pontuação
    const partidasComPontuacao = await Promise.all(
      emAndamento.map(async (partida) => {
        try {
          const eventosRes = await fetch(`/api/partidas/${partida.id}/eventos`);
          const eventos = eventosRes.ok ? await eventosRes.json() : [];
          
          // Debug: log dos eventos para verificar estrutura
          console.log(`Eventos da partida ${partida.id}:`, eventos);
          console.log(`Team1ID: ${partida.team1Id}, Team2ID: ${partida.team2Id}`);
          
          // Calcular pontuação por time baseado nos eventos
          const eventosTime1 = eventos.filter(evento => {
            // Verificar se o jogador pertence ao time 1
            const pertenceTime1 = evento.jogador?.times?.some(timeJogador => timeJogador.timeId === partida.team1Id);
            const ehGol = evento.tipo === 'GOL';
            console.log(`Evento ${evento.id}: Jogador ${evento.jogador?.nome}, Times: ${evento.jogador?.times?.map(t => t.timeId)}, Pertence Time1: ${pertenceTime1}, É Gol: ${ehGol}, Pontos: ${evento.pontosGerados}`);
            return pertenceTime1 && ehGol;
          });
          
          const eventosTime2 = eventos.filter(evento => {
            // Verificar se o jogador pertence ao time 2
            const pertenceTime2 = evento.jogador?.times?.some(timeJogador => timeJogador.timeId === partida.team2Id);
            const ehGol = evento.tipo === 'GOL';
            return pertenceTime2 && ehGol;
          });
          
          const pontuacaoTime1 = eventosTime1.reduce((total, evento) => total + (evento.pontosGerados || 0), 0);
          const pontuacaoTime2 = eventosTime2.reduce((total, evento) => total + (evento.pontosGerados || 0), 0);
          
          console.log(`Pontuação calculada - Time1: ${pontuacaoTime1}, Time2: ${pontuacaoTime2}`);

          return {
            ...partida,
            pontuacaoTime1,
            pontuacaoTime2,
            eventos
          };
        } catch (err) {
          console.error(`Erro ao carregar eventos da partida ${partida.id}:`, err);
          return {
            ...partida,
            pontuacaoTime1: 0,
            pontuacaoTime2: 0,
            eventos: []
          };
        }
      })
    );
    
    setPartidasEmAndamento(partidasComPontuacao);
    setUltimaAtualizacao(new Date());
  } catch (err) {
    console.error('Erro ao carregar partidas em andamento:', err);
    setPartidasEmAndamento([]);
  } finally {
    setCarregandoAndamento(false);
  }
};
```

##### 1.3 useEffect para Atualização em Tempo Real
```jsx
// useEffect para atualizar partidas em andamento em tempo real
useEffect(() => {
  if (!selectedTournament) return;

  // Atualizar imediatamente se há partidas em andamento
  if (partidasEmAndamento.length > 0) {
    const interval = setInterval(() => {
      carregarPartidasEmAndamento();
    }, 3000); // Atualizar a cada 3 segundos para partidas em andamento

    return () => clearInterval(interval);
  } else {
    // Se não há partidas em andamento, verificar menos frequentemente
    const interval = setInterval(() => {
      carregarPartidasEmAndamento();
    }, 15000); // Atualizar a cada 15 segundos para verificar novas partidas

    return () => clearInterval(interval);
  }
}, [selectedTournament, partidasEmAndamento.length]);
```

##### 1.4 Atualização do useEffect Principal
```jsx
useEffect(() => {
  if (selectedTournament) {
    carregarProximasPartidas();
    carregarJogadoresDestaque();
    carregarPartidasFinalizadas();
    carregarPartidasEmAndamento(); // Adicionado
  } else {
    setProximasPartidas([]);
    setJogadoresDestaque({});
    setPartidasFinalizadas([]);
    setPartidasEmAndamento([]); // Adicionado
  }
}, [selectedTournament]);
```

##### 1.5 Atualização da Função tratarSumulaEnviada
```jsx
const tratarSumulaEnviada = async (partidaId) => {
  // recarregar listas (a súmula acabou de ser criada e a partida deve aparecer como finalizada)
  await carregarPartidasFinalizadas();
  await carregarProximasPartidas(); // Atualizar próximas partidas também
  await carregarJogadoresDestaque(); // Atualizar jogadores em destaque
  await carregarPartidasEmAndamento(); // Atualizar partidas em andamento
};
```

##### 1.6 Nova Interface para Partidas Atuais
```jsx
{/* PARTIDAS ATUAIS (partidas em andamento com pontuação em tempo real) */}
<div>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">PARTIDAS ATUAIS</h2>
    {ultimaAtualizacao && partidasEmAndamento.length > 0 && (
      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${carregandoAndamento ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
        <span>Última atualização: {ultimaAtualizacao.toLocaleTimeString()}</span>
      </div>
    )}
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {carregandoAndamento ? (
      <div className="col-span-2 text-center py-8">Carregando partidas em andamento...</div>
    ) : partidasEmAndamento.length === 0 ? (
      <div className="col-span-2 text-center py-8 text-gray-500">
        Nenhuma partida em andamento no momento.
        <br />
        <span className="text-xs text-gray-400">As partidas aparecerão aqui quando iniciadas</span>
      </div>
    ) : (
      partidasEmAndamento.slice(0, 2).map((match) => (
        <div key={match.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-green-600 dark:text-green-400 font-semibold uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                AO VIVO
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Atualizado em tempo real
              </div>
            </div>
            <p className="text-2xl font-bold my-2 text-gray-900 dark:text-gray-100">{match.team1} VS {match.team2}</p>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2 text-center">
              {match.pontuacaoTime1 || 0} - {match.pontuacaoTime2 || 0}
            </div>
            {/* Debug: mostrar número de eventos encontrados */}
            <div className="text-xs text-gray-400 text-center mb-2">
              {match.eventos?.length || 0} eventos • Team1ID: {match.team1Id} • Team2ID: {match.team2Id}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-300">Esporte: {match.modality}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Modalidade: {match.category}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Local: {match.location}</p>
              {match.fase && <p className="text-sm text-gray-600 dark:text-gray-300">Fase: {match.fase}</p>}
            </div>
          </div>
          <CardSplat />
        </div>
      ))
    )}
  </div>
  
  {/* Mostrar próximas partidas abaixo se não houver partidas em andamento */}
  {partidasEmAndamento.length === 0 && proximasPartidas.length > 0 && (
    <>
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-6 mb-4">Próximas Partidas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {proximasPartidas.slice(0, 2).map((match) => (
          <div key={match.id} className="bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden opacity-75">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase">PRÓXIMA</p>
              </div>
              <p className="text-xl font-bold my-2 text-gray-700 dark:text-gray-300">{match.team1} VS {match.team2}</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">{match.result || 'Aguardando'}</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Esporte: {match.modality}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Modalidade: {match.category}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Local: {match.location}</p>
                {match.fase && <p className="text-sm text-gray-600 dark:text-gray-400">Fase: {match.fase}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )}
</div>
```

### 2. **Novo Arquivo: route.js (Iniciar Partidas)**
**Localização:** `src/app/api/partidas/[partidaId]/iniciar/route.js`

#### Conteúdo Completo:
```javascript
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { partidaId } = await params;

    // Verificar se a partida existe e se pode ser iniciada
    const partida = await prisma.partida.findUnique({
      where: { id: parseInt(partidaId) },
    });

    if (!partida) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 });
    }

    // Verificar se a partida não está finalizada
    if (partida.statusPartida === 'FINALIZADA') {
      return NextResponse.json({ error: 'Partida já foi finalizada' }, { status: 400 });
    }

    // Atualizar o status da partida para "EM_ANDAMENTO"
    const partidaAtualizada = await prisma.partida.update({
      where: { id: parseInt(partidaId) },
      data: {
        statusPartida: 'EM_ANDAMENTO',
      },
      include: {
        times: {
          include: {
            time: {
              include: {
                curso: true,
                categoria: {
                  include: {
                    modalidade: true
                  }
                }
              }
            }
          }
        },
        grupo: {
          include: {
            modalidade: true
          }
        },
        modalidade: true,
        local: true
      }
    });

    return NextResponse.json(partidaAtualizada, { status: 200 });
  } catch (error) {
    console.error('Erro ao iniciar partida:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}
```

### 3. **SumulaModal.jsx**
**Localização:** `src/components/SumulaModal.jsx`

#### Mudanças:
```jsx
// Atualiza o status da partida para "Em andamento" se estiver ao vivo
const atualizarStatusParaEmAndamento = async () => {
  if (isOpen && estaAoVivo && match?.status === 'Agendada') {
    try {
      const response = await fetch(`/api/partidas/${match.id}/iniciar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        // Notificar o componente pai sobre a mudança de status para que a UI seja atualizada.
        // Esta é a correção principal para o status não atualizar na tela.
        if (onSumulaEnviada) {
          onSumulaEnviada(match.id, 'Em andamento');
        }
      }
    } catch (error) {
      console.error('Falha ao atualizar status da partida:', error);
    }
  }
};
```

### 4. **route.js (Eventos)**
**Localização:** `src/app/api/partidas/[partidaId]/eventos/route.js`

#### Mudanças:
```javascript
// Modificação no GET para incluir informações dos times dos jogadores
const eventos = await prisma.eventoPartida.findMany({
  where: {
    partidaId: parseInt(partidaId),
  },
  include: {
    jogador: {
      include: {
        times: {
          include: {
            time: true
          }
        }
      }
    },
  },
  orderBy: {
    id: 'asc',
  },
});
```

## Funcionalidades Implementadas

### 1. **Detecção Automática de Partidas em Andamento**
- O sistema filtra partidas com status "Em andamento", "andamento", "jogando" ou "iniciada"
- Atualização automática da lista de partidas em andamento

### 2. **Cálculo de Pontuação em Tempo Real**
- Busca eventos de cada partida em andamento
- Calcula pontuação baseada nos eventos de gol por time
- Utiliza a relação jogador → time para determinar a qual time pertence cada gol

### 3. **Interface Visual Aprimorada**
- Indicador "AO VIVO" com animação pulsante
- Placar em tempo real destacado
- Timestamp da última atualização
- Indicador visual do status de carregamento
- Informações de debug (número de eventos, IDs dos times)

### 4. **Atualização Automática**
- Atualização a cada 3 segundos para partidas em andamento
- Atualização a cada 15 segundos quando não há partidas em andamento
- Fallback para próximas partidas quando não há jogos ao vivo

### 5. **Integração com Sistema Existente**
- Compatibilidade mantida com súmulas existentes
- Atualização automática quando súmulas são enviadas
- Utilização da API existente de iniciar partidas

## Status de Implementação

### ✅ Implementado
- [x] Estados e funções para partidas em andamento
- [x] API para iniciar partidas
- [x] Cálculo de pontuação baseado em eventos
- [x] Interface visual com indicadores ao vivo
- [x] Atualização automática em tempo real
- [x] Integração com SumulaModal
- [x] Logs de debug para troubleshooting

### 🔄 Para Melhorias Futuras
- [ ] Otimização de performance para muitas partidas simultâneas
- [ ] Cache de dados para reduzir chamadas à API
- [ ] Notificações push para mudanças de pontuação
- [ ] Histórico de eventos em tempo real na interface
- [ ] Configuração da frequência de atualização pelo usuário

## Como Usar

1. **Iniciar uma Partida:**
   - Abra a súmula de uma partida com status "Agendada"
   - A partida será automaticamente marcada como "Em andamento"
   - Ela aparecerá na seção "PARTIDAS ATUAIS" do Dashboard

2. **Acompanhar Pontuação:**
   - Adicione eventos de gol através da súmula
   - A pontuação será atualizada automaticamente no Dashboard
   - O placar é atualizado a cada 3 segundos

3. **Monitoramento:**
   - Verifique o indicador de última atualização
   - Observe os logs do console para debug
   - O sistema mostra número de eventos encontrados

## Troubleshooting

### Pontuação não atualiza:
1. Verifique se os jogadores estão corretamente vinculados aos times
2. Confirme se os eventos estão sendo salvos com o tipo "GOL"
3. Verifique os logs do console para errors na estrutura de dados
4. Confirme se os IDs dos times estão corretos

### Partidas não aparecem como "em andamento":
1. Verifique se o status foi alterado corretamente no banco
2. Confirme se a API de iniciar partidas está funcionando
3. Verifique se há partidas com status compatível

Este documento serve como referência completa para a implementação das partidas em tempo real no Dashboard.
