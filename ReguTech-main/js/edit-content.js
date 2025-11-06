// js/edit-content.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const editContentForm = document.getElementById('edit-content-form');
    const submitButton = document.getElementById('submit-button');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');
    
    // Campos del formulario
    const contentTitle = document.getElementById('contentTitle');
    const contentType = document.getElementById('contentType');
    const content = document.getElementById('content');

    let contentId = null;
    let contentTypeValue = null;

    // --- 1. VERIFICACIÓN DE SEGURIDAD Y OBTENCIÓN DE ID/TIPO ---
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
        contentId = params.get('id');
        contentTypeValue = params.get('type'); // 'checklist' o 'politica'

        if (!contentId || !contentTypeValue) {
            showError('No se ha especificado un contenido válido.');
            if(submitButton) submitButton.disabled = true;
            return;
        }

        loadContentData(contentId, contentTypeValue);
    });

    // --- 2. LÓGICA DE CARGA DE DATOS ---
    async function loadContentData(id, type) {
        try {
            const response = await fetch(`http://localhost:3000/api/backoffice/${type}s/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('No se pudo cargar el contenido.');

            const data = await response.json();
            
            // Rellenamos el formulario
            contentTitle.value = data.nombre;
            contentType.value = type; // Asignamos el tipo (el campo está 'disabled' en el HTML)
            
            if (type === 'checklist') {
                content.value = data.descripcion; // El checklist usa 'descripcion'
            } else if (type === 'politica') {
                content.value = data.contenido; // La política usa 'contenido'
            }

        } catch (err) {
            console.error('Error:', err);
            showError(err.message);
            if(submitButton) submitButton.disabled = true;
        }
    }

    // --- 3. LÓGICA DE EVENTOS (SUBMIT Y LOGOUT) ---

    // Enviar Formulario
    if (editContentForm) {
        editContentForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            hideError();

            // 1. Recolectar los datos
            const nombre = contentTitle.value;
            const contenidoBody = content.value;
            
            let url = `http://localhost:3000/api/backoffice/${contentTypeValue}s/${contentId}`;
            let body = { nombre };

            // 2. Armar el body correcto según el tipo
            if (contentTypeValue === 'checklist') {
                body.descripcion = contenidoBody;
            } else if (contentTypeValue === 'politica') {
                body.contenido = contenidoBody;
            }
            
            try {
                // 3. Enviar datos a la API (PUT)
                const response = await fetch(url, {
                    method: 'PUT',
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

                // 4. ¡Éxito!
                alert('¡Contenido actualizado con éxito!');
                window.location.href = 'content-management.html'; 

            } catch (err) {
                console.error('Error al guardar:', err);
                showError(err.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar Cambios';
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