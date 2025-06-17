FROM node:22.12.0-alpine

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar arquivos do projeto
COPY . .

# Construir aplicação
RUN npm run build

# Expor porta 3000
EXPOSE 3000

# Iniciar aplicação
CMD ["npm", "run", "dev"]