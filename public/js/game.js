const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let colorNave = 'red';
// Variables del jugador actual
let currentPlayer = { x: 20, y: 20 };
console.log(players[socket.id]);
// Verificar si el jugador es nuevo
if (!players[socket.id]) {
    players[socket.id] = { x: currentPlayer.x, y: currentPlayer.y };
}

const estrellas = [{ x: 50, y: 50 }, { x: 100, y: 100 }, { x: 150, y: 150 }, { x: 110, y: 80 }, { x: 20, y: 500 }, { x: 230, y: 40 },{ x: 410, y: 120 }, { x: 130, y: 120 }]; // Array de estrellas

let selectColor = document.getElementById('color');
selectColor.addEventListener('change', () => {
    colorNave = selectColor.value;
});

function drawEstrellas() {
    ctx.fillStyle = 'white';
    estrellas.forEach((estrella) => {
        ctx.fillRect(estrella.x, estrella.y, 20, 20);
    });
}

// Dibujar todos los jugadores
function drawPlayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const id in players) {
        const player = players[id];
        ctx.fillStyle = id === socket.id ? colorNave : 'blue'; // Diferenciar al jugador actual
        ctx.fillRect(player.x, player.y, 20, 20);
    }
    // Verificar colisión con estrellas
    estrellas.forEach((estrella, index) => {
        if (currentPlayer.x === estrella.x && currentPlayer.y === estrella.y) {
            estrellas.splice(index, 1); // Eliminar estrella si hay colisión
        }
    });
}

// Mover al jugador actual con las teclas
document.addEventListener('keydown', (event) => {
    
    if (event.key === 'ArrowUp') currentPlayer.y -= 10;
    if (event.key === 'ArrowDown') currentPlayer.y += 10;
    if (event.key === 'ArrowLeft') currentPlayer.x -= 10;
    if (event.key === 'ArrowRight') currentPlayer.x += 10;

    // Actualizar posición local
    players[socket.id].x = currentPlayer.x;
    players[socket.id].y = currentPlayer.y;

    // Enviar movimiento al servidor
    socket.emit('move', currentPlayer);
});

// Loop para redibujar a los jugadores
setInterval(drawPlayers, 1000 / 60);
setInterval(drawEstrellas, 1000 / 60);