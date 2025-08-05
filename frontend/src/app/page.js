'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { LoginPage } from '@/components/LoginPage';
import { DashboardPage } from '@/components/DashboardPage';
import { SeasonsPage } from '@/components/SeasonsPage';
import { TeamsPage } from '@/components/TeamsPage';
import { RegistrationsPage } from '@/components/RegistrationsPage';
import { BracketsPage } from '@/components/BracketsPage';
import { MatchesPage } from '@/components/MatchesPage';
import { GroupsPage } from '@/components/GroupsPage';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard'); // Começa no dashboard
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Lógica principal de renderização de conteúdo
  const renderPage = () => {
    // Se o usuário NÃO está logado:
    if (!isLoggedIn) {
      // Permite apenas Dashboard e Login
      if (currentPage === 'login') {
        return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
      } else {
        // Qualquer outra página (seasons, teams, etc.) quando deslogado
        // será redirecionada para o Dashboard.
        // O Dashboard sempre será acessível para deslogados.
        return <DashboardPage />;
      }
    }

    // Se o usuário ESTÁ logado:
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'seasons': return <SeasonsPage />;
      case 'teams': return <TeamsPage />;
      case 'registrations': return <RegistrationsPage />;
      case 'brackets': return <BracketsPage />;
      case 'matches': return <MatchesPage />;
      case 'groups': return <GroupsPage />;
      // Se estiver logado, não tem por que mostrar a LoginPage diretamente aqui,
      // a menos que você queira uma tela de perfil/alterar senha na rota 'login'.
      // case 'login': return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
      default: return <DashboardPage />; // Caso padrão para logados
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isLoggedIn={isLoggedIn}
        onLogout={() => setIsLoggedIn(false)}
        onLoginClick={() => setCurrentPage('login')}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}