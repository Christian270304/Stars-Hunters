// Conexión al servidor
const urlParams = new URLSearchParams(window.location.search);
const namespace = urlParams.get('namespace');
const socket = io(`http://localhost:3000${namespace}`, { transports: ['websocket'], upgrade: true });
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const visualPlayerSize = 50;
const username = localStorage.getItem('username');

const modal = document.getElementById('scoreModal');
const closeModal = document.querySelector('.close');

let tabPressed = false;
let config = {};
let renderPlayers = {}; 
let estrellas = {};
let currentPlayerId;
let moving = { up: false, down: false, left: false, right: false, angle: 0 };
let lastUpdate = Date.now();

// Función de interpolación
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

socket.on('connect', () => {
    console.log('Conectado al servidor');
    socket.emit('rol', 'Player', username);
});

socket.on('playerId', (id) => {
    currentPlayerId = id;
});

socket.on('gameState', (state) => {
    updateScores(state.players);
    // Interpolar posiciones
    const now = Date.now();
    const dt = now - lastUpdate;
    lastUpdate = now;

    for (const id in state.players) {
        if (!renderPlayers[id]) {
            renderPlayers[id] = { ...state.players[id] };
        } else {
            const renderPlayer = renderPlayers[id];
            const serverPlayer = state.players[id];
            const t = Math.min(1, dt / 1000 * 60); // Factor de interpolación
            
            renderPlayer.x = lerp(renderPlayer.x, serverPlayer.x, t);
            renderPlayer.y = lerp(renderPlayer.y, serverPlayer.y, t);
            renderPlayer.angle = serverPlayer.angle;
        }
    }
    estrellas = state.estrellas;
});

socket.on('config', (configuracion) => {
    console.log('Configuración:', configuracion);
    config = {
        width: configuracion.width,
        height: configuracion.height,
        estrellas: configuracion.estrellas
    }
    document.getElementById('gameCanvas').width = config.width;
    document.getElementById('gameCanvas').height = config.height;
});

socket.on('gameOver', (state) => {
    updateScores(state.players, true);
    modal.classList.add('active');
});


function closeInstructions() {
    document.getElementById("instructionOverlay").classList.remove("active");
    gameLoop();
} 

socket.on('gameStart', () => {
    const instructionOverlay = document.getElementById('instructionOverlay');
    instructionOverlay.classList.add('active');
       

});

// Manejo de entrada mejorado
function handleInput() {
    const player = renderPlayers[currentPlayerId];
    if (!player) return;

    calculateAngle();
    
    // Emitir estado de movimiento a 60 FPS
    socket.emit('move', moving);
}

// Bucle de juego optimizado
function gameLoop() {
    handleInput();
    draw();
    requestAnimationFrame(gameLoop);
}
const estrellaImg = new Image();
estrellaImg.src = '../assets/estrella.svg';
const nauJugador = new Image();
nauJugador.src = '../assets/nau3_old.png'; // Verifica que la ruta sea correcta
const nauEnemic = new Image();
nauEnemic.src = '../assets/nauEnemiga.png'; // Verifica que la ruta sea correcta

// Función de dibujo actualizada
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar estrellas
    for (const starId in estrellas) {
        const estrella = estrellas[starId];
        ctx.drawImage(estrellaImg, estrella.x, estrella.y, 50, 50);
    }

    // Dibujar jugadores interpolados
    for (const id in renderPlayers) {
        const player = renderPlayers[id];
        if (!player) continue;

        const playerImage = id === currentPlayerId ? nauJugador : nauEnemic;
        
        ctx.save();
        ctx.translate(player.x + visualPlayerSize / 2, player.y + visualPlayerSize / 2);
        ctx.rotate(player.angle);
        ctx.drawImage(playerImage, -visualPlayerSize / 2, -visualPlayerSize / 2, visualPlayerSize, visualPlayerSize);
        ctx.restore();
    }
}

// Manejadores de teclado actualizados
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') moving.up = true;
    if (key === 's' || key === 'arrowdown') moving.down = true;
    if (key === 'a' || key === 'arrowleft') moving.left = true;
    if (key === 'd' || key === 'arrowright') moving.right = true;
    if (key === 'tab') {
        event.preventDefault();
        if (!tabPressed) {
            tabPressed = true;
            modal.classList.add('active');
        }
    }
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') moving.up = false;
    if (key === 's' || key === 'arrowdown') moving.down = false;
    if (key === 'a' || key === 'arrowleft') moving.left = false;
    if (key === 'd' || key === 'arrowright') moving.right = false;
    if (key === 'tab') { 
        event.preventDefault();
        tabPressed = false;
        modal.classList.remove('active');
      }
});

// Resto del código sin cambios...
// Función para calcular el ángulo según la dirección del movimiento
function calculateAngle() {
    if (moving.up && moving.left) {
        moving.angle = Math.PI * 1.75;
    } 
    else if (moving.up && moving.right) {
        moving.angle = Math.PI / 4;
    }
    else if (moving.down && moving.left) {
        moving.angle = Math.PI * 1.25;
    }
    else if (moving.down && moving.right) {
        moving.angle = Math.PI * 0.75;
    }
    else if (moving.up) {
        moving.angle = 0;
    }
    else if (moving.down) {
        moving.angle = Math.PI;
    }
    else if (moving.left) {
        moving.angle = Math.PI * 1.5;
    }
    else if (moving.right) {
        moving.angle = Math.PI / 2;
    }
}

function updateScores(players, showVictory = false) {
    const scoresList = document.getElementById('scoresList');
    const winnerNameDiv = document.getElementById('winnerName');
    const scoreModal = document.getElementById('scoreModal');

    // Ordenar jugadores por puntaje
    const sortedPlayers = Object.values(players).sort((a, b) => (b.score || 0) - (a.score || 0));

    // Generar el contenido de la tabla de puntuaciones
    scoresList.innerHTML = sortedPlayers
        .map((player, index) => `
            <tr>
                <td>#${index + 1}</td>
                <td>${player.name || `${player.id.slice(0, 5)}`}</td>
                <td>${player.score || 0}</td>
            </tr>
        `).join('');

    // Si se debe mostrar la animación de victoria
    if (showVictory && sortedPlayers.length > 0 && sortedPlayers[0].score > 0) {
        const winner = sortedPlayers[0]; // El jugador con más puntos

        // Mostrar el nombre del ganador
        winnerNameDiv.textContent = `🎉 ¡${winner.name || 'Jugador'} GANA! 🎉`;
        winnerNameDiv.style.display = 'block';

        // Mostrar el modal
        scoreModal.classList.add('active');

        // Iniciar la animación de confeti
        startConfetti();

        // Ocultar el modal después de 10 segundos
        setTimeout(() => {
            scoreModal.classList.remove('active');
            winnerNameDiv.style.display = 'none';
            stopConfetti();
        }, 10000);
    } 
}

// Función para iniciar la animación de confeti
function startConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.classList.add('confetti-container');
    document.body.appendChild(confettiContainer);

    // Crear elementos de confeti
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = `${Math.random() * 10 + 5}px`;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.top = `${Math.random() * 100}vh`;
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.animation = `fall ${Math.random() * 5 + 3}s linear infinite`;

        confettiContainer.appendChild(confetti);
    }
}

let hipervelocitat = false;
let powerupActive = false;
let interval = 1000;
let temps = 0;
let powerupDuration = 5000;
let velocidad = 1;

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


// Función para detener la animación de confeti
function stopConfetti() {
    const confettiContainer = document.querySelector('.confetti-container');
    if (confettiContainer) {
        confettiContainer.remove();
    }
}