// js/content-management.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const logoutButton = document.getElementById('logout-button');
    const contentTbody = document.getElementById('content-tbody');

    // --- 1. VERIFICACIÓN DE SEGURIDAD ---
    document.addEventListener('DOMContentLoaded', () => {
        if (!token) {
            window.location.href = 'index.html'; 
            return;
        }

        // Esta página es SOLO para SuperAdmin
        if (userRol !== 'SuperAdmin') {
            alert('No tienes permiso para acceder a esta página.');
            window.location.href = 'dashboard.html';
            return;
        }

        // Si todo está bien, cargamos los datos
        cargarPlantillas();
    });

    // --- 2. LÓGICA DE CARGA DE DATOS ---
    async function cargarPlantillas() {
        if (!contentTbody) return;

        try {
            // Usamos la ruta de backoffice que ya existe
            const response = await fetch('http://localhost:3000/api/backoffice/checklists', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.clear();
                    window.location.href = 'index.html';
                }
                throw new Error('Error al cargar las plantillas de checklists.');
            }

            const checklists = await response.json();
            renderTabla(checklists);

        } catch (err) {
            console.error('Error:', err);
            contentTbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al cargar datos. ${err.message}</td></tr>`;
        }
    }

    // --- 3. FUNCIÓN PARA RENDERIZAR LA TABLA ---
    function renderTabla(checklists) {
        contentTbody.innerHTML = ''; // Limpiamos el spinner

        if (checklists.length === 0) {
            contentTbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay plantillas de checklist creadas.</td></tr>`;
            return;
        }

        checklists.forEach(checklist => {
            const tr = document.createElement('tr');
            
            const fecha = new Date(checklist.fecha_creacion).toLocaleDateString('es-ES', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            });

            tr.innerHTML = `
                <td>${checklist.nombre}</td>
                <td>${checklist.version || 'v1.0'}</td>
                <td>${fecha}</td>
                <td class"text-nowrap">
                    <a href="edit-content.html?id=${checklist.id_checklist}" class="btn btn-outline-custom btn-sm rounded-pill me-2">
                        <i class="fas fa-edit"></i> Editar
                    </a>
                    <a href="manage-checklists.html?id=${checklist.id_checklist}" class="btn btn-primary-custom btn-sm rounded-pill me-2">
                        <i class="fas fa-list-check"></i> Preguntas
                    </a>
                </td>
            `;
            contentTbody.appendChild(tr);
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