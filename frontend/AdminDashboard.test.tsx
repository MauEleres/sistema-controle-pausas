import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AdminDashboard from '../src/pages/admin/Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock do axios
const mockAxios = new MockAdapter(axios);

// Mock do contexto de autenticação
jest.mock('../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../src/contexts/AuthContext'),
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Admin Teste',
      email: 'admin@teste.com',
      role: 'admin'
    },
    isAuthenticated: true
  })
}));

describe('Testes do Dashboard do Administrador', () => {
  beforeEach(() => {
    mockAxios.reset();
    
    // Mock das chamadas de API
    mockAxios.onGet('http://localhost:5000/api/admin/users').reply(200, {
      users: [
        {
          id: 1,
          name: 'Admin Teste',
          email: 'admin@teste.com',
          role: 'admin'
        },
        {
          id: 2,
          name: 'Supervisor Teste',
          email: 'supervisor@teste.com',
          role: 'supervisor'
        },
        {
          id: 3,
          name: 'Atendente 1',
          email: 'atendente1@teste.com',
          role: 'atendente'
        },
        {
          id: 4,
          name: 'Atendente 2',
          email: 'atendente2@teste.com',
          role: 'atendente'
        }
      ]
    });
    
    mockAxios.onGet('http://localhost:5000/api/admin/teams').reply(200, {
      teams: [
        {
          id: 1,
          name: 'Equipe A',
          description: 'Equipe de atendimento A'
        },
        {
          id: 2,
          name: 'Equipe B',
          description: 'Equipe de atendimento B'
        }
      ]
    });
    
    mockAxios.onGet('http://localhost:5000/api/admin/pause-types').reply(200, {
      pauseTypes: [
        {
          id: 1,
          name: 'Almoço',
          description: 'Pausa para almoço',
          maxDuration: 60
        },
        {
          id: 2,
          name: 'Banheiro',
          description: 'Pausa para ir ao banheiro',
          maxDuration: 10
        },
        {
          id: 3,
          name: 'Treinamento',
          description: 'Pausa para treinamento',
          maxDuration: 120
        },
        {
          id: 4,
          name: 'Intervalo Técnico',
          description: 'Pausa técnica',
          maxDuration: 15
        }
      ]
    });
  });

  test('Renderiza o dashboard do administrador corretamente', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard do Administrador')).toBeInTheDocument();
      expect(screen.getByText('Bem-vindo(a), Admin Teste!')).toBeInTheDocument();
    });
  });

  test('Exibe os cards de estatísticas', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Usuários')).toBeInTheDocument();
      expect(screen.getByText('Equipes')).toBeInTheDocument();
      expect(screen.getByText('Tipos de Pausa')).toBeInTheDocument();
      expect(screen.getByText('Pausas Ativas')).toBeInTheDocument();
      
      // Verificar os valores das estatísticas
      expect(screen.getByText('4')).toBeInTheDocument(); // Total de usuários
      expect(screen.getByText('2')).toBeInTheDocument(); // Total de equipes
      expect(screen.getByText('4')).toBeInTheDocument(); // Total de tipos de pausa
      
      // Verificar detalhes dos usuários
      expect(screen.getByText('Atendentes: 2')).toBeInTheDocument();
      expect(screen.getByText('Supervisores: 1')).toBeInTheDocument();
      expect(screen.getByText('Administradores: 1')).toBeInTheDocument();
    });
  });

  test('Exibe a seção de atividades recentes', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Atividades Recentes')).toBeInTheDocument();
      // Verificar se pelo menos uma atividade é exibida
      expect(screen.getByText(/Fez login no sistema/)).toBeInTheDocument();
    });
  });
});
