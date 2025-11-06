// js/create-user.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const createClientForm = document.getElementById('create-client-form');
    const submitButton = document.getElementById('submit-button');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');

    // --- 1. VERIFICACIÓN DE SEGURIDAD ---
    document.addEventListener('DOMContentLoaded', () => {
        if (!token) {
            console.log('No hay token. Redirigiendo a login...');
            window.location.href = 'index.html'; 
            return;
        }

        // Esta página es SOLO para SuperAdmin
        if (userRol !== 'SuperAdmin') {
            console.warn('Acceso denegado. Se requiere rol de SuperAdmin.');
            alert('No tienes permiso para acceder a esta página.');
            window.location.href = 'dashboard.html';
            return;
        }
    });

    // --- 2. LÓGICA DE EVENTOS (SUBMIT Y LOGOUT) ---

    // Enviar Formulario
    if (createClientForm) {
        createClientForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando...';
            hideError();

            // 1. Recolectar los datos del formulario
            const clientName = document.getElementById('clientName').value;
            const userName = document.getElementById('adminName').value; // El backend espera 'userName'
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value; // El nuevo campo

            // Validación simple
            if (!clientName || !userName || !email || !password) {
                showError('Todos los campos son obligatorios.');
                submitButton.disabled = false;
                submitButton.textContent = 'Crear Cliente';
                return;
            }
            
            try {
                // 2. Enviar datos a la API (POST /api/create-admin-user)
                const response = await fetch('http://localhost:3000/api/create-admin-user', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`, // El token de SuperAdmin
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        clientName,
                        userName,
                        email,
                        password
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'No se pudo crear el cliente.');
                }

                // 3. ¡Éxito! Redirigir a la lista de clientes
                alert('¡Cliente y Administrador creados con éxito!');
                window.location.href = 'clients-list.html'; 

            } catch (err) {
                console.error('Error al crear cliente:', err);
                showError(err.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Crear Cliente';
            }
        });
    }

    // Botón de Cerrar Sesión
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            localStorage.clear();
            window.location.href = 'index.html'; 
        });
    }

    // --- Funciones Helper ---
    function showError(message) {
        if(errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
    }

    function hideError() {
        if(errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

})();