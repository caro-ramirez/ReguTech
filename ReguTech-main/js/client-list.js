// js/clients-list.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const logoutButton = document.getElementById('logout-button');
    const pageTitle = document.getElementById('page-title');
    const usersTbody = document.getElementById('users-tbody');
    
    // (NUEVO) Elementos del Modal
    const deleteModalEl = document.getElementById('deleteModal');
    const deleteModalBody = document.getElementById('deleteModalBody');
    const confirmDeleteButton = document.getElementById('confirm-delete-button');
    
    let clienteId = null;
    let userToDeleteId = null; // (NUEVO) Variable para guardar el ID del usuario a eliminar
    let deleteModalInstance = null; // (NUEVO) Variable para la instancia del modal

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
        
        // (NUEVO) Inicializar la instancia del modal de Bootstrap
        if (deleteModalEl) {
            deleteModalInstance = new bootstrap.Modal(deleteModalEl);
        }

        const params = new URLSearchParams(window.location.search);
        clienteId = params.get('cliente_id');

        if (!clienteId) {
            if(pageTitle) pageTitle.textContent = 'Error';
            usersTbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">No se ha especificado un ID de cliente.</td></tr>`;
            return;
        }

        cargarDatos(clienteId);
    });

    // --- 2. LÓGICA DE CARGA DE DATOS (Título y Usuarios) ---
    async function cargarDatos(id) {
        try {
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

            if (pageTitle) pageTitle.textContent = `Usuarios de ${cliente.nombre}`;
            renderTabla(usuarios);

        } catch (err) {
            console.error('Error:', err);
            usersTbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${err.message}</td></tr>`;
        }
    }

    // --- 3. FUNCIÓN PARA RENDERIZAR LA TABLA ---
    function renderTabla(usuarios) {
        usersTbody.innerHTML = ''; 

        if (usuarios.length === 0) {
            usersTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Este cliente no tiene usuarios registrados.</td></tr>`;
            return;
        }

        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            // (NUEVO) Añadimos un ID a la fila para poder borrarla
            tr.id = `user-row-${user.id_usuario}`; 
            
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
                    <button type="button" class="btn btn-danger-custom btn-sm rounded-pill delete-btn" 
                            data-bs-toggle="modal" data-bs-target="#deleteModal"
                            data-user-id="${user.id_usuario}"
                            data-user-name="${user.nombre_completo}">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </td>
            `;
            usersTbody.appendChild(tr);
        });
        
        // (NUEVO) Añadimos los listeners a los botones de eliminar
        addDeleteListeners();
    }

    // --- 4. LÓGICA DE LOGOUT ---
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            localStorage.clear();
            window.location.href = 'index.html'; 
        });
    }

    // --- 5. (NUEVO) LÓGICA PARA ELIMINAR USUARIO ---
    
    // Función para añadir listeners a los botones "Eliminar" de la tabla
    function addDeleteListeners() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Obtenemos los datos del botón
                userToDeleteId = button.dataset.userId;
                const userName = button.dataset.userName;
                
                // Actualizamos el texto del modal
                if (deleteModalBody) {
                    deleteModalBody.textContent = `¿Estás seguro de que deseas eliminar a ${userName}? Esta acción no se puede deshacer.`;
                }
            });
        });
    }

    // Listener para el botón de confirmación DENTRO del modal
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', async () => {
            if (!userToDeleteId) return;

            // Cambiamos el estado del botón a "cargando"
            confirmDeleteButton.disabled = true;
            confirmDeleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';

            try {
                const response = await fetch(`http://localhost:3000/api/backoffice/usuarios/${userToDeleteId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'No se pudo eliminar el usuario.');
                }

                // ¡Éxito!
                // 1. Cerramos el modal
                if(deleteModalInstance) deleteModalInstance.hide();
                
                // 2. Eliminamos la fila de la tabla
                const rowToRemove = document.getElementById(`user-row-${userToDeleteId}`);
                if (rowToRemove) rowToRemove.remove();

            } catch (err) {
                console.error('Error al eliminar:', err);
                // Mostramos el error dentro del modal
                if(deleteModalBody) deleteModalBody.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
            } finally {
                // Restauramos el botón
                confirmDeleteButton.disabled = false;
                confirmDeleteButton.innerHTML = 'Eliminar Usuario';
                userToDeleteId = null; // Limpiamos el ID
            }
        });
    }
    
    // (NUEVO) Limpiar el modal cuando se cierra
    if (deleteModalEl) {
        deleteModalEl.addEventListener('hidden.bs.modal', () => {
            if (deleteModalBody) {
                deleteModalBody.textContent = '¿Estás seguro de que deseas eliminar a este usuario? Esta acción no se puede deshacer.';
            }
            if (confirmDeleteButton) {
                confirmDeleteButton.disabled = false;
                confirmDeleteButton.innerHTML = 'Eliminar Usuario';
            }
            userToDeleteId = null;
        });
    }

})();