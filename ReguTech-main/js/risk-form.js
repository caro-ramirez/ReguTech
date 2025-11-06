// js/risk-form.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const riskForm = document.getElementById('risk-form');
    const submitButton = document.getElementById('submit-button');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');
    const pageTitle = document.querySelector('h1'); // El <h1> del título

    // --- (NUEVO) Variables de estado ---
    let editMode = false;
    let riskId = null;

    // --- 1. VERIFICACIÓN DE SEGURIDAD Y CARGA DE DATOS ---
    document.addEventListener('DOMContentLoaded', () => {
        // Chequeo de Token
        if (!token) {
            console.log('No hay token. Redirigiendo a login...');
            window.location.href = 'index.html'; 
            return;
        }

        // Chequeo de Rol
        if (userRol !== 'Administrador' && userRol !== 'SuperAdmin') {
            console.warn('Acceso denegado. Se requiere rol de Admin.');
            alert('No tienes permiso para acceder a esta página.');
            window.location.href = 'dashboard.html';
            return;
        }

        // --- (NUEVO) Comprobar si estamos en modo EDICIÓN ---
        const params = new URLSearchParams(window.location.search);
        riskId = params.get('id');
        
        if (riskId) {
            editMode = true;
            // Cambiamos la UI para modo edición
            if(pageTitle) pageTitle.textContent = 'Editar Riesgo/Oportunidad';
            if(submitButton) submitButton.textContent = 'Actualizar';
            // Cargamos los datos del riesgo
            loadRiskData(riskId);
        } else {
            editMode = false;
            if(pageTitle) pageTitle.textContent = 'Registrar Nuevo Riesgo';
        }
    });

    // --- (NUEVO) Función para cargar datos en modo Edición ---
    async function loadRiskData(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/riesgos/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Riesgo no encontrado o no tienes permiso para verlo.');
                }
                throw new Error('No se pudieron cargar los datos del riesgo.');
            }

            const riesgo = await response.json();
            
            // Rellenamos el formulario
            document.getElementById('descripcion-riesgo').value = riesgo.descripcion;
            document.getElementById('probabilidad').value = riesgo.probabilidad;
            document.getElementById('impacto').value = riesgo.impacto;
            
            // Seleccionamos el radio button correcto
            const tipoRadio = document.querySelector(`input[name="tipo-riesgo"][value="${riesgo.tipo}"]`);
            if (tipoRadio) tipoRadio.checked = true;

        } catch (err) {
            console.error('Error al cargar riesgo:', err);
            showError(err.message);
            if(submitButton) submitButton.disabled = true; // Deshabilitar si no se pueden cargar datos
        }
    }


    // --- 2. LÓGICA DE EVENTOS (SUBMIT Y LOGOUT) ---

    // Enviar Formulario (AHORA ES DINÁMICO)
    if (riskForm) {
        riskForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            submitButton.disabled = true;
            submitButton.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${editMode ? 'Actualizando...' : 'Guardando...'}`;
            hideError();

            // 1. Recolectar datos (igual que antes)
            const descripcion = document.getElementById('descripcion-riesgo').value;
            const tipo = document.querySelector('input[name="tipo-riesgo"]:checked').value;
            const probabilidad = document.getElementById('probabilidad').value;
            const impacto = document.getElementById('impacto').value;

            if (!descripcion) {
                showError('La descripción es obligatoria.');
                submitButton.disabled = false;
                submitButton.textContent = editMode ? 'Actualizar' : 'Guardar';
                return;
            }
            
            // --- (NUEVO) Lógica de envío dinámica ---
            try {
                let url;
                let method;

                if (editMode) {
                    url = `http://localhost:3000/api/riesgos/${riskId}`;
                    method = 'PUT';
                } else {
                    url = 'http://localhost:3000/api/riesgos';
                    method = 'POST';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        descripcion,
                        tipo,
                        probabilidad,
                        impacto
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'No se pudo guardar el riesgo.');
                }

                alert(`¡Riesgo ${editMode ? 'actualizado' : 'guardado'} con éxito!`);
                window.location.href = 'risk.html'; // Redirigir a la lista

            } catch (err) {
                console.error('Error al guardar:', err);
                showError(err.message);
                submitButton.disabled = false;
                submitButton.textContent = editMode ? 'Actualizar' : 'Guardar';
            }
        });
    }

    // Botón de Cerrar Sesión (sin cambios)
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