// js/edit-user.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const editUserForm = document.getElementById('edit-user-form');
    const submitButton = document.getElementById('submit-button');
    const logoutButton = document.getElementById('logout-button');
    const cancelButton = document.getElementById('cancel-button');
    const errorMessage = document.getElementById('error-message');
    
    // Campos del formulario
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userRoleInput = document.getElementById('userRole');
    const userStatusInput = document.getElementById('userStatus');

    let userId = null;

    // --- 1. VERIFICACIÓN DE SEGURIDAD Y OBTENCIÓN DE ID ---
    document.addEventListener('DOMContentLoaded', () => {
        if (!token) {
            window.location.href = 'index.html'; 
            return;
        }

        if (userRol !== 'SuperAdmin') {
            alert('No tienes permiso para acceder a esta página.');
            window.location.href = 'dashboard.html';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        userId = params.get('id');

        if (!userId) {
            showError('No se ha especificado un ID de usuario.');
            if(submitButton) submitButton.disabled = true;
            return;
        }

        // Si todo está bien, cargamos los datos del usuario
        cargarDatosUsuario(userId);
    });

    // --- 2. LÓGICA DE CARGA DE DATOS ---
    async function cargarDatosUsuario(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/backoffice/usuarios/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) window.location.href = 'index.html';
                throw new Error('No se pudieron cargar los datos del usuario.');
            }

            const usuario = await response.json();
            
            // Rellenamos el formulario
            if(userNameInput) userNameInput.value = usuario.nombre_completo;
            if(userEmailInput) userEmailInput.value = usuario.email;
            if(userRoleInput) userRoleInput.value = usuario.rol;
            if(userStatusInput) userStatusInput.value = usuario.estado_cuenta;

        } catch (err) {
            console.error('Error:', err);
            showError(err.message);
        }
    }

    // --- 3. LÓGICA DE EVENTOS (SUBMIT, CANCELAR, LOGOUT) ---

    // Enviar Formulario
    if (editUserForm) {
        editUserForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            hideError();

            // 1. Recolectar los datos
            const data = {
                nombre_completo: userNameInput.value,
                rol: userRoleInput.value,
                estado_cuenta: userStatusInput.value
                // No enviamos el email porque está deshabilitado
            };
            
            try {
                // 2. Enviar datos a la API (PUT /api/backoffice/usuarios/:id)
                const response = await fetch(`http://localhost:3000/api/backoffice/usuarios/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'No se pudo actualizar el usuario.');
                }

                // 3. ¡Éxito! Redirigir a la lista de usuarios
                alert('¡Usuario actualizado con éxito!');
                // Volvemos a la página anterior (la lista de usuarios de ese cliente)
                window.history.back(); 

            } catch (err) {
                console.error('Error al actualizar:', err);
                showError(err.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar Cambios';
            }
        });
    }

    // Botón de Cancelar
    if (cancelButton) {
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            // Simplemente vuelve a la página anterior
            window.history.back();
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