// js/create-content.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const createContentForm = document.getElementById('create-content-form');
    const submitButton = document.getElementById('submit-button');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');

    // --- 1. VERIFICACIÓN DE SEGURIDAD ---
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
    });

    // --- 2. LÓGICA DE EVENTOS (SUBMIT Y LOGOUT) ---

    // Enviar Formulario
    if (createContentForm) {
        createContentForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            hideError();

            // 1. Recolectar los datos del formulario
            const nombre = document.getElementById('contentTitle').value;
            const tipo = document.getElementById('contentType').value;
            const contenido = document.getElementById('content').value;

            // Validación
            if (!nombre || !tipo) {
                showError('El Título y el Tipo de Contenido son obligatorios.');
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar Contenido';
                return;
            }

            let url = '';
            let body = {};

            // 2. Decidir a qué API llamar
            if (tipo === 'checklist') {
                url = 'http://localhost:3000/api/backoffice/checklists';
                body = { nombre: nombre, descripcion: contenido }; // Mapeamos 'content' a 'descripcion'
            } else if (tipo === 'politica') {
                url = 'http://localhost:3000/api/backoffice/politicas';
                body = { nombre: nombre, contenido: contenido }; // Mapeamos 'content' a 'contenido'
            } else {
                showError('Por favor, seleccione un tipo de contenido válido.');
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar Contenido';
                return;
            }
            
            try {
                // 3. Enviar datos a la API
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'No se pudo guardar el contenido.');
                }

                // 4. ¡Éxito! Redirigir a la lista de contenido
                alert('¡Contenido guardado con éxito!');
                window.location.href = 'content-management.html'; 

            } catch (err) {
                console.error('Error al guardar:', err);
                showError(err.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar Contenido';
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