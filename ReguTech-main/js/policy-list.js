// js/policy-list.js

(function() {
    const token = localStorage.getItem('token');
    
    // Elementos del DOM
    const logoutButton = document.getElementById('logout-button');
    const policiesTbody = document.getElementById('policies-tbody');

    // --- 1. VERIFICACIÓN DE SEGURIDAD ---
    document.addEventListener('DOMContentLoaded', () => {
        if (!token) {
            window.location.href = 'index.html'; 
            return;
        }
        
        // Esta página la puede ver cualquier rol
        cargarPoliticas();
    });

    // --- 2. LÓGICA DE CARGA DE DATOS ---
    async function cargarPoliticas() {
        if (!policiesTbody) return;

        try {
            // Llamamos a la nueva ruta del backend
            const response = await fetch('http://localhost:3000/api/policies/status', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.clear();
                    window.location.href = 'index.html';
                }
                throw new Error('Error al cargar las políticas.');
            }

            const politicas = await response.json();
            renderTabla(politicas);

        } catch (err) {
            console.error('Error:', err);
            policiesTbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error al cargar datos. ${err.message}</td></tr>`;
        }
    }

    // --- 3. FUNCIÓN PARA RENDERIZAR LA TABLA ---
    function renderTabla(politicas) {
        policiesTbody.innerHTML = ''; // Limpiamos el spinner

        if (politicas.length === 0) {
            policiesTbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No hay políticas asignadas.</td></tr>`;
            return;
        }

        politicas.forEach(p => {
            const tr = document.createElement('tr');
            
            let estadoBadge = '';
            let buttonText = '';

            if (p.leida) {
                estadoBadge = '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> Leída</span>';
                buttonText = 'Ver Política';
            } else {
                estadoBadge = '<span class="badge bg-warning text-dark"><i class="fas fa-hourglass-half me-1"></i> Pendiente</span>';
                buttonText = 'Ver y Confirmar';
            }

            tr.innerHTML = `
                <td>${p.nombre}</td>
                <td>${estadoBadge}</td>
                <td>
                    <a href="policy-view.html?id=${p.id_politica}" class="btn btn-primary-custom btn-sm">${buttonText}</a>
                </td>
            `;
            policiesTbody.appendChild(tr);
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