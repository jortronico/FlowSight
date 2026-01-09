const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener resumen general
router.get('/overview', dashboardController.getOverview);

// Obtener actividad reciente
router.get('/activity', dashboardController.getRecentActivity);

// Obtener salud del sistema
router.get('/health', dashboardController.getSystemHealth);

module.exports = router;

