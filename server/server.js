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

            config.width = data.width;
            config.height = data.height;
            config.estrellas = data.estrellas;
           
            if (!namespaces[namespace].config.gameStarted) {
                nsp.emit('config', namespaces[namespace].config);
            }
        });

        socket.on("startGame", () => {
            namespaces[namespace].config.gameStop = false;
            
            if (!namespaces[namespace].config.gameStarted) {
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
            if (namespaces[namespace].config.gameStarted) {
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

            if (player.Hyperspeed) {
                hypervelocidad = HYPERSPEED_MULTIPLIER;
            }

            if (data.hypervelocidad && !player.Hyperspeed && !player.speedCooldown) {
                player.Hyperspeed = true;
                hypervelocidad = HYPERSPEED_MULTIPLIER;

                socket.emit('hyperspeedStatus', { status: 'active' });

                setTimeout(() => {
                    player.Hyperspeed = false;
                    player.speedCooldown = true;

                    socket.emit('hyperspeedStatus', { status: 'cooldown' });

                    setTimeout(() => {
                        player.speedCooldown = false;

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
            delete namespaces[namespace].players[socket.id];

            if (namespaces[namespace].users[socket.id]) {
                delete namespaces[namespace].users[socket.id];
            }

            if (Object.keys(namespaces[namespace].players).length === 0 &&
                Object.keys(namespaces[namespace].users).length === 0) {
                
                delete namespaces[namespace];
                io._nsps.delete(namespace); 
        
                setTimeout(async() => {
                    try {
                        const connection = await pool.getConnection();
                        await connection.execute('DELETE FROM servers WHERE namespace = ?', [namespace]);
                        connection.release();
                        console.log(`Namespace ${namespace} eliminado de la base de datos`);
                    } catch (error) {
                        console.error(`Error al eliminar namespace de la base de datos:`, error);
                    }
                }, 1500);
            }

            nsp.emit('gameState', namespaces[namespace]);
        });
    });
};


/**
 * Genera una estrella en una posició aleatòria dins del joc, assegurant-se que no estigui massa a prop d'altres jugadors o estrelles.
 *
 * @param {Object} namespaceData - Les dades del namespace del joc.
 * @returns {Object} - Un objecte que representa la nova estrella amb un id únic i coordenades x i y.
 */
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

        // Verificar distància amb jugadors
        for (const playerId in namespaceData.players) {
            const player = namespaceData.players[playerId];
            const distance = Math.hypot(player.x - x, player.y - y);
            if (distance < 100) {
                isValidPosition = false;
                break;
            }
        }

        // Verificar distància amb altres estrelles
        if (isValidPosition) {
            for (const estrellaId in namespaceData.estrellas) {
                const estrella = namespaceData.estrellas[estrellaId];
                const distance = Math.hypot(estrella.x - x, estrella.y - y);
                if (distance < 50) { // 50px de distància mínima entre estrelles
                    isValidPosition = false;
                    break;
                }
            }
        }
    }

    if (!isValidPosition) {
        x = Math.random() * (namespaceData.config.width - 50);
        y = Math.random() * (namespaceData.config.height - 50);
    }
    
    return { id, x, y };
}


/**
 * Comprova les col·lisions entre un jugador i les estrelles.
 * Si un jugador col·lisiona amb una estrella, l'estrella es reemplaça per una nova estrella aleatòria,
 * s'incrementa la puntuació del jugador i s'actualitza l'estat del joc.
 * Si la puntuació del jugador arriba al límit configurat, el joc es dona per acabat.
 *
 * @param {Object} nsp - El namespace del joc.
 * @param {string} namespace - El nom de l'espai de noms del joc.
 * @param {string} playerId - L'identificador del jugador.
 */
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

        if (distance < 30) { 
            delete gameState.estrellas[starId];

            const nuevaEstrella = generarEstrellaAleatoria(gameState);
            gameState.estrellas[nuevaEstrella.id] = nuevaEstrella;

            player.score = (player.score || 0) + 1;

            if (player.score >= gameState.config.estrellas) {
                gameState.config.gameStarted = false;
                nsp.emit('gameOver', gameState);
                
                return;
            }

            nsp.to(playerId).emit('updateScore', player.score);

            nsp.emit('gameState', gameState);
            break;
        }
    }
}


// Iniciar el servidor después de conectar a la base de datos
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
