const errorMessageElement = document.getElementById('error-message') as HTMLElement;
const toggleRegisterButton = document.getElementById('toggleRegister') as HTMLAnchorElement;
const toggleLoginButton = document.getElementById('toggleLogin') as HTMLAnchorElement;
const loginForm = document.getElementById('loginForm') as HTMLFormElement;
const registerForm = document.getElementById('registerForm') as HTMLFormElement;
const toggleMode = document.getElementById('toggleMode') as HTMLElement;
const backToLogin = document.getElementById('backToLogin') as HTMLElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const regUsernameInput = document.getElementById('regUsername') as HTMLInputElement;
const regPasswordInput = document.getElementById('regPassword') as HTMLInputElement;

// Funció per mostrar errors
function showError(message: string) {
    errorMessageElement.textContent = message;
    errorMessageElement.classList.add('visible');
}

toggleRegisterButton.addEventListener('click', (e: Event) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    toggleMode.style.display = 'none';
    backToLogin.style.display = 'block';
});

toggleLoginButton.addEventListener('click', (e: Event) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    toggleMode.style.display = 'block';
    backToLogin.style.display = 'none';
});

loginForm.addEventListener('submit', async (event: Event) => {
    event.preventDefault();
    
    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const response = await fetch('https://stars-hunters-production.up.railway.app/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            localStorage.setItem('username', username);
            window.location.href = './servidores.html';
        } else {
            showError('Error d\'inici de sessió: Nom d\'usuari o contrasenya incorrectes');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('S\'ha produït un error inesperat. Si us plau, torna-ho a intentar.');
    }
});

registerForm.addEventListener('submit', async (event: Event) => {
    event.preventDefault();
    
    const username = regUsernameInput.value;
    const password = regPasswordInput.value;

    try {
        const response = await fetch('https://stars-hunters-production.up.railway.app/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            localStorage.setItem('username', username);
            window.location.href = './servidores.html';
        } else {
            showError('Error de registre: Nom d\'usuari ja existent o entrada no vàlida');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('S\'ha produït un error inesperat. Si us plau, torna-ho a intentar.');
    }
});
