import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Buscar um time específico por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const timeId = parseInt(id, 10);

    if (isNaN(timeId)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    // Buscar o time com relacionamentos
    const team = await prisma.times.findUnique({
      where: { id_times: timeId },
      include: {
        curso: true,
        categoria: {
          include: {
            modalidade: true
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ message: "Time não encontrado." }, { status: 404 });
    }

    return NextResponse.json(team, { status: 200 });

  } catch (error) {
    console.error("Erro ao buscar time:", error);
    return NextResponse.json({ message: "Não foi possível buscar o time." }, { status: 500 });
  }
}

// PUT - Atualizar um time
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const timeId = parseInt(id, 10);

    if (isNaN(timeId)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    // Verificar se o time existe
    const teamExists = await prisma.times.findUnique({
      where: { id_times: timeId }
    });

    if (!teamExists) {
      return NextResponse.json({ message: "Time não encontrado." }, { status: 404 });
    }

    const data = await request.json();

    // Buscar ou criar curso se fornecido
    let cursoId = teamExists.id_curso;
    if (data.course) {
      let curso = await prisma.cursos.findFirst({
        where: { nome_curso: data.course }
      });

      if (!curso) {
        curso = await prisma.cursos.create({
          data: {
            nome_curso: data.course,
            sigla_curso: data.course.substring(0, 5).toUpperCase()
          }
        });
      }
      cursoId = curso.id_curso;
    }

    // Atualizar o time
    const updatedTeam = await prisma.times.update({
      where: { id_times: timeId },
      data: {
        nome_time: data.name || data.nome_time,
        sala: data.year || data.sala,
        id_curso: cursoId,
        id_categoria: data.categoriaId || teamExists.id_categoria
      },
      include: {
        curso: true,
        categoria: {
          include: {
            modalidade: true
          }
        }
      }
    });

    return NextResponse.json(updatedTeam, { status: 200 });

  } catch (error) {
    console.error("Erro ao atualizar time:", error);
    return NextResponse.json({ message: "Não foi possível atualizar o time." }, { status: 500 });
  }
}

// DELETE - Deletar um time
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const timeId = parseInt(id, 10);

    if (isNaN(timeId)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    // Verificar se o time existe
    const teamExists = await prisma.times.findUnique({
      where: { id_times: timeId }
    });

    if (!teamExists) {
      return NextResponse.json({ message: "Time não encontrado." }, { status: 404 });
    }

    // Deletar o time (relacionamentos são tratados pelo Prisma schema)
    const deletedTeam = await prisma.times.delete({
      where: { id_times: timeId }
    });

    return NextResponse.json(
      { message: "Time deletado com sucesso.", team: deletedTeam },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro ao deletar time:", error);
    return NextResponse.json({ message: "Não foi possível deletar o time." }, { status: 500 });
  }
}