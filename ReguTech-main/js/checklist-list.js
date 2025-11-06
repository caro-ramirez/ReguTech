// js/checklist-list.js

(function() {
    const token = localStorage.getItem('token');
    
    // Elementos del DOM
    const logoutButton = document.getElementById('logout-button');
    const checklistsTbody = document.getElementById('checklists-tbody');

    // --- 1. VERIFICACIÓN DE SEGURIDAD ---
    document.addEventListener('DOMContentLoaded', () => {
        if (!token) {
            window.location.href = 'index.html'; 
            return;
        }
        
        // Esta página la puede ver cualquier rol
        cargarChecklists();
    });

    // --- 2. LÓGICA DE CARGA DE DATOS ---
    async function cargarChecklists() {
        if (!checklistsTbody) return;

        try {
            // Llamamos a la nueva ruta del backend
            const response = await fetch('http://localhost:3000/api/checklists/status', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.clear();
                    window.location.href = 'index.html';
                }
                throw new Error('Error al cargar los checklists.');
            }

            const checklists = await response.json();
            renderTabla(checklists);

        } catch (err) {
            console.error('Error:', err);
            checklistsTbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al cargar datos. ${err.message}</td></tr>`;
        }
    }

    // --- 3. FUNCIÓN PARA RENDERIZAR LA TABLA ---
    function renderTabla(checklists) {
        checklistsTbody.innerHTML = ''; // Limpiamos el spinner

        if (checklists.length === 0) {
            checklistsTbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay checklists asignados.</td></tr>`;
            return;
        }

        checklists.forEach(c => {
            const tr = document.createElement('tr');
            
            // Lógica para calcular estado y progreso
            let porcentaje = 0;
            let estadoBadge = '';
            let actionButton = '';

            if (c.total_preguntas === 0) {
                // Checklist vacío (sin preguntas)
                porcentaje = 0;
                estadoBadge = '<span class="badge bg-secondary">Vacío</span>';
                actionButton = '<button class="btn btn-outline-custom btn-sm rounded-pill" disabled>N/A</button>';
            
            } else if (c.total_respuestas === 0) {
                // Pendiente
                porcentaje = 0;
                estadoBadge = '<span class="badge bg-primary-custom-light"><i class="fas fa-clock me-1"></i> Pendiente</span>';
                actionButton = `<a href="respond-checklist.html?id=${c.id_checklist}" class="btn btn-primary-custom btn-sm rounded-pill">Iniciar</a>`;
            
            } else if (c.total_respuestas < c.total_preguntas) {
                // En Progreso
                porcentaje = Math.round((c.total_respuestas / c.total_preguntas) * 100);
                estadoBadge = '<span class="badge bg-warning text-dark-custom"><i class="fas fa-hourglass-half me-1"></i> En Progreso</span>';
                actionButton = `<a href="respond-checklist.html?id=${c.id_checklist}" class="btn btn-primary-custom btn-sm rounded-pill">Continuar</a>`;
            
            } else {
                // Completado
                porcentaje = 100;
                estadoBadge = '<span class="badge bg-success-custom"><i class="fas fa-check-circle me-1"></i> Completado</span>';
                actionButton = `<a href="#" class="btn btn-outline-custom btn-sm rounded-pill">Ver Reporte</a>`; // TODO: Enlazar a 'report.html'
            }

            // HTML de la barra de progreso
            const progressBar = `
                <div class="progress" style="height: 15px;">
                    <div class="progress-bar ${porcentaje === 100 ? 'bg-success-custom' : 'bg-info-custom'}" 
                         role="progressbar" 
                         style="width: ${porcentaje}%;" 
                         aria-valuenow="${porcentaje}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
            `;

            tr.innerHTML = `
                <td>${c.nombre}</td>
                <td>${estadoBadge}</td>
                <td>${progressBar}</td>
                <td>${actionButton}</td>
            `;
            checklistsTbody.appendChild(tr);
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