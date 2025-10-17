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

  // Nova função para acesso como visitante
  const handleGuestAccess = () => {
    onLogin({ isGuest: true });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">ICM - Interclass Manager</h1>
        <form className="space-y-4" onSubmit={handleLogin}>
          <Input label="Email" type="email" name="email" />
          <Input label="Senha" type="password" name="senha" />
          <Button type="submit" className="w-full">Entrar</Button>
        </form>
        
        {/* Divisor */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou</span>
          </div>
        </div>

        {/* Botão de Visitante */}
        <Button 
          type="button" 
          onClick={handleGuestAccess}
          className="w-full bg-gray-500 hover:bg-gray-600"
        >
          Continuar como Visitante
        </Button>
        
        <p className="text-xs text-gray-500 text-center mt-3">
          Como visitante você terá acesso apenas para visualização
        </p>
      </div>
    </div>
  );
};