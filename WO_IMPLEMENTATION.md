# Implementação da Funcionalidade WO (Walk Over)

## 📋 Resumo
Este documento detalha todas as mudanças implementadas para adicionar a funcionalidade de WO (Walk Over) ao sistema de gerenciamento de torneios.

## 🎯 Objetivos
- Permitir que times declarem WO (desistência) em partidas
- Exibir indicadores visuais para times com WO
- Posicionar times com WO no final das tabelas de classificação
- Mostrar "WO" em vermelho ao invés da posição numérica

---

## 🔧 Arquivos Modificados

### 1. **Frontend - Página de Partidas**
**Arquivo:** `src/components/MatchesPage.jsx`

#### Mudanças:
- ✅ Adicionado botão WO com ícone AlertTriangle
- ✅ Integração com modal WOModal
- ✅ Indicador visual para times com WO nas partidas
- ✅ Lógica para detectar times com WO baseado no resultado

```jsx
// Botão WO adicionado
<button
  onClick={() => handleWOClick(partida)}
  className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
  title="Declarar WO (Walk Over)"
>
  <AlertTriangle size={16} />
</button>

// Indicador visual para times com WO
{(partida.resultadoCasa === 'WO' || partida.resultadoVisitante === 'WO') && (
  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
    <AlertTriangle size={14} />
    <span className="text-xs font-medium">WO</span>
  </div>
)}
```

### 2. **Frontend - Página de Chaveamento**
**Arquivo:** `src/components/BracketsPage.jsx`

#### Mudanças:
- ✅ Modificada exibição da posição na tabela de classificação
- ✅ Times com WO mostram "WO" em vermelho
- ✅ Cálculo correto das posições para times ativos

```jsx
// Exibição condicional da posição
<td className="py-2 px-2 font-bold text-center">
  {time.temWO ? (
    <span className="text-red-700 dark:text-red-500 font-bold">WO</span>
  ) : (
    <span className="text-gray-900 dark:text-gray-100">{posicaoReal}°</span>
  )}
</td>
```

### 3. **Backend - Lógica de Pontuação**
**Arquivo:** `src/utils/pontuacaoTorneio.js`

#### Mudanças:
- ✅ Adicionada constante `WO: 0` para pontos do torneio
- ✅ Flag `temWO` adicionada à estrutura de dados dos times
- ✅ Detecção de WO no processamento de resultados
- ✅ Ordenação especial para colocar times com WO no final

```javascript
// Constante adicionada
export const PONTOS_TORNEIO = {
  VENCEDOR: 3,
  EMPATE: 1,
  PERDEDOR: 0,
  WO: 0, // Time que dá WO não ganha pontos
  PENDENTE: 0
};

// Estrutura de dados modificada
acc[timeId] = {
  timeId,
  nome: partidaTime.time.nome,
  pontos: 0,
  jogos: 0,
  vitorias: 0,
  empates: 0,
  derrotas: 0,
  golsPro: 0,
  golsContra: 0,
  saldoGols: 0,
  temWO: false // ← Nova flag adicionada
};

// Lógica de detecção de WO
case 'WO':
  team.derrotas += 1;
  team.temWO = true; // ← Marcar que o time teve WO
  break;

// Ordenação especial
const classificacaoArray = Object.values(classificacao).sort((a, b) => {
  // Times com WO sempre vão para o final
  if (a.temWO && !b.temWO) return 1;
  if (!a.temWO && b.temWO) return -1;
  
  // Se ambos têm WO ou ambos não têm, ordenar normalmente
  if (b.pontos !== a.pontos) return b.pontos - a.pontos;
  if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
  return b.golsPro - a.golsPro;
});
```

### 4. **API - Classificação Geral**
**Arquivo:** `src/app/api/classificacao/route.js`

#### Mudanças:
- ✅ Flag `temWO` adicionada em `obterClassificacaoGeral()`
- ✅ Detecção de WO separada de derrota comum
- ✅ Ordenação especial em todas as funções de classificação

```javascript
// Estrutura de dados modificada
acc[timeId] = {
  timeId,
  nome: partidaTime.time.nome,
  genero: partidaTime.time.categoria.genero,
  modalidade: partidaTime.time.categoria.modalidade.nome,
  pontos: 0,
  jogos: 0,
  vitorias: 0,
  empates: 0,
  derrotas: 0,
  golsPro: 0,
  golsContra: 0,
  saldoGols: 0,
  temWO: false // ← Nova flag adicionada
};

// Detecção de WO melhorada
switch (partidaTime.resultado) {
  case 'VENCEDOR':
    team.vitorias += 1;
    break;
  case 'EMPATE':
    team.empates += 1;
    break;
  case 'PERDEDOR':
    team.derrotas += 1;
    break;
  case 'WO':
    team.derrotas += 1;
    team.temWO = true; // ← Marcar que o time teve WO
    break;
}

// Ordenação em ambas as funções de classificação geral
const classificacaoArray = Object.values(classificacao).sort((a, b) => {
  // Times com WO sempre vão para o final
  if (a.temWO && !b.temWO) return 1;
  if (!a.temWO && b.temWO) return -1;
  
  // Se ambos têm WO ou ambos não têm, ordenar normalmente
  if (b.pontos !== a.pontos) return b.pontos - a.pontos;
  if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
  return b.golsPro - a.golsPro;
});
```

---

## 🎨 Componentes Reutilizados

### **WOModal.jsx**
- Modal existente foi reutilizado para seleção de time com WO
- Nenhuma modificação necessária no componente

---

## 📊 Comportamento da Funcionalidade

### **Fluxo do WO:**
1. **Partida em Andamento**: Usuário clica no botão WO (ícone AlertTriangle)
2. **Modal de Seleção**: Seleciona qual time está dando WO
3. **Atualização do Resultado**: Time selecionado recebe resultado "WO"
4. **Indicadores Visuais**: Partida mostra ícone WO laranja
5. **Classificação Atualizada**: Time com WO vai para o final da tabela

### **Regras de Pontuação:**
- **Time com WO**: 0 pontos, conta como derrota
- **Time oponente**: 3 pontos, conta como vitória
- **Estatísticas**: Preservadas (gols, saldo, etc.)

### **Exibição nas Tabelas:**
- **Posição**: "WO" em vermelho ao invés do número
- **Ordenação**: Times com WO sempre no final
- **Posições dos Ativos**: Calculadas corretamente excluindo WOs

---

## 🎯 Tipos de Classificação Afetados

### ✅ **Classificação por Grupo**
- Times com WO no final do grupo
- Implementado via `obterClassificacao()` em `pontuacaoTorneio.js`

### ✅ **Classificação Geral do Torneio**
- Times com WO no final da classificação geral
- Implementado via `obterClassificacaoGeral()` na API

### ✅ **Classificação Geral por Modalidade**
- Times com WO no final da modalidade específica
- Implementado via `obterClassificacaoGeralModalidade()` na API

---

## 🔍 Detalhes Técnicos

### **Flag temWO:**
- **Tipo**: Boolean
- **Propósito**: Identificar times que deram WO
- **Uso**: Ordenação e exibição condicional

### **Ordenação Customizada:**
```javascript
// Lógica de ordenação aplicada em todas as classificações
if (a.temWO && !b.temWO) return 1;  // A vai para o final
if (!a.temWO && b.temWO) return -1; // B vai para o final

// Se ambos têm mesmo status de WO, ordenar normalmente
if (b.pontos !== a.pontos) return b.pontos - a.pontos;
if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
return b.golsPro - a.golsPro;
```

### **Cálculo de Posições:**
```javascript
// Excluir times com WO do cálculo de posições
const timesAntes = dados.slice(0, index);
const timesComWOAntes = timesAntes.filter(t => t.temWO).length;
const posicaoReal = index + 1 - timesComWOAntes;
```

---

## ✅ Status da Implementação

- [x] **Modal de WO**: Funcional e integrado
- [x] **Botão WO**: Visível em partidas ativas
- [x] **Indicadores Visuais**: Ícones em partidas e times
- [x] **Classificação por Grupo**: Times com WO no final
- [x] **Classificação Geral**: Times com WO no final
- [x] **Classificação por Modalidade**: Times com WO no final
- [x] **Cálculo de Posições**: Correto para times ativos
- [x] **Estilização**: "WO" em vermelho nas tabelas

---

## 🚀 Resultado Final

A funcionalidade de WO está completamente implementada e integrada ao sistema. Times que dão WO são automaticamente posicionados no final de todas as tabelas de classificação, com indicadores visuais apropriados e cálculo correto das posições dos times ativos.

**Data da Implementação:** Outubro 2025  
**Status:** ✅ Completo e Funcional