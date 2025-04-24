const express = require('express');
const router = express.Router();
const { verifyToken, isAtendente } = require('../middlewares/auth');
const { PauseRecord, PauseType, User } = require('../database/models');

// Obter todos os tipos de pausa ativos
router.get('/types', verifyToken, isAtendente, async (req, res) => {
  try {
    const pauseTypes = await PauseType.findAll({
      where: { active: true },
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({ pauseTypes });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar tipos de pausa', error: error.message });
  }
});

// Iniciar uma pausa
router.post('/start', verifyToken, isAtendente, async (req, res) => {
  try {
    const { pauseTypeId, notes } = req.body;
    
    // Verificar se o tipo de pausa existe
    const pauseType = await PauseType.findByPk(pauseTypeId);
    if (!pauseType || !pauseType.active) {
      return res.status(404).json({ message: 'Tipo de pausa não encontrado ou inativo' });
    }
    
    // Verificar se o usuário já tem uma pausa em andamento
    const activePause = await PauseRecord.findOne({
      where: {
        userId: req.user.id,
        status: 'em_andamento'
      }
    });
    
    if (activePause) {
      return res.status(400).json({ 
        message: 'Você já possui uma pausa em andamento',
        activePause
      });
    }
    
    // Criar o registro de pausa
    const pauseRecord = await PauseRecord.create({
      userId: req.user.id,
      pauseTypeId,
      startTime: new Date(),
      status: 'em_andamento',
      notes
    });
    
    res.status(201).json({
      message: 'Pausa iniciada com sucesso',
      pauseRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao iniciar pausa', error: error.message });
  }
});

// Finalizar uma pausa
router.post('/end/:id', verifyToken, isAtendente, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    // Buscar o registro de pausa
    const pauseRecord = await PauseRecord.findByPk(id);
    
    if (!pauseRecord) {
      return res.status(404).json({ message: 'Registro de pausa não encontrado' });
    }
    
    // Verificar se a pausa pertence ao usuário atual
    if (pauseRecord.userId !== req.user.id) {
      return res.status(403).json({ message: 'Você não tem permissão para finalizar esta pausa' });
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
      notes: notes ? (pauseRecord.notes ? `${pauseRecord.notes}\n${notes}` : notes) : pauseRecord.notes
    });
    
    res.status(200).json({
      message: 'Pausa finalizada com sucesso',
      pauseRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao finalizar pausa', error: error.message });
  }
});

// Obter histórico de pausas do usuário atual
router.get('/history', verifyToken, isAtendente, async (req, res) => {
  try {
    const { startDate, endDate, pauseTypeId, status } = req.query;
    
    // Construir o objeto de filtro
    const where = { userId: req.user.id };
    
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
    
    if (status) {
      where.status = status;
    }
    
    // Buscar o histórico de pausas
    const pauseHistory = await PauseRecord.findAll({
      where,
      include: [
        { model: PauseType, attributes: ['id', 'name', 'description'] }
      ],
      order: [['startTime', 'DESC']]
    });
    
    res.status(200).json({ pauseHistory });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar histórico de pausas', error: error.message });
  }
});

module.exports = router;
