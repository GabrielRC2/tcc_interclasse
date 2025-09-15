


# 1. Copiar o arquivo de exemplo
cd frontend

cp .env.example .env



# 2. Editar o .env com suas configurações

# 3. Instalar dependências
npm install


# 4. Configurar banco
npx prisma generate
npx prisma db push


# 5. Rodar o projeto
npm run dev
