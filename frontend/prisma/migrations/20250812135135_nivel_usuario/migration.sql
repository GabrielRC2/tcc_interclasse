/*
  Warnings:

  - The values [professor] on the enum `Usuarios_tipo_usuario` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `usuarios` MODIFY `tipo_usuario` ENUM('admin', 'representante', 'staff') NOT NULL;
