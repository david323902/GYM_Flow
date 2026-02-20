const express = require('express');
const router = express.Router();

// Legacy placeholder for notifications
router.get('/', (req, res) => {
    res.json({ success: true, message: 'Ruta de notifications funcionando (legacy)' });
});

module.exports = router;
