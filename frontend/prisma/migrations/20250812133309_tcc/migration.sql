/*
  Warnings:

  - You are about to alter the column `nome_torneio` on the `torneio` table. The data in that column could be lost. The data in that column will be cast from `VarChar(200)` to `VarChar(150)`.
  - You are about to alter the column `status_torneio` on the `torneio` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Enum(EnumId(1))`.
  - You are about to drop the `categoria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `curso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `eventopartida` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grupo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grupotime` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `jogador` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `local` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modalidade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `partida` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `partidatime` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `time` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `time_jogadores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `torneio_modalidades` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `categoria` DROP FOREIGN KEY `Categoria_fk_id_modalidade_fkey`;

-- DropForeignKey
ALTER TABLE `eventopartida` DROP FOREIGN KEY `EventoPartida_fk_id_jogador_fkey`;

-- DropForeignKey
ALTER TABLE `eventopartida` DROP FOREIGN KEY `EventoPartida_fk_id_partida_fkey`;

-- DropForeignKey
ALTER TABLE `grupo` DROP FOREIGN KEY `Grupo_fk_id_modalidade_fkey`;

-- DropForeignKey
ALTER TABLE `grupo` DROP FOREIGN KEY `Grupo_fk_id_torneio_fkey`;

-- DropForeignKey
ALTER TABLE `grupotime` DROP FOREIGN KEY `GrupoTime_fk_id_grupo_fkey`;

-- DropForeignKey
ALTER TABLE `grupotime` DROP FOREIGN KEY `GrupoTime_fk_id_time_fkey`;

-- DropForeignKey
ALTER TABLE `jogador` DROP FOREIGN KEY `Jogador_fk_id_curso_fkey`;

-- DropForeignKey
ALTER TABLE `local` DROP FOREIGN KEY `Local_fk_id_torneio_fkey`;

-- DropForeignKey
ALTER TABLE `partida` DROP FOREIGN KEY `Partida_fk_id_grupo_fkey`;

-- DropForeignKey
ALTER TABLE `partida` DROP FOREIGN KEY `Partida_fk_id_local_fkey`;

-- DropForeignKey
ALTER TABLE `partida` DROP FOREIGN KEY `Partida_fk_id_torneio_fkey`;

-- DropForeignKey
ALTER TABLE `partidatime` DROP FOREIGN KEY `PartidaTime_fk_id_partida_fkey`;

-- DropForeignKey
ALTER TABLE `partidatime` DROP FOREIGN KEY `PartidaTime_fk_id_time_fkey`;

-- DropForeignKey
ALTER TABLE `time` DROP FOREIGN KEY `Time_fk_id_categoria_fkey`;

-- DropForeignKey
ALTER TABLE `time` DROP FOREIGN KEY `Time_fk_id_curso_fkey`;

-- DropForeignKey
ALTER TABLE `time_jogadores` DROP FOREIGN KEY `Time_Jogadores_fk_id_jogador_fkey`;

-- DropForeignKey
ALTER TABLE `time_jogadores` DROP FOREIGN KEY `Time_Jogadores_fk_id_time_fkey`;

-- DropForeignKey
ALTER TABLE `torneio_modalidades` DROP FOREIGN KEY `Torneio_Modalidades_fk_id_modalidade_fkey`;

-- DropForeignKey
ALTER TABLE `torneio_modalidades` DROP FOREIGN KEY `Torneio_Modalidades_fk_id_torneio_fkey`;

-- AlterTable
ALTER TABLE `torneio` MODIFY `nome_torneio` VARCHAR(150) NOT NULL,
    MODIFY `status_torneio` ENUM('Planejamento', 'Em_Andamento', 'Finalizado') NOT NULL,
    MODIFY `inicio_torneio` DATE NOT NULL,
    MODIFY `fim_torneio` DATE NOT NULL;

-- DropTable
DROP TABLE `categoria`;

-- DropTable
DROP TABLE `curso`;

-- DropTable
DROP TABLE `eventopartida`;

-- DropTable
DROP TABLE `grupo`;

-- DropTable
DROP TABLE `grupotime`;

-- DropTable
DROP TABLE `jogador`;

-- DropTable
DROP TABLE `local`;

-- DropTable
DROP TABLE `modalidade`;

-- DropTable
DROP TABLE `partida`;

-- DropTable
DROP TABLE `partidatime`;

-- DropTable
DROP TABLE `time`;

-- DropTable
DROP TABLE `time_jogadores`;

-- DropTable
DROP TABLE `torneio_modalidades`;

-- DropTable
DROP TABLE `usuario`;

-- CreateTable
CREATE TABLE `Usuarios` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_usuario` VARCHAR(100) NOT NULL,
    `email_usuario` VARCHAR(255) NOT NULL,
    `senha_hash` VARCHAR(255) NOT NULL,
    `tipo_usuario` ENUM('admin', 'professor') NOT NULL,

    UNIQUE INDEX `Usuarios_email_usuario_key`(`email_usuario`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Modalidades` (
    `id_modalidade` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_modalidade` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `Modalidades_nome_modalidade_key`(`nome_modalidade`),
    PRIMARY KEY (`id_modalidade`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categorias` (
    `id_categoria` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_categoria` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `Categorias_nome_categoria_key`(`nome_categoria`),
    PRIMARY KEY (`id_categoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Locais` (
    `id_local` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_local` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `Locais_nome_local_key`(`nome_local`),
    PRIMARY KEY (`id_local`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Times` (
    `id_times` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_time` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `Times_nome_time_key`(`nome_time`),
    PRIMARY KEY (`id_times`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jogadores` (
    `id_jogador` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_jogador` VARCHAR(100) NOT NULL,
    `numero_camisa_jogador` INTEGER NULL,

    PRIMARY KEY (`id_jogador`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Participantes` (
    `fk_id_jogador` INTEGER NOT NULL,
    `fk_id_times` INTEGER NOT NULL,

    PRIMARY KEY (`fk_id_jogador`, `fk_id_times`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inscricoes` (
    `id_inscricao` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_id_torneio` INTEGER NOT NULL,
    `fk_id_times` INTEGER NOT NULL,
    `fk_id_modalidades` INTEGER NOT NULL,
    `fk_id_categoria` INTEGER NOT NULL,

    UNIQUE INDEX `Inscricoes_fk_id_torneio_fk_id_times_fk_id_modalidades_fk_id_key`(`fk_id_torneio`, `fk_id_times`, `fk_id_modalidades`, `fk_id_categoria`),
    PRIMARY KEY (`id_inscricao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grupos` (
    `id_grupo` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_grupo` VARCHAR(50) NOT NULL,
    `fk_id_torneio` INTEGER NOT NULL,
    `fk_id_modalidades` INTEGER NOT NULL,
    `fk_id_categoria` INTEGER NOT NULL,

    PRIMARY KEY (`id_grupo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grupos_Inscricoes` (
    `fk_id_grupo` INTEGER NOT NULL,
    `fk_id_inscricao` INTEGER NOT NULL,

    UNIQUE INDEX `Grupos_Inscricoes_fk_id_inscricao_key`(`fk_id_inscricao`),
    PRIMARY KEY (`fk_id_grupo`, `fk_id_inscricao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Partidas` (
    `id_partidas` INTEGER NOT NULL AUTO_INCREMENT,
    `placar_time_A` INTEGER NULL,
    `placar_time_B` INTEGER NULL,
    `status_partida` ENUM('Agendada', 'Em_Andamento', 'Finalizada') NOT NULL DEFAULT 'Agendada',
    `fk_id_local` INTEGER NOT NULL,
    `fk_id_torneio` INTEGER NOT NULL,
    `fk_id_grupo` INTEGER NULL,

    PRIMARY KEY (`id_partidas`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Partida_Inscricoes` (
    `fk_id_partida` INTEGER NOT NULL,
    `fk_id_inscricao` INTEGER NOT NULL,
    `identificador_time` ENUM('Time_A', 'Time_B') NOT NULL,

    PRIMARY KEY (`fk_id_partida`, `fk_id_inscricao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Eventos_Partida` (
    `id_evento` INTEGER NOT NULL AUTO_INCREMENT,
    `tempo_partida` INTEGER NULL,
    `tipo_evento` ENUM('Gol', 'Ponto', 'Cartao_Amarelo', 'Cartao_Vermelho') NOT NULL,
    `pontos_gerados` INTEGER NULL,
    `fk_id_partida` INTEGER NOT NULL,
    `fk_id_jogador` INTEGER NOT NULL,
    `fk_id_time` INTEGER NOT NULL,

    PRIMARY KEY (`id_evento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Participantes` ADD CONSTRAINT `Participantes_fk_id_jogador_fkey` FOREIGN KEY (`fk_id_jogador`) REFERENCES `Jogadores`(`id_jogador`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participantes` ADD CONSTRAINT `Participantes_fk_id_times_fkey` FOREIGN KEY (`fk_id_times`) REFERENCES `Times`(`id_times`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inscricoes` ADD CONSTRAINT `Inscricoes_fk_id_torneio_fkey` FOREIGN KEY (`fk_id_torneio`) REFERENCES `Torneio`(`id_torneio`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inscricoes` ADD CONSTRAINT `Inscricoes_fk_id_times_fkey` FOREIGN KEY (`fk_id_times`) REFERENCES `Times`(`id_times`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inscricoes` ADD CONSTRAINT `Inscricoes_fk_id_modalidades_fkey` FOREIGN KEY (`fk_id_modalidades`) REFERENCES `Modalidades`(`id_modalidade`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inscricoes` ADD CONSTRAINT `Inscricoes_fk_id_categoria_fkey` FOREIGN KEY (`fk_id_categoria`) REFERENCES `Categorias`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grupos` ADD CONSTRAINT `Grupos_fk_id_torneio_fkey` FOREIGN KEY (`fk_id_torneio`) REFERENCES `Torneio`(`id_torneio`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grupos` ADD CONSTRAINT `Grupos_fk_id_modalidades_fkey` FOREIGN KEY (`fk_id_modalidades`) REFERENCES `Modalidades`(`id_modalidade`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grupos` ADD CONSTRAINT `Grupos_fk_id_categoria_fkey` FOREIGN KEY (`fk_id_categoria`) REFERENCES `Categorias`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grupos_Inscricoes` ADD CONSTRAINT `Grupos_Inscricoes_fk_id_grupo_fkey` FOREIGN KEY (`fk_id_grupo`) REFERENCES `Grupos`(`id_grupo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grupos_Inscricoes` ADD CONSTRAINT `Grupos_Inscricoes_fk_id_inscricao_fkey` FOREIGN KEY (`fk_id_inscricao`) REFERENCES `Inscricoes`(`id_inscricao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partidas` ADD CONSTRAINT `Partidas_fk_id_local_fkey` FOREIGN KEY (`fk_id_local`) REFERENCES `Locais`(`id_local`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partidas` ADD CONSTRAINT `Partidas_fk_id_torneio_fkey` FOREIGN KEY (`fk_id_torneio`) REFERENCES `Torneio`(`id_torneio`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partidas` ADD CONSTRAINT `Partidas_fk_id_grupo_fkey` FOREIGN KEY (`fk_id_grupo`) REFERENCES `Grupos`(`id_grupo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida_Inscricoes` ADD CONSTRAINT `Partida_Inscricoes_fk_id_partida_fkey` FOREIGN KEY (`fk_id_partida`) REFERENCES `Partidas`(`id_partidas`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida_Inscricoes` ADD CONSTRAINT `Partida_Inscricoes_fk_id_inscricao_fkey` FOREIGN KEY (`fk_id_inscricao`) REFERENCES `Inscricoes`(`id_inscricao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Eventos_Partida` ADD CONSTRAINT `Eventos_Partida_fk_id_partida_fkey` FOREIGN KEY (`fk_id_partida`) REFERENCES `Partidas`(`id_partidas`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Eventos_Partida` ADD CONSTRAINT `Eventos_Partida_fk_id_jogador_fkey` FOREIGN KEY (`fk_id_jogador`) REFERENCES `Jogadores`(`id_jogador`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Eventos_Partida` ADD CONSTRAINT `Eventos_Partida_fk_id_time_fkey` FOREIGN KEY (`fk_id_time`) REFERENCES `Times`(`id_times`) ON DELETE RESTRICT ON UPDATE CASCADE;
