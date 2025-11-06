// js/respond-checklist.js

// Función anónima que se ejecuta al cargar la página (IIFE)
(function() {
    const token = localStorage.getItem('token');
    
    // Elementos del DOM
    const checklistTitle = document.getElementById('checklist-title');
    const checklistDescription = document.getElementById('checklist-description');
    const checklistContainer = document.getElementById('checklist-container');
    const checklistForm = document.getElementById('checklist-form');
    const submitButton = document.getElementById('submit-button');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');

    let checklistId = null;

    // --- 1. VERIFICACIÓN DE SEGURIDAD Y OBTENCIÓN DE ID ---
    document.addEventListener('DOMContentLoaded', () => {
        if (!token) {
            console.log('No hay token. Redirigiendo a login...');
            window.location.href = 'index.html'; 
            return;
        }

        // Obtener el ID del checklist desde la URL
        const params = new URLSearchParams(window.location.search);
        checklistId = params.get('id');

        if (!checklistId) {
            showError('No se ha especificado un checklist.');
            if(submitButton) submitButton.disabled = true;
            return;
        }

        fetchChecklist(checklistId);
    });

    // --- 2. LÓGICA DE CARGA DE DATOS ---
    async function fetchChecklist(id) {
        try {
            // Esta es la ruta GET /api/checklists/:id que modificamos
            const response = await fetch(`http://localhost:3000/api/checklists/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.clear();
                    window.location.href = 'index.html';
                }
                throw new Error('No se pudo cargar el checklist.');
            }

            const checklist = await response.json();

            // Llenamos el título y descripción
            if(checklistTitle) checklistTitle.textContent = checklist.nombre;
            if(checklistDescription) checklistDescription.textContent = checklist.descripcion;

            // Renderizamos las preguntas
            renderPreguntas(checklist.preguntas);

        } catch (err) {
            console.error('Error:', err);
            showError(err.message);
        }
    }

    // --- 3. FUNCIÓN PARA RENDERIZAR PREGUNTAS ---
    function renderPreguntas(preguntas) {
        if (!checklistContainer) return;
        
        checklistContainer.innerHTML = ''; // Limpiamos el spinner

        if (!preguntas || preguntas.length === 0) {
            checklistContainer.innerHTML = '<p>Este checklist no tiene preguntas.</p>';
            if(submitButton) submitButton.disabled = true;
            return;
        }

        preguntas.forEach((pregunta, index) => {
            const preguntaId = pregunta.id_pregunta;
            
            // Creamos el HTML para cada pregunta
            const preguntaDiv = document.createElement('div');
            preguntaDiv.className = 'mb-4 p-3 border rounded-3 bg-light';
            // Guardamos el ID de la pregunta en el dataset para encontrarlo luego
            preguntaDiv.dataset.preguntaId = preguntaId; 

            preguntaDiv.innerHTML = `
                <label class="form-label fw-bold">${index + 1}. ${pregunta.texto_pregunta}</label>
                <div class="my-2">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="opcion_${preguntaId}" id="opcion_${preguntaId}_cumple" value="Cumple" required>
                        <label class="form-check-label" for="opcion_${preguntaId}_cumple">Cumple</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="opcion_${preguntaId}" id="opcion_${preguntaId}_no_cumple" value="No Cumple">
                        <label class="form-check-label" for="opcion_${preguntaId}_no_cumple">No Cumple</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="opcion_${preguntaId}" id="opcion_${preguntaId}_parcial" value="Cumple Parcialmente">
                        <label class="form-check-label" for="opcion_${preguntaId}_parcial">Cumple Parcialmente</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="opcion_${preguntaId}" id="opcion_${preguntaId}_na" value="N/A">
                        <label class="form-check-label" for="opcion_${preguntaId}_na">N/A</label>
                    </div>
                </div>
                <div class="form-group">
                    <label for="obs_${preguntaId}" class="form-label small text-muted">Observaciones</label>
                    <textarea class="form-control" id="obs_${preguntaId}" rows="2"></textarea>
                </div>
            `;
            checklistContainer.appendChild(preguntaDiv);
        });
    }


    // --- 4. LÓGICA DE EVENTOS (SUBMIT Y LOGOUT) ---

    // Enviar Formulario
    if (checklistForm) {
        checklistForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evitamos que la página se recargue
            if (!checklistId) return;

            try {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';

                // Recolectamos las respuestas
                const respuestas = [];
                const preguntasDivs = checklistContainer.querySelectorAll('[data-pregunta-id]');

                for (const div of preguntasDivs) {
                    const id_pregunta = div.dataset.preguntaId;
                    const opcionSeleccionada = div.querySelector(`input[name="opcion_${id_pregunta}"]:checked`);
                    const observaciones = div.querySelector(`#obs_${id_pregunta}`).value;

                    if (!opcionSeleccionada) {
                        // Esta es una validación simple
                        throw new Error(`Por favor, responde la pregunta "${div.querySelector('label.fw-bold').textContent}"`);
                    }

                    respuestas.push({
                        id_pregunta: id_pregunta,
                        opcion_seleccionada: opcionSeleccionada.value,
                        observaciones: observaciones
                    });
                }
                
                // Enviamos el array de respuestas al backend
                const response = await fetch(`http://localhost:3000/api/checklists/${checklistId}/responder`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ respuestas: respuestas }) // El backend espera { "respuestas": [...] }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'No se pudieron guardar las respuestas.');
                }

                // ¡Éxito!
                alert('¡Checklist enviado con éxito!');
                window.location.href = 'dashboard.html'; // Devolver al dashboard

            } catch (err) {
                console.error('Error al enviar:', err);
                showError(err.message);
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Enviar Respuestas';
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

    // Función helper para mostrar errores
    function showError(message) {
        if(errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
    }

})();