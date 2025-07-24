import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Importa o cliente Prisma para interagir com o banco de dados

export async function GET(request, {params}) {
    try {
        const {id} = await params; // Obtém o ID do time a partir dos parâmetros da requisição

        const idLocal = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idLocal)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }

        // 1. Verifica se o time existe antes de tentar deletar
        const placeExists = await prisma.locais.findUnique({
        where: {
            id_local: idLocal,
        },
        });
        if (!placeExists) {
        return NextResponse.json({ message: "Local não encontrado." }, { status: 404 });
        }
        //Retorna os times encontrados como uma resposta JSON com status 200 (OK).
        return NextResponse.json(placeExists, { status: 200 });
        
    } catch (error) {
        // 3. Se ocorrer qualquer erro no bloco 'try', o 'catch' é executado.
        console.error("Erro ao buscar locais:", error); // Mostra o erro no console do servidor para depuração.
    
        // Retorna uma mensagem de erro com status 500 (Erro Interno do Servidor).
        return NextResponse.json({ message: "Não foi possível buscar os locais." }, { status: 500 });
    }
}


export async function PATCH(request, {params}) {
    try {
        const {id} = await params;

        const idLocal = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idLocal)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }

        // 1. Verifica se o time existe antes de atualizar
        const placeExists = await prisma.locais.findUnique({
        where: {
            id_local: idLocal,
        },
        });
        if (!placeExists) {
        return NextResponse.json({ message: "Local não encontrado." }, { status: 404 });
        }

        // Recebe os dados do corpo da requisição
        const body = await request.json();
        const {nome_local} = body;

        const updatedPlace = await prisma.locais.update({
            where: {id_local: idLocal},
            data: {nome_local}, 
        });
        return NextResponse.json(updatedPlace, { status: 200 });

    } catch (error) {
        // 3. Se ocorrer qualquer erro no bloco 'try', o 'catch' é executado.
        console.error("Erro ao atualizar o local:", error); // Mostra o erro no console do servidor para depuração.
    
        // Retorna uma mensagem de erro com status 500 (Erro Interno do Servidor).
        return NextResponse.json({ message: "Não foi possível atualizar o local." }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try{
        const {id} = await params; // Obtém o ID do time a partir dos parâmetros da requisição

        const idLocal = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idLocal)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }
        // 1. Verifica se o time existe antes de tentar deletar
        const placeExists = await prisma.locais.findUnique({
        where: {
            id_local: idLocal,
        },
        });
        if (!placeExists) {
        return NextResponse.json({ message: "Local não encontrado." }, { status: 404 });
        }
        // 2. Se o time existir, prossegue para deletar o time
        // O método 'delete' do Prisma é usado para remover o registro do banco de dados.   
        // Deleta o time com o ID fornecido
        const deletedPlace = await prisma.locais.delete({
        where: { id_local: idLocal,},
        });

        // Retorna o time deletado como resposta
        return NextResponse.json(deletedPlace, {message: "Local deletado com sucesso."},{ status: 200 });
    
    } catch (error) {
        console.error("Erro ao deletar time:", error);
        return NextResponse.json({ message: "Não foi possível deletar o local." }, { status: 500 });
    }
}