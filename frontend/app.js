const API_URL = 'http://localhost:3000/api';

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');

// Manejo de Vistas
function mostrarDashboard() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    obtenerTareas();
}

function logout() {
    localStorage.removeItem('token');
    dashboardView.classList.add('hidden');
    loginView.classList.remove('hidden');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

// Registro
async function registrar() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if(!email || !password) return alert('Llena todos los campos');

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if(res.ok) alert('Registrado con éxito. Ahora dale a "Iniciar Sesión"');
        else alert(data.error || 'Error al registrar');
    } catch (error) { alert('Error de conexión con el servidor'); }
}

// Iniciar Sesión (Obtiene JWT)
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if(!email || !password) return alert('Llena todos los campos');

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if(data.token) {
            localStorage.setItem('token', data.token); // Guarda el JWT
            mostrarDashboard();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) { alert('Error de conexión con el servidor'); }
}

// CRUD: Crear Tarea
async function crearTarea() {
    const nombre = document.getElementById('nueva-tarea').value;
    if(!nombre) return alert('La tarea no puede estar vacía');

    await fetch(`${API_URL}/tareas`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Envía el JWT
        },
        body: JSON.stringify({ nombre })
    });
    document.getElementById('nueva-tarea').value = '';
    obtenerTareas();
}

// CRUD: Leer Tareas
async function obtenerTareas() {
    const res = await fetch(`${API_URL}/tareas`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const tareas = await res.json();
    const lista = document.getElementById('lista-tareas');
    lista.innerHTML = '';
    
    tareas.forEach(t => {
        lista.innerHTML += `
            <li>
                <span>${t.nombre}</span>
                <button onclick="eliminarTarea('${t._id}')">Borrar</button>
            </li>`;
    });
}

// CRUD: Eliminar Tarea
async function eliminarTarea(id) {
    await fetch(`${API_URL}/tareas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    obtenerTareas();
}

// Comprobar si ya hay sesión activa al recargar la página
if (localStorage.getItem('token')) {
    mostrarDashboard();
}