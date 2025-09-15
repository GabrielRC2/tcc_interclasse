'use client';
import { Input, Button } from '@/components/common';
import { signIn } from "next-auth/react";

export const LoginPage = ({ onLogin }) => {
  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.senha.value;

    // signIn retorna um objeto com ok/erro se você passar redirect: false
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // Não redireciona automaticamente
    });

    if (result?.ok) {
      onLogin(); // Login bem-sucedido, atualiza o estado no pai
    } else {
      // Aqui você pode mostrar uma mensagem de erro se quiser
      alert("Usuário ou senha inválidos.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">ICM - Interclass Manager</h1>
        <form className="space-y-4" onSubmit={handleLogin}>
          <Input label="Email" type="email" name="email" defaultValue="a@test.com" />
          <Input label="Senha" type="password" name="senha" defaultValue="123456" />
          <Button type="submit" className="w-full">Entrar</Button>
        </form>
      </div>
    </div>
  );
};