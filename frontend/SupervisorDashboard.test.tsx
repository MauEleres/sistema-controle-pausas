import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import SupervisorDashboard from '../src/pages/supervisor/Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock do axios
const mockAxios = new MockAdapter(axios);

// Mock do contexto de autenticação
jest.mock('../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../src/contexts/AuthContext'),
  useAuth: () => ({
    user: {
      id: 2,
      name: 'Supervisor Teste',
      email: 'supervisor@teste.com',
      role: 'supervisor',
      teamId: 1
    },
    isAuthenticated: true
  })
}));

describe('Testes do Dashboard do Supervisor', () => {
  beforeEach(() => {
    mockAxios.reset();
    
    // Mock das chamadas de API
    mockAxios.onGet('http://localhost:5000/api/supervisor/team-members').reply(200, {
      teamMembers: [
        {
          id: 3,
          name: 'Atendente 1',
          email: 'atendente1@teste.com'
        },
        {
          id: 4,
          name: 'Atendente 2',
          email: 'atendente2@teste.com'
        }
      ]
    });
    
    mockAxios.onGet('http://localhost:5000/api/supervisor/active-pauses').reply(200, {
      activePauses: [
        {
          id: 1,
          startTime: new Date().toISOString(),
          currentDuration: 15,
          isOvertime: false,
          User: {
            id: 3,
            name: 'Atendente 1',
            email: 'atendente1@teste.com'
          },
          PauseType: {
            id: 1,
            name: 'Almoço',
            maxDuration: 60
          }
        }
      ]
    });
  });

  test('Renderiza o dashboard do supervisor corretamente', async () => {
    render(
      <BrowserRouter>
        <SupervisorDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard do Supervisor')).toBeInTheDocument();
      expect(screen.getByText('Bem-vindo(a), Supervisor Teste!')).toBeInTheDocument();
      expect(screen.getByText('Pausas Ativas da Equipe')).toBeInTheDocument();
      expect(screen.getByText('Membros da Equipe')).toBeInTheDocument();
    });
  });

  test('Exibe pausas ativas da equipe', async () => {
    render(
      <BrowserRouter>
        <SupervisorDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Atendente')).toBeInTheDocument();
      expect(screen.getByText('Tipo de Pausa')).toBeInTheDocument();
      expect(screen.getByText('Início')).toBeInTheDocument();
      expect(screen.getByText('Duração')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Ações')).toBeInTheDocument();
      
      expect(screen.getByText('Atendente 1')).toBeInTheDocument();
      expect(screen.getByText('Almoço')).toBeInTheDocument();
      expect(screen.getByText('15 min')).toBeInTheDocument();
      expect(screen.getByText('Em andamento')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Finalizar' })).toBeInTheDocument();
    });
  });

  test('Exibe membros da equipe', async () => {
    render(
      <BrowserRouter>
        <SupervisorDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Atendente 1')).toBeInTheDocument();
      expect(screen.getByText('atendente1@teste.com')).toBeInTheDocument();
      expect(screen.getByText('Atendente 2')).toBeInTheDocument();
      expect(screen.getByText('atendente2@teste.com')).toBeInTheDocument();
      expect(screen.getAllByText('Ver Histórico').length).toBe(2);
    });
  });

  test('Abre diálogo ao clicar em "Finalizar" pausa', async () => {
    render(
      <BrowserRouter>
        <SupervisorDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Finalizar' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }));

    await waitFor(() => {
      expect(screen.getByText('Finalizar Pausa')).toBeInTheDocument();
      expect(screen.getByText(/Deseja finalizar a pausa de/)).toBeInTheDocument();
      expect(screen.getByText('Atendente 1')).toBeInTheDocument();
      expect(screen.getByText('Tipo de pausa: Almoço')).toBeInTheDocument();
      expect(screen.getByLabelText('Observações (opcional)')).toBeInTheDocument();
    });
  });
});
