const socket = io('http://localhost:3000');
const players = {}; // Objeto para almacenar los jugadores en el cliente

// Al recibir el estado inicial de todos los jugadores
socket.on('currentPlayers', (serverPlayers) => {
    for (const id in serverPlayers) {
        players[id] = serverPlayers[id];
    }
});

// Cuando un nuevo jugador se conecta
socket.on('newPlayer', (newPlayer) => {
    players[newPlayer.id] = newPlayer;
});

// Cuando un jugador se mueve
socket.on('playerMoved', (player) => {
    if (players[player.id]) {
        players[player.id].x = player.x;
        players[player.id].y = player.y;
    }
});

// Cuando un jugador se desconecta
socket.on('playerDisconnected', (id) => {
    delete players[id];
});