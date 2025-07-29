'use client';
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button, Input, Select, CardSplat } from '@/components/common';

export const RegistrationsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Estados para os dados do backend
  const [sports, setSports] = useState([]);
  const [places, setPlaces] = useState([]);
  const [divisions, setDivisions] = useState([]);

  // Busca os dados do backend
  async function fetchData() {
    try {
      const [sportsRes, placesRes, divisionsRes] = await Promise.all([
        fetch('/api/sports').then(res => res.json()),
        fetch('/api/places').then(res => res.json()),
        fetch('/api/division').then(res => res.json()),
      ]);

      setSports(sportsRes);
      setPlaces(placesRes);
      setDivisions(divisionsRes);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  }

  // Carrega os dados quando o componente montar
  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // Função para criar (POST)
  const handleSave = async (e) => {
    e.preventDefault();

    const type = e.target[0].value;  // Categoria (Select)
    const name = e.target[1].value;  // Nome do cadastro (Input)

    let endpoint = '';
    let body = {};

    if (type === 'Esportes') {
      endpoint = '/api/sports';
      body = { nome_modalidade: name };
    } else if (type === 'Locais') {
      endpoint = '/api/places';
      body = { nome_local: name };
    } else if (type === 'Categorias') {
      endpoint = '/api/division';
      body = { nome_categoria: name };
    } else {
      alert('Escolha uma categoria válida');
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao salvar');
      }

      await res.json(); // lê resposta (não está sendo usado, mas pode logar se quiser)

      setIsModalOpen(false);  // Fecha modal
      await fetchData();      // Atualiza listas
    } catch (err) {
      console.error(err);
      alert(err.message);
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

        {/* ESPORTES */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ESPORTES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sports.map(item => (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.nome_modalidade}</h3>
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

        {/* LOCAIS */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">LOCAIS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {places.map(item => (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.nome_local}</h3>
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

        {/* Categorias */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">CATEGORIAS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {divisions.map(item => (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{item.nome_categoria}</h3>
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
      </div>

      

      {/* MODAL DE CRIAÇÃO/EDIÇÃO */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? "EDITAR CADASTRO" : "CRIAR CADASTRO"}>
        <form className="space-y-4" onSubmit={handleSave}>
          <Select label="Categoria" defaultValue={editingItem ? sports.some(s => s.id === editingItem.id) ? 'Esportes' : 'Locais': ''}>
            <option>Selecionar</option>
            <option>Esportes</option>
            <option>Locais</option>
            <option>Categorias</option>
          </Select>
          <Input label="Nome do Cadastro" placeholder="Placeholder" defaultValue={editingItem?.nome_local || editingItem?.nome_modalidade || ''}/>
          <div className="flex justify-end pt-4">
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
