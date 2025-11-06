// js/clients-list.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const logoutButton = document.getElementById('logout-button');
    const pageTitle = document.getElementById('page-title');
    const usersTbody = document.getElementById('users-tbody');

    let clienteId = null;

    // --- 1. VERIFICACIÓN DE SEGURIDAD Y OBTENCIÓN DE ID ---
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

        const params = new URLSearchParams(window.location.search);
        clienteId = params.get('cliente_id');

        if (!clienteId) {
            if(pageTitle) pageTitle.textContent = 'Error';
            usersTbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">No se ha especificado un ID de cliente.</td></tr>`;
            return;
        }

        // Si todo está bien, cargamos los datos
        cargarDatos(clienteId);
    });

    // --- 2. LÓGICA DE CARGA DE DATOS (Título y Usuarios) ---
    async function cargarDatos(id) {
        try {
            // Hacemos dos peticiones a la vez
            const [clienteRes, usuariosRes] = await Promise.all([
                fetch(`http://localhost:3000/api/backoffice/clientes/${id}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:3000/api/backoffice/clientes/${id}/usuarios`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!clienteRes.ok || !usuariosRes.ok) {
                 if (clienteRes.status === 401 || usuariosRes.status === 401) {
                    localStorage.clear();
                    window.location.href = 'index.html'; // Token expiró
                }
                throw new Error('No se pudieron cargar los datos del cliente.');
            }

            const cliente = await clienteRes.json();
            const usuarios = await usuariosRes.json();

            // Actualizamos el título
            if (pageTitle) pageTitle.textContent = `Usuarios de ${cliente.nombre}`;

            // Renderizamos la tabla
            renderTabla(usuarios);

        } catch (err) {
            console.error('Error:', err);
            usersTbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${err.message}</td></tr>`;
        }
    }

    // --- 3. FUNCIÓN PARA RENDERIZAR LA TABLA ---
    function renderTabla(usuarios) {
        usersTbody.innerHTML = ''; // Limpiamos el spinner

        if (usuarios.length === 0) {
            usersTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Este cliente no tiene usuarios registrados.</td></tr>`;
            return;
        }

        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            
            const estadoBadge = user.estado_cuenta === 'activo' 
                ? '<span class="badge bg-success-custom rounded-pill">Activo</span>'
                : '<span class="badge bg-secondary rounded-pill">Inactivo</span>';

            tr.innerHTML = `
                <td>${user.nombre_completo}</td>
                <td>${user.email}</td>
                <td>${user.rol}</td>
                <td>${estadoBadge}</td>
                <td>
                    <a href="edit-user.html?id=${user.id_usuario}" class="btn btn-outline-custom btn-sm rounded-pill me-2">
                        <i class="fas fa-edit"></i> Editar
                    </a>
                    <button type="button" class="btn btn-danger-custom btn-sm rounded-pill" data-bs-toggle="modal" data-bs-target="#deleteModal">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </td>
            `;
            usersTbody.appendChild(tr);
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