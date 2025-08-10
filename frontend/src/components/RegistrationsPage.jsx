'use client';
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, Textarea, Select, CardSplat } from '@/components/common';
import { mockData } from '@/data';

export const RegistrationsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingUserListType, setEditingUserListType] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('Administradores');
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        tipo_usuario: ''
    });

    // Estado para dados
    const [data, setData] = useState({
        sports: [],
        locations: [],
        courses: [],
        administradores: [],
        staff: [],
        alunos: []
    });

    // Função para carregar usuários
    const loadUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const users = await response.json();
            setData(prev => ({
                ...prev,
                administradores: users.filter(u => u.tipo_usuario.toLowerCase() === 'admin'),
                staff: users.filter(u => u.tipo_usuario.toLowerCase() === 'staff'),
                alunos: users.filter(u => u.tipo_usuario.toLowerCase() === 'aluno')
            }));
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    };

    // Carregar dados iniciais
    useEffect(() => {
        const loadInitialData = async () => {
            await loadUsers();
            setData(prev => ({
                ...prev,
                ...mockData.registrations
            }));
        };

        loadInitialData();
    }, []);

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);

        if (item.id_usuario) {
            setSelectedCategory('Usuários');
            setFormData({
                nome: item.nome_usuario,
                email: item.email_usuario,
                senha: '',
                tipo_usuario: item.tipo_usuario
            });
        } else {
            setSelectedCategory(
                item.id.startsWith('sport') ? 'Esportes' :
                    item.id.startsWith('location') ? 'Locais' :
                        'Cursos'
            );
            setFormData({
                nome: item.name,
                email: '',
                senha: '',
                tipo_usuario: ''
            });
        }

        setEditingUserListType(null);
    }

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
        setEditingUserListType(null);
    }

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setEditingUserListType(null);
        setSelectedCategory('');
        setFormData({
            nome: '',
            email: '',
            senha: '',
            tipo_usuario: ''
        });
    };

    // Função para adicionar usuário
    const handleAddUser = async (type) => {
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome_usuario: formData.nome,
                    email_usuario: formData.email,
                    senha: '123456',
                    tipo_usuario: type === 'admins' ? 'admin' : 'staff'
                }),
            });

            if (response.ok) {
                loadUsers();
                closeModal();
                setFormData({ nome: '', email: '' });
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (error) {
            console.error('Erro ao adicionar usuário:', error);
            alert('Erro ao adicionar usuário');
        }
    };

    const handleDeleteUser = async (type, userId) => {
        if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadUsers();
                if (editingItem?.id_usuario === userId) {
                    closeModal();
                }
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao deletar usuário');
            }
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            alert('Erro ao deletar usuário');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const category = formData.get('category');

        if (category === 'Usuários') {
            const userData = {
                nome_usuario: formData.get('nome'),
                email_usuario: formData.get('email'),
                tipo_usuario: formData.get('tipo_usuario'),
                senha: formData.get('senha') || '123456'
            };

            try {
                if (editingItem) {
                    await handleUpdate(editingItem.id_usuario, userData);
                } else {
                    const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(userData),
                    });

                    if (response.ok) {
                        await loadUsers();
                        closeModal();
                        setFormData({ nome: '', email: '', senha: '', tipo_usuario: '' });
                    } else {
                        const error = await response.json();
                        alert(error.message);
                    }
                }
            } catch (error) {
                console.error('Erro ao salvar usuário:', error);
                alert('Erro ao salvar usuário');
            }
        } else {
            const itemData = {
                name: formData.get('nome'),
                description: formData.get('description'),
                ...(category === 'Cursos' && { sigla: formData.get('sigla') })
            };

            // TODO: Implementar lógica para salvar outras categorias
            console.log('Dados do item:', itemData);
        }
    };

    const handleUpdate = async (userId, userData) => {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                await loadUsers();
                closeModal();
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            alert('Erro ao atualizar usuário');
        }
    };

    return (
        <>
            <div className="space-y-8">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CADASTROS</h1>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                            <Trash2 size={24} />
                        </button>
                        <Button onClick={handleCreate}>Cadastrar Novo</Button>
                    </div>
                </div>

                {/* Seção ESPORTES */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ESPORTES</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data?.sports?.map((item, index) => (
                            <div key={item.id || `sport-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.name}</h3>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item)}>Editar</Button>
                                        <Button variant="secondary">Excluir</Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seção LOCAIS */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">LOCAIS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data?.locations?.map((item, index) => (
                            <div key={item.id || `location-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{item.description}</p>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item)}>Editar</Button>
                                        <Button variant="secondary">Excluir</Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seção CURSOS */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">CURSOS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data?.courses?.map((item, index) => (
                            <div key={item.id || `course-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Sigla: {item.sigla}</p>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item)}>Editar</Button>
                                        <Button variant="secondary">Excluir</Button>
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seção ADMINISTRADORES */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ADMINISTRADORES</h2>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    Gerenciamento de Usuários
                                </h3>
                                <Button onClick={() => {
                                    setEditingItem(null);
                                    setIsModalOpen(true);
                                    setSelectedCategory('Usuários');
                                }}>
                                    Cadastrar Novo Usuário
                                </Button>
                            </div>

                            {/* Tabs para tipos de usuários */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                                {['Administradores', 'Staff', 'Alunos'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setSelectedCategory(tab)}
                                        className={`py-2 px-4 border-b-2 ${selectedCategory === tab
                                            ? 'border-red-600 text-red-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Lista de usuários */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data[selectedCategory.toLowerCase()]?.map((user) => (
                                    <div
                                        key={user.id_usuario}
                                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {user.nome_usuario}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {user.email_usuario}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleDeleteUser(selectedCategory.toLowerCase(), user.id_usuario)}
                                                >
                                                    Excluir
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <CardSplat />
                    </div>
                </div>
            </div>

            {/* Modal de Edição/Criação */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? "EDITAR CADASTRO" : "CRIAR CADASTRO"}>
                {editingUserListType ? (
                    <form className="space-y-4" onSubmit={(e) => {
                        e.preventDefault();
                        handleAddUser(editingUserListType);
                    }}>
                        <h3 className="text-lg font-bold mb-4">Gerenciar Usuários de {editingItem?.name}</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {data[editingUserListType]?.map((user, index) => (
                                <div key={user.id_usuario || `user-${index}`} className="flex items-center justify-between p-2 border rounded-md dark:border-gray-600">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{user.nome_usuario}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{user.email_usuario}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                                        onClick={() => handleDeleteUser(editingUserListType, user.id_usuario)}
                                    >
                                        Deletar
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t dark:border-gray-700">
                            <h4 className="font-semibold mb-2">Adicionar Novo Usuário</h4>
                            <Input
                                name="nome"
                                label="Nome"
                                placeholder="Nome do usuário"
                                value={formData.nome}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                name="email"
                                label="Email"
                                type="email"
                                placeholder="email@exemplo.com"
                                className="mt-2"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                            <Button type="submit" className="mt-4 w-full">
                                Adicionar Usuário
                            </Button>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="button" onClick={closeModal}>Fechar</Button>
                        </div>
                    </form>
                ) : (
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <Select
                            name="category"
                            label="Categoria"
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                            required
                        >
                            <option value="">Selecionar</option>
                            <option value="Esportes">Esportes</option>
                            <option value="Locais">Locais</option>
                            <option value="Cursos">Cursos</option>
                            <option value="Usuários">Usuários</option>
                        </Select>

                        <Input
                            name="nome"
                            label="Nome"
                            placeholder="Digite o nome"
                            defaultValue={editingItem?.name || editingItem?.nome_usuario}
                            required
                        />

                        {selectedCategory === 'Usuários' ? (
                            <>
                                <Input
                                    name="email"
                                    type="email"
                                    label="Email"
                                    placeholder="email@exemplo.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    name="senha"
                                    type="password"
                                    label="Senha"
                                    placeholder="Digite a senha"
                                    value={formData.senha}
                                    onChange={handleInputChange}
                                    required={!editingItem}
                                />
                                <Select
                                    name="tipo_usuario"
                                    label="Tipo de Usuário"
                                    value={formData.tipo_usuario}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Selecionar</option>
                                    <option value="admin">Administrador</option>
                                    <option value="staff">Staff</option>
                                    <option value="aluno">Aluno</option>
                                </Select>
                            </>
                        ) : (
                            <>
                                <Textarea
                                    name="description"
                                    label="Descrição"
                                    placeholder="Digite a descrição"
                                    defaultValue={editingItem?.description}
                                    required
                                />
                                {selectedCategory === 'Cursos' && (
                                    <Input
                                        name="sigla"
                                        label="Sigla"
                                        placeholder="Digite a sigla"
                                        defaultValue={editingItem?.sigla}
                                        required
                                    />
                                )}
                            </>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
};
