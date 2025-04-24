const express = require('express');
const router = express.Router();
const { verifyToken, isSupervisor } = require('../middlewares/auth');
const { PauseRecord, PauseType, User, Team } = require('../database/models');
const { Op } = require('sequelize');

// Obter todos os atendentes da equipe do supervisor
router.get('/team-members', verifyToken, isSupervisor, async (req, res) => {
  try {
    const teamMembers = await User.findAll({
      where: {
        teamId: req.user.teamId,
        role: 'atendente',
        active: true
      },
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({ teamMembers });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar membros da equipe', error: error.message });
  }
});

// Finalizar pausa de um atendente
router.post('/end-pause/:id', verifyToken, isSupervisor, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    // Buscar o registro de pausa
    const pauseRecord = await PauseRecord.findByPk(id, {
      include: [{ model: User }]
    });
    
    if (!pauseRecord) {
      return res.status(404).json({ message: 'Registro de pausa não encontrado' });
    }
    
    // Verificar se o atendente pertence à equipe do supervisor
    if (pauseRecord.User.teamId !== req.user.teamId) {
      return res.status(403).json({ message: 'Você não tem permissão para finalizar pausas de atendentes de outras equipes' });
    }
    
    // Verificar se a pausa já foi finalizada
    if (pauseRecord.status !== 'em_andamento') {
      return res.status(400).json({ message: 'Esta pausa já foi finalizada ou cancelada' });
    }
    
    // Calcular a duração da pausa em minutos
    const endTime = new Date();
    const startTime = new Date(pauseRecord.startTime);
    const durationMs = endTime - startTime;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    
    // Atualizar o registro de pausa
    await pauseRecord.update({
      endTime,
      duration: durationMinutes,
      status: 'finalizada',
      notes: notes ? (pauseRecord.notes ? `${pauseRecord.notes}\n${notes} (finalizado pelo supervisor)` : `${notes} (finalizado pelo supervisor)`) : pauseRecord.notes
    });
    
    res.status(200).json({
      message: 'Pausa finalizada com sucesso',
      pauseRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao finalizar pausa', error: error.message });
  }
});

// Obter pausas em andamento dos atendentes da equipe
router.get('/active-pauses', verifyToken, isSupervisor, async (req, res) => {
  try {
    // Buscar todos os atendentes da equipe
    const teamMembers = await User.findAll({
      where: {
        teamId: req.user.teamId,
        role: 'atendente'
      },
      attributes: ['id']
    });
    
    const teamMemberIds = teamMembers.map(member => member.id);
    
    // Buscar pausas em andamento
    const activePauses = await PauseRecord.findAll({
      where: {
        userId: { [Op.in]: teamMemberIds },
        status: 'em_andamento'
      },
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: PauseType, attributes: ['id', 'name', 'maxDuration'] }
      ],
      order: [['startTime', 'ASC']]
    });
    
    // Adicionar informação de duração atual
    const now = new Date();
    const pausesWithDuration = activePauses.map(pause => {
      const startTime = new Date(pause.startTime);
      const durationMs = now - startTime;
      const currentDurationMinutes = Math.floor(durationMs / (1000 * 60));
      
      return {
        ...pause.toJSON(),
        currentDuration: currentDurationMinutes,
        isOvertime: pause.PauseType.maxDuration ? currentDurationMinutes > pause.PauseType.maxDuration : false
      };
    });
    
    res.status(200).json({ activePauses: pausesWithDuration });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pausas ativas', error: error.message });
  }
});

// Criar novo tipo de pausa
router.post('/pause-types', verifyToken, isSupervisor, async (req, res) => {
  try {
    const { name, description, maxDuration } = req.body;
    
    // Verificar se já existe um tipo de pausa com o mesmo nome
    const existingType = await PauseType.findOne({
      where: { name }
    });
    
    if (existingType) {
      return res.status(400).json({ message: 'Já existe um tipo de pausa com este nome' });
    }
    
    // Criar o tipo de pausa
    const pauseType = await PauseType.create({
      name,
      description,
      maxDuration,
      active: true
    });
    
    res.status(201).json({
      message: 'Tipo de pausa criado com sucesso',
      pauseType
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar tipo de pausa', error: error.message });
  }
});

// Obter relatório de pausas da equipe
router.get('/team-report', verifyToken, isSupervisor, async (req, res) => {
  try {
    const { startDate, endDate, pauseTypeId } = req.query;
    
    // Construir o objeto de filtro
    const where = {};
    
    // Adicionar filtros opcionais
    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.startTime = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.startTime = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    if (pauseTypeId) {
      where.pauseTypeId = pauseTypeId;
    }
    
    // Buscar todos os atendentes da equipe
    const teamMembers = await User.findAll({
      where: {
        teamId: req.user.teamId,
        role: 'atendente'
      },
      attributes: ['id']
    });
    
    const teamMemberIds = teamMembers.map(member => member.id);
    where.userId = { [Op.in]: teamMemberIds };
    
    // Buscar as pausas
    const pauseRecords = await PauseRecord.findAll({
      where,
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: PauseType, attributes: ['id', 'name'] }
      ],
      order: [['startTime', 'DESC']]
    });
    
    res.status(200).json({ pauseRecords });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar relatório', error: error.message });
  }
});

module.exports = router;
