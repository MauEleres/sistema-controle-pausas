const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Team } = require('../database/models');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'sistema-controle-pausas-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

module.exports = {
  // Registrar um novo usuário
  register: async (req, res) => {
    try {
      const { name, email, password, role, teamId } = req.body;
      
      // Verificar se o email já está em uso
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
      
      // Verificar se o usuário tem permissão para criar o tipo de usuário solicitado
      if (req.user) {
        if (req.user.role === 'supervisor' && (role === 'admin' || role === 'supervisor')) {
          return res.status(403).json({ message: 'Supervisores só podem criar atendentes' });
        }
        
        // Supervisores só podem adicionar usuários à sua própria equipe
        if (req.user.role === 'supervisor' && teamId !== req.user.teamId) {
          return res.status(403).json({ message: 'Supervisores só podem adicionar usuários à sua própria equipe' });
        }
      }
      
      // Hash da senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Criar o usuário
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'atendente', // Padrão é atendente
        teamId
      });
      
      // Remover a senha do objeto de resposta
      const userResponse = { ...newUser.get() };
      delete userResponse.password;
      
      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        user: userResponse
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao registrar usuário', error: error.message });
    }
  },
  
  // Login de usuário
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Verificar se o usuário existe
      const user = await User.findOne({ 
        where: { email },
        include: [{ model: Team }]
      });
      
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Verificar se o usuário está ativo
      if (!user.active) {
        return res.status(401).json({ message: 'Usuário desativado. Entre em contato com o administrador.' });
      }
      
      // Verificar a senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          teamId: user.teamId,
          name: user.name
        }, 
        JWT_SECRET, 
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      // Remover a senha do objeto de resposta
      const userResponse = { ...user.get() };
      delete userResponse.password;
      
      res.status(200).json({
        message: 'Login realizado com sucesso',
        token,
        user: userResponse
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
    }
  },
  
  // Obter informações do usuário atual
  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{ model: Team }],
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao obter perfil', error: error.message });
    }
  }
};
