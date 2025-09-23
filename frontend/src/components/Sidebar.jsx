'use client';

import { Home, Users, Plus, Shield, Calendar, FileText, LogOut, Moon, Sun, ChevronsLeft, Trophy, ChevronDown } from 'lucide-react';
import { Button } from '@/components/common';

const NavLink = ({ icon, label, pageName, isSidebarOpen, currentPage, setCurrentPage, toggleSidebar }) => (
    <li>
        <button
            onClick={() => {
                setCurrentPage(pageName);
                // Fecha a sidebar automaticamente no mobile APENAS se estiver aberta
                if (window.innerWidth < 768 && isSidebarOpen) {
                    toggleSidebar();
                }
            }}
            className={`flex items-center w-11/12 mx-auto rounded-lg transition-colors ${isSidebarOpen ? 'px-5 py-3' : 'p-3 justify-center'
                } ${currentPage === pageName
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
        >
            <div className={`flex items-center ${isSidebarOpen ? '' : 'justify-center w-full'}`}>
                {icon}
                <span
                    className={`ml-3 font-medium transition-all duration-200 whitespace-nowrap ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 absolute'
                        }`}
                >
                    {label}
                </span>
            </div>
        </button>
    </li>
);

export const Sidebar = ({ 
  isSidebarOpen, 
  toggleSidebar, 
  currentPage, 
  setCurrentPage, 
  isDarkMode, 
  toggleDarkMode, 
  logout,
  selectedTournament,
  onTournamentSelectorClick 
}) => {
    // Lógica para escolher a logo baseada no tema e estado da sidebar
    const getLogoUrl = () => {
        if (isDarkMode) {
            return isSidebarOpen ? '/ICM-logo-complete-white.png' : '/ICM-logo-white.png';
        } else {
            return isSidebarOpen ? '/ICM-logo-complete-black.png' : '/ICM-logo-black.png';
        }
    };

    return (
        <>
            {/* Overlay para mobile quando sidebar está aberta */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                bg-white dark:bg-gray-900 text-gray-800 dark:text-white 
                flex-shrink-0 flex flex-col transition-all duration-300 z-50
                ${isSidebarOpen
                    ? 'w-full md:w-72 fixed md:relative inset-0 md:inset-auto'
                    : 'w-16 md:w-24'
                }
            `}>
                {isSidebarOpen ? (
                    <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <img src={getLogoUrl()} alt="ICM Logo" className="h-12 transition-all duration-300" />
                        <Button 
                            onClick={toggleSidebar} 
                            variant="outline"
                            size="sm"
                            className="text-gray-500 dark:text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ChevronsLeft className="transition-transform duration-300" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center pt-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <img src={getLogoUrl()} alt="ICM Logo" className="h-10 transition-all duration-300 mb-2" />
                        <Button 
                            onClick={toggleSidebar} 
                            variant="outline"
                            size="sm"
                            className="text-gray-500 dark:text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ChevronsLeft className="transition-transform duration-300 rotate-180" />
                        </Button>
                    </div>
                )}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
                    {/* Tournament Selector */}
                    <div className="mb-4">
                        <button
                            onClick={onTournamentSelectorClick}
                            className={`w-full flex items-center rounded-md transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-400 ${
                                isSidebarOpen ? 'px-3 py-3' : 'p-2 justify-center'
                            } ${selectedTournament ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                            <div className={`flex items-center ${isSidebarOpen ? 'w-full' : 'justify-center'}`}>
                                <Trophy size={20} className={selectedTournament ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} />
                                {isSidebarOpen && (
                                    <>
                                        <div className="flex-1 ml-3 text-left">
                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                Torneio Ativo
                                            </div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {selectedTournament ? selectedTournament.name : 'Selecionar Torneio'}
                                            </div>
                                        </div>
                                        <ChevronDown size={16} className="text-gray-400 ml-2" />
                                    </>
                                )}
                            </div>
                        </button>
                    </div>

                    <p className={`px-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>GERAL</p>
                    <ul>
                        <NavLink icon={<Home size={20} />} label="Home" pageName="dashboard" isSidebarOpen={isSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} />
                        <NavLink icon={<Plus size={20} />} label="Cadastros" pageName="registrations" isSidebarOpen={isSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} />                        
                        <NavLink icon={<Calendar size={20} />} label="Temporadas" pageName="seasons" isSidebarOpen={isSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} />                        
                        <NavLink icon={<Users size={20} />} label="Times" pageName="teams" isSidebarOpen={isSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} />
                        <NavLink icon={<Users size={20} />} label="Grupos" pageName="groups" isSidebarOpen={isSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} />
                        <NavLink icon={<Shield size={20} />} label="Chaveamento" pageName="brackets" isSidebarOpen={isSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} />
                        <NavLink icon={<FileText size={20} />} label="Partidas" pageName="matches" isSidebarOpen={isSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} />
                    </ul>
                </nav>
                <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <Button 
                        onClick={toggleDarkMode} 
                        variant="outline"
                        className={`flex items-center w-11/12 mx-auto px-3 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <div className={`flex items-center ${isSidebarOpen ? '' : 'justify-center w-full'}`}>
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            <span className={`ml-3 font-medium transition-all duration-200 whitespace-nowrap ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 absolute'}`}>Tema</span>
                        </div>
                    </Button>
                    <Button 
                        onClick={logout} 
                        variant="tertiary"
                        className={`flex items-center w-11/12 mx-auto px-3 py-3 mt-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <div className={`flex items-center ${isSidebarOpen ? '' : 'justify-center w-full'}`}>
                            <LogOut size={20} />
                            <span className={`ml-3 font-medium transition-all duration-200 whitespace-nowrap ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 absolute'}`}>Sair</span>
                        </div>
                    </Button>
                </div>
            </aside>
        </>
    );
};
