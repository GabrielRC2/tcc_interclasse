'use client';
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, Textarea, Select, CardSplat } from '@/components/common';
import { mockData } from '@/data'; // Certifique-se de que o caminho está correto

export const RegistrationsPage = () => {
    // Estados existentes
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
<<<<<<< Updated upstream
    const [editingUserListType, setEditingUserListType] = useState(null); // 'admins' ou 'staff' para o modal de usuários
=======
    const [editingUserListType, setEditingUserListType] = useState(null);
    
    // Novo estado para dados
    const [data, setData] = useState({
        sports: [],
        locations: [],
        courses: [],
        admins: []
    });

    // Adicione um novo estado para formulário
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '', // Novo campo
        tipo_usuario: '' // Novo campo
    });

    // Adicione este estado para controlar o tipo de usuário
    const [selectedCategory, setSelectedCategory] = useState('');

    // Função para carregar usuários
    const loadUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const users = await response.json();
            setData(prev => ({
                ...prev,
                admins: users.filter(u => u.tipo_usuario === 'admin'),
                staff: users.filter(u => u.tipo_usuario === 'staff'),
                alunos: users.filter(u => u.tipo_usuario === 'aluno')
            }));
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    };

    // Carregar dados iniciais
    useEffect(() => {
        const loadInitialData = async () => {
            await loadUsers(); // Carrega os usuários
            setData(prev => ({
                ...prev,
                ...mockData.registrations
            }));
        };
        
        loadInitialData();
    }, []);
>>>>>>> Stashed changes

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
<<<<<<< Updated upstream
        // Se o item for de admins, preparamos o modal para listar usuários
        if (item.id.startsWith('admin')) {
            setEditingUserListType(item.id === 'admin-1' ? 'admins' : 'staff');
        } else {
            setEditingUserListType(null); // Reseta para outros tipos de cadastro
        }
=======
        
        if (item.id_usuario) { // Se for um usuário
            setSelectedCategory('Usuários');
            setFormData({
                nome: item.nome_usuario,
                email: item.email_usuario,
                senha: '', // Campo vazio para edição
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
>>>>>>> Stashed changes
    }

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
        setEditingUserListType(null); // Criação normal, não é uma lista de usuários
    }

    const closeModal = () => {
        setIsModalOpen(false);
<<<<<<< Updated upstream
        setEditingUserListType(null); // Garante que o tipo de lista de usuários seja resetado ao fechar
    };

    // Funções para manipular usuários dentro do modal de admins/staff
    const handleAddUser = (type) => {
        // Lógica para adicionar um novo usuário (nome/email) à lista
        console.log(`Adicionar novo usuário para ${type}`);
        // Você precisaria de inputs dentro do modal para coletar nome e email
        // E então atualizar o estado ou mockData
    };

    const handleDeleteUser = (type, userId) => {
        // Lógica para deletar um usuário específico da lista
        console.log(`Deletar usuário ${userId} de ${type}`);
        // Atualizar o estado ou mockData removendo o usuário
=======
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
                    senha: '123456', // Senha padrão inicial
                    tipo_usuario: type === 'admins' ? 'admin' : 'staff' || 'aluno' // Define o tipo de usuário baseado no tipo
                }),
            });

            if (response.ok) {
                loadUsers(); // Recarrega a lista
                closeModal();
                setFormData({ nome: '', email: '' }); // Limpa o formulário
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (error) {
            console.error('Erro ao adicionar usuário:', error);
            alert('Erro ao adicionar usuário');
        }
    };

    // Atualize a função handleDeleteUser existente
    const handleDeleteUser = async (type, userId) => {
        if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadUsers(); // Recarrega a lista
                if (editingItem?.id_usuario === userId) {
                    closeModal(); // Fecha o modal se o usuário sendo editado foi deletado
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

    // Função para lidar com mudanças no formulário
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Adicione esta função para controlar a mudança de categoria
    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    // Atualize a função handleSubmit
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const category = formData.get('category');
        
        if (category === 'Usuários') {
            const userData = {
                nome_usuario: formData.get('nome'),
                email_usuario: formData.get('email'),
                tipo_usuario: formData.get('tipo_usuario'),
                senha: formData.get('senha') || '123456' // Usa a senha do form ou a padrão
            };

            try {
                if (editingItem) {
                    // Se estiver editando
                    await handleUpdate(editingItem.id_usuario, userData);
                } else {
                    // Se estiver criando novo
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
            // Lógica para outras categorias (com descrição)
            const itemData = {
                name: formData.get('nome'),
                description: formData.get('description'),
                ...(category === 'Cursos' && { sigla: formData.get('sigla') })
            };
            
            // Implementar lógica para salvar outras categorias
            console.log('Dados do item:', itemData);
        }
    };

    // Adicione esta função após os outros handlers
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
                await loadUsers(); // Recarrega a lista
                closeModal();
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            alert('Erro ao atualizar usuário');
        }
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
                {/* Nova Seção ADMINISTRADORES */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ADMINISTRADORES</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mockData.registrations.admins.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{item.description}</p>
                                    <div className="flex gap-2">
                                        {/* Botão de Editar preto e sem Excluir */}
                                        <Button onClick={() => handleEdit(item)} className="bg-black text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600">
                                            Editar
                                        </Button>
=======
                {/* Seção ADMINISTRADORES */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ADMINISTRADORES</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data?.admins?.map((item, index) => (
                            <div key={item.id_usuario || `admin-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">
                                        {item.nome_usuario}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                        {item.email_usuario}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item)} className="bg-black text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600">
                                            Editar
                                        </Button>
                                        <Button 
                                            variant="secondary"
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                                            onClick={() => handleDeleteUser('admins', item.id_usuario)}
                                        >
                                            Excluir
                                        </Button>
>>>>>>> Stashed changes
                                    </div>
                                </div>
                                <CardSplat />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal de Edição/Criação */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? "EDITAR CADASTRO" : "CRIAR CADASTRO"}>
                {editingUserListType ? ( // Se for uma edição de "Administradores" ou "Staff"
<<<<<<< Updated upstream
                    <form className="space-y-4">
                        <h3 className="text-lg font-bold mb-4">Gerenciar Usuários de {editingItem?.name}</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {editingItem?.users?.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 border rounded-md dark:border-gray-600">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                                        onClick={() => handleDeleteUser(editingUserListType, user.id)}
=======
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
>>>>>>> Stashed changes
                                    >
                                        Deletar
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t dark:border-gray-700">
                            <h4 className="font-semibold mb-2">Adicionar Novo Usuário</h4>
<<<<<<< Updated upstream
                            <Input label="Nome" placeholder="Nome do usuário" />
                            <Input label="Email" placeholder="email@exemplo.com" type="email" className="mt-2" />
                            <Button onClick={() => handleAddUser(editingUserListType)} className="mt-4 w-full">Adicionar Usuário</Button>
=======
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
>>>>>>> Stashed changes
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="button" onClick={closeModal}>Fechar</Button>
                        </div>
                    </form>
                ) : ( // Modal para outros tipos de cadastro
<<<<<<< Updated upstream
                    <form className="space-y-4">
                        <Select
                            label="Categoria"
                            defaultValue={editingItem ? (
                                mockData.registrations.sports.some(s => s.id === editingItem.id) ? 'Esportes' :
                                    mockData.registrations.locations.some(l => l.id === editingItem.id) ? 'Locais' : 'Cursos'
                            ) : ''}
                        >
                            <option>Selecionar</option>
                            <option>Esportes</option>
                            <option>Locais</option>
                            <option>Cursos</option>
                            {/* Você pode adicionar 'Administradores' e 'Staff' aqui se quiser que sejam criáveis diretamente */}
                        </Select>
                        <Input label="Nome do Cadastro" placeholder="Digite o nome" defaultValue={editingItem?.name} />
                        {editingItem?.sigla !== undefined && (
                            <Input label="Sigla" placeholder="Digite a sigla" defaultValue={editingItem?.sigla} />
                        )}
                        {editingItem && !editingItem.id.startsWith('admin') && ( // Descrição apenas para Esportes e Locais
                            <Textarea label="Descrição" placeholder="Digite a descrição" defaultValue={editingItem?.description} />
                        )}
=======
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
                                    required={!editingItem} // Senha obrigatória apenas para novos usuários
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
                        
>>>>>>> Stashed changes
                        <div className="flex justify-end pt-4">
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
};