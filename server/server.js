const express = require('express');
const path = require('path');
const authController = require('../server/controllers/authController.js'); // Ruta relativa desde la raíz

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Ruta de archivos estáticos (Public/)
app.use(express.static(path.join(__dirname, '../public'))); 

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/game.html'));
});


const PORT = 3000;

const players = {};

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Manejo de conexiones de WebSocket
io.on('connection', (socket) => {
    console.log('Nuevo jugador conectado:', socket.id);

    players[socket.id] = { x: Math.random() * 800, y: Math.random() * 600, id: socket.id };

    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('estrella', (data) => {
        
        console.log(`Mensaje recibido: ${data}`);
        socket.emit('respuesta', 'Mensaje recibido en el servidor');
    });

    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);
        delete players[socket.id];
        socket.broadcast.emit('playerDisconnected', socket.id);
    });
});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost/Stars-Hunters/public/game.html`);
});