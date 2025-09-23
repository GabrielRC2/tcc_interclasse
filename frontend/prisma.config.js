import { defineConfig } from "@prisma/config";

export default defineConfig({
  // Caminho para o schema do Prisma (padrão: ./prisma/schema.prisma)
  schema: './prisma/schema.prisma',

  // Script de seed
  seed: 'node prisma/seed.js',
})