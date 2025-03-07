declare var io: any;

interface Player {
    id: string;
    x: number;
    y: number;
    angle: number;
    score: number;
    name: string;
}

interface Star {
    x: number;
    y: number;
}

interface GameConfig {
    width: number;
    height: number;
    estrellas: { [key: string]: Star };
}

interface HyperspeedStatus {
    status: 'active' | 'cooldown' | 'available';
}

const urlParams = new URLSearchParams(window.location.search);
const namespace = urlParams.get('namespace');
const socket = io(`http://localhost:3000${namespace}`, { transports: ['websocket'], upgrade: true });

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const instructionOverlay = document.getElementById('instructionOverlay') as HTMLElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const visualPlayerSize = 50;
const username = localStorage.getItem('username');

const estrellaImg = new Image();
estrellaImg.src = '../assets/estrella.svg';

const nauJugador = new Image();
nauJugador.src = '../assets/nau_azul.png';

const nauEnemic = new Image();
nauEnemic.src = '../assets/nauEnemiga.png';

const modal = document.getElementById('scoreModal') as HTMLElement;
const hypervelocidad = document.getElementById('hipervelocitat') as HTMLElement;

let moving: { up: boolean; down: boolean; left: boolean; right: boolean; angle: number; hypervelocidad: boolean } = {
    up: false,
    down: false,
    left: false,
    right: false,
    angle: 0,
    hypervelocidad: false,
};

let tabPressed = false;
let config: GameConfig = { width: 0, height: 0, estrellas: {} };
let Players: { [key: string]: Player } = {};
let estrellas: { [key: string]: Star } = {};
let currentPlayerId: string | undefined;
let gameStarted = false;


socket.on('connect', () => {
    console.log('Conectado al servidor');
    socket.emit('rol', 'Player', username);
});

socket.on('playerId', (id: string) => {
    currentPlayerId = id;
});

socket.on('gameState', (state: { players: { [key: string]: Player }; estrellas: { [key: string]: Star } }) => {
    updateScores(state.players);
    estrellas = state.estrellas;

    for (const id in state.players) {
        const serverPlayer = state.players[id];

        if (!Players[id]) {
            Players[id] = { ...serverPlayer };
        } else {
            const renderPlayer = Players[id];
            renderPlayer.x = serverPlayer.x;
            renderPlayer.y = serverPlayer.y;
            renderPlayer.angle = serverPlayer.angle;
        }
    }

    for (const id in Players) {
        if (!state.players[id]) {
        delete Players[id];  
        }
    }
});

socket.on('config', (configuracion: GameConfig) => {
    console.log('Configuración:', configuracion);
    config = configuracion;
    canvas.width = config.width;
    canvas.height = config.height;
});

socket.on('gameStart', () => {
    gameStarted = true;
    modal.classList.remove('active');
    gameLoop();
});

socket.on('gameStop', () => {
    gameStarted = false;
    modal.classList.add('active');
});

socket.on('gameOver', (state: { players: { [key: string]: Player } }) => {
    gameStarted = false;
    estrellas = {};
    updateScores(state.players, true);
    modal.classList.add('active');
});

socket.on('hyperspeedStatus', (data: HyperspeedStatus) => {
    if (data.status === 'active') {
        hypervelocidad.textContent = 'Hipervelocitat activa';
        hypervelocidad.style.color = 'green';
    } else if (data.status === 'cooldown') {
        hypervelocidad.textContent = 'Hipervelocitat en cooldown';
        hypervelocidad.style.color = 'red';
    } else if (data.status === 'available') {
        hypervelocidad.textContent = 'Hipervelocitat disponible';
        hypervelocidad.style.color = 'blue';
    }
});

// Escoltar els clics als botons de colors
document.querySelectorAll('#colores button').forEach((button) => {
    const btn = button as HTMLButtonElement;
    btn.addEventListener('click', () => {
        const color = btn.id;
        nauJugador.src = `../assets/nau_${color}.png`;
    });
});

// Quan s'ha carregat la pàgina
document.addEventListener('DOMContentLoaded', () => {
    instructionOverlay.classList.add('active');
});

/**
 * Tanca la superposició d'instruccions i inicia el bucle del joc.
 */
function closeInstructions() {
    instructionOverlay.classList.remove('active');
}

/**
 * Dibuixa el contingut del canvas, incloent les estrelles i els jugadors.
 * 
 * Aquesta funció esborra el canvas i després dibuixa les estrelles i els jugadors
 * en les seves posicions actuals. Els jugadors es dibuixen amb una imatge diferent
 * depenent de si són el jugador actual o un enemic.
 */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar estrellas
    for (const starId in estrellas) {
        const estrella = estrellas[starId];
        ctx.drawImage(estrellaImg, estrella.x, estrella.y, 50, 50);
    }

    // Dibujar jugadores interpolados
    for (const id in Players) {
        const player = Players[id];
        if (!player) continue;

        const playerImage = id === currentPlayerId ? nauJugador : nauEnemic;

        ctx.save();
        ctx.translate(player.x + visualPlayerSize / 2, player.y + visualPlayerSize / 2);
        ctx.rotate(player.angle);
        ctx.drawImage(playerImage, -visualPlayerSize / 2, -visualPlayerSize / 2, visualPlayerSize, visualPlayerSize);
        ctx.restore();
    }
}

// Events del teclat
document.addEventListener('keydown', (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') moving.up = true;
    if (key === 's' || key === 'arrowdown') moving.down = true;
    if (key === 'a' || key === 'arrowleft') moving.left = true;
    if (key === 'd' || key === 'arrowright') moving.right = true;
    if (key === 'h') moving.hypervelocidad = true;
    if (key === 'tab') {
        event.preventDefault();
        if (!tabPressed) {
            tabPressed = true;
            modal.classList.add('active');
        }
    }
});

document.addEventListener('keyup', (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') moving.up = false;
    if (key === 's' || key === 'arrowdown') moving.down = false;
    if (key === 'a' || key === 'arrowleft') moving.left = false;
    if (key === 'd' || key === 'arrowright') moving.right = false;
    if (key === 'h') moving.hypervelocidad = false;
    if (key === 'tab') {
        event.preventDefault();
        tabPressed = false;
        modal.classList.remove('active');
    }
});

/**
 * Calcula l'angle de moviment basat en les direccions de moviment.
 * Actualitza la propietat `angle` de l'objecte `moving` segons les direccions
 * (amunt, avall, esquerra, dreta) que estan actives.
 */
function calculateAngle() {
    if (moving.up && moving.left) {
        moving.angle = Math.PI * 1.75;
    } else if (moving.up && moving.right) {
        moving.angle = Math.PI / 4;
    } else if (moving.down && moving.left) {
        moving.angle = Math.PI * 1.25;
    } else if (moving.down && moving.right) {
        moving.angle = Math.PI * 0.75;
    } else if (moving.up) {
        moving.angle = 0;
    } else if (moving.down) {
        moving.angle = Math.PI;
    } else if (moving.left) {
        moving.angle = Math.PI * 1.5;
    } else if (moving.right) {
        moving.angle = Math.PI / 2;
    }
}

/**
 * Gestiona l'entrada de l'usuari per al jugador actual.
 * Si no hi ha cap jugador actual, la funció retorna sense fer res.
 * Calcula l'angle de moviment i emet l'estat de moviment.
 */
function handleInput() {
    if (!currentPlayerId) return;
    const player = Players[currentPlayerId];
    if (!player) return;

    calculateAngle();

    socket.emit('move', moving);
}

/**
 * Actualitza les puntuacions dels jugadors i mostra una animació de victòria.
 * 
 * @param {Object} players - Un objecte que conté els jugadors i les seves puntuacions.
 * @param {boolean} [showVictory=false] - Indica si s'ha de mostrar l'animació de victòria.
 */
function updateScores(players: { [key: string]: Player }, showVictory: boolean = false) {
    if (!currentPlayerId) return;
    const scoreboard = document.getElementById('scoreboard') as HTMLElement;
    const scoresList = document.getElementById('scoresList') as HTMLElement;
    const winnerNameDiv = document.getElementById('winnerName') as HTMLElement;
    const scoreModal = document.getElementById('scoreModal') as HTMLElement;

    scoreboard.innerHTML = players[currentPlayerId].score ? players[currentPlayerId].score.toString() : '0';

    const sortedPlayers = Object.values(players).sort((a, b) => (b.score || 0) - (a.score || 0));

    scoresList.innerHTML = sortedPlayers
        .map((player, index) => `
            <tr>
                <td>#${index + 1}</td>
                <td>${player.name || `${player.id.slice(0, 5)}`}</td>
                <td>${player.score || 0}</td>
            </tr>
        `).join('');

    if (showVictory && sortedPlayers.length > 0 && sortedPlayers[0].score > 0) {
        const winner = sortedPlayers[0];

        winnerNameDiv.textContent = `🎉 ¡${winner.name || 'Jugador'} GANA! 🎉`;
        winnerNameDiv.style.display = 'block';

        scoreModal.classList.add('active');

        startConfetti();

        setTimeout(() => {
            scoreModal.classList.remove('active');
            winnerNameDiv.style.display = 'none';
            stopConfetti();
        }, 4000);
    }
}

/**
 * Inicia l'animació de confeti a la pàgina.
 * Crea un contenidor de confeti i afegeix 100 elements de confeti amb estils i animacions aleatòries.
 */
function startConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.classList.add('confetti-container');
    document.body.appendChild(confettiContainer);

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

/**
 * Atura i elimina la confetti de la pàgina.
 * Cerca l'element amb la classe 'confetti-container' i, si existeix, el elimina del DOM.
 */
function stopConfetti() {
    const confettiContainer = document.querySelector('.confetti-container');
    if (confettiContainer) {
        confettiContainer.remove();
    }
}

/**
 * Bucle principal del joc que s'executa contínuament mentre el joc estigui en marxa.
 * Si el joc no ha començat, la funció retorna immediatament.
 * Gestiona l'entrada de l'usuari i dibuixa el contingut del joc.
 * Utilitza requestAnimationFrame per tornar a cridar-se a si mateixa i mantenir el bucle actiu.
 */
function gameLoop() {
    if (!gameStarted) return;
    handleInput();
    draw();
    requestAnimationFrame(gameLoop);
}
