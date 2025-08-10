import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            credentials: {
                email: { label: "Email", type: "text", placeholder: "email@icm.com" },
                password: { label: "Password", type: "password", placeholder: "password" },
            },
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

                    if (!isValid) {
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
        signIn: "/login",
    },
    debug: process.env.NODE_ENV === "development"
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };