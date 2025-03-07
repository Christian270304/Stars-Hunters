interface Server {
    name: string;
    namespace: string;
}

const messageElement = document.getElementById('message') as HTMLElement;

function showMessage(message: string, type: 'success' | 'error'): void {
    messageElement.textContent = message;
    messageElement.classList.remove('success', 'error'); 
    messageElement.classList.add(type); 

    messageElement.style.display = 'block';

    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}

async function createServer(): Promise<void> {
    const serverName = (document.getElementById('serverName') as HTMLInputElement).value;

    try {
        const response = await fetch('http://localhost:3000/servers/create', {
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
        } else {
            const errorData = await response.json();
            showMessage('Error creant el servidor: ' + errorData.message, 'error');
        }
    } catch (error) {
        console.log('Error creant el servidor: ' + error);
    }
}

async function loadServers(): Promise<void> {
    try {
        const response = await fetch('http://localhost:3000/servers/list', {
            credentials: 'include'
        });

        const servers: Server[] = await response.json();
        const serverList = document.getElementById('server-list') as HTMLElement;
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
    } catch (error) {
        console.log('Error loading servers: ' + error, 'error');
    }
}

function selectServer(namespace: string): void {
    console.log(`Conectando al servidor con namespace: ${namespace}`);
    showModal(namespace);
}

function showModal(namespace: string): void {
    const modal = document.getElementById('modal') as HTMLElement;
    modal.style.display = 'flex';

    // Manejar clic en el botón "Admin"
    const adminBtn = document.getElementById('adminBtn') as HTMLButtonElement;
    adminBtn.onclick = () => {
        window.location.href = `/admin.html?namespace=${namespace}`;
    };

    // Manejar clic en el botón "Jugar"
    const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
    playBtn.onclick = () => {
        window.location.href = `/game.html?namespace=${namespace}`;
    };
}

function closeModal(): void {
    const modal = document.getElementById('modal') as HTMLElement;
    modal.style.display = 'none';
}

window.onclick = (event: MouseEvent): void => {
    const modal = document.getElementById('modal') as HTMLElement;
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

setInterval(() => {
    loadServers();
}, 5000);

loadServers();

const serverNameInput = document.getElementById('serverName') as HTMLInputElement;
serverNameInput.addEventListener('keypress', (e: KeyboardEvent) => {
    if (e.key === 'Enter') createServer();
});
