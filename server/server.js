const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const authController = require('./controllers/authController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use('/auth', authController);
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
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