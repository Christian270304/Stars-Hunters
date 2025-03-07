import express from 'express';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';
import path from 'path';
import authRoutes from './routes/auth.js';
import serverRoutes from './routes/servers.js';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);
const io = new Server(server);
app.use(cors({
    origin: "*",
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.options('*', cors());

let pool;

// Conectar a la base de datos MySQL
async function connectToDatabase() {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            waitForConnections: true,
            connectionLimit: 10, // Ajusta este valor según tus necesidades
            queueLimit: 0
        });

        console.log('Conectado a la base de datos');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        process.exit(1); // Salir del proceso si no se puede conectar a la base de datos
    }
}

await connectToDatabase();
     
// Mildware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.use('/auth', authRoutes(pool));
app.use('/servers', serverRoutes(pool));


// Crear múltiples namespaces para diferentes instancias de juego
const namespaces = {}; 
const speed = 1.5;
const visualPlayerSize = 50;
const HYPERSPEED_COOLDOWN = 20000; 
const HYPERSPEED_MULTIPLIER = 2;
const HYPERSPEED_DURATION = 5000;


export const createNamespace = (namespace) => {
    console.log(`Creando namespace: ${namespace}`); 
    if (!namespaces[namespace]) {
        namespaces[namespace] = { players: {}, config: {width: 640, height: 480, estrellas: 5, Hyperspeed: false, speedCooldown: false, gameStarted: false, gameStop: false}, estrellas: {}, users: {} };
    }
    
    const nsp = io.of(namespace);

    nsp.on('connection', (socket) => {
        console.log(`Nuevo jugador conectado: ${socket.id}`);
        // Emitir al cliente su ID
        socket.emit('playerId', socket.id);
        
        socket.on('rol', (data, username) => {
            if (data === 'Player') {
                namespaces[namespace].players[socket.id] = {id: socket.id};
                namespaces[namespace].players[socket.id].name = username;
                
                namespaces[namespace].players[socket.id].x = Math.random() * namespaces[namespace].config.width;
                namespaces[namespace].players[socket.id].y = Math.random() * namespaces[namespace].config.height;
                
                socket.emit('config', namespaces[namespace].config);
                socket.emit('gameState', namespaces[namespace]);
                if (namespaces[namespace].config.gameStarted) {
                    socket.emit('gameStart');
                    socket.emit('hyperspeedStatus', { status: 'available' });
                }
                
            } else {
                if (namespaces[namespace].users && Object.values(namespaces[namespace].users).length > 0) {
                    socket.emit('adminExist', 'Ya hay un administrador conectado');
                } else {
                    namespaces[namespace].users[socket.id] = { rol: 'Admin' };
                    socket.emit('config', namespaces[namespace].config);
                }
            }
        });

        socket.on('config', (data) => {
            const config = namespaces[namespace].config;

             // Guardar la configuración en el objeto namespace
            config.width = data.width;
            config.height = data.height;
            config.estrellas = data.estrellas;
           
            if (!namespaces[namespace].config.gameStarted) {
                nsp.emit('config', namespaces[namespace].config);
            }
        });


        // server.js (dentro del evento 'startGame')
        socket.on("startGame", () => {
            namespaces[namespace].config.gameStop = false;
            
            // Solo resetear si es un nuevo juego (no una reanudación)
            if (!namespaces[namespace].config.gameStarted) {
                // Resetear puntos y estrellas solo al comenzar nuevo juego
                Object.values(namespaces[namespace].players).forEach(player => {
                    player.score = 0;
                });
                namespaces[namespace].estrellas = {};
            }
        
            namespaces[namespace].config.gameStarted = true;
            nsp.emit("gameStart");
            nsp.emit('hyperspeedStatus', { status: 'available' });
        
            // Generar estrellas solo si no existen
            if (Object.keys(namespaces[namespace].estrellas).length === 0) {
                let starsGenerated = 0;
                const generateStarInterval = setInterval(() => {
                    if (starsGenerated < namespaces[namespace].config.estrellas) {
                        const estrella = generarEstrellaAleatoria(namespaces[namespace]);
                        namespaces[namespace].estrellas[estrella.id] = estrella;
                        nsp.emit('gameState', namespaces[namespace]);
                        starsGenerated++;
                    } else {
                        clearInterval(generateStarInterval);
                    }
                }, 1500);
            }
        });

        socket.on("stopGame", () => {
            console.log('Juego detenido');
            // Detecar si el juego está en curso
            if (namespaces[namespace].config.gameStarted) {
                // Dejar de emitir el estado del juego
                //clearInterval(generateStarInterval);
                nsp.emit('gameStop');
                namespaces[namespace].config.gameStop = true;
            } else {
                nsp.emit('gameOver', namespaces[namespace]);
                namespaces[namespace].estrellas = {};
                namespaces[namespace].config.gameStarted = false;
                Object.values(namespaces[namespace].players).forEach((p) => p.score = 0);
            }
        });


        // Manejo de movimiento del jugador
        socket.on('move', (data) => {
            const player = namespaces[namespace].players[socket.id];
            if (!player) return;

            let hypervelocidad = 1;

            // Verificar si la hipervelocidad está activa
            if (player.Hyperspeed) {
                hypervelocidad = HYPERSPEED_MULTIPLIER;
            }

            // Verificar si la tecla de hipervelocidad está presionada y no está en cooldown
            if (data.hypervelocidad && !player.Hyperspeed && !player.speedCooldown) {
                player.Hyperspeed = true;
                hypervelocidad = HYPERSPEED_MULTIPLIER;

                // Notificar al cliente que la hipervelocidad está activa
                socket.emit('hyperspeedStatus', { status: 'active' });

                // Desactivar la hipervelocidad después de la duración
                setTimeout(() => {
                    player.Hyperspeed = false;
                    player.speedCooldown = true;

                    // Notificar al cliente que la hipervelocidad ha terminado y está en cooldown
                    socket.emit('hyperspeedStatus', { status: 'cooldown' });

                    // Activar el cooldown
                    setTimeout(() => {
                        player.speedCooldown = false;

                        // Notificar al cliente que la hipervelocidad está disponible nuevamente
                        socket.emit('hyperspeedStatus', { status: 'available' });
                    }, HYPERSPEED_COOLDOWN);
                }, HYPERSPEED_DURATION);
            }

            const newX = player.x + (data.right ? speed * hypervelocidad : 0) - (data.left ? speed * hypervelocidad : 0);
            const newY = player.y + (data.down ? speed * hypervelocidad : 0) - (data.up ? speed * hypervelocidad : 0);
        
            player.x = Math.max(0, Math.min(namespaces[namespace].config.width - visualPlayerSize, newX));
            player.y = Math.max(0, Math.min(namespaces[namespace].config.height - visualPlayerSize, newY));
            player.angle = data.angle;
        
            
            if (namespaces[namespace].config.gameStarted && !namespaces[namespace].config.gameStop) {
                checkCollisions(nsp, namespace, socket.id);
                nsp.emit("gameState", namespaces[namespace]);
            }
        });

        // Manejo de desconexión de jugador
        socket.on('disconnect', () => {
            console.log(`Jugador desconectado: ${socket.id}`);
            // Eliminar el jugador del Map
            delete namespaces[namespace].players[socket.id];
            // Si el administrador se desconecta, eliminarlo de la lista de usuarios
            if (namespaces[namespace].users[socket.id]) {
                delete namespaces[namespace].users[socket.id];
            }
            nsp.emit('gameState', namespaces[namespace]);
        });
    });
};

// Función para generar estrella con posición segura
function generarEstrellaAleatoria(namespaceData) {
    const id = Math.random().toString(36).substr(2, 9);
    const MAX_INTENTOS = 100;
    let isValidPosition = false;
    let x, y;
    let intentos = 0;
    
    while (!isValidPosition && intentos < MAX_INTENTOS) {
        intentos++;
        x = Math.random() * (namespaceData.config.width - 50);
        y = Math.random() * (namespaceData.config.height - 50);
        
        isValidPosition = true;

        // Verificar distancia con jugadores
        for (const playerId in namespaceData.players) {
            const player = namespaceData.players[playerId];
            const distance = Math.hypot(player.x - x, player.y - y);
            if (distance < 100) {
                isValidPosition = false;
                break;
            }
        }

        // Verificar distancia con otras estrellas
        if (isValidPosition) {
            for (const estrellaId in namespaceData.estrellas) {
                const estrella = namespaceData.estrellas[estrellaId];
                const distance = Math.hypot(estrella.x - x, estrella.y - y);
                if (distance < 50) { // 50px de distancia mínima entre estrellas
                    isValidPosition = false;
                    break;
                }
            }
        }
    }

    // Si no encontró posición válida, forzar una
    if (!isValidPosition) {
        x = Math.random() * (namespaceData.config.width - 50);
        y = Math.random() * (namespaceData.config.height - 50);
    }
    
    return { id, x, y };
}

// Función de detección de colisiones
function checkCollisions(nsp, namespace, playerId) {
    const gameState = namespaces[namespace];
    const player = gameState.players[playerId];
    
    if (!player) return;

    for (const starId of Object.keys(gameState.estrellas)) {
        const estrella = gameState.estrellas[starId];
        const distance = Math.hypot(
            player.x - estrella.x,
            player.y - estrella.y
        );

        if (distance < 30) { // Radio de colisión
            // Eliminar estrella
            delete gameState.estrellas[starId];
            
            // Generar nueva estrella
            const nuevaEstrella = generarEstrellaAleatoria(gameState);
            gameState.estrellas[nuevaEstrella.id] = nuevaEstrella;
            
            // Actualizar puntuación
            player.score = (player.score || 0) + 1;

            // Si el jugador alcanza 10 puntos, terminar el juego
            if (player.score >= gameState.config.estrellas) {
                gameState.config.gameStarted = false;
                nsp.emit('gameOver', gameState);
                
                return;
            }
            
            // Notificar al jugador
            nsp.to(playerId).emit('updateScore', player.score);
            
            // Actualizar estado del juego para todos
            nsp.emit('gameState', gameState);
            break;
        }
    }
}


// Iniciar el servidor después de conectar a la base de datos
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
