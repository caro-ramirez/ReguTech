// js/audit-list.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const auditListTbody = document.getElementById('audit-list-tbody');
    const logoutButton = document.getElementById('logout-button');
    const columnaCliente = document.getElementById('columna-cliente');

    // --- 1. VERIFICACIÓN DE SEGURIDAD ---
    document.addEventListener('DOMContentLoaded', () => {
        if (!token) {
            window.location.href = 'index.html'; 
            return;
        }

        // Esta página es solo para Admins y SuperAdmins
        if (userRol !== 'Administrador' && userRol !== 'SuperAdmin') {
            alert('No tienes permiso para acceder a esta página.');
            window.location.href = 'dashboard.html';
            return;
        }

        // Si es SuperAdmin, mostramos la columna de "Cliente"
        if (userRol === 'SuperAdmin') {
            if(columnaCliente) columnaCliente.style.display = 'table-cell';
        }

        // Si todo está bien, cargamos los datos
        cargarAuditorias();
    });

    // --- 2. LÓGICA DE CARGA DE DATOS ---
    async function cargarAuditorias() {
        if (!auditListTbody) return;

        try {
            const response = await fetch('http://localhost:3000/api/auditorias', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.clear();
                    window.location.href = 'index.html';
                }
                throw new Error('Error al cargar las auditorías.');
            }

            const auditorias = await response.json();
            renderTabla(auditorias);

        } catch (err) {
            console.error('Error:', err);
            auditListTbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error al cargar datos. ${err.message}</td></tr>`;
        }
    }

    // --- 3. FUNCIÓN PARA RENDERIZAR LA TABLA ---
    function renderTabla(auditorias) {
        auditListTbody.innerHTML = ''; // Limpiamos el spinner

        if (auditorias.length === 0) {
            auditListTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay planes de auditoría registrados.</td></tr>`;
            return;
        }

        auditorias.forEach(plan => {
            const tr = document.createElement('tr');
            
            // Formatear la fecha
            const fecha = new Date(plan.fecha_planificada).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            let filaHTML = `
                <td>${fecha}</td>
                <td>${plan.area_auditar}</td>
                <td>${plan.responsable_auditoria}</td>
            `;

            // Si es SuperAdmin, añadimos la columna del cliente
            if (userRol === 'SuperAdmin') {
                filaHTML += `<td>${plan.nombre_cliente || 'N/A'}</td>`;
            }

            filaHTML += `
                <td>
                    <a href="audit-findings-form.html?id=${plan.id_plan_auditoria}" class="btn btn-primary-custom btn-sm">
                        <i class="fas fa-plus me-1"></i> Registrar Hallazgos
                    </a>
                </td>
            `;
            
            tr.innerHTML = filaHTML;
            auditListTbody.appendChild(tr);
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