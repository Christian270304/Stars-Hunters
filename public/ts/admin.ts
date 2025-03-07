// Obtenir els paràmetres de la URL i configurar el socket
const urlParams = new URLSearchParams(window.location.search);
const namespace: string | null = urlParams.get("namespace");
const socket = (window as any).io(`https://stars-hunters-production.up.railway.app${namespace}`, {
  upgrade: true,
});

// Obtenir el canvas i els elements relacionats amb la interfície
const configButton = document.getElementById("configurar") as HTMLButtonElement;
const engegarButton = document.getElementById("encender") as HTMLButtonElement;
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const visualPlayerSize = 50;

const estrellaImg = new Image();
estrellaImg.src = "../assets/estrella.svg";
const nauJugador = new Image();
nauJugador.src = '../assets/nau_azul.png';

// Definir les interfícies per a la configuració del joc
interface Player {
  x: number;
  y: number;
  angle: number;
}

interface Star {
  x: number;
  y: number;
}

// Variables globals
let Players: Record<string, Player> = {};
let estrellas: Record<string, { x: number; y: number }> = {};
let config: { width?: number; height?: number } = {};

// Establir els esdeveniments de socket
socket.on("connect", () => {
  console.log("Conectado al servidor");
  socket.emit("rol", "Admin");
});

socket.on("adminExist", (message: string) => {
  alert(message);
  window.location.href = "/servidores.html";
});

// Capturar inicio de juego
socket.on("gameStart", () => {
  gameLoop();
});

socket.on("gameOver", () => {
  alert("Game Over");
  configButton.disabled = false;
  engegarButton.disabled = false;
  configButton.classList.remove("btn-disabled");
  configButton.classList.add("btn-config");
  engegarButton.innerHTML = "Encender";
  engegarButton.classList.remove("btn-apagar");
  engegarButton.classList.add("btn-encender");
  
});

socket.on('gameState', (state: { players: { [key: string]: Player }; estrellas: { [key: string]: Star } }) => {
  estrellas = state.estrellas;

  // Actualització directa sense interpolació
  for (const id in state.players) {
      const serverPlayer = state.players[id];

      if (!Players[id]) {
          // Crear nou jugador si no existeix
          Players[id] = { ...serverPlayer };
      } else {
          // Actualitzar posició i angle directament
          const renderPlayer = Players[id];
          renderPlayer.x = serverPlayer.x;
          renderPlayer.y = serverPlayer.y;
          renderPlayer.angle = serverPlayer.angle;
      }
  }

  // Eliminar jugadors que ja no existeixen al servidor
  for (const id in Players) {
    if (!state.players[id]) {
      delete Players[id];  // Eliminar jugador que no està al servidor
    }
  }
});

// Desactivar el botó d'engegar inicialment
engegarButton.disabled = true;
engegarButton.classList.add("btn-disabled");

// Afegir esdeveniment de clic al botó de configuració
configButton.addEventListener("click", function () {
  let isValid = true;

  const width = parseInt((document.getElementById("width") as HTMLInputElement).value,10);
  const height = parseInt((document.getElementById("height") as HTMLInputElement).value,10);
  const estrellasCount = parseInt((document.getElementById("estrellas") as HTMLInputElement).value,10);

  const canvasContainer = document.querySelector(".canvas-container") as HTMLElement;

  if (width >= 640 && width <= 1280) {
    canvas.width = width;
    canvasContainer.style.width = `${width}px`;
  } else {
    isValid = false;
    alert("El valor ha d'estar entre 640 i 1280");
  }

  if (height >= 480 && height <= 960) {
    canvas.height = height;
    canvasContainer.style.height = `${height}px`;
  } else {
    isValid = false;
    alert("El valor ha d'estar entre 480 i 960");
  }

  if (!(estrellasCount >= 5 && estrellasCount <= 10)) {
    alert("El valor ha d'estar entre 5 i 10");
  }

  if (isValid) {
    config.width = width;
    config.height = height;
    engegarButton.disabled = false;
    engegarButton.classList.remove("btn-disabled");
    engegarButton.classList.add("btn-encender");
    socket.emit("config", { width, height, estrellas: estrellasCount });
  }
});

// Afegir esdeveniment de clic al botó d'engegar
engegarButton.addEventListener("click", function () {
  if (engegarButton.innerHTML === "Encender") {
    socket.emit("startGame");
    configButton.disabled = true;
    configButton.classList.add("btn-disabled"); // Deshabilitar el botón de configurar
    engegarButton.innerHTML = "Apagar";
    engegarButton.classList.remove("btn-encender");
    engegarButton.classList.add("btn-apagar"); // Cambiar a color rojo
  } else {
    configButton.disabled = false;
    configButton.classList.remove("btn-disabled"); // Habilitar el botón de configurar
    configButton.classList.add("btn-config");
    engegarButton.innerHTML = "Encender";
    engegarButton.classList.remove("btn-apagar");
    engegarButton.classList.add("btn-encender"); // Volver al color verde
    socket.emit("stopGame");
  }
});

/**
 * Dibuixa el contingut del canvas, incloent les estrelles i els jugadors.
 * 
 * Aquesta funció esborra el canvas i després dibuixa les estrelles i els jugadors
 * en les seves posicions actuals. Els jugadors es dibuixen amb una imatge diferent
 * depenent de si són el jugador actual o un enemic.
 */
function draw() {
  ctx.clearRect(0, 0, config.width ?? canvas.width, config.height ?? canvas.height);

  for (const starId in estrellas) {
    const estrella = estrellas[starId];
    ctx.drawImage(estrellaImg, estrella.x, estrella.y, 50, 50);
  }

  for (const id in Players) {
    const player = Players[id];
    if (!player) continue;

    ctx.save();
    ctx.translate(player.x + visualPlayerSize / 2, player.y + visualPlayerSize / 2);
    ctx.rotate(player.angle);
    ctx.drawImage(nauJugador, -visualPlayerSize / 2, -visualPlayerSize / 2, visualPlayerSize, visualPlayerSize);
    ctx.restore();
  }
}

// Funció per al bucle del joc
function gameLoop() {
  draw();
  requestAnimationFrame(gameLoop);
}
