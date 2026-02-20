const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Servidor funcionando' });
});

app.get('/api/auth/test', (req, res) => {
    res.json({ message: 'Auth endpoint funcionando' });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor de prueba en http://localhost:${PORT}`);
});