'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Sidebar } from '@/components/Sidebar';
import { LoginPage } from '@/components/LoginPage';
import { Dashboard } from '@/components/DashboardPage';
import { SeasonsPage } from '@/components/SeasonsPage';
import { TeamsPage } from '@/components/TeamsPage';
import { RegistrationsPage } from '@/components/RegistrationsPage';
import { BracketsPage } from '@/components/BracketsPage';
import { MatchesPage } from '@/components/MatchesPage';
import { GroupsPage } from '@/components/GroupsPage';
import { TournamentSelector } from '@/components/TournamentSelector';
import { useTournament } from '@/contexts/TournamentContext';

// Função utilitária centralizada para verificar permissões
const checkUserAccess = (userType, pageName) => {
  if (!userType) return pageName === 'dashboard';
  
  // REPRESENTANTE só pode acessar dashboard e teams
  if (userType === 'REPRESENTANTE') {
    return pageName === 'dashboard' || pageName === 'teams';
  }
  
  // STAFF pode acessar dashboard, teams e registrations
  if (userType === 'STAFF') {
    return pageName === 'dashboard' || pageName === 'teams' || pageName === 'registrations';
  }
  
  // ADMIN tem acesso total
  return true;
};

// Função utilitária para obter páginas permitidas para um tipo de usuário
const getAllowedPages = (userType) => {
  if (!userType) return ['dashboard'];
  
  if (userType === 'REPRESENTANTE') {
    return ['dashboard', 'teams'];
  }
  
  if (userType === 'STAFF') {
    return ['dashboard', 'teams'];
  }
  
  // ADMIN tem acesso a todas as páginas
  return ['dashboard', 'seasons', 'teams', 'registrations', 'brackets', 'matches', 'groups'];
};

function AppContent() {
  const { data: session, status } = useSession();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const { selectedTournament, tournaments, selectTournament } = useTournament();

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Show loading while checking session
  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  // Show login page if not authenticated AND not guest
  if ((status === "unauthenticated" || !session) && !isGuest) {
    return <LoginPage onLogin={(options = {}) => {
      if (options.isGuest) {
        setIsGuest(true);
      } else {
        window.location.reload();
      }
    }} />;
  }

  // Verifica se o usuário tem permissão para acessar a página usando função centralizada
  const hasPageAccess = (pageName) => {
    // Se for visitante, só pode acessar dashboard
    if (isGuest) {
      return pageName === 'dashboard';
    }
    const userType = session?.user?.tipo_usuario;
    return checkUserAccess(userType, pageName);
  };

  // Intercepta mudanças de página para verificar permissões
  const handlePageChange = (pageName) => {
    if (hasPageAccess(pageName)) {
      setCurrentPage(pageName);
    }
  };

  // Lógica principal de renderização de conteúdo
  const renderPage = () => {
    // Se o usuário é visitante, só mostra o Dashboard
    if (isGuest) {
      return <Dashboard isGuest={true} />;
    }

    // Se o usuário NÃO está logado:
    if (!session) {
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

    // Verifica se o usuário tem acesso à página atual
    if (!hasPageAccess(currentPage)) {
      setCurrentPage('dashboard');
      return <Dashboard />;
    }

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
    setCurrentPage('dashboard'); // Redireciona para dashboard após login
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setIsGuest(false);
    setCurrentPage('dashboard'); // Redireciona para dashboard após logout
  };

  const handleLoginClick = () => {
    setCurrentPage('login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isLoggedIn={!!session}
        userType={isGuest ? 'guest' : session?.user?.tipo_usuario}
        allowedPages={isGuest ? ['dashboard'] : getAllowedPages(session?.user?.tipo_usuario)}
        onLogout={handleLogout}
        onLoginClick={handleLoginClick}
        selectedTournament={selectedTournament}
        onTournamentSelectorClick={() => setShowTournamentSelector(true)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      <TournamentSelector
        isOpen={showTournamentSelector}
        onClose={() => setShowTournamentSelector(false)}
        tournaments={tournaments}
        selectedTournament={selectedTournament}
        onSelectTournament={selectTournament}
      />
    </div>
  );
}

export default function Home() {
  return <AppContent />;
}