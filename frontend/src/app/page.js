'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { LoginPage } from '@/components/LoginPage';
import { Dashboard } from '@/components/DashboardPage';
import { SeasonsPage } from '@/components/SeasonsPage';
import { TeamsPage } from '@/components/TeamsPage';
import { RegistrationsPage } from '@/components/RegistrationsPage';
import { BracketsPage } from '@/components/BracketsPage';
import { MatchesPage } from '@/components/MatchesPage';
import { GroupsPage } from '@/components/GroupsPage';
import { TournamentProvider } from '@/contexts/TournamentContext';

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
        return <LoginPage onLogin={handleLogin} />;
      } else {
        // Qualquer outra página (seasons, teams, etc.) quando deslogado
        // será redirecionada para o Dashboard.
        // O Dashboard sempre será acessível para deslogados.
        return <Dashboard />;
      }
    }

    // Se o usuário ESTÁ logado:
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'seasons': return <SeasonsPage />;
      case 'teams': return <TeamsPage />;
      case 'registrations': return <RegistrationsPage />;
      case 'brackets': return <BracketsPage />;
      case 'matches': return <MatchesPage />;
      case 'groups': return <GroupsPage />;
      default: return <Dashboard />;
    }
  };

  // Funções de login e logout
  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard'); // Redireciona para dashboard após login
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('dashboard'); // Redireciona para dashboard após logout
  };

  const handleLoginClick = () => {
    setCurrentPage('login');
  };

  return (
    <TournamentProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onLoginClick={handleLoginClick}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {renderPage()}
          </main>
        </div>
      </div>
    </TournamentProvider>
  );
}