1. Copiar o arquivo de exemplo
cd frontend
cp .env.example .env

2. Editar o .env com suas configurações

3. Instalar dependências
npm install
npm i @react-pdf/renderer

4. Configurar banco
npx prisma generate
npx prisma db push

5. Se quiser popular o banco de dados
npx prisma db seed

6. Rodar o projeto
npm run dev
