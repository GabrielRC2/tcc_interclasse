'use client';
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, Select, Textarea, CardSplat } from '@/components/common';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';

export const RegistrationsPage = () => {
    // Hooks
    const toast = useToast();
    const confirm = useConfirm();

    // Estados de controle
    const [currentUser, setCurrentUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [category, setCategory] = useState('');
    const [selectedUserCategory, setSelectedUserCategory] = useState('Administradores');

    // Estados para dados principais
    const [sports, setSports] = useState([]);
    const [locations, setLocations] = useState([]);
    const [courses, setCourses] = useState([]);

    // Estados para usuários (importante para login)
    const [users, setUsers] = useState({
        administradores: [],
        staff: [],
        representantes: []
    });

    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        sigla: '',
        email: '',
        senha: '',
        tipo_usuario: ''
    });

    useEffect(() => {
        loadAllData();
        loadCurrentUser();
    }, []);

    // Função para buscar dados do usuário logado
    const loadCurrentUser = async () => {
        try {
            const response = await fetch('/api/users/me');

            if (response.ok) {
                const userData = await response.json();
                setCurrentUser(userData);
            } else {
                console.error('Erro ao buscar dados do usuário');
                setCurrentUser(null);
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            setCurrentUser(null);
        } finally {
            setUserLoading(false);
        }
    };

    // Função para carregar todos os dados (cadastros + usuários)
    const loadAllData = async () => {
        try {
            // Carregar cadastros básicos
            const [sportsRes, locationsRes, coursesRes] = await Promise.all([
                fetch('/api/modalidades'),
                fetch('/api/locais'),
                fetch('/api/cursos')
            ]);

            const sportsData = await sportsRes.json();
            const locationsData = await locationsRes.json();
            const coursesData = await coursesRes.json();

            // Garantir que sejam arrays
            setSports(Array.isArray(sportsData) ? sportsData : []);
            setLocations(Array.isArray(locationsData) ? locationsData : []);
            setCourses(Array.isArray(coursesData) ? coursesData : []);

            // Carregar usuários (importante para login)
            await loadUsers();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            // Definir arrays vazios em caso de erro
            setSports([]);
            setLocations([]);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    // Função para carregar usuários (ESSENCIAL PARA LOGIN)
    const loadUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const usersData = await response.json();

            // Separar usuários por tipo (importante para controle de acesso)
            console.log('Dados dos usuários carregados:', usersData);
            
            setUsers({
                administradores: usersData.filter(u => {
                    const tipo = u.tipo?.toLowerCase();
                    return tipo === 'admin' || tipo === 'administrador';
                }),
                staff: usersData.filter(u => u.tipo?.toLowerCase() === 'staff'),
                representantes: usersData.filter(u => {
                    const tipo = u.tipo?.toLowerCase(); 
                    return tipo === 'representante';
                })
            });
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            // Se a API não existe ainda, usar dados mock
            setUsers({
                administradores: [
                    { id: 1, nome: 'Admin Principal', email: 'admin@icm.com', tipo: 'admin' }
                ],
                staff: [
                    { id: 1, nome: 'Staff Principal', email: 'staff@icm.com', tipo: 'staff' }
                ],
                representantes: [
                    { id: 1, nome: 'Representante Principal', email: 'representante@icm.com', tipo: 'representante' }
                ]
            });
        }
    };

    const handleEdit = (item, type) => {
        setEditingItem(item);
        setCategory(type);

        if (type === 'Usuários') {
            // Para usuários (importante para login)
            // Mapear o tipo do usuário para os valores do select
            let tipoMapeado = '';
            const tipoOriginal = (item.tipo || '').toLowerCase();
            
            if (tipoOriginal === 'admin' || tipoOriginal === 'administrador') {
                tipoMapeado = 'admin';
            } else if (tipoOriginal === 'staff') {
                tipoMapeado = 'staff';
            } else if (tipoOriginal === 'representante') {
                tipoMapeado = 'representante';
            }

            console.log('Editando usuário:', item);
            console.log('Tipo original:', item.tipo);
            console.log('Tipo mapeado:', tipoMapeado);

            setFormData({
                name: item.nome || '',
                sigla: '',
                email: item.email || '',
                senha: '',
                tipo_usuario: tipoMapeado
            });
        } else {
            // Para outros cadastros
            setFormData({
                name: item.nome || item.name || '',
                sigla: item.sigla || '',
                email: '',
                senha: '',
                tipo_usuario: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingItem(null);
        setCategory('');
        setFormData({ name: '', sigla: '', email: '', senha: '', tipo_usuario: '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let endpoint = '';
            let body = {};
            let method = editingItem ? 'PUT' : 'POST';

            switch (category) {
                case 'Esportes':
                    endpoint = editingItem ? `/api/modalidades/${editingItem.id}` : '/api/modalidades';
                    body = { name: formData.name };
                    break;
                case 'Locais':
                    endpoint = editingItem ? `/api/locais/${editingItem.id}` : '/api/locais';
                    body = { name: formData.name };
                    break;
                case 'Cursos':
                    endpoint = editingItem ? `/api/cursos/${editingItem.id}` : '/api/cursos';
                    body = { name: formData.name, sigla: formData.sigla };
                    break;
                case 'Usuários':
                    // IMPORTANTE PARA LOGIN: Gerenciamento de usuários
                    endpoint = editingItem ? `/api/users/${editingItem.id}` : '/api/users';
                    body = {
                        nome_usuario: formData.name,
                        email_usuario: formData.email,
                        tipo_usuario: formData.tipo_usuario,
                        ...(formData.senha && { senha: formData.senha })
                    };
                    break;
                default:
                    toast.warning('Selecione uma categoria');
                    return;
            }

            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                if (category === 'Usuários') {
                    await loadUsers(); // Recarregar usuários
                } else {
                    await loadAllData(); // Recarregar outros dados
                }
                setIsModalOpen(false);
                toast.success(`${category.slice(0, -1)} ${editingItem ? 'editado' : 'criado'} com sucesso!`);
            } else {
                const error = await response.json();
                toast.error(error.message || `Erro ao ${editingItem ? 'editar' : 'criar'} cadastro`);
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar cadastro');
        }
    };

    const handleDelete = async (item, type) => {
        const confirmed = await confirm.danger(`Tem certeza que deseja excluir "${item.nome || item.name}"?`, {
            title: 'Confirmar Exclusão',
            confirmText: 'Excluir',
            cancelText: 'Cancelar'
        });

        if (!confirmed) {
            return;
        }

        try {
            let endpoint = '';
            switch (type) {
                case 'Esportes':
                    endpoint = `/api/modalidades/${item.id}`;
                    break;
                case 'Locais':
                    endpoint = `/api/locais/${item.id}`;
                    break;
                case 'Cursos':
                    endpoint = `/api/cursos/${item.id}`;
                    break;
                case 'Usuários':
                    // IMPORTANTE PARA LOGIN: Exclusão de usuários
                    endpoint = `/api/users/${item.id}`;
                    break;
                default:
                    return;
            }

            const response = await fetch(endpoint, {
                method: 'DELETE'
            });

            if (response.ok) {
                if (type === 'Usuários') {
                    await loadUsers(); // Recarregar usuários
                } else {
                    await loadAllData(); // Recarregar outros dados
                }
                toast.success(`${type.slice(0, -1)} excluído com sucesso!`);
            } else {
                const error = await response.json();
                toast.error(error.message || 'Erro ao excluir cadastro');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir cadastro');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ name: '', sigla: '', email: '', senha: '', tipo_usuario: '' });
        setCategory('');
        setEditingItem(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600 dark:text-gray-400">Carregando...</div>;
    }

    // Bloquear acesso para usuários do tipo 'staff'
    if (currentUser && currentUser.tipo_usuario === 'staff') {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h2>
                <p className="text-gray-700 dark:text-gray-300">
                    Usuários do tipo <b>staff</b> não têm permissão para acessar a área de cadastros.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Entre em contato com um administrador se precisar de acesso.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CADASTROS</h1>
                    <Button onClick={handleCreate} className="w-full md:w-auto">Cadastrar Novo</Button>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ESPORTES</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sports.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">{item.nome}</h3>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item, 'Esportes')}>Editar</Button>
                                        <Button
                                            onClick={() => handleDelete(item, 'Esportes')}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Excluir
                                        </Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">LOCAIS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {locations.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">{item.nome}</h3>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item, 'Locais')}>Editar</Button>
                                        <Button
                                            onClick={() => handleDelete(item, 'Locais')}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Excluir
                                        </Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">CURSOS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {courses.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.nome}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Sigla: {item.sigla}</p>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item, 'Cursos')}>Editar</Button>
                                        <Button
                                            onClick={() => handleDelete(item, 'Cursos')}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Excluir
                                        </Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seção USUÁRIOS (ESSENCIAL PARA LOGIN) */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">GERENCIAMENTO DE USUÁRIOS</h2>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    Sistema de Autenticação
                                </h3>
                                <Button onClick={() => {
                                    setEditingItem(null);
                                    setCategory('Usuários');
                                    // Manter a categoria atualmente selecionada
                                    const tipoUsuario = selectedUserCategory === 'Administradores' ? 'admin' : 
                                                       selectedUserCategory === 'Staff' ? 'staff' : 'representante';
                                    setFormData({ name: '', sigla: '', email: '', senha: '', tipo_usuario: tipoUsuario });
                                    setIsModalOpen(true);
                                }}>
                                    Cadastrar Novo Usuário
                                </Button>
                            </div>

                            {/* Tabs para tipos de usuários */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                                {['Administradores', 'Staff', 'Representantes'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setSelectedUserCategory(tab)}
                                        className={`py-2 px-4 border-b-2 transition-colors ${selectedUserCategory === tab
                                            ? 'border-red-600 text-red-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Lista de usuários por categoria */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {users[selectedUserCategory.toLowerCase()]?.map((user) => (
                                    <div
                                        key={user.id || user.id}
                                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {user.nome}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {user.email}
                                                </p>
                                                <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                                    {user.tipo}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleEdit(user, 'Usuários')}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-red-600 hover:bg-red-700"
                                                    onClick={() => handleDelete(user, 'Usuários')}
                                                >
                                                    Excluir
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!users[selectedUserCategory.toLowerCase()] || users[selectedUserCategory.toLowerCase()].length === 0) && (
                                    <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
                                        <p>Nenhum usuário do tipo "{selectedUserCategory}" encontrado.</p>
                                        <Button
                                            onClick={() => {
                                                setEditingItem(null);
                                                setCategory('Usuários');
                                                setFormData({ name: '', sigla: '', email: '', senha: '', tipo_usuario: selectedUserCategory === 'Administradores' ? 'admin' : selectedUserCategory === 'Staff' ? 'staff' : 'representante'});
                                                setIsModalOpen(true);
                                            }}
                                            className="mt-2"
                                        >
                                            Criar Primeiro {selectedUserCategory === 'Administradores' ? 'Administrador' : selectedUserCategory === 'Staff' ? 'Staff' : 'Representante'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <CardSplat />
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? "EDITAR CADASTRO" : "CRIAR CADASTRO"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Categoria"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="">Selecionar categoria</option>
                        <option value="Esportes">Esportes</option>
                        <option value="Locais">Locais</option>
                        <option value="Cursos">Cursos</option>
                        <option value="Usuários">Usuários (Login)</option>
                    </Select>

                    <Input
                        label="Nome"
                        placeholder="Digite o nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    {category === 'Cursos' && (
                        <Input
                            label="Sigla"
                            placeholder="Digite a sigla"
                            value={formData.sigla}
                            onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                            required
                        />
                    )}

                    {category === 'Usuários' && (
                        <>
                            <Input
                                label="Email"
                                type="email"
                                placeholder="usuario@exemplo.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />

                            <Input
                                label="Senha"
                                type="password"
                                placeholder={editingItem ? "Deixe em branco para manter a senha atual" : "Digite a senha"}
                                value={formData.senha}
                                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                required={!editingItem}
                            />

                            <Select
                                label="Tipo de Usuário"
                                value={formData.tipo_usuario}
                                onChange={(e) => setFormData({ ...formData, tipo_usuario: e.target.value })}
                                required
                            >
                                <option value="">Selecionar tipo</option>
                                <option value="admin">Administrador</option>
                                <option value="staff">Staff</option>
                                <option value="representante">Representante</option>
                            </Select>
                        </>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" onClick={closeModal} className="bg-gray-500">
                            Cancelar
                        </Button>
                        <Button type="submit">{editingItem ? 'Salvar' : 'Criar'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};