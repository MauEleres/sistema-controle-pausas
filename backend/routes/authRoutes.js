const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

// Rotas públicas
router.post('/login', authController.login);

// Rotas protegidas
router.post('/register', verifyToken, authController.register);
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
