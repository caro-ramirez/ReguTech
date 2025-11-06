// js/action-plan-draft.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const logoutButton = document.getElementById('logout-button');
    const actionPlanForm = document.getElementById('action-plan-form');
    const submitButton = document.getElementById('submit-button');
    const errorMessage = document.getElementById('error-message');
    
    // Campos del formulario
    const hallazgoIdInput = document.getElementById('hallazgo-id-input');
    const hallazgoDescripcion = document.getElementById('hallazgo-descripcion');

    let hallazgoId = null;

    // --- 1. VERIFICACIÓN DE SEGURIDAD Y OBTENCIÓN DE ID ---
    document.addEventListener('DOMContentLoaded', () => {
        if (!token) {
            window.location.href = 'index.html'; 
            return;
        }

        if (userRol !== 'Administrador' && userRol !== 'SuperAdmin') {
            alert('No tienes permiso para acceder a esta página.');
            window.location.href = 'dashboard.html';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        hallazgoId = params.get('hallazgo_id');

        if (!hallazgoId) {
            showError('No se ha especificado un hallazgo. Vuelva a la lista de hallazgos.');
            if(submitButton) submitButton.disabled = true;
            return;
        }

        // Si hay ID, lo guardamos y cargamos los datos del hallazgo
        hallazgoIdInput.value = hallazgoId;
        fetchHallazgoDetails(hallazgoId);
    });

    // --- 2. LÓGICA DE CARGA DE DATOS (para pre-rellenar) ---
    async function fetchHallazgoDetails(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/auditorias/hallazgos/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('No se pudo cargar la información del hallazgo.');
            }

            const hallazgo = await response.json();
            
            // Actualizamos el campo de texto del hallazgo
            if (hallazgoDescripcion) {
                hallazgoDescripcion.value = `(${hallazgo.tipo_hallazgo}) ${hallazgo.descripcion}`;
            }

        } catch (err) {
            console.error('Error:', err);
            showError(err.message);
        }
    }

    // --- 3. LÓGICA DE EVENTOS (SUBMIT Y LOGOUT) ---

    // Enviar Formulario
    if (actionPlanForm) {
        actionPlanForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            hideError();

            // 1. Recolectar los datos del formulario
            const planData = {
                id_hallazgo: hallazgoId,
                area_afectada: document.getElementById('area-afectada').value,
                accion_propuesta: document.getElementById('accion-propuesta').value,
                responsable_asignado: document.getElementById('responsable-asignado').value,
                fecha_limite: document.getElementById('fecha-limite').value,
                descripcion_detallada: document.getElementById('descripcion-detallada').value
            };
            
            try {
                // 2. Enviar datos a la API (POST /api/planes)
                const response = await fetch('http://localhost:3000/api/planes', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(planData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'No se pudo guardar el plan de acción.');
                }

                // 3. ¡Éxito! Redirigir a la lista de auditorías
                alert('¡Plan de Acción guardado con éxito!');
                window.location.href = 'audit-list.html'; 

            } catch (err) {
                console.error('Error al guardar:', err);
                showError(err.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar Plan de Acción';
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