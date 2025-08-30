# 🏆 PROPOSTA: SEPARAÇÃO ENTRE PONTOS DA PARTIDA E PONTOS DO TORNEIO

## 📊 PROBLEMA IDENTIFICADO

Atualmente, estamos confundindo dois tipos de pontuação:

### ❌ **Situação Atual (INCORRETA)**
- `pontosCasa/pontosVisitante` sendo usado para ambos:
  1. Pontos da súmula (gols marcados na partida)
  2. Pontos do torneio (3-1-0 para classificação)

### ✅ **Situação Proposta (CORRETA)**
- `pontosCasa/pontosVisitante` = **Apenas pontos da súmula**
- `pontosTorneio` = **Novo campo para pontuação de classificação**

---

## 🔧 MUDANÇAS NECESSÁRIAS

### 1. **ESQUEMA DO BANCO DE DADOS**

#### **Opção A: Adicionar campo na tabela PartidaTime**
```prisma
model PartidaTime {
  partidaId       Int     @map("fk_id_partida")
  timeId          Int     @map("fk_id_time")
  ehCasa          Boolean @map("eh_casa")
  resultado       String  @default("PENDENTE") @map("resutado_partida")
  pontosTorneio   Int     @default(0) @map("pontos_torneio") // NOVO CAMPO
  partida         Partida @relation(fields: [partidaId], references: [id])
  time            Time    @relation(fields: [timeId], references: [id])

  @@id([partidaId, timeId])
  @@map("PartidaTime")
}
```

#### **Opção B: Nova tabela de classificação**
```prisma
model ClassificacaoTorneio {
  id            Int @id @default(autoincrement())
  timeId        Int @map("fk_id_time")
  torneioId     Int @map("fk_id_torneio")
  grupoId       Int @map("fk_id_grupo")
  pontos        Int @default(0) @map("pontos_torneio")
  vitorias      Int @default(0)
  empates       Int @default(0)
  derrotas      Int @default(0)
  golsPro       Int @default(0)
  golsContra    Int @default(0)
  saldoGols     Int @default(0)
  time          Time @relation(fields: [timeId], references: [id])
  torneio       Torneio @relation(fields: [torneioId], references: [id])
  grupo         Grupo @relation(fields: [grupoId], references: [id])
  
  @@unique([timeId, torneioId, grupoId])
  @@map("ClassificacaoTorneio")
}
```

### 2. **REGRAS DE PONTUAÇÃO**

```javascript
const PONTOS_TORNEIO = {
  VENCEDOR: 3,
  EMPATE: 1,
  PERDEDOR: 0,
  WO: 0 // Time que dá WO não ganha pontos
};
```

### 3. **LÓGICA DE ATUALIZAÇÃO**

```javascript
// Quando uma partida é finalizada:
async function atualizarPontuacaoTorneio(partidaId) {
  const partida = await prisma.partida.findUnique({
    where: { id: partidaId },
    include: { times: { include: { time: true } } }
  });

  for (const partidaTime of partida.times) {
    let pontosTorneio = 0;
    
    switch (partidaTime.resultado) {
      case 'VENCEDOR':
        pontosTorneio = 3;
        break;
      case 'EMPATE':
        pontosTorneio = 1;
        break;
      case 'PERDEDOR':
      case 'WO':
        pontosTorneio = 0;
        break;
    }

    // Atualizar pontos do torneio
    await prisma.partidaTime.update({
      where: {
        partidaId_timeId: {
          partidaId: partidaId,
          timeId: partidaTime.timeId
        }
      },
      data: { pontosTorneio }
    });
  }
}
```

---

## 💡 RECOMENDAÇÃO

**Recomendo a Opção A** (campo na PartidaTime) porque:

1. ✅ **Simplicidade**: Menos tabelas para gerenciar
2. ✅ **Performance**: Consultas mais diretas
3. ✅ **Consistência**: Dados relacionados ficam juntos
4. ✅ **Facilidade**: Menor impacto no código existente

---

## 🚀 IMPLEMENTAÇÃO

### Passo 1: Atualizar Schema
### Passo 2: Migração do Banco
### Passo 3: Atualizar APIs
### Passo 4: Corrigir Lógica WO
### Passo 5: Atualizar Frontend

---

## 📋 EXEMPLOS DE USO

### **Partida Normal:**
- Time A: 2 gols, VENCEDOR → `pontosCasa: 2, pontosTorneio: 3`
- Time B: 1 gol, PERDEDOR → `pontosVisitante: 1, pontosTorneio: 0`

### **Partida com WO:**
- Time A: 0 gols, WO → `pontosCasa: 0, pontosTorneio: 0`
- Time B: 0 gols, VENCEDOR → `pontosVisitante: 0, pontosTorneio: 3`

### **Empate:**
- Time A: 1 gol, EMPATE → `pontosCasa: 1, pontosTorneio: 1`
- Time B: 1 gol, EMPATE → `pontosVisitante: 1, pontosTorneio: 1`
