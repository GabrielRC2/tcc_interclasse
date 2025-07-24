import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Importa o cliente Prisma para interagir com o banco de dados

export async function GET(request, {params}) {
    try {
        const {id} = await params; // Obtém o ID do time a partir dos parâmetros da requisição

        const idTorneio = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idTorneio)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }

        // 1. Verifica se o time existe antes de tentar deletar
        const tournamentExists = await prisma.torneio.findUnique({
        where: {
            id_torneio: idTorneio,
        },
        });
        if (!tournamentExists) {
        return NextResponse.json({ message: "Torneio não encontrado." }, { status: 404 });
        }
        //Retorna os times encontradas como uma resposta JSON com status 200 (OK).
        return NextResponse.json(tournamentExists, { status: 200 });
        
    } catch (error) {
        // 3. Se ocorrer qualquer erro no bloco 'try', o 'catch' é executado.
        console.error("Erro ao buscar torneio:", error); // Mostra o erro no console do servidor para depuração.
    
        // Retorna uma mensagem de erro com status 500 (Erro Interno do Servidor).
        return NextResponse.json({ message: "Não foi possível buscar o torneio." }, { status: 500 });
    }
}


export async function PATCH(request, {params}) {
    try {
        const {id} = await params;

        const idTorneio = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idTorneio)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }

        // 1. Verifica se o time existe antes de atualizar
        const tournamentExists = await prisma.torneio.findUnique({
        where: {
            id_torneio: idTorneio,
        },
        });
        if (!tournamentExists) {
        return NextResponse.json({ message: "Torneio não encontrado." }, { status: 404 });
        }

        // Recebe os dados do corpo da requisição
        const body = await request.json();
        const { nome_torneio, inicio_torneio, fim_torneio, status_torneio } = body;

        const updatedDivision = await prisma.torneio.update({
            where: {id_torneio: idTorneio},
                  data: {
        nome_torneio,
        inicio_torneio: new Date(inicio_torneio), // Converte a string de data para um objeto Date
        fim_torneio: new Date(fim_torneio),     // Converte a string de data para um objeto Date
        status_torneio: status_torneio || "Planejamento", // Usa o status fornecido ou o padrão
      },
        });
        return NextResponse.json(updatedDivision, { status: 200 });

    } catch (error) {
        // 3. Se ocorrer qualquer erro no bloco 'try', o 'catch' é executado.
        console.error("Erro ao atualizar o Torneio:", error); // Mostra o erro no console do servidor para depuração.
    
        // Retorna uma mensagem de erro com status 500 (Erro Interno do Servidor).
        return NextResponse.json({ message: "Não foi possível atualizar a Torneio." }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try{
        const {id} = await params; // Obtém o ID do time a partir dos parâmetros da requisição

        const idTorneio = parseInt(id, 10); // Converte o ID para um número inteiro
        if (isNaN(idTorneio)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
        }
        // 1. Verifica se o time existe antes de tentar deletar
        const tournamentExists = await prisma.torneio.findUnique({
        where: {
            id_torneio: idTorneio,
        },
        });
        if (!tournamentExists) {
        return NextResponse.json({ message: "Torneio não encontrado." }, { status: 404 });
        }
        // 2. Se o time existir, prossegue para deletar o time
        // O método 'delete' do Prisma é usado para remover o registro do banco de dados.   
        // Deleta o time com o ID fornecido
        const deletedTournament = await prisma.torneio.delete({
        where: { id_torneio: idTorneio,},
        });

        // Retorna o time deletado como resposta
        return NextResponse.json(deletedTournament, {message: "Torneio deletado com sucesso."},{ status: 200 });
    
    } catch (error) {
        console.error("Erro ao deletar torneio:", error);
        return NextResponse.json({ message: "Não foi possível deletar o Torneio." }, { status: 500 });
    }
}