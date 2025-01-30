const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let colorNave = 'red';
// Variables del jugador actual
// Tamaño del canvas
const canvasWidth = 900;
const canvasHeight = 500;

// Tamaño del jugador
const playerSize = 20;

// Generar una posición aleatoria dentro del canvas, ajustada a coordenadas enteras
let currentPlayer = {
  x: Math.floor(Math.random() * (canvasWidth - playerSize)),  // Coordenada aleatoria en X
  y: Math.floor(Math.random() * (canvasHeight - playerSize))  // Coordenada aleatoria en Y
};

// Verificar si el jugador es nuevo
if (!players[socket.id]) {
    players[socket.id] = { x: currentPlayer.x, y: currentPlayer.y };
}

const estrellas = []; // Array de estrellas
const maxEstrellas = 10;
for (let i = 0; i < maxEstrellas; i++) {
    const x = Math.floor(Math.random() * (canvas.width / 20)) * 20;
    const y = Math.floor(Math.random() * (canvas.height / 20)) * 20;
    estrellas.push({ x, y });
}

/*let selectColor = document.getElementById('color');
selectColor.addEventListener('change', () => {
    colorNave = selectColor.value;
});*/

function drawEstrellas() {
    ctx.fillStyle = 'white';
    estrellas.forEach((estrella) => {
        ctx.fillRect(estrella.x, estrella.y, 20, 20);
    });
}

// Dibujar todos los jugadores
function drawPlayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let score = document.getElementById('scoreboard');
    for (const id in players) {
        const player = players[id];
        ctx.fillStyle = id === socket.id ? colorNave : 'blue'; // Diferenciar al jugador actual
        ctx.fillRect(player.x, player.y, 20, 20);
    }
    // Verificar colisión con estrellas
    estrellas.forEach((estrella, index) => {
        if (currentPlayer.x === estrella.x && currentPlayer.y === estrella.y) {
            estrellas.splice(index, 1); // Eliminar estrella si hay colisión
            score.innerText = parseInt(score.innerText) + 1; // Incrementar el puntaje
        }
    });
}

// Mover al jugador actual con las teclas
// Velocidad de movimiento (en píxeles por intervalo)
let velocidad = 1;  // Velocidad normal del jugador
let hipervelocitat = false;
let temps = 0;
let interval = 1000;
let powerupDuration = 5000; // Duración del powerup en milisegundos
let powerupActive = false;

// Variables para controlar el movimiento
let moving = { up: false, down: false, left: false, right: false };

// Iniciar un intervalo de 1 segundo
setInterval(() => {
    if (!powerupActive && !hipervelocitat) { // Solo contar si no hay hipervelocidad activa
        ++temps;
        if (temps === 10) {
            hipervelocitat = true;
            temps = 0; // Reiniciar el contador solo cuando se activa la hipervelocidad

        }
    }

    
    
}, interval);

setInterval(() => {
    
    let div = document.getElementById('hipervelocitat');
    div.innerHTML = hipervelocitat ? "Hipervelocitat disponible" : "Hipervelocitat NO disponible";
}, 1);



document.addEventListener('keydown', (event) => {
    if (event.key === 'h' && hipervelocitat) {
        hipervelocitat = false;
        powerupActive = true;
        velocidad = 5;

        setTimeout(() => {
            powerupActive = false;
            velocidad = 1;
            temps = 0; // 🔥 Reiniciar el contador cuando se usa la hipervelocidad
        }, powerupDuration);
    }
});


// Detectar cuando se presionan las teclas
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') moving.up = true;
    if (event.key === 'ArrowDown') moving.down = true;
    if (event.key === 'ArrowLeft') moving.left = true;
    if (event.key === 'ArrowRight') moving.right = true;
});

// Detectar cuando se sueltan las teclas
document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowUp') moving.up = false;
    if (event.key === 'ArrowDown') moving.down = false;
    if (event.key === 'ArrowLeft') moving.left = false;
    if (event.key === 'ArrowRight') moving.right = false;
});

// Función para mover al jugador a intervalos
function movePlayer() {
    if (moving.up) currentPlayer.y -= velocidad;
    if (moving.down) currentPlayer.y += velocidad;
    if (moving.left) currentPlayer.x -= velocidad;
    if (moving.right) currentPlayer.x += velocidad;

    // Actualizar posición local
    players[socket.id].x = currentPlayer.x;
    players[socket.id].y = currentPlayer.y;

    // Enviar movimiento al servidor
    socket.emit('move', currentPlayer);
}

// Iniciar un intervalo para mover al jugador
setInterval(movePlayer, 1000 / 60);  // 60 veces por segundo (60 FPS)


// Loop para redibujar a los jugadores
setInterval(drawPlayers, 1000 / 60);
setInterval(drawEstrellas, 1000 / 60);
