import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Login from '../src/pages/Login';
import { AuthProvider } from '../src/contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock do axios
const mockAxios = new MockAdapter(axios);

// Mock do useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('Testes de Login', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  test('Renderiza o formulário de login corretamente', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Sistema de Controle de Pausas')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  test('Exibe erro quando campos estão vazios', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Por favor, preencha todos os campos')).toBeInTheDocument();
    });
  });

  test('Exibe erro quando credenciais são inválidas', async () => {
    mockAxios.onPost('http://localhost:5000/api/auth/login').reply(401, {
      message: 'Credenciais inválidas'
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'usuario@teste.com' }
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senhaerrada' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });

  test('Login bem-sucedido para atendente', async () => {
    mockAxios.onPost('http://localhost:5000/api/auth/login').reply(200, {
      token: 'fake-token',
      user: {
        id: 1,
        name: 'Atendente Teste',
        email: 'atendente@teste.com',
        role: 'atendente'
      }
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'atendente@teste.com' }
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      // Verificar se o token foi armazenado no localStorage
      expect(localStorage.getItem('token')).toBe('fake-token');
    });
  });
});
