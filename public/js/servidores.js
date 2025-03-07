const messageElement = document.getElementById('message');
// Funció per mostrar missatges
function showMessage(message, type) {
    messageElement.textContent = message;
    messageElement.classList.remove('success', 'error');
    messageElement.classList.add(type);
    messageElement.style.display = 'block';
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}
async function createServer() {
    const serverName = document.getElementById('serverName').value;
    try {
        const response = await fetch('https://stars-hunters-production.up.railway.app/servers/create', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: serverName })
        });
        if (response.ok) {
            showMessage('Servidor creat amb èxit', 'success');
            loadServers();
        }
        else {
            const errorData = await response.json();
            showMessage('Error creant el servidor: ' + errorData.message, 'error');
        }
    }
    catch (error) {
        console.log('Error creant el servidor: ' + error);
    }
}
async function loadServers() {
    try {
        const response = await fetch('https://stars-hunters-production.up.railway.app/servers/list', {
            credentials: 'include'
        });
        const servers = await response.json();
        const serverList = document.getElementById('server-list');
        serverList.innerHTML = '';
        servers.forEach((server) => {
            const serverCard = document.createElement('div');
            serverCard.className = 'server-card';
            serverCard.innerHTML = `
                <h3>${server.name}</h3>
                <p><span>12/50</span> jugadores en línea</p>
                <p>Ping promedio: <span>30ms</span></p>
                <button class="connect-button" onclick="selectServer('${server.namespace}')">Conectar</button>
            `;
            serverList.appendChild(serverCard);
        });
    }
    catch (error) {
        console.log('Error loading servers: ' + error, 'error');
    }
}
function selectServer(namespace) {
    console.log(`Conectando al servidor con namespace: ${namespace}`);
    showModal(namespace);
}
function showModal(namespace) {
    const modal = document.getElementById('modal');
    modal.style.display = 'flex';
    // Manejar clic en el botón "Admin"
    const adminBtn = document.getElementById('adminBtn');
    adminBtn.onclick = () => {
        window.location.href = `/admin.html?namespace=${namespace}`;
    };
    // Manejar clic en el botón "Jugar"
    const playBtn = document.getElementById('playBtn');
    playBtn.onclick = () => {
        window.location.href = `/game.html?namespace=${namespace}`;
    };
}
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}
window.onclick = (event) => {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};
setInterval(() => {
    loadServers();
}, 5000);
loadServers();
const serverNameInput = document.getElementById('serverName');
serverNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter')
        createServer();
});
//# sourceMappingURL=servidores.js.map