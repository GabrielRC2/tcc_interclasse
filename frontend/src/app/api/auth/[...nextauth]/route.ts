import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
<<<<<<< Updated upstream
//import prisma from "@/generated/prisma/client";
//import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma"; // Certifique-se de que o caminho está correto
import { hash } from "crypto";

//const prisma = new PrismaClient();

=======
import { prisma } from "@/lib/prisma";
>>>>>>> Stashed changes

const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            credentials: {
                email: { label: "Email", type: "text", placeholder: "email@icm.com" },
                password: { label: "Password", type: "password", placeholder: "password" },
            },
<<<<<<< Updated upstream
           async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null; // Credenciais incompletas
        }

        // --- FAZENDO O SELECT NO BANCO DE DADOS ---

        const user = await prisma.usuarios.findUnique({
          where: {
            email_usuario: credentials.email,
          },
        });

        // Se o usuário não for encontrado no banco de dados
        if (!user) {
          console.log("Usuário não encontrado.");
          return null;
        }

        // --- VERIFICANDO A SENHA ---
        // Compara a senha fornecida pelo usuário com a senha hasheada no banco de dados
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.senha_hash // senha_usuario agora deve ser o hash da senha
        );

        // Se a senha não for válida
        if (isPasswordValid) {
          console.log("Senha inválida.");
          return null;
        }

        // Retorne apenas os dados necessários para a sessão
        return {
          id: String(user.id_usuario), // Ensure id is a string
          nome_usuario: user.nome_usuario,
          email_usuario: user.email_usuario,
          tipo_usuario: user.tipo_usuario,
        };
            }
            })
    ]
}
=======
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }

                    const user = await prisma.usuarios.findUnique({
                        where: {
                            email_usuario: credentials.email,
                        },
                    });

                    if (!user) {
                        console.log("Usuário não encontrado");
                        return null;
                    }

                    // Compara a senha usando bcrypt.compare
                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.senha_hash
                    );

                    if (isValid) {
                        console.log("Senha inválida");
                        return null;
                    }

                    return {
                        id: user.id_usuario.toString(),
                        email: user.email_usuario,
                        name: user.nome_usuario,
                        tipo: user.tipo_usuario
                    };
                } catch (error) {
                    console.error("Erro na autenticação:", error);
                    return null;
                }
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    debug: process.env.NODE_ENV === 'development',
};
>>>>>>> Stashed changes

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };