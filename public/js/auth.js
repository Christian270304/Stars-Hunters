const errorMessageElement = document.getElementById('error-message');
const toggleRegisterButton = document.getElementById('toggleRegister');
const toggleLoginButton = document.getElementById('toggleLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const toggleMode = document.getElementById('toggleMode');
const backToLogin = document.getElementById('backToLogin');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const regUsernameInput = document.getElementById('regUsername');
const regPasswordInput = document.getElementById('regPassword');
function showError(message) {
    errorMessageElement.textContent = message;
    errorMessageElement.classList.add('visible');
}
toggleRegisterButton.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    toggleMode.style.display = 'none';
    backToLogin.style.display = 'block';
});
toggleLoginButton.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    toggleMode.style.display = 'block';
    backToLogin.style.display = 'none';
});
loginForm.addEventListener('submit', async (event) => {
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
        }
        else {
            showError('Error d\'inici de sessió: Nom d\'usuari o contrasenya incorrectes');
        }
    }
    catch (error) {
        console.error('Error:', error);
        showError('S\'ha produït un error inesperat. Si us plau, torna-ho a intentar.');
    }
});
registerForm.addEventListener('submit', async (event) => {
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
        }
        else {
            showError('Error de registre: Nom d\'usuari ja existent o entrada no vàlida');
        }
    }
    catch (error) {
        console.error('Error:', error);
        showError('S\'ha produït un error inesperat. Si us plau, torna-ho a intentar.');
    }
});
//# sourceMappingURL=auth.js.map