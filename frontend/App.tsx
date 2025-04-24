import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import AtendenteLayout from './layouts/AtendenteLayout';
import SupervisorLayout from './layouts/SupervisorLayout';
import AdminLayout from './layouts/AdminLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Páginas de Atendente
import AtendenteDashboard from './pages/atendente/Dashboard';
import AtendenteHistorico from './pages/atendente/Historico';
import AtendentePerfil from './pages/atendente/Perfil';

// Páginas de Supervisor
import SupervisorDashboard from './pages/supervisor/Dashboard';
import SupervisorEquipe from './pages/supervisor/Equipe';
import SupervisorTiposPausa from './pages/supervisor/TiposPausa';
import SupervisorRelatorios from './pages/supervisor/Relatorios';

// Páginas de Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsuarios from './pages/admin/Usuarios';
import AdminEquipes from './pages/admin/Equipes';
import AdminTiposPausa from './pages/admin/TiposPausa';

// Componente para rotas protegidas
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirecionar para o dashboard apropriado com base no papel do usuário
    if (user.role === 'atendente') {
      return <Navigate to="/atendente/dashboard" />;
    } else if (user.role === 'supervisor') {
      return <Navigate to="/supervisor/dashboard" />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    }
  }

  return children;
};

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#424242',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Rotas de Atendente */}
            <Route path="/atendente" element={
              <ProtectedRoute allowedRoles={['atendente', 'supervisor', 'admin']}>
                <AtendenteLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<AtendenteDashboard />} />
              <Route path="historico" element={<AtendenteHistorico />} />
              <Route path="perfil" element={<AtendentePerfil />} />
              <Route path="" element={<Navigate to="/atendente/dashboard" />} />
            </Route>
            
            {/* Rotas de Supervisor */}
            <Route path="/supervisor" element={
              <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                <SupervisorLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<SupervisorDashboard />} />
              <Route path="equipe" element={<SupervisorEquipe />} />
              <Route path="tipos-pausa" element={<SupervisorTiposPausa />} />
              <Route path="relatorios" element={<SupervisorRelatorios />} />
              <Route path="" element={<Navigate to="/supervisor/dashboard" />} />
            </Route>
            
            {/* Rotas de Admin */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="equipes" element={<AdminEquipes />} />
              <Route path="tipos-pausa" element={<AdminTiposPausa />} />
              <Route path="" element={<Navigate to="/admin/dashboard" />} />
            </Route>
            
            {/* Rota padrão - redireciona para login */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
