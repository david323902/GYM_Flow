const express = require('express');
const router = express.Router();

// GET /api/usuarios - Obtener todos los usuarios (legacy)
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Lista de usuarios',
        data: [
            { id: 1, nombre: 'Usuario 1', email: 'usuario1@test.com' },
            { id: 2, nombre: 'Usuario 2', email: 'usuario2@test.com' }
        ]
    });
});

module.exports = router;
