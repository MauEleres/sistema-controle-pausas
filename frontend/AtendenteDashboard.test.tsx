import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AtendenteDashboard from '../src/pages/atendente/Dashboard';
import { AuthProvider } from '../src/contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock do axios
const mockAxios = new MockAdapter(axios);

// Mock do contexto de autenticação
jest.mock('../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../src/contexts/AuthContext'),
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Atendente Teste',
      email: 'atendente@teste.com',
      role: 'atendente'
    },
    isAuthenticated: true
  })
}));

describe('Testes do Dashboard do Atendente', () => {
  beforeEach(() => {
    mockAxios.reset();
    
    // Mock das chamadas de API
    mockAxios.onGet('http://localhost:5000/api/pauses/types').reply(200, {
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
        }
      ]
    });
    
    mockAxios.onGet('http://localhost:5000/api/pauses/history').reply(200, {
      pauseHistory: []
    });
  });

  test('Renderiza o dashboard do atendente corretamente', async () => {
    render(
      <BrowserRouter>
        <AtendenteDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard do Atendente')).toBeInTheDocument();
      expect(screen.getByText('Bem-vindo(a), Atendente Teste!')).toBeInTheDocument();
      expect(screen.getByText('Status Atual')).toBeInTheDocument();
      expect(screen.getByText('Tipos de Pausa Disponíveis')).toBeInTheDocument();
    });
  });

  test('Exibe status "Disponível" quando não há pausa ativa', async () => {
    render(
      <BrowserRouter>
        <AtendenteDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Disponível')).toBeInTheDocument();
      expect(screen.getByText('Você não está em pausa no momento.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Iniciar Pausa' })).toBeInTheDocument();
    });
  });

  test('Exibe tipos de pausa disponíveis', async () => {
    render(
      <BrowserRouter>
        <AtendenteDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Almoço')).toBeInTheDocument();
      expect(screen.getByText('Pausa para almoço')).toBeInTheDocument();
      expect(screen.getByText('Banheiro')).toBeInTheDocument();
      expect(screen.getByText('Pausa para ir ao banheiro')).toBeInTheDocument();
    });
  });

  test('Abre diálogo ao clicar em "Iniciar Pausa"', async () => {
    render(
      <BrowserRouter>
        <AtendenteDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Iniciar Pausa' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Pausa' }));

    await waitFor(() => {
      expect(screen.getByText('Iniciar Pausa')).toBeInTheDocument();
      expect(screen.getByText('Selecione o tipo de pausa que deseja iniciar:')).toBeInTheDocument();
      expect(screen.getByLabelText('Tipo de Pausa')).toBeInTheDocument();
      expect(screen.getByLabelText('Observações (opcional)')).toBeInTheDocument();
    });
  });

  test('Exibe status "Em Pausa" quando há pausa ativa', async () => {
    // Mock para simular uma pausa ativa
    mockAxios.onGet('http://localhost:5000/api/pauses/history').reply(200, {
      pauseHistory: [
        {
          id: 1,
          startTime: new Date().toISOString(),
          status: 'em_andamento',
          PauseType: {
            id: 1,
            name: 'Almoço',
            maxDuration: 60
          }
        }
      ]
    });

    render(
      <BrowserRouter>
        <AtendenteDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Em Pausa')).toBeInTheDocument();
      expect(screen.getByText('Tipo: Almoço')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Finalizar Pausa' })).toBeInTheDocument();
    });
  });
});
