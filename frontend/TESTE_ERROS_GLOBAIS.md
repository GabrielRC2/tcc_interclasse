# 🧪 Guia de Testes - Sistema Global de Erros (SPA)

Este guia mostra como testar cada tipo de erro global implementado no sistema **Single Page Application** (navegação por componentes, sem URLs).

## 📋 **Pré-requisitos**
- Servidor Next.js rodando (`npm run dev`)
- Navegador com DevTools (Chrome/Edge/Firefox)
- Sistema de toasts implementado
- **Importante:** Erros são de **API/Backend**, não de navegação/URLs

## 🎯 **Contexto: SPA vs URLs**
**Seu sistema:** Navegação por componentes (Sidebar → Dashboard, Teams, Matches, etc.)
**Erros possíveis:** APIs do backend, rede, dados - **NÃO** erros de roteamento
**Tratamento:** Interceptação global de `fetch()` para APIs

---

## 🔌 **1. Teste de Internet (Offline/Online)**

### **Como Testar:**
1. **Abra o DevTools:** `F12`
2. **Vá para aba Network**
3. **Encontre o dropdown "No throttling"** (ou "Online")
4. **Selecione "Offline"**
5. ✅ **Deve aparecer:** "🔌 Sem conexão com a internet. Verifique sua conexão."
6. **Volte para "Online"**
7. ✅ **Deve aparecer:** "✅ Conexão com a internet restaurada."

### **Método Alternativo:**
```javascript
// Cole no Console do DevTools (F12 → Console):
window.dispatchEvent(new Event('offline')); // Simula offline
window.dispatchEvent(new Event('online'));  // Simula online
```

---

## 🔑 **2. Teste de Erro 401 (Sessão Expirada)**

### **Como Testar:**
1. **Cole no Console:**
```javascript
// Testar endpoint que precisa de autenticação
fetch('/api/users/me');
```
2. ✅ **Deve aparecer:** "🔑 Sessão expirada. Você será redirecionado..."
3. ✅ **Deve limpar localStorage e recarregar a página**

### **Cenários Reais no seu SPA:**
- **Deixe o sistema aberto por horas** (sessão expira automaticamente)
- **Faça logout** e tente criar/editar qualquer coisa
- **Feche e reabra o navegador** sem fazer login novamente
- **Tente usar funcionalidades** após sessão expirar

### **APIs que REALMENTE geram 401 (precisam de autenticação):**
```javascript
// Endpoints que verificam autenticação:
fetch('/api/users/me');                    // Perfil do usuário
fetch('/api/auth/verify');                 // Verificar sessão
fetch('/api/dashboard/jogadores-destaque'); // Dados do dashboard
fetch('/api/users', { method: 'GET' });    // Listar usuários (admin)

// Para FORÇAR 401, remova o token primeiro:
localStorage.removeItem('authToken');
sessionStorage.clear();
// Depois teste qualquer endpoint protegido:
fetch('/api/users/me');
```

---

## � **2.1. Exemplos de Outros Erros Comuns**

### **Erro 400 (Bad Request) - Dados Mal Formados:**
```javascript
// Exemplo real que gera 400:
fetch('/api/teams', { 
  method: 'POST', 
  headers: {'Content-Type': 'application/json'}, 
  body: JSON.stringify({nome: 'Test'}) // Falta cursoId obrigatório
});
```
✅ **Deve aparecer:** "📋 Dados inválidos. Verifique os campos preenchidos."

### **Erro 405 (Method Not Allowed) - Método HTTP Errado:**
```javascript
// Exemplo real que gera 405:
fetch('/api/partidas', { 
  method: 'POST',  // POST pode não ser suportado
  headers: {'Content-Type': 'application/json'}, 
  body: JSON.stringify({})
});
```
✅ **Deve aparecer:** "❌ Método não permitido para esta operação."

### **Erro 500 (Internal Server Error) - Falha no Servidor:**
```javascript
// Exemplo real que gera 500:
fetch('/api/torneios', { 
  method: 'POST', 
  headers: {'Content-Type': 'application/json'}, 
  body: JSON.stringify({}) // Dados vazios causam exception
});
```
✅ **Deve aparecer:** "🔧 Erro interno do servidor. Tente novamente em alguns minutos."

---

## �🛡️ **3. Teste de Erro 403 (Permissão Negada)**

### **Como Testar:**
1. **Cole no Console:**
```javascript
// ADMIN tentando função de STAFF, ou vice-versa
fetch('/api/torneios', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nome: 'Torneio Teste' })
});
```
2. ✅ **Deve aparecer:** "🛡️ Você não tem permissão para esta operação."

### **Cenários Reais no seu SPA:**
- **Login como STAFF:** Tente acessar componente de criação de torneios (só ADMIN)
- **Login como REPRESENTANTE:** Tente editar times de outros cursos
- **Usuário comum:** Tente acessar área administrativa
- **Use a sidebar:** Clique em "Admin" > "Seasons" se não for ADMIN

### **APIs que podem gerar 403:**
```javascript
// Se não for ADMIN:
fetch('/api/torneios', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({nome: 'Test'}) });

// Se não for dono do time:
fetch('/api/teams/1', { method: 'DELETE' });

// Se não tiver permissão para modalidade:
fetch('/api/partidas', { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status: 'FINALIZADA'}) });
```

---

## ❓ **4. Teste de Erro 404 (Recurso Não Encontrado)**

### **Como Testar:**
1. **Cole no Console:**
```javascript
fetch('/api/endpoint-inexistente');
```
2. ✅ **Deve aparecer:** "❓ Recurso não encontrado."

### **Cenários Reais no seu SPA:**
- **IDs inexistentes:** Tentar editar time que foi deletado
- **Dados desatualizados:** Acessar partida que foi removida
- **Cache local:** Tentar acessar recurso que não existe mais

### **APIs reais que podem gerar 404:**
```javascript
fetch('/api/teams/999999');     // Time inexistente
fetch('/api/partidas/999999');  // Partida inexistente  
fetch('/api/jogadores/999999'); // Jogador inexistente
fetch('/api/torneios/999999');  // Torneio inexistente
fetch('/api/grupos/999999');    // Grupo inexistente
fetch('/api/modalidades/999999'); // Modalidade inexistente
```
✅ **Deve aparecer:** "❓ Recurso não encontrado para [times/partidas/etc]."

---

## ⏱️ **5. Teste de Timeout**

### **Como Testar no DevTools:**
1. **F12 → Network**
2. **Encontre "No throttling"**
3. **Selecione "Slow 3G" ou "Fast 3G"**
4. **Faça uma requisição pesada**
5. ✅ **Deve aparear após 30s:** "⏱️ Timeout: A operação demorou muito. Tente novamente."

### **Método pelo Console:**
```javascript
// Simular timeout
const controller = new AbortController();
setTimeout(() => controller.abort(), 100); // Aborta em 100ms

fetch('/api/partidas', { 
  signal: controller.signal 
}).catch(console.log);
```

---

## 🔧 **6. Teste de Erro 500 (Servidor)**

### **Como Testar:**
1. **Cole no Console:**
```javascript
// Se houver endpoint que force erro 500
fetch('/api/force-error-500');
```

### **Simulação:**
```javascript
// Simular resposta 500 no DevTools
// 1. F12 → Network
// 2. Right-click em requisição
// 3. "Override response" → Status: 500
```
✅ **Deve aparecer:** "🔧 Erro interno do servidor. Tente novamente em alguns minutos."

---

## 📋 **7. Teste de Erro 422 (Dados Inválidos)**

### **Cenários Reais no seu SPA:**
- **Formulários mal preenchidos:** Nome vazio, email inválido
- **Validação de negócio:** Criar time sem modalidade
- **Dados inconsistentes:** Partida com times iguais

### **Como Testar:**
```javascript
// Nome de time vazio
fetch('/api/teams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    nome: '', // Nome vazio = inválido
    cursoId: 1
  })
});

// Jogador sem nome  
fetch('/api/jogadores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    nome: '',
    timeId: 1
  })
});

// Partida com dados inválidos
fetch('/api/partidas', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    time1Id: 1,
    time2Id: 1 // Times iguais = inválido
  })
});
```
✅ **Deve aparecer:** "📋 Dados inválidos. Verifique os campos preenchidos."

---

## ⚠️ **8. Teste de Erro 409 (Conflito)**

### **Cenários Reais no seu SPA:**
- **Nomes duplicados:** Criar time com nome que já existe
- **Conflito de horário:** Agendar partida em horário ocupado  
- **Estado inconsistente:** Tentar finalizar partida já finalizada

### **Como Testar:**
```javascript
// Time com nome duplicado
fetch('/api/teams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    nome: '1º ADS', // Se já existe um time com esse nome
    cursoId: 1
  })
});

// Jogador já existe em outro time
fetch('/api/jogadores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'João Silva', // Se já existe
    email: 'joao@email.com' // Email já usado
  })
});

// Finalizar partida já finalizada
fetch('/api/partidas/1/finalizar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ resultado: 'FINALIZADA' })
});
```
✅ **Deve aparecer:** "⚠️ Conflito: Esta operação não pode ser realizada no momento."

---

## 🚫 **9. Teste de Erro 429 (Muitas Tentativas)**

### **Como Testar:**
```javascript
// Fazer muitas requisições rapidamente
for(let i = 0; i < 100; i++) {
  fetch('/api/partidas');
}
```
✅ **Deve aparecer:** "⏱️ Muitas tentativas. Aguarde um momento e tente novamente."

---

## 🌐 **10. Teste de Erro de Rede**

### **Cenários Reais no seu SPA:**
- **WiFi instável:** Conectividade intermitente
- **Servidor backend offline:** Problema no Express/Node.js
- **Proxy/Firewall:** Bloqueio de requisições

### **Como Testar:**
1. **Desconecte fisicamente a internet** 
2. **Use qualquer componente** (Teams, Matches, Dashboard)
3. **Tente criar/editar** qualquer coisa
4. ✅ **Deve aparecer:** "🔌 Erro de conexão. Verifique sua internet."

### **Método Alternativo:**
```javascript
// Simular no DevTools: F12 → Network → Offline
// Depois tente qualquer fetch:
fetch('/api/teams');
fetch('/api/partidas');
fetch('/api/users/me');
```

---

## 🔍 **11. Teste de Erro Genérico**

### **Como Testar:**
```javascript
// Forçar erro JavaScript
throw new Error('Erro de teste');
```
✅ **Deve aparecer:** "❌ Erro inesperado na aplicação."

---

## 📊 **Resumo de Mensagens Esperadas:**

| Erro | Código | Mensagem |
|------|--------|----------|
| Internet | offline | 🔌 Sem conexão com a internet |
| Internet | online | ✅ Conexão restaurada |
| Auth | 401 | 🔑 Sessão expirada |
| Permissão | 403 | 🛡️ Sem permissão |
| Not Found | 404 | ❓ Recurso não encontrado |
| Timeout | 408 | ⏱️ Timeout da operação |
| Conflito | 409 | ⚠️ Conflito detectado |
| Dados | 422 | 📋 Dados inválidos |
| Rate Limit | 429 | ⏱️ Muitas tentativas |
| Servidor | 500+ | 🔧 Erro interno do servidor |
| Rede | Network | 🔌 Erro de conexão |
| Genérico | JS Error | ❌ Erro inesperado |

---

## 🎯 **Dicas de Teste:**

1. **Toasts aparecem no canto inferior direito**
2. **Cada toast dura 5 segundos por padrão**
3. **Múltiplos toasts se empilham verticalmente**
4. **Clique no X para fechar manualmente**
5. **Erros são logados no console para debug**

---

## 🚨 **Troubleshooting para SPAs:**

**Toast não aparece?**
- ✅ Verifique se `GlobalErrorMonitor` está no layout
- ✅ Verifique se está dentro do `ToastProvider`
- ✅ Abra console para ver erros (F12)

**Erro 401 não limpa sessão?**
- ✅ **Normal!** SPAs não usam URLs para auth
- ✅ Deve limpar localStorage/sessionStorage
- ✅ Deve recarregar página ou resetar estado global

**Interceptador não funciona?**
- ✅ Verifique se `useGlobalErrors` está sendo chamado
- ✅ Confirme que `fetch` original foi interceptado
- ✅ Use `console.log` para debugar interceptação

**Diferenças entre SPA e sites tradicionais:**
- ❌ **Não há** erros 404 de páginas (componentes sempre existem)
- ❌ **Não há** redirects baseados em URL  
- ✅ **Ainda há** todos os erros de API (401, 403, 500, etc.)
- ✅ **Tratamento é via** interceptação de fetch, não navegação