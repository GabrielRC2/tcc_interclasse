import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const torneioId = searchParams.get('torneioId');
    
    if (!torneioId) return Response.json([]);
    
    const modalidades = await prisma.modalidade.findMany({
      where: {
        categorias: {
          some: {
            times: {
              some: { torneioId: parseInt(torneioId) }
            }
          }
        }
      }
    });
    
    return Response.json(modalidades);
  } catch (error) {
    return Response.json([]);
  }
}