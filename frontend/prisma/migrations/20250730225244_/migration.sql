/*
  Warnings:

  - You are about to drop the column `fk_id_categoria` on the `grupo` table. All the data in the column will be lost.
  - You are about to drop the column `placar_time_dois` on the `partida` table. All the data in the column will be lost.
  - You are about to drop the column `placar_time_um` on the `partida` table. All the data in the column will be lost.
  - You are about to alter the column `data_hora_partida` on the `partida` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `inicio_torneio` on the `torneio` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `fim_torneio` on the `torneio` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the `grupo_times` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `partida_times` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sala_jogador` to the `Jogador` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sala_time` to the `Time` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `grupo` DROP FOREIGN KEY `Grupo_fk_id_categoria_fkey`;

-- DropForeignKey
ALTER TABLE `grupo_times` DROP FOREIGN KEY `Grupo_Times_fk_id_grupo_fkey`;

-- DropForeignKey
ALTER TABLE `grupo_times` DROP FOREIGN KEY `Grupo_Times_fk_id_time_fkey`;

-- DropForeignKey
ALTER TABLE `partida_times` DROP FOREIGN KEY `Partida_Times_fk_id_partida_fkey`;

-- DropForeignKey
ALTER TABLE `partida_times` DROP FOREIGN KEY `Partida_Times_fk_id_time_fkey`;

-- DropIndex
DROP INDEX `Grupo_fk_id_categoria_fkey` ON `grupo`;

-- AlterTable
ALTER TABLE `grupo` DROP COLUMN `fk_id_categoria`,
    MODIFY `nome_grupo` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `jogador` ADD COLUMN `sala_jogador` VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE `partida` DROP COLUMN `placar_time_dois`,
    DROP COLUMN `placar_time_um`,
    ADD COLUMN `pontos_casa` INTEGER NULL,
    ADD COLUMN `pontos_visitante` INTEGER NULL,
    MODIFY `data_hora_partida` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `time` ADD COLUMN `sala_time` VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE `torneio` MODIFY `inicio_torneio` DATETIME NOT NULL,
    MODIFY `fim_torneio` DATETIME NOT NULL;

-- DropTable
DROP TABLE `grupo_times`;

-- DropTable
DROP TABLE `partida_times`;

-- CreateTable
CREATE TABLE `GrupoTime` (
    `fk_id_grupo` INTEGER NOT NULL,
    `fk_id_time` INTEGER NOT NULL,

    PRIMARY KEY (`fk_id_grupo`, `fk_id_time`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartidaTime` (
    `fk_id_partida` INTEGER NOT NULL,
    `fk_id_time` INTEGER NOT NULL,
    `eh_casa` BOOLEAN NOT NULL,

    PRIMARY KEY (`fk_id_partida`, `fk_id_time`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GrupoTime` ADD CONSTRAINT `GrupoTime_fk_id_grupo_fkey` FOREIGN KEY (`fk_id_grupo`) REFERENCES `Grupo`(`id_grupo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrupoTime` ADD CONSTRAINT `GrupoTime_fk_id_time_fkey` FOREIGN KEY (`fk_id_time`) REFERENCES `Time`(`id_time`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartidaTime` ADD CONSTRAINT `PartidaTime_fk_id_partida_fkey` FOREIGN KEY (`fk_id_partida`) REFERENCES `Partida`(`id_partida`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartidaTime` ADD CONSTRAINT `PartidaTime_fk_id_time_fkey` FOREIGN KEY (`fk_id_time`) REFERENCES `Time`(`id_time`) ON DELETE RESTRICT ON UPDATE CASCADE;
