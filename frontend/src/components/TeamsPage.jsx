'use client';

import { useState, useEffect } from 'react';
import { teamsService } from '@/services/api';
import { Trash2, Plus, UserCircle, Filter, X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, CardSplat, Select } from '@/components/common';

function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', numeroCamisa: '' });
  const [availablePlayers, setAvailablePlayers] = useState([]);
  
  // Estados dos filtros
  const [filters, setFilters] = useState({
      gender: 'Todos',
      sport: 'Todos',
      course: 'Todos',
      year: 'Todos'
  });

  // Opções dos filtros
  const genderOptions = ['Todos', 'Masculino', 'Feminino'];
  const sportOptions = ['Todos', 'Futsal', 'Vôlei', 'Basquete', 'Handebol'];
  const courseOptions = ['Todos', '1º ETIM', '2º ETIM', '3º ETIM', 'Misto'];
  const yearOptions = ['Todos', '1º', '2º', '3º', 'Misto'];

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await teamsService.getAll();
      setTeams(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (team) => {
      setSelectedTeam(team);
      setIsDetailOpen(true);
  };

  const updateFilter = (filterType, value) => {
      setFilters(prev => ({
          ...prev,
          [filterType]: value
      }));
  };

  const clearAllFilters = () => {
      setFilters({
          gender: 'Todos',
          sport: 'Todos',
          course: 'Todos',
          year: 'Todos'
      });
  };

  const getActiveFilters = () => {
      return Object.entries(filters)
          .filter(([key, value]) => value !== 'Todos')
          .map(([key, value]) => ({ key, value }));
  };

  const filteredTeams = teams.filter(team => {
      if (filters.gender !== 'Todos' && team.gender !== filters.gender) return false;
      if (filters.sport !== 'Todos' && team.sport !== filters.sport) return false;
      if (filters.course !== 'Todos' && team.course !== filters.course) return false;
      if (filters.year !== 'Todos' && team.year !== filters.year) return false;
      return true;
  });

  const handleCreateTeam = async (teamData) => {
      try {
          await teamsService.create(teamData);
          await loadTeams(); // Recarrega a lista
          setIsModalOpen(false);
      } catch (error) {
          console.error('Erro ao criar time:', error);
      }
  };

  const [formData, setFormData] = useState({
    name: '',
    course: '',
    year: '',
    gender: '',
    sport: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await teamsService.create(formData);
      await loadTeams();
      setIsDetailOpen(false);
      setFormData({ name: '', course: '', year: '', gender: '', sport: '' });
    } catch (error) {
      console.error('Erro ao criar time:', error);
    }
  };

  // Função para carregar jogadores disponíveis CORRIDA
  const loadAvailablePlayers = async () => {
    try {
      if (!selectedTeam) return;
      
      console.log('Carregando jogadores para time:', selectedTeam.id);
      const response = await fetch(`/api/jogadores?timeId=${selectedTeam.id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar jogadores');
      }
      
      const players = await response.json();
      console.log('Jogadores disponíveis:', players);
      setAvailablePlayers(players);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      setAvailablePlayers([]);
    }
  };

  // Função para adicionar jogador ao time CORRIGIDA
  const addPlayerToTeam = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      console.log('Adicionando jogador:', newPlayer);
      
      const response = await fetch(`/api/teams/${selectedTeam.id}/jogadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jogadorId: newPlayer.jogadorId,
          numeroCamisa: newPlayer.numeroCamisa
        })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao adicionar jogador');
        return;
      }

      // Recarregar dados do time
      await loadTeams();
      
      // Limpar formulário e fechar modal
      setNewPlayer({ name: '', numeroCamisa: '', jogadorId: null });
      setShowAddPlayer(false);
      
      alert('Jogador adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar jogador:', error);
      alert('Erro ao adicionar jogador');
    }
  };

  return (
      <>
          <div className="space-y-6">
              {/* Cabeçalho */}
              <div className="flex flex-wrap justify-between items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">TIMES</h1>
                  <div className="flex items-center gap-4">
                      <button className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                          <Trash2 size={24} />
                      </button>
                      <Button onClick={() => openDetails(null)}>Criar Novo Time</Button>
                  </div>
              </div>

              {/* Área de Filtros */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-4">
                      <Filter size={20} className="text-gray-500 dark:text-gray-400" />
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">FILTROS</h3>
                      {getActiveFilters().length > 0 && (
                          <button
                              onClick={clearAllFilters}
                              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-auto"
                          >
                              Limpar todos
                          </button>
                      )}
                  </div>

                  {/* Grid de Filtros */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <Select
                          label="Gênero"
                          value={filters.gender}
                          onChange={(e) => updateFilter('gender', e.target.value)}
                      >
                          {genderOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                          ))}
                      </Select>

                      <Select
                          label="Esporte"
                          value={filters.sport}
                          onChange={(e) => updateFilter('sport', e.target.value)}
                      >
                          {sportOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                          ))}
                      </Select>

                      <Select
                          label="Curso"
                          value={filters.course}
                          onChange={(e) => updateFilter('course', e.target.value)}
                      >
                          {courseOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                          ))}
                      </Select>

                      <Select
                          label="Ano"
                          value={filters.year}
                          onChange={(e) => updateFilter('year', e.target.value)}
                      >
                          {yearOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                          ))}
                      </Select>
                  </div>

                  {/* Filtros Ativos */}
                  {getActiveFilters().length > 0 && (
                      <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Filtros ativos:</span>
                          {getActiveFilters().map(({ key, value }) => (
                              <div
                                  key={key}
                                  className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2"
                              >
                                  <span>{value}</span>
                                  <button
                                      onClick={() => updateFilter(key, 'Todos')}
                                      className="hover:text-red-900 dark:hover:text-red-100"
                                  >
                                      <X size={14} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Estatísticas */}
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>
                      Mostrando {filteredTeams.length} de {teams.length} times
                  </span>
                  <span>
                      {getActiveFilters().length > 0 ? 'Filtrado' : 'Todos os times'}
                  </span>
              </div>

              {/* Grid de Times */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
                  {filteredTeams.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                          <p className="text-gray-500 dark:text-gray-400 text-lg">
                              Nenhum time encontrado com os filtros selecionados
                          </p>
                          <button
                              onClick={clearAllFilters}
                              className="mt-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                              Limpar filtros
                          </button>
                      </div>
                  ) : (
                      filteredTeams.map(team => (
                          <div
                              key={team.id}
                              onClick={() => openDetails(team)}
                              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden cursor-pointer hover:border-red-500 dark:hover:border-red-500 transition-colors"
                          >
                              <input
                                  type="checkbox"
                                  className="absolute top-2 right-2 z-20 form-checkbox h-4 w-4 text-red-600 rounded border-gray-300 dark:border-gray-600 focus:ring-red-500 bg-white dark:bg-gray-900"
                                  onClick={e => e.stopPropagation()}
                              />
                              <div className="relative z-10 text-center">
                                  <p className="text-xl font-bold my-2 text-gray-900 dark:text-gray-100">{team.name}</p>
                                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                      <p>{team.course} - {team.year}</p>
                                      <p>{team.gender} | {team.sport}</p>
                                      <p>Jogadores: {team.playersCount}</p>
                                  </div>
                              </div>
                              <CardSplat />
                          </div>
                      ))
                  )}
              </div>
          </div>

          <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={selectedTeam ? selectedTeam.name : 'Criar Novo Time'} size="max-w-2xl">
              {selectedTeam ? (
                  <div className="space-y-4">
                      {/* Informações do Time */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                  <span className="font-semibold text-gray-600 dark:text-gray-400">Curso:</span>
                                  <span className="ml-2 text-gray-900 dark:text-gray-100">{selectedTeam.course}</span>
                              </div>
                              <div>
                                  <span className="font-semibold text-gray-600 dark:text-gray-400">Ano:</span>
                                  <span className="ml-2 text-gray-900 dark:text-gray-100">{selectedTeam.year}</span>
                              </div>
                              <div>
                                  <span className="font-semibold text-gray-600 dark:text-gray-400">Gênero:</span>
                                  <span className="ml-2 text-gray-900 dark:text-gray-100">{selectedTeam.gender}</span>
                              </div>
                              <div>
                                  <span className="font-semibold text-gray-600 dark:text-gray-400">Esporte:</span>
                                  <span className="ml-2 text-gray-900 dark:text-gray-100">{selectedTeam.sport}</span>
                              </div>
                          </div>
                      </div>

                      {/* Jogadores */}
                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="font-bold border-b-2 border-gray-200 dark:border-gray-700 w-full pb-1 text-gray-900 dark:text-gray-100">JOGADORES</h4>
                              <button 
  onClick={() => {
    loadAvailablePlayers();
    setShowAddPlayer(true);
  }}
  className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center -mb-2 flex-shrink-0"
>
  <Plus size={16} />
</button>
                          </div>
                          <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-gray-100 dark:scrollbar-track-gray-700 hover:scrollbar-thumb-red-600 dark:hover:scrollbar-thumb-red-400">
                              {selectedTeam.players.map(p => (
                                  <div key={p.id} className="flex items-center justify-between text-gray-700 dark:text-gray-300 min-w-0">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <UserCircle size={24} className="text-gray-400 flex-shrink-0" />
                                          <span className="truncate">{p.name}</span>
                                          <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">{p.points} PTS</span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                          {p.red > 0 && (
                                              <div className="flex items-center gap-1">
                                                  <div className="w-3 h-4 bg-red-600 rounded-sm"></div>
                                                  <span className="text-xs font-bold text-red-600">{p.red}</span>
                                              </div>
                                          )}
                                          {p.yellow > 0 && (
                                              <div className="flex items-center gap-1">
                                                  <div className="w-3 h-4 bg-yellow-500 rounded-sm"></div>
                                                  <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{p.yellow}</span>
                                              </div>
                                          )}
                                          {p.red === 0 && p.yellow === 0 && (
                                              <span className="text-xs text-gray-400">Sem cartões</span>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                  <span>Total de jogadores: {selectedTeam.players.length}</span>
                                  <span>Pontos do time: {selectedTeam.players.reduce((sum, p) => sum + p.points, 0)}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input 
        label="Nome do Time" 
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder="Ex: 1º ETIM" 
        required
      />
      <Select 
        label="Curso"
        name="course"
        value={formData.course}
        onChange={handleInputChange}
        required
      >
        <option value="">Selecione o curso</option>
        {courseOptions.filter(c => c !== 'Todos').map(course => (
          <option key={course} value={course}>{course}</option>
        ))}
      </Select>
      <Select 
        label="Ano"
        name="year"
        value={formData.year}
        onChange={handleInputChange}
        required
      >
        <option value="">Selecione o ano</option>
        <option value="1º">1º</option>
        <option value="2º">2º</option>
        <option value="3º">3º</option>
        <option value="Misto">Misto</option>
      </Select>
      <Select 
        label="Gênero"
        name="gender"
        value={formData.gender}
        onChange={handleInputChange}
        required
      >
        <option value="">Selecione o gênero</option>
        <option value="Masculino">Masculino</option>
        <option value="Feminino">Feminino</option>
      </Select>
      <Select 
        label="Esporte" 
        name="sport"
        value={formData.sport}
        onChange={handleInputChange}
        className="md:col-span-2"
        required
      >
        <option value="">Selecione o esporte</option>
        <option value="Futsal">Futsal</option>
        <option value="Vôlei">Vôlei</option>
        <option value="Basquete">Basquete</option>
        <option value="Handebol">Handebol</option>
      </Select>
    </div>
    <div className="flex justify-end pt-4">
      <Button type="submit">Salvar</Button>
    </div>
  </form>
              )}
          </Modal>

          {/* Modal para Adicionar Jogador */}
          {showAddPlayer && (
  <Modal 
    isOpen={showAddPlayer} 
    onClose={() => setShowAddPlayer(false)} 
    title="Adicionar Jogador"
    size="max-w-md"
  >
    <form onSubmit={addPlayerToTeam} className="space-y-4">
      <Select
        label="Jogador"
        value={newPlayer.jogadorId || ''}
        onChange={(e) => setNewPlayer({...newPlayer, jogadorId: parseInt(e.target.value)})}
        required
      >
        <option value="">Selecione um jogador</option>
        {availablePlayers.map(player => (
          <option key={player.id} value={player.id}>
            {player.name} - {player.course}
          </option>
        ))}
      </Select>
      
      <Input
        label="Número da Camisa"
        type="number"
        min="1"
        max="99"
        value={newPlayer.numeroCamisa}
        onChange={(e) => setNewPlayer({...newPlayer, numeroCamisa: e.target.value})}
        required
      />
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          onClick={() => setShowAddPlayer(false)}
          className="bg-gray-500"
        >
          Cancelar
        </Button>
        <Button type="submit">Adicionar</Button>
      </div>
    </form>
  </Modal>
)}
      </>
  );
};

export { TeamsPage }; // Adicionar esta linha no final
export default TeamsPage;