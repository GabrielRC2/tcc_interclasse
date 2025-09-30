# ✅ CHECKLIST PRÁTICO DE TESTES - INÍCIO RÁPIDO

## 🚀 TESTES PRIORITÁRIOS (Faça PRIMEIRO)

### FASE 1: FUNCIONALIDADES CRÍTICAS (30min)
- [ ] **Criar um torneio completo**
  - Dashboard → Novo Torneio → "Meio do Ano" → Local + Datas → Salvar
  - ✅ Deve criar com modalidades automáticas
  - ✅ Deve redirecionar para página do torneio

- [ ] **Cadastrar times básicos**
  - Times → Novo Time → Futebol Masculino → 5-10 jogadores → Salvar
  - ✅ Deve aceitar apenas 5-15 jogadores
  - ✅ Números de camisa não podem repetir

- [ ] **Realizar sorteio de grupos**
  - Grupos → Selecionar modalidade → Realizar sorteio
  - ✅ Times devem ser distribuídos aleatoriamente
  - ✅ Deve mostrar preview antes do sorteio

- [ ] **Gerar partidas básicas**
  - Partidas → Gerar Partidas → Confirmar
  - ✅ Deve criar partidas seguindo regras
  - ✅ Deve otimizar horários automaticamente

### FASE 2: FLUXO DE SÚMULAS (20min)
- [ ] **Súmula ao vivo**
  - Partidas → Status "Em andamento" → Acessar Eventos
  - ✅ Deve permitir adicionar gols/cartões
  - ✅ Placar deve atualizar automaticamente

- [ ] **Finalizar partida**
  - Na súmula → Enviar Súmula → Confirmar
  - ✅ Status deve mudar para "Finalizada"
  - ✅ Botão "Exportar PDF" deve aparecer

- [ ] **Exportar PDF**
  - Súmula finalizada → Exportar PDF
  - ✅ PDF deve gerar com dados corretos
  - ✅ Layout deve estar bem formatado

### FASE 3: RESPONSIVIDADE BÁSICA (15min)
- [ ] **Teste mobile (Chrome DevTools F12)**
  - iPhone SE (375px) → Testar navegação
  - ✅ Menu lateral deve colapsar
  - ✅ Tabelas devem ter scroll horizontal
  - ✅ Botões devem ocupar largura total

- [ ] **Teste desktop**
  - 1920px → Verificar aproveitamento da tela
  - ✅ Sidebar deve ser fixa
  - ✅ Conteúdo deve usar largura adequada

---

## 🔍 CHECKLIST DETALHADO POR PÁGINA

### DASHBOARD
- [ ] Mostra torneio ativo corretamente
- [ ] Cards estatísticos atualizados
- [ ] Seletor de torneio funcional
- [ ] Próximas partidas listadas
- [ ] Jogadores destaque aparecendo

### TORNEIOS (SeasonsPage)
- [ ] Criar "Meio do Ano" → Modalidades automáticas OK
- [ ] Criar "Fim de Ano" → Modalidades automáticas OK
- [ ] Editar torneio existente → Campos preenchidos
- [ ] Validação de datas → Início < Fim
- [ ] Excluir torneio → Confirmação adequada

### TIMES (TeamsPage)
- [ ] Novo time → Formulário completo
- [ ] Adicionar jogador → Validações OK
- [ ] Números de camisa → Não duplicar
- [ ] Mínimo 5 jogadores → Erro se menor
- [ ] Máximo 15 jogadores → Erro se maior
- [ ] Filtros → Modalidade + Gênero
- [ ] Editar time → Dados preservados

### GRUPOS (GroupsPage)
- [ ] Seleção modalidade → Times carregam
- [ ] Quantidade grupos → Sugestão automática
- [ ] Sorteio → Distribuição aleatória
- [ ] Refazer sorteio → Confirmação clara
- [ ] Limpar grupos → Aviso de impacto
- [ ] Grupos vazios → Mensagem adequada

### PARTIDAS (MatchesPage)
- [ ] Gerar partidas → Regras aplicadas
- [ ] Filtros → Modalidade, gênero, status
- [ ] Configurar locais → Modal funcional
- [ ] Status partida → Clique alterna
- [ ] Botão súmula → Aparece no status certo
- [ ] Refazer sorteio → Mantém configurações

### SÚMULAS (SumulaModal)
- [ ] Carregar dados → Times + jogadores
- [ ] Adicionar gol → Placar atualiza
- [ ] Cartões → Amarelo/vermelho
- [ ] Modo ao vivo → Campos editáveis
- [ ] Finalizar → Status muda
- [ ] PDF → Só aparece se finalizada
- [ ] Editar finalizada → Reabilita campos

### CHAVEAMENTO (BracketsPage)
- [ ] Gerar eliminatórias → Base na classificação
- [ ] Visualização → Bracket claro
- [ ] Filtros → Por modalidade
- [ ] Navegação fases → Oitavas → Final
- [ ] Partidas eliminatórias → Diferentes de grupo

---

## 🐛 BUGS COMUNS PARA VERIFICAR

### DADOS E VALIDAÇÃO
- [ ] Campos vazios → Mensagens de erro claras
- [ ] Textos longos → Não quebram layout
- [ ] Caracteres especiais → Não causam erro
- [ ] Números negativos → Rejeitados onde necessário
- [ ] Datas inválidas → Validação frontend/backend

### INTERFACE
- [ ] Botões → Estados hover/active/disabled
- [ ] Modais → Fecham com ESC
- [ ] Loading → Indicadores visuais
- [ ] Erros → Mensagens em português
- [ ] Tema escuro → Contraste adequado

### PERFORMANCE
- [ ] Listas grandes → Scroll suave
- [ ] Filtros → Resposta instantânea
- [ ] Navegação → Sem delays perceptíveis
- [ ] Imagens → Carregamento otimizado
- [ ] JavaScript → Sem erros no console

---

## 📱 TESTE RÁPIDO DE RESPONSIVIDADE

### BREAKPOINTS CRÍTICOS
1. **320px (iPhone SE)**
   - Menu → Hamburguer funciona
   - Formulários → Campos largura total
   - Tabelas → Scroll horizontal

2. **768px (iPad)**
   - Layout → 2 colunas onde adequado
   - Sidebar → Comportamento híbrido
   - Cards → Grid responsivo

3. **1024px+ (Desktop)**
   - Sidebar → Fixa e expandida
   - Conteúdo → Largura otimizada
   - Hover → Estados visuais ativos

---

## ⚡ TESTE EXPRESS (10 MINUTOS)

**Cenário Mínimo Viável:**
1. Criar torneio "Teste Rápido"
2. Cadastrar 4 times (2 modalidades diferentes)
3. Fazer sorteio → 1 grupo de 4
4. Gerar 6 partidas
5. Simular 1 partida completa (com súmula)
6. Exportar 1 PDF
7. Testar em mobile

**Se tudo funcionar:** Sistema está estável para testes mais complexos
**Se algo falhar:** Priorize correções antes de prosseguir

---

## 🎯 CRITÉRIOS DE SUCESSO

**MÍNIMO ACEITÁVEL:**
- ✅ Fluxo completo funciona (criar → sorteio → partidas → súmula)
- ✅ Responsivo em mobile básico
- ✅ Exportação PDF funcional
- ✅ Sem erros JavaScript críticos

**IDEAL:**
- ✅ Todos os casos de teste passam
- ✅ Performance <3s em operações
- ✅ UI polida e intuitiva
- ✅ Compatível com principais navegadores

---

**💡 DICA:** Documente tudo que encontrar! Use screenshots para bugs visuais e anote passos exatos para reproduzir problemas.