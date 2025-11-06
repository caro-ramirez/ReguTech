// js/content-management.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const logoutButton = document.getElementById('logout-button');
    const checklistsTbody = document.getElementById('checklists-tbody');
    const politicasTbody = document.getElementById('politicas-tbody');

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

        // Cargamos ambos tipos de contenido
        cargarChecklists();
        cargarPoliticas();
    });

    // --- 2. LÓGICA DE CARGA DE CHECKLISTS ---
    async function cargarChecklists() {
        if (!checklistsTbody) return;
        checklistsTbody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';

        try {
            const response = await fetch('http://localhost:3000/api/backoffice/checklists', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error al cargar las plantillas de checklists.');
            
            const checklists = await response.json();
            renderChecklistsTabla(checklists);

        } catch (err) {
            console.error('Error:', err);
            checklistsTbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al cargar datos.</td></tr>`;
        }
    }

    // --- 3. LÓGICA DE CARGA DE POLÍTICAS ---
    async function cargarPoliticas() {
        if (!politicasTbody) return;
        politicasTbody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';

        try {
            const response = await fetch('http://localhost:3000/api/backoffice/politicas', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error al cargar las plantillas de políticas.');

            const politicas = await response.json();
            renderPoliticasTabla(politicas);

        } catch (err) {
            console.error('Error:', err);
            politicasTbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al cargar datos.</td></tr>`;
        }
    }

    // --- 4. FUNCIONES DE RENDERIZADO ---
    function renderChecklistsTabla(checklists) {
        checklistsTbody.innerHTML = ''; 

        if (checklists.length === 0) {
            checklistsTbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay plantillas de checklist creadas.</td></tr>`;
            return;
        }

        checklists.forEach(checklist => {
            const tr = document.createElement('tr');
            const fecha = new Date(checklist.fecha_creacion).toLocaleDateString('es-ES');
            
            // Botón de Editar ahora pasa 'type=checklist'
            tr.innerHTML = `
                <td>${checklist.nombre}</td>
                <td>${checklist.version || 'v1.0'}</td>
                <td>${fecha}</td>
                <td class="text-nowrap">
                    <a href="edit-content.html?id=${checklist.id_checklist}&type=checklist" class="btn btn-outline-custom btn-sm rounded-pill me-2">
                        <i class="fas fa-edit"></i> Editar
                    </a>
                    <a href="manage-checklists.html?id=${checklist.id_checklist}" class="btn btn-primary-custom btn-sm rounded-pill me-2">
                        <i class="fas fa-list-check"></i> Preguntas
                    </a>
                </td>
            `;
            checklistsTbody.appendChild(tr);
        });
    }

    function renderPoliticasTabla(politicas) {
        politicasTbody.innerHTML = ''; 

        if (politicas.length === 0) {
            politicasTbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay plantillas de políticas creadas.</td></tr>`;
            return;
        }

        politicas.forEach(politica => {
            const tr = document.createElement('tr');
            const fecha = new Date(politica.fecha_publicacion).toLocaleDateString('es-ES');

            // Botón de Editar ahora pasa 'type=politica'
            tr.innerHTML = `
                <td>${politica.nombre}</td>
                <td>${politica.version || 'v1.0'}</td>
                <td>${fecha}</td>
                <td class="text-nowrap">
                    <a href="edit-content.html?id=${politica.id_politica}&type=politica" class="btn btn-outline-custom btn-sm rounded-pill me-2">
                        <i class="fas fa-edit"></i> Editar
                    </a>
                </td>
            `;
            politicasTbody.appendChild(tr);
        });
    }

    // --- 5. LÓGICA DE LOGOUT ---
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            localStorage.clear();
            window.location.href = 'index.html'; 
        });
    }

})();