/*
  Warnings:

  - You are about to drop the column `tempo_partida` on the `eventopartida` table. All the data in the column will be lost.
  - You are about to drop the column `fk_id_torneio` on the `local` table. All the data in the column will be lost.
  - You are about to alter the column `data_hora_partida` on the `partida` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `inicio_torneio` on the `torneio` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `fim_torneio` on the `torneio` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - Added the required column `genero_categoria` to the `Categoria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genero_jogador` to the `Jogador` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fk_id_modalidade` to the `Partida` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genero` to the `Partida` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fk_id_torneio` to the `Time` table without a default value. This is not possible if the table is not empty.
  - Added the required column `turma_time` to the `Time` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_usuario` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `local` DROP FOREIGN KEY `Local_fk_id_torneio_fkey`;

-- DropForeignKey
ALTER TABLE `partida` DROP FOREIGN KEY `Partida_fk_id_grupo_fkey`;

-- DropIndex
DROP INDEX `Local_fk_id_torneio_fkey` ON `local`;

-- DropIndex
DROP INDEX `Partida_fk_id_grupo_fkey` ON `partida`;

-- AlterTable
ALTER TABLE `categoria` ADD COLUMN `genero_categoria` VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE `eventopartida` DROP COLUMN `tempo_partida`;

-- AlterTable
ALTER TABLE `jogador` ADD COLUMN `genero_jogador` VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE `local` DROP COLUMN `fk_id_torneio`;

-- AlterTable
ALTER TABLE `partida` ADD COLUMN `fase` VARCHAR(50) NULL,
    ADD COLUMN `fk_id_modalidade` INTEGER NOT NULL,
    ADD COLUMN `genero` VARCHAR(10) NOT NULL,
    ADD COLUMN `ordem` INTEGER NULL,
    ADD COLUMN `penaltis_casa` INTEGER NULL DEFAULT 0,
    ADD COLUMN `penaltis_visitante` INTEGER NULL DEFAULT 0,
    ADD COLUMN `tem_penaltis` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tipo` VARCHAR(20) NOT NULL DEFAULT 'GRUPO',
    MODIFY `data_hora_partida` DATETIME NOT NULL,
    MODIFY `fk_id_grupo` INTEGER NULL;

-- AlterTable
ALTER TABLE `partidatime` ADD COLUMN `pontos_torneio` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `resutado_partida` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE';

-- AlterTable
ALTER TABLE `time` ADD COLUMN `fk_id_torneio` INTEGER NOT NULL,
    ADD COLUMN `turma_time` VARCHAR(1) NOT NULL;

-- AlterTable
ALTER TABLE `torneio` ADD COLUMN `local_torneio` VARCHAR(200) NOT NULL DEFAULT 'ETEC João Belarmino',
    MODIFY `inicio_torneio` DATETIME NOT NULL,
    MODIFY `fim_torneio` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `tipo_usuario` ENUM('ADMIN', 'STAFF', 'REPRESENTANTE') NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `Local_Modalidade` (
    `fk_id_local` INTEGER NOT NULL,
    `fk_id_modalidade` INTEGER NOT NULL,

    UNIQUE INDEX `Local_Modalidade_fk_id_local_fk_id_modalidade_key`(`fk_id_local`, `fk_id_modalidade`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Time` ADD CONSTRAINT `Time_fk_id_torneio_fkey` FOREIGN KEY (`fk_id_torneio`) REFERENCES `Torneio`(`id_torneio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida` ADD CONSTRAINT `Partida_fk_id_grupo_fkey` FOREIGN KEY (`fk_id_grupo`) REFERENCES `Grupo`(`id_grupo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida` ADD CONSTRAINT `Partida_fk_id_modalidade_fkey` FOREIGN KEY (`fk_id_modalidade`) REFERENCES `Modalidade`(`id_modalidade`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Local_Modalidade` ADD CONSTRAINT `Local_Modalidade_fk_id_local_fkey` FOREIGN KEY (`fk_id_local`) REFERENCES `Local`(`id_local`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Local_Modalidade` ADD CONSTRAINT `Local_Modalidade_fk_id_modalidade_fkey` FOREIGN KEY (`fk_id_modalidade`) REFERENCES `Modalidade`(`id_modalidade`) ON DELETE RESTRICT ON UPDATE CASCADE;
