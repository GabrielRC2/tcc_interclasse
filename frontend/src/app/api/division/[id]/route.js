import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Importa o cliente Prisma para interagir com o banco de dados

export async function GET(request, {params}) {
    try {
        const {id} = await params; // Obtém o ID do time a partir dos parâmetros da requisição

        const idCategoria = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idCategoria)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }

        // 1. Verifica se o time existe antes de tentar deletar
        const divisionExists = await prisma.categorias.findUnique({
        where: {
            id_categoria: idCategoria,
        },
        });
        if (!divisionExists) {
        return NextResponse.json({ message: "Categoria não encontrada." }, { status: 404 });
        }
        //Retorna os times encontradas como uma resposta JSON com status 200 (OK).
        return NextResponse.json(divisionExists, { status: 200 });
        
    } catch (error) {
        // 3. Se ocorrer qualquer erro no bloco 'try', o 'catch' é executado.
        console.error("Erro ao buscar categoria:", error); // Mostra o erro no console do servidor para depuração.
    
        // Retorna uma mensagem de erro com status 500 (Erro Interno do Servidor).
        return NextResponse.json({ message: "Não foi possível buscar a categoria." }, { status: 500 });
    }
}


export async function PATCH(request, {params}) {
    try {
        const {id} = await params;

        const idCategoria = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idCategoria)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }

        // 1. Verifica se o time existe antes de atualizar
        const divisionExists = await prisma.categorias.findUnique({
        where: {
            id_categoria: idCategoria,
        },
        });
        if (!divisionExists) {
        return NextResponse.json({ message: "Categoria não encontrada." }, { status: 404 });
        }

        // Recebe os dados do corpo da requisição
        const body = await request.json();
        const {nome_categoria} = body;

        const updatedDivision = await prisma.categorias.update({
            where: {id_categoria: idCategoria},
            data: {nome_categoria}, 
        });
        return NextResponse.json(updatedDivision, { status: 200 });

    } catch (error) {
        // 3. Se ocorrer qualquer erro no bloco 'try', o 'catch' é executado.
        console.error("Erro ao atualizar a Categoria:", error); // Mostra o erro no console do servidor para depuração.
    
        // Retorna uma mensagem de erro com status 500 (Erro Interno do Servidor).
        return NextResponse.json({ message: "Não foi possível atualizar a Categoria." }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try{
        const {id} = await params; // Obtém o ID do time a partir dos parâmetros da requisição

        const idCategoria = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idCategoria)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }
        // 1. Verifica se o time existe antes de tentar deletar
        const divisionExists = await prisma.categorias.findUnique({
        where: {
            id_categoria: idCategoria,
        },
        });
        if (!divisionExists) {
        return NextResponse.json({ message: "Categoria não encontrada." }, { status: 404 });
        }
        // 2. Se o time existir, prossegue para deletar o time
        // O método 'delete' do Prisma é usado para remover o registro do banco de dados.   
        // Deleta o time com o ID fornecido
        const deletedSport = await prisma.categorias.delete({
        where: { id_categoria: idCategoria,},
        });

        // Retorna o time deletado como resposta
        return NextResponse.json(deletedSport, {message: "Categoria deletada com sucesso."},{ status: 200 });
    
    } catch (error) {
        console.error("Erro ao deletar categoria:", error);
        return NextResponse.json({ message: "Não foi possível deletar a Categoria." }, { status: 500 });
    }
}