const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const { User, Team, PauseType } = require('../database/models');
const bcrypt = require('bcryptjs');

// Obter todos os usuários
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Team }],
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
  }
});

// Criar um novo usuário (qualquer nível)
router.post('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, teamId, active } = req.body;
    
    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Criar o usuário
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'atendente',
      teamId,
      active: active !== undefined ? active : true
    });
    
    // Remover a senha do objeto de resposta
    const userResponse = { ...newUser.get() };
    delete userResponse.password;
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar usuário', error: error.message });
  }
});

// Atualizar um usuário
router.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, teamId, active } = req.body;
    
    // Verificar se o usuário existe
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Verificar se o email já está em uso por outro usuário
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já está em uso por outro usuário' });
      }
    }
    
    // Preparar objeto de atualização
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (teamId !== undefined) updateData.teamId = teamId;
    if (active !== undefined) updateData.active = active;
    
    // Hash da senha se fornecida
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    
    // Atualizar o usuário
    await user.update(updateData);
    
    // Buscar o usuário atualizado com a equipe
    const updatedUser = await User.findByPk(id, {
      include: [{ model: Team }],
      attributes: { exclude: ['password'] }
    });
    
    res.status(200).json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar usuário', error: error.message });
  }
});

// Excluir um usuário (desativar)
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Desativar o usuário em vez de excluir
    await user.update({ active: false });
    
    res.status(200).json({
      message: 'Usuário desativado com sucesso'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao desativar usuário', error: error.message });
  }
});

// Gerenciar equipes
// Obter todas as equipes
router.get('/teams', verifyToken, isAdmin, async (req, res) => {
  try {
    const teams = await Team.findAll({
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({ teams });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar equipes', error: error.message });
  }
});

// Criar uma nova equipe
router.post('/teams', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Verificar se já existe uma equipe com o mesmo nome
    const existingTeam = await Team.findOne({ where: { name } });
    if (existingTeam) {
      return res.status(400).json({ message: 'Já existe uma equipe com este nome' });
    }
    
    // Criar a equipe
    const team = await Team.create({
      name,
      description
    });
    
    res.status(201).json({
      message: 'Equipe criada com sucesso',
      team
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar equipe', error: error.message });
  }
});

// Atualizar uma equipe
router.put('/teams/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Verificar se a equipe existe
    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({ message: 'Equipe não encontrada' });
    }
    
    // Verificar se o nome já está em uso por outra equipe
    if (name && name !== team.name) {
      const existingTeam = await Team.findOne({ where: { name } });
      if (existingTeam) {
        return res.status(400).json({ message: 'Já existe uma equipe com este nome' });
      }
    }
    
    // Atualizar a equipe
    await team.update({
      name: name || team.name,
      description: description !== undefined ? description : team.description
    });
    
    res.status(200).json({
      message: 'Equipe atualizada com sucesso',
      team
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar equipe', error: error.message });
  }
});

// Gerenciar tipos de pausa (admin pode editar/desativar)
router.get('/pause-types', verifyToken, isAdmin, async (req, res) => {
  try {
    const pauseTypes = await PauseType.findAll({
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({ pauseTypes });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar tipos de pausa', error: error.message });
  }
});

router.put('/pause-types/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, maxDuration, active } = req.body;
    
    // Verificar se o tipo de pausa existe
    const pauseType = await PauseType.findByPk(id);
    if (!pauseType) {
      return res.status(404).json({ message: 'Tipo de pausa não encontrado' });
    }
    
    // Atualizar o tipo de pausa
    await pauseType.update({
      name: name || pauseType.name,
      description: description !== undefined ? description : pauseType.description,
      maxDuration: maxDuration !== undefined ? maxDuration : pauseType.maxDuration,
      active: active !== undefined ? active : pauseType.active
    });
    
    res.status(200).json({
      message: 'Tipo de pausa atualizado com sucesso',
      pauseType
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar tipo de pausa', error: error.message });
  }
});

module.exports = router;
