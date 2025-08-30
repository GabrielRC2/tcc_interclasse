# 🏆 IMPLEMENTAÇÃO WO (Walk Over) - SISTEMA COMPLETO v2.0

## 📊 SEPARAÇÃO ENTRE PONTOS DA PARTIDA E PONTOS DO TORNEIO

### ✅ **PROBLEMA RESOLVIDO**

O sistema agora faz distinção clara entre:
- **Pontos da Partida** (`pontosCasa`/`pontosVisitante`): Gols/pontos marcados na súmula
- **Pontos do Torneio** (`pontosTorneio`): Sistema 3-1-0 para classificação

---

## 🗃️ ESTRUTURA DO BANCO DE DADOS

### Tabela `PartidaTime` (Atualizada)
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

### Migração Necessária
```bash
npx prisma migrate dev --name add_pontos_torneio
```

---

## 🔧 SISTEMA DE PONTUAÇÃO

### Regras de Pontuação do Torneio
```javascript
const PONTOS_TORNEIO = {
  VENCEDOR: 3,
  EMPATE: 1,
  PERDEDOR: 0,
  WO: 0 // Time que dá WO não ganha pontos
};
```

### Exemplos Práticos

#### **Partida Normal (2x1)**
- **Time A**: 2 gols, VENCEDOR → `pontosCasa: 2, pontosTorneio: 3`
- **Time B**: 1 gol, PERDEDOR → `pontosVisitante: 1, pontosTorneio: 0`

#### **Partida com WO**
- **Time A**: WO → `pontosCasa: 0, pontosTorneio: 0`
- **Time B**: VENCEDOR → `pontosVisitante: 0, pontosTorneio: 3`

#### **Empate (1x1)**
- **Time A**: 1 gol, EMPATE → `pontosCasa: 1, pontosTorneio: 1`
- **Time B**: 1 gol, EMPATE → `pontosVisitante: 1, pontosTorneio: 1`

---

## 📁 ARQUIVOS IMPLEMENTADOS

### 1. **Utilitário de Pontuação** (`src/utils/pontuacaoTorneio.js`)
- ✅ Funções para cálculo automático de pontos do torneio
- ✅ Separação clara entre pontos da partida e classificação
- ✅ Processamento específico para WO
- ✅ Geração de classificação ordenada

### 2. **API WO Atualizada** (`src/app/api/partidas/[id]/wo/route.js`)
- ✅ Usa nova lógica de pontuação
- ✅ Partidas WO marcadas com pontos 0x0 (sem jogo efetivo)
- ✅ Time WO marcado como "WO", adversário como "VENCEDOR"
- ✅ Outras partidas: time WO como "PERDEDOR"

### 3. **API Partidas Atualizada** (`src/app/api/partidas/[id]/route.js`)
- ✅ Integrada com sistema de pontuação do torneio
- ✅ Cálculo automático de resultados baseado nos pontos da súmula
- ✅ Atualização simultânea de resultado e pontos do torneio

### 4. **API Classificação** (`src/app/api/classificacao/route.js`)
- ✅ Endpoint para buscar classificação do torneio
- ✅ Estatísticas completas (pontos, jogos, vitórias, empates, derrotas)
- ✅ Cálculo de saldo de gols
- ✅ Ordenação por: pontos → saldo → gols pró

### 5. **Interface WO** (`src/components/WOModal.jsx`)
- ✅ Modal para seleção de time que dá WO
- ✅ Interface visual intuitiva
- ✅ Integração com API atualizada

---

## 🚀 FUNCIONALIDADES

### ✅ **Sistema WO Completo**
1. **Seleção de Time**: Modal para escolher qual time dá WO
2. **Atualização Automática**: 
   - Partida atual: Time WO → "WO", Adversário → "VENCEDOR"
   - Outras partidas: Time WO → "PERDEDOR", Adversários → "VENCEDOR"
3. **Pontuação Correta**: 
   - Pontos da súmula: 0x0 (sem jogo efetivo)
   - Pontos do torneio: WO=0, VENCEDOR=3, PERDEDOR=0

### ✅ **Sistema de Classificação**
- **Critérios de Ordenação**: Pontos → Saldo de Gols → Gols Pró
- **Estatísticas Completas**: V-E-D, gols pró/contra, saldo
- **API Dedicada**: `/api/classificacao?torneioId=X&grupoId=Y`

### ✅ **Separação Clara de Conceitos**
- **Súmula**: Pontos marcados durante o jogo
- **Torneio**: Sistema 3-1-0 para classificação
- **WO**: Tratamento específico sem confundir com resultados normais

---

## 🎯 PRÓXIMOS PASSOS

### 1. **Migração do Banco**
```bash
cd frontend
npx prisma migrate dev --name add_pontos_torneio
```

### 2. **Interface de Classificação**
- Criar componente para exibir tabela de classificação
- Integrar com API `/api/classificacao`

### 3. **Relatórios**
- Relatório de estatísticas por time
- Histórico de partidas com pontuação detalhada

---

## 📊 EXEMPLO DE USO DA API

### Buscar Classificação
```javascript
// Classificação geral do torneio
GET /api/classificacao?torneioId=1

// Classificação de um grupo específico
GET /api/classificacao?torneioId=1&grupoId=2

// Resposta
{
  "classificacao": [
    {
      "timeId": 1,
      "nome": "Time A",
      "pontos": 9,
      "jogos": 3,
      "vitorias": 3,
      "empates": 0,
      "derrotas": 0,
      "golsPro": 8,
      "golsContra": 2,
      "saldoGols": 6
    }
    // ... outros times
  ]
}
```

### Registrar WO
```javascript
POST /api/partidas/123/wo
{
  "timeWOId": 456
}

// Resposta
{
  "message": "WO registrado com sucesso. 4 partida(s) afetada(s).",
  "partidasAfetadas": 4,
  "timeWO": "Time A",
  "timeVencedor": "Time B"
}
```

---

## ✅ STATUS DA IMPLEMENTAÇÃO

- [x] Schema do banco atualizado
- [x] Utilitário de pontuação criado
- [x] API WO com nova lógica
- [x] API partidas integrada
- [x] API classificação implementada
- [x] Interface WO funcional
- [ ] Migração do banco executada
- [ ] Interface de classificação
- [ ] Testes de integração

---

**🎯 O sistema está pronto para uso após executar a migração do banco de dados!**
