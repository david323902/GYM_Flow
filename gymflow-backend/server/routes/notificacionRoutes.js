const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificacionController');

router.post('/manual', controller.enviarNotificacionManual);
router.get('/verificar-config', controller.verificarConfig);
router.post('/reporte-cierre', controller.enviarReporteCierre);

module.exports = router;