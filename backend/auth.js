const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'sistema-controle-pausas-secret';

module.exports = {
  // Middleware para verificar se o usuário está autenticado
  verifyToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  },
  
  // Middleware para verificar se o usuário tem permissão de atendente
  isAtendente: (req, res, next) => {
    if (req.user.role === 'atendente' || req.user.role === 'supervisor' || req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Acesso negado: permissão de atendente necessária' });
    }
  },
  
  // Middleware para verificar se o usuário tem permissão de supervisor
  isSupervisor: (req, res, next) => {
    if (req.user.role === 'supervisor' || req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Acesso negado: permissão de supervisor necessária' });
    }
  },
  
  // Middleware para verificar se o usuário tem permissão de admin
  isAdmin: (req, res, next) => {
    if (req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Acesso negado: permissão de administrador necessária' });
    }
  },
  
  // Middleware para verificar se o usuário tem acesso a um atendente específico
  // (próprio usuário, supervisor da equipe ou admin)
  canAccessUser: async (req, res, next) => {
    const { User, Team } = require('../database/models');
    const targetUserId = parseInt(req.params.id);
    
    // Se for o próprio usuário, permitir acesso
    if (req.user.id === targetUserId) {
      return next();
    }
    
    try {
      // Se for admin, permitir acesso
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Se for supervisor, verificar se o atendente está na sua equipe
      if (req.user.role === 'supervisor') {
        const targetUser = await User.findByPk(targetUserId);
        
        if (!targetUser) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        
        if (targetUser.teamId === req.user.teamId) {
          return next();
        }
      }
      
      // Se chegou aqui, não tem permissão
      return res.status(403).json({ message: 'Acesso negado: você não tem permissão para acessar este usuário' });
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao verificar permissões', error: error.message });
    }
  }
};
