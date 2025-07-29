import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Importa o cliente Prisma para interagir com o banco de dados

export async function GET(request, {params}) {
    try {
        const {id} = await params; // Obtém o ID do time a partir dos parâmetros da requisição

        const idTime = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idTime)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }

        // Verifica se o time existe antes de tentar deletar
        const teamExists = await prisma.times.findUnique({
        where: {
            id_times: idTime,
        },
        });
        if (!teamExists) {
        return NextResponse.json({ message: "Time não encontrado." }, { status: 404 });
        }
        return NextResponse.json(teamExists, { status: 200 });
        
    } catch (error) {
        console.error("Erro ao buscar times:", error); 
    
        return NextResponse.json({ message: "Não foi possível buscar os times." }, { status: 500 });
    }
}

export async function PATCH(request, {params}) {
    try {
        const {id} = await params;

        const idTime = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idTime)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }

        // Verifica se o time existe antes de atualizar
        const teamExists = await prisma.times.findUnique({
        where: {
            id_times: idTime,
        },
        });
        if (!teamExists) {
        return NextResponse.json({ message: "Time não encontrado." }, { status: 404 });
        }

        // Recebe os dados do corpo da requisição
        const body = await request.json();
        const {nome_time} = body;

        const updatedTeam = await prisma.times.update({
            where: {id_times: idTime},
            data: {nome_time}, 
        });
        return NextResponse.json(updatedTeam, { status: 200 });

    } catch (error) {
        console.error("Erro ao atualizar o time:", error);
    
        return NextResponse.json({ message: "Não foi possível atualizar o time." }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try{
        const {id} = await params; // Obtém o ID do time a partir dos parâmetros da requisição

        const idTime = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idTime)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }
        //Verifica se o time existe antes de tentar deletar
        const teamExists = await prisma.times.findUnique({
        where: {
            id_times: idTime,
        },
        });
        if (!teamExists) {
        return NextResponse.json({ message: "Time não encontrado." }, { status: 404 });
        }
        // Se o time existir, prossegue para deletar o time
        const deletedTeam = await prisma.times.delete({
        where: { id_times: idTime,},
        });

        // Retorna o time deletado como resposta
        return NextResponse.json(deletedTeam, {message: "Time deletado com sucesso."},{ status: 200 });
    
    } catch (error) {
        console.error("Erro ao deletar time:", error);
        return NextResponse.json({ message: "Não foi possível deletar o time." }, { status: 500 });
    }
}