import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../../lib/prisma";

// Interface para o usuário extendido
interface ExtendedUser {
    id: string;
    email: string;
    name: string;
    tipo_usuario: string;
}

export const authOptions: NextAuthOptions = {
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

                    const user = await prisma.usuario.findUnique({
                        where: {
                            email: credentials.email,
                        },
                    });

                    if (!user) {
                        return null;
                    }

                    // Compara a senha usando bcrypt.compare
                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.senhaHash
                    );

                    if (!isValid) {
                        return null;
                    }
                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.nome,
                        tipo_usuario: user.tipo
                    } satisfies ExtendedUser;
                } catch (error) {
                    console.error("❌ Erro na autenticação:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Adiciona o tipo do usuário ao token JWT usando verificação de propriedade
            if (user && 'tipo_usuario' in user) {
                token.tipo_usuario = (user as ExtendedUser).tipo_usuario;
            }
            return token;
        },
        async session({ session, token }) {
            // Adiciona o tipo do usuário à sessão usando verificação de propriedade
            if (token && 'tipo_usuario' in token) {
                (session.user as any).tipo_usuario = token.tipo_usuario;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    debug: process.env.NODE_ENV === "development"
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
