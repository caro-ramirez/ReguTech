// js/companies-list.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const logoutButton = document.getElementById('logout-button');
    const clientsTbody = document.getElementById('clients-tbody');

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
        cargarClientes();
    });

    // --- 2. LÓGICA DE CARGA DE DATOS ---
    async function cargarClientes() {
        if (!clientsTbody) return;

        try {
            const response = await fetch('http://localhost:3000/api/backoffice/clientes', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.clear();
                    window.location.href = 'index.html';
                }
                throw new Error('Error al cargar los clientes.');
            }

            const clientes = await response.json();
            renderTabla(clientes);

        } catch (err) {
            console.error('Error:', err);
            clientsTbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al cargar datos. ${err.message}</td></tr>`;
        }
    }

    // --- 3. FUNCIÓN PARA RENDERIZAR LA TABLA ---
    function renderTabla(clientes) {
        clientsTbody.innerHTML = ''; // Limpiamos el spinner

        if (clientes.length === 0) {
            clientsTbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay clientes registrados.</td></tr>`;
            return;
        }

        clientes.forEach(cliente => {
            const tr = document.createElement('tr');
            
            const fecha = new Date(cliente.fecha_creacion).toLocaleDateString('es-ES', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            });

            tr.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${fecha}</td>
                <td><span class="badge bg-info-custom rounded-pill">${cliente.user_count}</span></td>
                <td>
                    <a href="clients-list.html?cliente_id=${cliente.id_cliente}" class="btn btn-outline-custom btn-sm rounded-pill me-2">
                        <i class="fas fa-users"></i> Ver Usuarios
                    </a>
                </td>
            `;
            clientsTbody.appendChild(tr);
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