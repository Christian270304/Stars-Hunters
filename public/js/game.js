const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let colorNave = 'red';
// Variables del jugador actual
// Tamaño del canvas
const canvasWidth = 1000;
const canvasHeight = 550;

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

const estrellas = []; // Array vacío al inicio
const maxEstrellas = 10;
let intervalEstrellas; // Tiempo para que aparezca una nueva estrella (ms)
let despawnTime = 20000; // Tiempo para que una estrella desaparezca (ms)

const estrellaImg = new Image();
estrellaImg.src = '../public/images/estrella.svg';

function drawEstrellas() {
    // Limpia el canvas antes de dibujar    
    ctx.fillStyle = 'white';
    estrellas.forEach((estrella) => {
        ctx.drawImage(estrellaImg, estrella.x, estrella.y, 50, 50);
    });
}

// Genera una estrella cada cierto tiempo
function spawnStar() {
    // Si aún no alcanzamos el máximo, generamos una estrella
    if (estrellas.length < maxEstrellas) {
        const step = 30;
        const maxX =  Math.floor((canvas.width - 50) / step);
        const maxY = Math.floor((canvas.height - 50) / step);

        const x = Math.floor(Math.random() * (maxX + 1)) * step;
        const y = Math.floor(Math.random() * (maxY + 1)) * step;
        const estrella = { x, y };

        estrellas.push(estrella);

        // Configurar el "despawning" de la estrella después de 'despawnTime' milisegundos
        setTimeout(() => {
            const index = estrellas.indexOf(estrella);
            if (index !== -1) {
                estrellas.splice(index, 1);
            }
        }, despawnTime);
    }
    
    // Determinar el próximo intervalo en función de la cantidad de estrellas
    let nextInterval;
    if (estrellas.length < 2) {
        nextInterval = 500;  // Más rápido si no hay estrellas
    } else if (estrellas.length < 4) {
        nextInterval = 1000;
    } else if (estrellas.length < 6) {
        nextInterval = 3000;
    } else if(estrellas.length < 8) {
        nextInterval = 5000;  // Más lento si ya hay varias estrellas
    } else {
        nextInterval = 7000;
    }
    
    // Programar la siguiente generación con setTimeout
    setTimeout(spawnStar, nextInterval);
}

// Iniciar la generación de estrellas
spawnStar();

// Renderiza las estrellas continuamente
function animate() {
    drawEstrellas();
    requestAnimationFrame(animate);
}

animate();

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
        if (
            currentPlayer.x < estrella.x + 50 &&
            currentPlayer.x + playerSize > estrella.x &&
            currentPlayer.y < estrella.y + 50 &&
            currentPlayer.y + playerSize > estrella.y
          ) {
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
            temps = 0; 
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
    if (moving.up) currentPlayer.y = Math.max(0, currentPlayer.y - velocidad);
    if (moving.down) currentPlayer.y = Math.min(canvasHeight - playerSize, currentPlayer.y + velocidad);
    if (moving.left) currentPlayer.x = Math.max(0, currentPlayer.x - velocidad);
    if (moving.right) currentPlayer.x = Math.min(canvasWidth - playerSize, currentPlayer.x + velocidad);

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
