import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Importa o cliente Prisma para interagir com o banco de dados

export async function GET(request, {params}) {
    try {
        const {id} = await params; // Obtém o ID do time a partir dos parâmetros da requisição

        const idEsporte = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idEsporte)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }

        // 1. Verifica se o time existe antes de tentar deletar
        const sportExists = await prisma.modalidades.findUnique({
        where: {
            id_modalidade: idEsporte,
        },
        });
        if (!sportExists) {
        return NextResponse.json({ message: "Esporte não encontrado." }, { status: 404 });
        }
        //Retorna os times encontrados como uma resposta JSON com status 200 (OK).
        return NextResponse.json(sportExists, { status: 200 });
        
    } catch (error) {
        // 3. Se ocorrer qualquer erro no bloco 'try', o 'catch' é executado.
        console.error("Erro ao buscar esportes:", error); // Mostra o erro no console do servidor para depuração.
    
        // Retorna uma mensagem de erro com status 500 (Erro Interno do Servidor).
        return NextResponse.json({ message: "Não foi possível buscar o esporte." }, { status: 500 });
    }
}


export async function PATCH(request, {params}) {
    try {
        const {id} = await params;

        const idEsporte = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idEsporte)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }

        // 1. Verifica se o time existe antes de atualizar
        const sportExists = await prisma.modalidades.findUnique({
        where: {
            id_modalidade: idEsporte,
        },
        });
        if (!sportExists) {
        return NextResponse.json({ message: "Esporte não encontrado." }, { status: 404 });
        }

        // Recebe os dados do corpo da requisição
        const body = await request.json();
        const {nome_modalidade} = body;

        const updatedSport = await prisma.modalidades.update({
            where: {id_modalidade: idEsporte},
            data: {nome_modalidade}, 
        });
        return NextResponse.json(updatedSport, { status: 200 });

    } catch (error) {
        // 3. Se ocorrer qualquer erro no bloco 'try', o 'catch' é executado.
        console.error("Erro ao atualizar o esporte:", error); // Mostra o erro no console do servidor para depuração.
    
        // Retorna uma mensagem de erro com status 500 (Erro Interno do Servidor).
        return NextResponse.json({ message: "Não foi possível atualizar o esporte." }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try{
        const {id} = await params; // Obtém o ID do time a partir dos parâmetros da requisição

        const idEsporte = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idEsporte)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }
        // 1. Verifica se o time existe antes de tentar deletar
        const sportExists = await prisma.modalidades.findUnique({
        where: {
            id_modalidade: idEsporte,
        },
        });
        if (!sportExists) {
        return NextResponse.json({ message: "Local não encontrado." }, { status: 404 });
        }
        // 2. Se o time existir, prossegue para deletar o time
        // O método 'delete' do Prisma é usado para remover o registro do banco de dados.   
        // Deleta o time com o ID fornecido
        const deletedSport = await prisma.modalidades.delete({
        where: { id_modalidade: idEsporte,},
        });

        // Retorna o time deletado como resposta
        return NextResponse.json(deletedSport, {message: "Esporte deletado com sucesso."},{ status: 200 });
    
    } catch (error) {
        console.error("Erro ao deletar time:", error);
        return NextResponse.json({ message: "Não foi possível deletar o esporte." }, { status: 500 });
    }
}