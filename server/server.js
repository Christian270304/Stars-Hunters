import express from 'express';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';
import path from 'path';
import authRoutes from './routes/auth.js';
import serverRoutes from './routes/servers.js';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({path: path.resolve(__dirname, '../.env')});

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
const namespaces = {}; // Guardará los namespaces creados
const speed = 1.5;
const visualPlayerSize = 50;


export const createNamespace = (namespace) => {
    console.log(`Creando namespace: ${namespace}`); 
    if (!namespaces[namespace]) {
        namespaces[namespace] = { players: {}, config: {width: 640, height: 480, estrellas: 5, gameStarted: false, gameStop: false}, estrellas: {}, users: {} };
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
                
                    socket.emit('gameStart');
                
                
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
            // Guardar la configuración en el objeto namespace
            namespaces[namespace].config = {
                width: data.width,
                height: data.height,
                estrellas: data.estrellas
            }
    
            if (namespaces[namespace].config.gameStarted) {
                nsp.emit('config', namespaces[namespace].config);
            }
        });


        // server.js (dentro del evento 'startGame')
        socket.on("startGame", () => {
            const gameState = namespaces[namespace];
            
            if (!gameState.config.gameStarted) {
                // Resetear estado del juego
                gameState.config.gameStarted = true;
                gameState.config.gameStop = false;
                gameState.estrellas = {};

                // Generar todas las estrellas al inicio
                for (let i = 0; i < gameState.config.estrellas; i++) {
                    const estrella = generarEstrellaAleatoria(gameState);
                    gameState.estrellas[estrella.id] = estrella;
                }

                // Notificar a todos los clientes
                nsp.emit("gameStart");
                nsp.emit("gameState", gameState);
            }
        });

        socket.on("stopGame", () => {
            console.log('Juego detenido');
            // Detecar si el juego está en curso
            if (namespaces[namespace].config.gameStarted) {
                // Dejar de emitir el estado del juego
                //clearInterval(generateStarInterval);
                namespaces[namespace].config.gameStop = true;
            } else {
                nsp.emit('gameOver', namespaces[namespace]);
                // Borrar los puntos de los jugadores
                Object.values(gameState.players).forEach((p) => p.score = 0);
            }
            // Si el juego a acabo borrar todos los registros del namespcae
        });


        // Manejo de movimiento del jugador
        socket.on('move', (data) => {
            const player = namespaces[namespace].players[socket.id];
            if (!player) return;
        
            const newX = player.x + (data.right ? speed : 0) - (data.left ? speed : 0);
            const newY = player.y + (data.down ? speed : 0) - (data.up ? speed : 0);
        
            player.x = Math.max(0, Math.min(namespaces[namespace].config.width - visualPlayerSize, newX));
            player.y = Math.max(0, Math.min(namespaces[namespace].config.height - visualPlayerSize, newY));
            player.angle = data.angle;
        
            
            if (namespaces[namespace].config.gameStarted) {
                checkCollisions(nsp, namespace, socket.id);
                nsp.emit("gameState", namespaces[namespace]);
            }
        });
        

        // Recibir evento de eliminación de estrella
        // socket.on('removeEstrella', (estrella) => {
        //     // Eliminar la estrella del array en el gameState correspondiente
        //     const index = gameState.estrellas.findIndex(
        //         (e) => e.x === estrella.x && e.y === estrella.y
        //     );
        //     if (index !== -1) {
        //         gameState.estrellas.splice(index, 1); // Eliminar la estrella de la lista
        
        //         // Generar una nueva estrella en una posición aleatoria
        //         const nuevaEstrella = generarEstrellaAleatoria(gameState);  // Pasa gameState aquí
        //         gameState.estrellas.push(nuevaEstrella);  // Añadimos una nueva estrella
        //     }
        
        //     // Emitir el estado actualizado del juego solo al namespace actual
        //     // nsp.emit('gameState', {
        //     //     estrellas: gameState.estrellas,
        //     //     players: Object.fromEntries(gameState.players)
        //     // });
        // });

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


    // Emisión periódica del estado del juego a todos los jugadores (30Hz, 33ms)
    // server.js (dentro de createNamespace)
    setInterval(() => {
        nsp.emit("gameState", namespaces[namespace]); // Envía el estado actualizado
    }, 1000 / 30); // 30 veces por segundo
};

// Función para generar estrella con posición segura
function generarEstrellaAleatoria(namespaceData) {
    const id = Math.random().toString(36).substr(2, 9);
    let isValidPosition = false;
    let x, y;

    while (!isValidPosition) {
        x = Math.random() * (namespaceData.config.width - 50);
        y = Math.random() * (namespaceData.config.height - 50);
        
        // Verificar distancia con jugadores
        isValidPosition = true;
        for (const playerId in namespaceData.players) {
            const player = namespaceData.players[playerId];
            const distance = Math.hypot(player.x - x, player.y - y);
            if (distance < 100) { // 100px de distancia mínima
                isValidPosition = false;
                break;
            }
        }
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
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
