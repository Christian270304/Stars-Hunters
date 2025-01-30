// filepath: /c:/Users/crisg/OneDrive/Documentos/2DAW/Projecto/StarsHunters/server/controllers/authController.js
const express = require('express');
const router = express.Router();

// Ruta para el registro
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    // Lógica para registrar al usuario
    res.send('Usuario registrado');
});

// Ruta para el inicio de sesión
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Lógica para iniciar sesión
    res.send('Usuario logueado');
});

module.exports = router;