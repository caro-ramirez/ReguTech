// js/policy-detail.js

// Función anónima que se ejecuta al cargar la página (IIFE)
(function() {
    const token = localStorage.getItem('token');
    
    // Elementos del DOM
    const policyTitle = document.getElementById('policy-title');
    const policyContent = document.getElementById('policy-content');
    const confirmButton = document.getElementById('confirm-button');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');

    let policyId = null;

    // --- 1. VERIFICACIÓN DE SEGURIDAD Y OBTENCIÓN DE ID ---
    document.addEventListener('DOMContentLoaded', () => {
        if (!token) {
            console.log('No hay token. Redirigiendo a login...');
            window.location.href = 'index.html'; // O tu página de login
            return;
        }

        // Obtener el ID de la política desde la URL (ej: policy-detail.html?id=xxxxx)
        const params = new URLSearchParams(window.location.search);
        policyId = params.get('id');

        if (!policyId) {
            showError('No se ha especificado una política.');
            if(confirmButton) confirmButton.disabled = true;
            return;
        }

        // Si todo está bien, carga el contenido
        fetchPolicy(policyId);
    });

    // --- 2. LÓGICA DE CARGA DE DATOS ---
    async function fetchPolicy(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/policies/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.clear();
                    window.location.href = 'index.html'; // Token expirado o inválido
                }
                throw new Error('No se pudo cargar la política.');
            }

            const politica = await response.json();

            // Llenamos el HTML con los datos
            if(policyTitle) policyTitle.textContent = politica.nombre;
            if(policyContent) policyContent.innerHTML = politica.contenido; // Usamos .innerHTML si el contenido es HTML

        } catch (err) {
            console.error('Error:', err);
            showError(err.message);
        }
    }

    // --- 3. LÓGICA DE EVENTOS (BOTONES) ---

    // Botón de Confirmar Lectura
    if (confirmButton) {
        confirmButton.addEventListener('click', async () => {
            if (!policyId) return;

            try {
                confirmButton.disabled = true; // Deshabilitar para evitar doble clic
                confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Confirmando...';

                const response = await fetch(`http://localhost:3000/api/policies/${policyId}/confirm`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                    // No necesitamos body, el ID del usuario y de la política están en la URL y el token
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'No se pudo confirmar la lectura.');
                }

                // ¡Éxito!
                alert('¡Lectura confirmada con éxito!');
                window.location.href = 'dashboard.html'; // Devolver al dashboard

            } catch (err) {
                console.error('Error al confirmar:', err);
                showError(err.message);
                confirmButton.disabled = false;
                confirmButton.innerHTML = '<i class="fas fa-check-circle me-2"></i>He Leído y Confirmo';
            }
        });
    }

    // Botón de Cerrar Sesión (reutilizado del dashboard)
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            localStorage.clear();
            window.location.href = 'index.html'; 
        });
    }

    // Función helper para mostrar errores
    function showError(message) {
        if(errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
    }

})();