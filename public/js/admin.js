const urlParams = new URLSearchParams(window.location.search);
const namespace = urlParams.get('namespace');
const socket = io(`http://localhost:3000${namespace}`, {  upgrade: true });

const configButton = document.getElementById('configurar');
const engegarButton = document.getElementById('encender');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const visualPlayerSize = 50;

let renderPlayers = {}; 
let estrellas = {};
let lastUpdate = Date.now();
let config = {};

socket.on('connect', () => {
    console.log('Conectado al servidor');
    socket.emit('rol', 'Admin');
});

socket.on('adminExist',(message) => {
    alert(message);
    // Redirigir a la página de servidores al usuario

    window.location.href = '/servidores.html';
});

socket.on('gameOver', (state) => {
    alert('Game Over');
    configButton.disabled = false;
    configButton.style.backgroundColor = '#FFA000';
    engegarButton.innerHTML = 'Encender';
    engegarButton.style.backgroundColor = '#FFA000';
    engegarButton.disabled = false;
});

socket.on('gameState', (state) => {
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

// Función de interpolación
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

engegarButton.disabled = true;
// Poner de color gris el boton
engegarButton.style.backgroundColor = '#ccc';


configButton.addEventListener('click', function() {
    let boolean = true;
    engegarButton.disabled = false;
    // Devolver el color original al boton
    engegarButton.style.backgroundColor = '#4CAF50';
    const width = parseInt(document.getElementById('width').value, 10);
    const height = parseInt(document.getElementById('height').value, 10);
    const estrellas = parseInt(document.getElementById('estrellas').value, 10);
    const canvas = document.getElementById('gameCanvas');
    const canvasContainer = document.querySelector('.canvas-container');
    const ctx = canvas.getContext('2d');

        // Guardar el contenido actual antes de cambiar el tamaño
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Ajustar el tamaño del contenedor
        if (width >= 640 && width <= 1280) {
            canvas.width = width;
            canvasContainer.style.width = `${width}px`;
        } else {
            boolean = false;
            alert('El valor debe estar entre 640 y 1280');
        }
        if ( height >= 480 && height <= 960) {
            canvas.height = height;
            canvasContainer.style.height = `${height}px`;
        } else {
            boolean = false;
            alert('El valor debe estar entre 480 y 960');
        }
        if (estrellas < 5 || estrellas > 10) {
            alert('El valor debe estar entre 5 y 10');
        } 
        if (boolean) {
            config.width = width;
            config.height = height;
            socket.emit('config', { width, height, estrellas });
        }
        // Restaurar el contenido del canvas
        ctx.putImageData(imageData, 0, 0);

        
        
});

engegarButton.addEventListener('click', function() {
    
    //engegarButton.innerHTML = engegarButton.innerHTML === 'Encender' ? 'Apagar' : 'Encender';
    engegarButton.innerHTML === 'Encender' ? engegarButton.style.backgroundColor = '#FFA000' : engegarButton.style.backgroundColor = '#FF0000';
    //engegarButton.innerHTML === 'Encender' ? engegarButton.disabled = false : engegarButton.disabled = true;
    if (engegarButton.innerHTML === 'Encender') {
        socket.emit('startGame');
        configButton.disabled = true;
        configButton.style.backgroundColor = '#ccc';
        engegarButton.innerHTML = 'Apagar';
        engegarButton.style.backgroundColor= '#f80000';
    } else {
        configButton.disabled = false;
        configButton.style.backgroundColor = '#FFA000';
        engegarButton.innerHTML = 'Encender';
        engegarButton.style.backgroundColor = '#4CAF50';
        socket.emit('stopGame');
    }
    
});


socket.on('gameStart', () => {
    gameLoop();
});

// Bucle de juego optimizado
function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

const estrellaImg = new Image();
estrellaImg.src = '../assets/estrella.svg';
const nauJugador = new Image();
nauJugador.src = '../assets/nau3_old.png';

// Función de dibujo actualizada
function draw() {
    ctx.clearRect(0, 0, config.width, config.height);

    // Dibujar estrellas
    for (const starId in estrellas) {
        const estrella = estrellas[starId];
        ctx.drawImage(estrellaImg, estrella.x, estrella.y, 50, 50);
    }

    // Dibujar jugadores interpolados
    for (const id in renderPlayers) {
        const player = renderPlayers[id];
        if (!player) continue;

        const playerImage = nauJugador;
        
        ctx.save();
        ctx.translate(player.x + visualPlayerSize / 2, player.y + visualPlayerSize / 2);
        ctx.rotate(player.angle);
        ctx.drawImage(playerImage, -visualPlayerSize / 2, -visualPlayerSize / 2, visualPlayerSize, visualPlayerSize);
        ctx.restore();
    }
}
