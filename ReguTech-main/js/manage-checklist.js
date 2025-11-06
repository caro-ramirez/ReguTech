// js/manage-checklists.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const logoutButton = document.getElementById('logout-button');
    const pageTitle = document.getElementById('page-title');
    const questionsTbody = document.getElementById('questions-tbody');
    
    // Elementos del Modal
    const createQuestionModalEl = document.getElementById('createQuestionModal');
    const createQuestionModal = new bootstrap.Modal(createQuestionModalEl);
    const createQuestionForm = document.getElementById('create-question-form');
    const saveQuestionButton = document.getElementById('save-question-button');
    const modalErrorMessage = document.getElementById('modal-error-message');
    const questionTextInput = document.getElementById('questionText');
    const isMandatoryInput = document.getElementById('isMandatory');

    let checklistId = null;

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
        checklistId = params.get('id');

        if (!checklistId) {
            pageTitle.textContent = "Error";
            questionsTbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">No se ha especificado un ID de checklist.</td></tr>`;
            return;
        }

        // Si todo está bien, cargamos los datos
        cargarDatos(checklistId);
    });

    // --- 2. LÓGICA DE CARGA DE DATOS (Título y Preguntas) ---
    async function cargarDatos(id) {
        try {
            // Hacemos dos peticiones a la vez
            const [checklistRes, preguntasRes] = await Promise.all([
                fetch(`http://localhost:3000/api/backoffice/checklists/${id}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:3000/api/backoffice/checklists/${id}/preguntas`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!checklistRes.ok || !preguntasRes.ok) {
                 if (checklistRes.status === 401) window.location.href = 'index.html';
                throw new Error('No se pudieron cargar los datos del checklist.');
            }

            const checklist = await checklistRes.json();
            const preguntas = await preguntasRes.json();

            if (pageTitle) pageTitle.textContent = `Gestionar Preguntas de: ${checklist.nombre}`;
            renderTabla(preguntas);

        } catch (err) {
            console.error('Error:', err);
            questionsTbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">${err.message}</td></tr>`;
        }
    }

    // --- 3. FUNCIÓN PARA RENDERIZAR LA TABLA ---
    function renderTabla(preguntas) {
        questionsTbody.innerHTML = ''; // Limpiamos el spinner

        if (preguntas.length === 0) {
            questionsTbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">Este checklist aún no tiene preguntas.</td></tr>`;
            return;
        }

        preguntas.forEach(pregunta => {
            const tr = document.createElement('tr');
            tr.id = `pregunta-row-${pregunta.id_pregunta}`;
            
            const obligatoriaBadge = pregunta.obligatoria
                ? '<i class="fas fa-check text-success-custom"></i> Sí'
                : '<i class="fas fa-times text-danger-custom"></i> No';

            tr.innerHTML = `
                <td>${pregunta.texto_pregunta}</td>
                <td>${obligatoriaBadge}</td>
                <td class="text-nowrap">
                    <button type="button" class="btn btn-outline-custom btn-sm rounded-pill me-2" disabled>
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button type="button" class="btn btn-danger-custom btn-sm rounded-pill delete-btn" data-question-id="${pregunta.id_pregunta}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            questionsTbody.appendChild(tr);
        });
        
        // Añadimos listeners a los nuevos botones de eliminar
        addDeleteListeners();
    }
    
    // --- 4. LÓGICA DEL MODAL (CREAR PREGUNTA) ---
    if (createQuestionForm) {
        createQuestionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            saveQuestionButton.disabled = true;
            saveQuestionButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            hideError();

            const data = {
                texto_pregunta: questionTextInput.value,
                obligatoria: isMandatoryInput.checked,
                orden: questionsTbody.rows.length + 1 // Asignamos un orden simple
            };

            try {
                const response = await fetch(`http://localhost:3000/api/backoffice/checklists/${checklistId}/preguntas`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'No se pudo guardar la pregunta.');
                }

                // Éxito
                createQuestionModal.hide(); // Ocultar modal de Bootstrap
                createQuestionForm.reset(); // Limpiar formulario
                cargarDatos(checklistId); // Recargar la tabla

            } catch (err) {
                console.error('Error al guardar:', err);
                showError(err.message);
            } finally {
                saveQuestionButton.disabled = false;
                saveQuestionButton.innerHTML = 'Guardar Pregunta';
            }
        });
    }

    // --- 5. LÓGICA PARA ELIMINAR PREGUNTA ---
    function addDeleteListeners() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const questionId = button.dataset.questionId;
                if (!confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) {
                    return;
                }

                try {
                    const response = await fetch(`http://localhost:3000/api/backoffice/preguntas/${questionId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.msg || 'No se pudo eliminar la pregunta.');
                    }
                    
                    // Éxito: eliminar la fila de la tabla
                    const rowToRemove = document.getElementById(`pregunta-row-${questionId}`);
                    if (rowToRemove) rowToRemove.remove();

                } catch (err) {
                    console.error('Error al eliminar:', err);
                    alert(`Error: ${err.message}`);
                }
            });
        });
    }

    // --- 6. LÓGICA DE LOGOUT ---
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            localStorage.clear();
            window.location.href = 'index.html'; 
        });
    }

    // --- Funciones Helper ---
    function showError(message) {
        if(modalErrorMessage) {
            modalErrorMessage.textContent = message;
            modalErrorMessage.style.display = 'block';
        }
    }
    function hideError() {
        if(modalErrorMessage) {
            modalErrorMessage.style.display = 'none';
        }
    }

})();