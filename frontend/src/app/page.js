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
const checkUserAccess = (userType, pageName, isGuest) => {
  // Cadastros (registrations) é exclusivo para ADMIN
  if (pageName === 'registrations') {
    return userType === 'ADMIN' && !isGuest;
  }
  
  // Visitantes e usuários logados podem acessar todas as outras páginas
  return true;
};

// Função utilitária para obter páginas permitidas para um tipo de usuário
const getAllowedPages = (userType, isGuest) => {
  // Lista base de páginas acessíveis para todos (incluindo visitantes)
  const basePagesForAll = ['dashboard', 'seasons', 'teams', 'brackets', 'matches', 'groups'];
  
  // Visitantes têm acesso a todas EXCETO cadastros
  if (isGuest) {
    return basePagesForAll;
  }
  
  // ADMIN tem acesso a TODAS as páginas (incluindo cadastros)
  if (userType === 'ADMIN') {
    return [...basePagesForAll, 'registrations'];
  }
  
  // REPRESENTANTE, STAFF e outros tipos têm acesso a todas EXCETO cadastros
  return basePagesForAll;
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
    // Visitantes podem acessar todas as páginas exceto cadastros
    if (isGuest) {
      return checkUserAccess(null, pageName, true);
    }
    
    // Se não estiver logado, só pode acessar dashboard
    if (!session) {
      return pageName === 'dashboard';
    }
    
    const userType = session?.user?.tipo_usuario;
    return checkUserAccess(userType, pageName, false);
  };

  // Intercepta mudanças de página para verificar permissões
  const handlePageChange = (pageName) => {
    if (hasPageAccess(pageName)) {
      setCurrentPage(pageName);
    }
  };

  // Lógica principal de renderização de conteúdo
  const renderPage = () => {
    // Se o usuário NÃO está logado e NÃO é visitante:
    if (!session && !isGuest) {
      // Permite apenas Dashboard e Login
      if (currentPage === 'login') {
        return <LoginPage onLogin={handleLogin} />;
      } else {
        // Qualquer outra página quando deslogado será redirecionada para o Dashboard
        return <Dashboard />;
      }
    }

    // Verifica se o usuário tem acesso à página atual
    if (!hasPageAccess(currentPage)) {
      setCurrentPage('dashboard');
      return <Dashboard isGuest={isGuest} />;
    }

    // Renderiza a página solicitada (com suporte para visitantes)
    switch (currentPage) {
      case 'dashboard': return <Dashboard isGuest={isGuest} />;
      case 'seasons': return <SeasonsPage isGuest={isGuest} />;
      case 'teams': return <TeamsPage isGuest={isGuest} />;
      case 'registrations': return <RegistrationsPage />;
      case 'brackets': return <BracketsPage isGuest={isGuest} />;
      case 'matches': return <MatchesPage isGuest={isGuest} />;
      case 'groups': return <GroupsPage isGuest={isGuest} />;
      default: return <Dashboard isGuest={isGuest} />;
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
        isLoggedIn={!!session || isGuest}
        userType={isGuest ? 'guest' : session?.user?.tipo_usuario}
        allowedPages={getAllowedPages(session?.user?.tipo_usuario, isGuest)}
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