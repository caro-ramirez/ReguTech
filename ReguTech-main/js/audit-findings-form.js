// js/audit-findings-form.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const findingsForm = document.getElementById('findings-form');
    const submitButton = document.getElementById('submit-button');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');
    const auditTitle = document.getElementById('audit-title');

    let planId = null;

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

        // Obtener el ID del Plan de Auditoría desde la URL
        const params = new URLSearchParams(window.location.search);
        planId = params.get('id');

        if (!planId) {
            showError('No se ha especificado un plan de auditoría.');
            if(submitButton) submitButton.disabled = true;
            return;
        }

        // Si todo está bien, carga los datos del plan
        fetchPlanDetails(planId);
    });

    // --- 2. LÓGICA DE CARGA DE DATOS (para el título) ---
    async function fetchPlanDetails(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/auditorias/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('No se pudo cargar la información de la auditoría.');
            }

            const plan = await response.json();
            
            // Formatear la fecha
            const fecha = new Date(plan.fecha_planificada).toLocaleDateString('es-ES', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            });

            // Actualizamos el título
            if(auditTitle) auditTitle.textContent = `Auditoría: ${plan.area_auditar} (${fecha})`;

        } catch (err) {
            console.error('Error:', err);
            showError(err.message);
        }
    }

    // --- 3. LÓGICA DE EVENTOS (SUBMIT Y LOGOUT) ---

    // Enviar Formulario
    if (findingsForm) {
        findingsForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            if (!planId) return;

            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            hideError();

            // 1. Recolectar los datos del formulario
            const tipo_hallazgo = document.getElementById('tipo-hallazgo').value;
            const descripcion = document.getElementById('descripcion-hallazgo').value;
            
            // Ignoramos 'evidencia' y 'area-responsable' como mencionamos

            if (!tipo_hallazgo || !descripcion) {
                showError('El Tipo y la Descripción son obligatorios.');
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar Hallazgo';
                return;
            }
            
            try {
                // 2. Enviar datos a la API (POST /api/auditorias/:id/hallazgos)
                const response = await fetch(`http://localhost:3000/api/auditorias/${planId}/hallazgos`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tipo_hallazgo,
                        descripcion
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'No se pudo guardar el hallazgo.');
                }

                // 3. ¡Éxito! Redirigir a la lista
                alert('¡Hallazgo guardado con éxito!');
                window.location.href = 'audit-list.html'; 

            } catch (err) {
                console.error('Error al guardar:', err);
                showError(err.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar Hallazgo';
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