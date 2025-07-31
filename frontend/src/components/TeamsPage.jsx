'use client';

import { useState, useEffect } from 'react';
import { teamsService } from '@/services/api';
import { Trash2, Plus, UserCircle, Filter, X, Edit } from 'lucide-react';
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

  const [courseOptions, setCourseOptions] = useState(['Todos']);
  const [sportOptions, setSportOptions] = useState(['Todos']);
  const genderOptions = ['Todos', 'Masculino', 'Feminino'];
  const yearOptions = ['Todos', '1º', '2º', '3º', 'Misto'];

  useEffect(() => {
    loadTeams();
    loadCursos();
    loadModalidades();
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

  const [cursos, setCursos] = useState([]);
  const [modalidades, setModalidades] = useState([]);

  const loadCursos = async () => {
    try {
      const response = await fetch('/api/cursos');
      const cursosData = await response.json();
      setCursos(cursosData);

      const courseNames = ['Todos', ...cursosData.map(c => c.nome)];
      setCourseOptions(courseNames);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    }
  };

  const loadModalidades = async () => {
    try {
      const response = await fetch('/api/modalidades');
      const modalidadesData = await response.json();
      setModalidades(modalidadesData);

      const sportNames = ['Todos', ...modalidadesData.map(m => m.nome)];
      setSportOptions(sportNames);
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error);
    }
  };

  // Adicionar novos estados
  const [isEditing, setIsEditing] = useState(false);

  const openDetails = (team) => {
    setSelectedTeam(team);
    if (team) {
      setFormData({
        course: team.course,
        year: team.year,
        gender: team.gender,
        sport: team.sport
      });
      setIsEditing(false);
    } else {
      setFormData({ course: '', year: '', gender: '', sport: '' });
      setIsEditing(false);
    }
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
      // Gerar nome automaticamente
      const teamName = generateTeamName(formData.year, formData.course);

      // Verificar se já existe time com esse nome, gênero e esporte
      const existingTeam = teams.find(team =>
        team.name === teamName &&
        team.gender === formData.gender &&
        team.sport === formData.sport
      );

      if (existingTeam) {
        alert(`Time ${teamName} ${formData.gender} de ${formData.sport} já existe!`);
        return;
      }

      const teamData = {
        ...formData,
        name: teamName // Nome gerado automaticamente
      };

      await teamsService.create(teamData);
      await loadTeams();
      setIsDetailOpen(false);
      setFormData({ course: '', year: '', gender: '', sport: '' });
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

  // Adicionar função para gerar nome automaticamente
  const generateTeamName = (year, course) => {
    if (!year || !course) return '';
    
    // Buscar sigla do curso no estado cursos
    const cursoObj = cursos.find(c => c.nome === course);
    const sigla = cursoObj ? cursoObj.sigla : course.substring(0, 4).toUpperCase();
    
    return `${year}${sigla}`;
  };

  // Adicionar novos estados
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [newPlayerData, setNewPlayerData] = useState({
    name: '',
    sala: '',
    cursoId: null
  });

  // Função para criar novo jogador
  const createNewPlayer = async (e) => {
    e.preventDefault();
    try {
      console.log('Criando novo jogador:', newPlayerData);

      const response = await fetch('/api/jogadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlayerData)
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao criar jogador');
        return;
      }

      // Recarregar jogadores disponíveis
      await loadAvailablePlayers();

      // Limpar formulário e fechar modal
      setNewPlayerData({ name: '', sala: '', cursoId: null });
      setShowCreatePlayer(false);

      alert('Jogador criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar jogador:', error);
      alert('Erro ao criar jogador');
    }
  };

  // Função para excluir time
  const deleteTeam = async (teamId) => {
    if (!confirm('Tem certeza que deseja excluir este time? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao excluir time');
        return;
      }

      await loadTeams();
      setIsDetailOpen(false);
      alert('Time excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir time:', error);
      alert('Erro ao excluir time');
    }
  };

  // Função para editar time
  const editTeam = async (e) => {
    e.preventDefault();
    try {
      const teamName = generateTeamName(formData.year, formData.course);

      const teamData = {
        ...formData,
        name: teamName
      };

      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao editar time');
        return;
      }

      await loadTeams();
      setIsDetailOpen(false);
      setIsEditing(false);
      alert('Time editado com sucesso!');
    } catch (error) {
      console.error('Erro ao editar time:', error);
      alert('Erro ao editar time');
    }
  };

  // Adicionar estados para seleção múltipla
  const [selectedTeamsIds, setSelectedTeamsIds] = useState([]);

  // Função para selecionar/deselecionar time
  const toggleTeamSelection = (teamId) => {
    setSelectedTeamsIds(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  // Função para selecionar todos os times
  const toggleSelectAll = () => {
    if (selectedTeamsIds.length === filteredTeams.length) {
      setSelectedTeamsIds([]);
    } else {
      setSelectedTeamsIds(filteredTeams.map(team => team.id));
    }
  };

  // Função para excluir times selecionados
  const deleteSelectedTeams = async () => {
    if (selectedTeamsIds.length === 0) {
      alert('Selecione pelo menos um time para excluir');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${selectedTeamsIds.length} time(s) selecionado(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // Excluir todos os times selecionados
      const deletePromises = selectedTeamsIds.map(teamId =>
        fetch(`/api/teams/${teamId}`, { method: 'DELETE' })
      );

      const results = await Promise.all(deletePromises);

      // Verificar se alguma exclusão falhou
      const failed = results.filter(response => !response.ok);

      if (failed.length > 0) {
        alert(`Erro ao excluir ${failed.length} time(s). Alguns podem ter sido excluídos com sucesso.`);
      } else {
        alert(`${selectedTeamsIds.length} time(s) excluído(s) com sucesso!`);
      }

      // Recarregar lista e limpar seleção
      await loadTeams();
      setSelectedTeamsIds([]);
    } catch (error) {
      console.error('Erro ao excluir times:', error);
      alert('Erro ao excluir times selecionados');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">TIMES</h1>
          <div className="flex items-center gap-4">
            {/* Mostrar contador e botão delete quando há seleções */}
            {selectedTeamsIds.length > 0 && (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTeamsIds.length} selecionado(s)
                </span>
                <button
                  onClick={deleteSelectedTeams}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  title={`Excluir ${selectedTeamsIds.length} time(s) selecionado(s)`}
                >
                  <Trash2 size={24} />
                </button>
              </>
            )}
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
                  checked={selectedTeamsIds.includes(team.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleTeamSelection(team.id);
                  }}
                  className="absolute top-2 right-2 z-20 form-checkbox h-4 w-4 text-red-600 rounded border-gray-300 dark:border-gray-600 focus:ring-red-500 bg-white dark:bg-gray-900"
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
            {!isEditing ? (
              <>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {selectedTeam.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        title="Editar time"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => deleteTeam(selectedTeam.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Excluir time"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

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
              </>
            ) : (
              <form onSubmit={editTeam} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Time (Automático)
                    </label>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 text-center py-2">
                      {generateTeamName(formData.year, formData.course) || 'Selecione Ano e Curso'}
                    </div>
                  </div>

                  <Select
                    label="Curso"
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecione o curso</option>
                    {cursos.map(curso => (
                      <option key={curso.id} value={curso.nome}>{curso.nome} ({curso.sigla})</option>
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
                    required
                  >
                    <option value="">Selecione o esporte</option>
                    {modalidades.map(modalidade => (
                      <option key={modalidade.id} value={modalidade.nome}>{modalidade.nome}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-500"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Alterações</Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* PREVIEW DO NOME DO TIME */}
              <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Time (Automático)
                </label>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 text-center py-2">
                  {generateTeamName(formData.year, formData.course) || 'Selecione Ano e Curso'}
                </div>
              </div>

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
                label="Curso"
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecione o curso</option>
                {cursos.map(curso => (
                  <option key={curso.id} value={curso.sigla}>{curso.sigla}</option>
                ))}
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
                {modalidades.map(modalidade => (
                  <option key={modalidade.id} value={modalidade.nome}>{modalidade.nome}</option>
                ))}
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
          title="Adicionar Jogador ao Time"
          size="max-w-md"
        >
          <form onSubmit={addPlayerToTeam} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Jogadores disponíveis da sala {selectedTeam?.year}
              </span>
              <button
                type="button"
                onClick={() => {
                  const cursoId = cursos.find(c => c.nome === selectedTeam?.course)?.id || 1;
                  setNewPlayerData({
                    name: '',
                    sala: selectedTeam?.year || '',
                    genero: selectedTeam?.gender || 'Masculino',
                    cursoId: cursoId
                  });
                  setShowCreatePlayer(true);
                }}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                + Criar Novo Jogador
              </button>
            </div>

            <Select
              label="Jogador"
              value={newPlayer.jogadorId || ''}
              onChange={(e) => setNewPlayer({ ...newPlayer, jogadorId: parseInt(e.target.value) })}
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
              onChange={(e) => setNewPlayer({ ...newPlayer, numeroCamisa: e.target.value })}
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
              <Button type="submit">Adicionar ao Time</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Adicionar modal para criar novo jogador */}
      {showCreatePlayer && (
        <Modal
          isOpen={showCreatePlayer}
          onClose={() => setShowCreatePlayer(false)}
          title="Criar Novo Jogador"
          size="max-w-md"
        >
          <form onSubmit={createNewPlayer} className="space-y-4">
            <Input
              label="Nome do Jogador"
              type="text"
              value={newPlayerData.name}
              onChange={(e) => setNewPlayerData({ ...newPlayerData, name: e.target.value })}
              required
            />

            <Input
              label="Sala"
              type="text"
              value={newPlayerData.sala}
              onChange={(e) => setNewPlayerData({ ...newPlayerData, sala: e.target.value })}
              placeholder="Ex: 3º, 2º, 1º"
              required
            />

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Gênero: <strong>{newPlayerData.genero}</strong> (Automático do time)
              </span>
            </div>

            <Select
              label="Curso"
              value={newPlayerData.cursoId || ''}
              onChange={(e) => setNewPlayerData({ ...newPlayerData, cursoId: parseInt(e.target.value) })}
              required
            >
              <option value="">Selecione o curso</option>
              {cursos.map(curso => (
                <option key={curso.id} value={curso.id}>
                  {curso.nome}
                </option>
              ))}
            </Select>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setShowCreatePlayer(false)}
                className="bg-gray-500"
              >
                Cancelar
              </Button>
              <Button type="submit">Criar Jogador</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export { TeamsPage }; // Adicionar esta linha no final
export default TeamsPage;