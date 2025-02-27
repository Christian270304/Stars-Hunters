const urlParams = new URLSearchParams(window.location.search);
const namespace = urlParams.get('namespace');
const socket = io(`http://localhost:3000${namespace}`, {  upgrade: true });

const configButton = document.getElementById('configurar');


socket.on('connect', () => {
    console.log('Conectado al servidor');
    socket.emit('rol', 'Admin');
});

configButton.addEventListener('click', function() {
    const width = parseInt(document.getElementById('width').value, 10);
    const height = parseInt(document.getElementById('height').value, 10);
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
            alert('El valor debe estar entre 640 y 1280');
        }
        if ( height >= 480 && height <= 960) {
            canvas.height = height;
            canvasContainer.style.height = `${height}px`;
        } else {
            alert('El valor debe estar entre 480 y 960');
        }
        // Restaurar el contenido del canvas
        ctx.putImageData(imageData, 0, 0);

        
        socket.emit('config', { width, height });
});

