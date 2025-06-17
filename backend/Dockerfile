FROM php:8.2-fpm

# Argumentos definidos no docker-compose.yml
ARG WWWUSER=1000
ARG WWWGROUP=1000

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev

# Limpar cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar extensões PHP
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Obter Composer mais recente
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Criar usuário do sistema para executar comandos Composer e Artisan
RUN groupadd -g $WWWGROUP appgroup \
    && useradd -u $WWWUSER -g appgroup -m appuser

# Definir diretório de trabalho
WORKDIR /var/www/html

# Copiar código da aplicação
COPY . .

# Definir permissões de diretório
RUN chown -R appuser:appgroup /var/www/html

# Mudar para o usuário não-root
USER appuser

# Expor porta 9000 e iniciar php-fpm
EXPOSE 9000
CMD ["php-fpm"]