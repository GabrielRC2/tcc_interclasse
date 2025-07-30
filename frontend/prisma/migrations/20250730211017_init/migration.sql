-- CreateTable
CREATE TABLE `Torneio` (
    `id_torneio` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_torneio` VARCHAR(200) NOT NULL,
    `status_torneio` VARCHAR(20) NOT NULL,
    `inicio_torneio` DATETIME NOT NULL,
    `fim_torneio` DATETIME NOT NULL,

    PRIMARY KEY (`id_torneio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Modalidade` (
    `id_modalidade` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_modalidade` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id_modalidade`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categoria` (
    `id_categoria` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_categoria` VARCHAR(50) NOT NULL,
    `fk_id_modalidade` INTEGER NOT NULL,

    PRIMARY KEY (`id_categoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Curso` (
    `id_curso` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_curso` VARCHAR(100) NOT NULL,
    `sigla_curso` VARCHAR(10) NOT NULL,

    UNIQUE INDEX `Curso_sigla_curso_key`(`sigla_curso`),
    PRIMARY KEY (`id_curso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jogador` (
    `id_jogador` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_jogador` VARCHAR(70) NOT NULL,
    `fk_id_curso` INTEGER NOT NULL,

    PRIMARY KEY (`id_jogador`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Time` (
    `id_time` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_time` VARCHAR(100) NOT NULL,
    `fk_id_curso` INTEGER NOT NULL,
    `fk_id_categoria` INTEGER NOT NULL,

    PRIMARY KEY (`id_time`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grupo` (
    `id_grupo` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_grupo` VARCHAR(30) NOT NULL,
    `fk_id_torneio` INTEGER NOT NULL,
    `fk_id_modalidade` INTEGER NOT NULL,
    `fk_id_categoria` INTEGER NOT NULL,

    PRIMARY KEY (`id_grupo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Local` (
    `id_local` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_local` VARCHAR(100) NOT NULL,
    `fk_id_torneio` INTEGER NOT NULL,

    PRIMARY KEY (`id_local`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Partida` (
    `id_partida` INTEGER NOT NULL AUTO_INCREMENT,
    `data_hora_partida` DATETIME NOT NULL,
    `status_partida` VARCHAR(20) NOT NULL,
    `placar_time_um` INTEGER NOT NULL,
    `placar_time_dois` INTEGER NOT NULL,
    `fk_id_torneio` INTEGER NOT NULL,
    `fk_id_local` INTEGER NOT NULL,
    `fk_id_grupo` INTEGER NOT NULL,

    PRIMARY KEY (`id_partida`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventoPartida` (
    `id_evento` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo_evento` VARCHAR(30) NOT NULL,
    `pontos_gerados` INTEGER NOT NULL,
    `tempo_partida` TIME NOT NULL,
    `fk_id_partida` INTEGER NOT NULL,
    `fk_id_jogador` INTEGER NOT NULL,

    PRIMARY KEY (`id_evento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_usuario` VARCHAR(70) NOT NULL,
    `email_usuario` VARCHAR(70) NOT NULL,
    `senha_hash` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `Usuario_email_usuario_key`(`email_usuario`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Torneio_Modalidades` (
    `fk_id_torneio` INTEGER NOT NULL,
    `fk_id_modalidade` INTEGER NOT NULL,

    PRIMARY KEY (`fk_id_torneio`, `fk_id_modalidade`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grupo_Times` (
    `fk_id_grupo` INTEGER NOT NULL,
    `fk_id_time` INTEGER NOT NULL,

    PRIMARY KEY (`fk_id_grupo`, `fk_id_time`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Time_Jogadores` (
    `fk_id_time` INTEGER NOT NULL,
    `fk_id_jogador` INTEGER NOT NULL,
    `numero_camisa` INTEGER NOT NULL,

    PRIMARY KEY (`fk_id_time`, `fk_id_jogador`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Partida_Times` (
    `fk_id_partida` INTEGER NOT NULL,
    `fk_id_time` INTEGER NOT NULL,

    PRIMARY KEY (`fk_id_partida`, `fk_id_time`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Categoria` ADD CONSTRAINT `Categoria_fk_id_modalidade_fkey` FOREIGN KEY (`fk_id_modalidade`) REFERENCES `Modalidade`(`id_modalidade`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jogador` ADD CONSTRAINT `Jogador_fk_id_curso_fkey` FOREIGN KEY (`fk_id_curso`) REFERENCES `Curso`(`id_curso`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Time` ADD CONSTRAINT `Time_fk_id_curso_fkey` FOREIGN KEY (`fk_id_curso`) REFERENCES `Curso`(`id_curso`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Time` ADD CONSTRAINT `Time_fk_id_categoria_fkey` FOREIGN KEY (`fk_id_categoria`) REFERENCES `Categoria`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grupo` ADD CONSTRAINT `Grupo_fk_id_torneio_fkey` FOREIGN KEY (`fk_id_torneio`) REFERENCES `Torneio`(`id_torneio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grupo` ADD CONSTRAINT `Grupo_fk_id_modalidade_fkey` FOREIGN KEY (`fk_id_modalidade`) REFERENCES `Modalidade`(`id_modalidade`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grupo` ADD CONSTRAINT `Grupo_fk_id_categoria_fkey` FOREIGN KEY (`fk_id_categoria`) REFERENCES `Categoria`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Local` ADD CONSTRAINT `Local_fk_id_torneio_fkey` FOREIGN KEY (`fk_id_torneio`) REFERENCES `Torneio`(`id_torneio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida` ADD CONSTRAINT `Partida_fk_id_torneio_fkey` FOREIGN KEY (`fk_id_torneio`) REFERENCES `Torneio`(`id_torneio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida` ADD CONSTRAINT `Partida_fk_id_local_fkey` FOREIGN KEY (`fk_id_local`) REFERENCES `Local`(`id_local`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida` ADD CONSTRAINT `Partida_fk_id_grupo_fkey` FOREIGN KEY (`fk_id_grupo`) REFERENCES `Grupo`(`id_grupo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventoPartida` ADD CONSTRAINT `EventoPartida_fk_id_partida_fkey` FOREIGN KEY (`fk_id_partida`) REFERENCES `Partida`(`id_partida`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventoPartida` ADD CONSTRAINT `EventoPartida_fk_id_jogador_fkey` FOREIGN KEY (`fk_id_jogador`) REFERENCES `Jogador`(`id_jogador`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Torneio_Modalidades` ADD CONSTRAINT `Torneio_Modalidades_fk_id_torneio_fkey` FOREIGN KEY (`fk_id_torneio`) REFERENCES `Torneio`(`id_torneio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Torneio_Modalidades` ADD CONSTRAINT `Torneio_Modalidades_fk_id_modalidade_fkey` FOREIGN KEY (`fk_id_modalidade`) REFERENCES `Modalidade`(`id_modalidade`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grupo_Times` ADD CONSTRAINT `Grupo_Times_fk_id_grupo_fkey` FOREIGN KEY (`fk_id_grupo`) REFERENCES `Grupo`(`id_grupo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grupo_Times` ADD CONSTRAINT `Grupo_Times_fk_id_time_fkey` FOREIGN KEY (`fk_id_time`) REFERENCES `Time`(`id_time`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Time_Jogadores` ADD CONSTRAINT `Time_Jogadores_fk_id_time_fkey` FOREIGN KEY (`fk_id_time`) REFERENCES `Time`(`id_time`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Time_Jogadores` ADD CONSTRAINT `Time_Jogadores_fk_id_jogador_fkey` FOREIGN KEY (`fk_id_jogador`) REFERENCES `Jogador`(`id_jogador`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida_Times` ADD CONSTRAINT `Partida_Times_fk_id_partida_fkey` FOREIGN KEY (`fk_id_partida`) REFERENCES `Partida`(`id_partida`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida_Times` ADD CONSTRAINT `Partida_Times_fk_id_time_fkey` FOREIGN KEY (`fk_id_time`) REFERENCES `Time`(`id_time`) ON DELETE RESTRICT ON UPDATE CASCADE;
