// js/hallazgos-detalle.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const logoutButton = document.getElementById('logout-button');
    const pageTitle = document.getElementById('page-title');
    const findingsCountTitle = document.getElementById('findings-count-title');
    const hallazgosContainer = document.getElementById('hallazgos-container');

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

        const params = new URLSearchParams(window.location.search);
        planId = params.get('id');

        if (!planId) {
            hallazgosContainer.innerHTML = '<p class="text-center text-danger">No se ha especificado un plan de auditoría.</p>';
            return;
        }

        // Cargamos los datos del plan Y los hallazgos al mismo tiempo
        cargarDatos(planId);
    });

    // --- 2. LÓGICA DE CARGA DE DATOS (Título y Hallazgos) ---
    async function cargarDatos(id) {
        try {
            // Hacemos dos peticiones a la vez
            const [planRes, hallazgosRes] = await Promise.all([
                fetch(`http://localhost:3000/api/auditorias/${id}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:3000/api/auditorias/${id}/hallazgos`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!planRes.ok || !hallazgosRes.ok) {
                 if (planRes.status === 401 || hallazgosRes.status === 401) {
                    localStorage.clear();
                    window.location.href = 'index.html'; // Token expiró
                }
                throw new Error('No se pudieron cargar los datos de la auditoría.');
            }

            const plan = await planRes.json();
            const hallazgos = await hallazgosRes.json();

            // Actualizamos los títulos
            if (pageTitle) pageTitle.textContent = `Detalles de Hallazgos: ${plan.area_auditar}`;
            if (findingsCountTitle) findingsCountTitle.textContent = `Listado de Hallazgos (${hallazgos.length})`;

            // Renderizamos los hallazgos
            renderHallazgos(hallazgos);

        } catch (err) {
            console.error('Error:', err);
            hallazgosContainer.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    }

    // --- 3. FUNCIÓN PARA RENDERIZAR HALLAZGOS ---
    function renderHallazgos(hallazgos) {
        hallazgosContainer.innerHTML = ''; // Limpiamos el spinner

        if (hallazgos.length === 0) {
            hallazgosContainer.innerHTML = '<p class="text-center text-muted">No hay hallazgos registrados para este plan.</p>';
            return;
        }

        hallazgos.forEach(hallazgo => {
            const div = document.createElement('div');
            div.className = 'mb-4';
            
            const fecha = new Date(hallazgo.fecha_registro).toLocaleDateString('es-ES', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            });

            // --- CAMBIO: El botón ahora es "Crear Plan de Acción" y enlaza ---
            div.innerHTML = `
                <h4 class="text-primary-dark">(${hallazgo.tipo_hallazgo})</h4>
                <p class="text-muted">${hallazgo.descripcion}</p>
                <p><strong>Fecha Detectado:</strong> ${fecha}</p>
                <div class="d-flex justify-content-end">
                    <a href="action-plan-draft.html?hallazgo_id=${hallazgo.id_hallazgo}" class="btn btn-success btn-sm">
                        <i class="fas fa-plus me-1"></i> Crear Plan de Acción
                    </a>
                </div>
                <hr>
            `;
            hallazgosContainer.appendChild(div);
        });
    }

    // --- 4. LÓGICA DE LOGOUT ---
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            localStorage.clear();
            window.location.href = 'index.html'; 
        });
    }

})();