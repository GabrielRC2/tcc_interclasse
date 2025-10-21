# 🌱 Seeder do Sistema Interclasse

Este documento explica como usar o seeder para popular o banco de dados com dados de teste.

## 📋 O que o seeder cria?

### 👥 Usuários de Teste
- **1 Admin**: Acesso total ao sistema
- **1 Staff**: Operacional (gerenciar jogos, times, resultados)
- **3 Representantes**: Um para cada turma de teste

### 🎯 Dados do Sistema
- **2 Locais**: Quadra de Cima, Quadra de Baixo
- **7 Cursos**: DS, ETEL, EVE, ETIQ, HUM, EDA, ADA
- **4 Modalidades**: Futsal, Vôlei, Basquete, Handebol
- **2 Torneios**: Meio do Ano 2024, Fim de Ano 2024
- **4 Categorias**: Vôlei e Handebol (Masculino/Feminino)
- **Jogadores**: ~630 jogadores com nomes realistas
- **Times**: Times por curso/sala/categoria
- **Escalações**: Jogadores associados aos times

## 🚀 Como usar

### 1️⃣ Executar o seeder

```bash
# Opção 1: Usando npm
npm run prisma:seed

# Opção 2: Usando o Prisma diretamente
npx prisma db seed

# Opção 3: Executar o arquivo diretamente
node prisma/seed.js
```

### 2️⃣ Credenciais criadas

#### 👨‍💼 ADMIN (Acesso Total)
```
Email: admin@interclasse.com
Senha: 123456
```

#### 👔 STAFF (Operacional)
```
Email: staff@interclasse.com
Senha: 123456
```

#### 👨‍🎓 REPRESENTANTES
```
Email: rep1a@interclasse.com
Senha: 123456

Email: rep1b@interclasse.com
Senha: 123456

Email: rep2a@interclasse.com
Senha: 123456
```

## ⚠️ IMPORTANTE

### Segurança
- **NUNCA** use estas credenciais em produção!
- Altere as senhas imediatamente após o primeiro login
- Em produção, use senhas fortes e únicas

### Limpeza de dados
O seeder **remove todos os dados existentes** antes de criar novos dados. Isso inclui:
- Todas as partidas, grupos, times e jogadores
- Todos os torneios, categorias e modalidades
- Todos os cursos e locais
- **Usuários de teste** (apenas os emails listados acima)

### Quando executar
Execute o seeder quando:
- ✅ Estiver configurando o ambiente de desenvolvimento
- ✅ Precisar resetar os dados para testes
- ✅ Quiser ter dados realistas para demonstrações
- ❌ **NUNCA** em produção com dados reais

## 🔧 Troubleshooting

### Erro: "Cannot find module 'bcryptjs'"
```bash
npm install bcryptjs
```

### Erro: "Prisma Client not generated"
```bash
npx prisma generate
```

### Erro: "Database connection failed"
1. Verifique o arquivo `.env` na raiz do projeto
2. Confirme que a variável `DATABASE_URL` está correta
3. Certifique-se de que o banco de dados está rodando

### Erro: "Migration not applied"
```bash
npx prisma migrate dev
```

## 📊 Estrutura dos dados gerados

### Jogadores
- 15 jogadores por combinação de: curso × sala × gênero
- Total: ~630 jogadores
- Nomes realistas (primeiro nome + dois sobrenomes)

### Times
- 1 time por combinação de: curso × sala × categoria
- Nome no formato: `{sala}{sigla_curso}` (ex: "1ºDS", "2ºETEL")
- Total: 84 times (7 cursos × 3 salas × 4 categorias)

### Escalações
- Vôlei: 6 jogadores por time
- Handebol: 7 jogadores por time
- Jogadores escalados com números de camisa sequenciais

## 📝 Customização

Para modificar os dados gerados, edite o arquivo `prisma/seed.js`:

```javascript
// Adicionar mais cursos
{ nome: 'Novo Curso', sigla: 'NC' }

// Adicionar mais modalidades
{ nome: 'Tênis de Mesa' }

// Modificar quantidade de jogadores
for (let i = 0; i < 20; i++) { // era 15
```

## 🔗 Arquivos relacionados

- `prisma/seed.js` - Script principal do seeder
- `prisma/schema.prisma` - Schema do banco de dados
- `package.json` - Configuração do script de seed
- `.env` - Configuração da conexão com o banco

---

**Desenvolvido para o Sistema de Gestão de Eventos Interclasse**
