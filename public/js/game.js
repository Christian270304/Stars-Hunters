const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Tamaño del canvas y tamaño del jugador
const canvasWidth = 1285;
const canvasHeight = 550;
const playerSize = 20;
const visualPlayerSize = 50;

// Variables del jugador actual
// Tamaño del canvas
const canvasWidth = 1285;
const canvasHeight = 550;

// Tamaño del jugador
const playerSize = 20;
const visualPlayerSize = 50;
let moving = { up: false, down: false, left: false, right: false };

// Generar una posición aleatoria dentro del canvas, ajustada a coordenadas enteras
let currentPlayer = {
  x: Math.floor(Math.random() * (canvasWidth - playerSize)),  // Coordenada aleatoria en X
  y: Math.floor(Math.random() * (canvasHeight - playerSize))  // Coordenada aleatoria en Y
};

// Verificar si el jugador es nuevo
if (!players[socket.id]) {
    players[socket.id] = { x: currentPlayer.x, y: currentPlayer.y };
}

const estrellas = []; 
    x: Math.floor(Math.random() * (canvasWidth - playerSize)), 
    y: Math.floor(Math.random() * (canvasHeight - playerSize))
};

let moving = { up: false, down: false, left: false, right: false };
let colorNave = 'blue';
let players = {};

// Estrellas
let estrellas = [];
const maxEstrellas = 10;
let intervalEstrellas; 
let despawnTime = 20000; 

const estrellaImg = new Image();
estrellaImg.src = '../public/images/estrella.svg';

const despawnTime = 20000;
const estrellaImg = new Image();
estrellaImg.src = '../assets/estrella.svg';

// Dibujar las estrellas
function drawEstrellas() {
    // Limpia el canvas antes de dibujar    
    ctx.fillStyle = 'white';
    estrellas.forEach((estrella) => {
        estrellaImg.style.transform = 'rotate(90deg)';
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

const nauJugador = new Image();
nauJugador.src = '../public/images/nau3_old.png';

if(moving.down){

    nauJugador.style.transform('rotate(180deg)');
        ctx.drawImage(estrellaImg, estrella.x, estrella.y, 50, 50);
    });
}

// Detectar colisiones con estrellas
function checkCollisions() {
    for (let i = 0; i < estrellas.length; i++) {
        const estrella = estrellas[i];

        if (
            currentPlayer.x < estrella.x + 50 &&
            currentPlayer.x + playerSize > estrella.x &&
            currentPlayer.y < estrella.y + 50 &&
            currentPlayer.y + playerSize > estrella.y
        ) {
            estrellas.splice(i, 1); // Eliminar estrella del cliente
            let score = document.getElementById('scoreboard');
            score.innerText = parseInt(score.innerText) + 1; // Incrementar puntaje

            // Emitir evento al servidor para eliminar la estrella
            socket.emit('removeEstrella', estrella);
        }
    }
}

// Dibujar los jugadores
const nauJugador = new Image();
nauJugador.src = '../assets/nau3_old.png'; // Verifica que la ruta sea correcta

// Añadir la función onload para asegurarse de que la imagen se cargue antes de dibujar
nauJugador.onload = () => {
    update();  
};

nauJugador.onerror = () => {
    console.log("Error al cargar la imagen.");
};

// Función para dibujar los jugadores
function drawPlayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    

    let score = document.getElementById('scoreboard');
    drawEstrellas(); 

    for (const id in players) {
        const player = players[id];
        ctx.fillStyle = id === socket.id ? colorNave : 'blue'; // Diferenciar al jugador actual
        ctx.drawImage(nauJugador ,player.x, player.y, visualPlayerSize, visualPlayerSize);
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

        ctx.save(); 
        ctx.translate(player.x + visualPlayerSize / 2, player.y + visualPlayerSize / 2);
        ctx.rotate(player.rotation);
        ctx.drawImage(nauJugador, -visualPlayerSize / 2, -visualPlayerSize / 2, visualPlayerSize, visualPlayerSize);
        ctx.restore(); 
    }
}

// Mover al jugador
let velocidad = 1; // Velocidad normal del jugador
let hipervelocitat = false;
let temps = 0;
let interval = 1000;
let powerupDuration = 5000; // Duración del powerup en milisegundos
let powerupActive = false;

// Controlar hipervelocidad
setInterval(() => {
    if (!powerupActive && !hipervelocitat) {
        temps++;
        if (temps === 10) {
            hipervelocitat = true;
            temps = 0;
        }
    }
}, interval);

setInterval(() => {
    let div = document.getElementById('hipervelocitat');
    div.innerHTML = hipervelocitat ? "Hipervelocitat disponible" : "Hipervelocitat NO disponible";
}, 1);

// Habilitar hipervelocidad con la tecla 'h'
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

// Mover el jugador con las teclas
document.addEventListener('keydown', (event) => {

    if (event.key === 'ArrowUp') moving.up = true;
    if (event.key === 'ArrowDown') moving.down = true;
    if (event.key === 'ArrowLeft') moving.left = true;
    if (event.key === 'ArrowRight') moving.right = true;
    movePlayer();
});

document.addEventListener('keyup', (event) => {

    if (event.key === 'ArrowUp') moving.up = false;
    if (event.key === 'ArrowDown') moving.down = false;
    if (event.key === 'ArrowLeft') moving.left = false;
    if (event.key === 'ArrowRight') moving.right = false;
});

// Mover al jugador en el canvas
function movePlayer() {
    if (moving.up) {
        
        currentPlayer.y = Math.max(0, currentPlayer.y - velocidad);
        nauJugador.style.transform = 'rotate(0deg)';
    }
    
    if (moving.down) {
        
        currentPlayer.y = Math.min(canvasHeight - visualPlayerSize, currentPlayer.y + velocidad);
        nauJugador.style.transform = 'rotate(180deg)';
    }
    
    if (moving.left) {

        currentPlayer.x = Math.max(0, currentPlayer.x - velocidad);
        nauJugador.style.transform = 'rotate(270deg)';
    }

    if (moving.right) {

        currentPlayer.x = Math.min(canvasWidth - visualPlayerSize, currentPlayer.x + velocidad);
        nauJugador.style.transform = 'rotate(90deg)';
    }

    // Actualizar posición local
    players[socket.id].x = currentPlayer.x;
    players[socket.id].y = currentPlayer.y;

    // Enviar movimiento al servidor
    socket.emit('move', currentPlayer);
    if (moving.up || moving.down || moving.left || moving.right) {
        calculateAngle();  
        currentPlayer.rotation = angle;  
    }

    if (moving.up) currentPlayer.y = Math.max(0, currentPlayer.y - velocidad);
    if (moving.down) currentPlayer.y = Math.min(canvasHeight - visualPlayerSize, currentPlayer.y + velocidad);
    if (moving.left) currentPlayer.x = Math.max(0, currentPlayer.x - velocidad);
    if (moving.right) currentPlayer.x = Math.min(canvasWidth - visualPlayerSize, currentPlayer.x + velocidad);

    if (currentPlayer.id) {
        players[currentPlayer.id] = { 
            x: currentPlayer.x, 
            y: currentPlayer.y, 
            rotation: currentPlayer.rotation 
        };
        socket.emit('move', { x: currentPlayer.x, y: currentPlayer.y, rotation: currentPlayer.rotation });
    }
}



// Iniciar un intervalo para mover al jugador
setInterval(movePlayer, 1000 / 60);  // 60 veces por segundo (60 FPS)
// Loop para redibujar a los jugadores
setInterval(drawPlayers, 1000 / 60);
setInterval(drawEstrellas, 1000 / 60);

// Variables para almacenar el ángulo de rotación de la nave
let angle = 0;

// Función para calcular el ángulo según la dirección del movimiento
function calculateAngle() {
    if (moving.up && moving.left) {
        angle = Math.PI * 1.75;
    } 
    else if (moving.up && moving.right) {
        angle = Math.PI / 4;
    }
    else if (moving.down && moving.left) {
        angle = Math.PI * 1.25;
    }
    else if (moving.down && moving.right) {
        angle = Math.PI * 0.75;
    }
    else if (moving.up) {
        angle = 0;
    }
    else if (moving.down) {
        angle = Math.PI;
    }
    else if (moving.left) {
        angle = Math.PI * 1.5;
    }
    else if (moving.right) {
        angle = Math.PI / 2;
    }
}

// Actualizar el juego
function update() {
    movePlayer();
    checkCollisions();
    drawPlayers();
    requestAnimationFrame(update);
}