// js/risk.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const riesgosTbody = document.getElementById('riesgos-tbody');
    const logoutButton = document.getElementById('logout-button');
    const columnaCliente = document.getElementById('columna-cliente');

    // --- 1. VERIFICACIÓN DE SEGURIDAD ---
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

        // Si es SuperAdmin, mostramos la columna de "Cliente"
        if (userRol === 'SuperAdmin') {
            if(columnaCliente) columnaCliente.style.display = 'table-cell';
        }

        // Si todo está bien, cargamos los datos
        cargarRiesgos();
    });

    // --- 2. LÓGICA DE CARGA DE DATOS ---
    async function cargarRiesgos() {
        if (!riesgosTbody) return;

        try {
            const response = await fetch('http://localhost:3000/api/riesgos', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.clear();
                    window.location.href = 'index.html';
                }
                throw new Error('Error al cargar los riesgos.');
            }

            const riesgos = await response.json();
            renderTabla(riesgos);

        } catch (err) {
            console.error('Error:', err);
            riesgosTbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar datos. ${err.message}</td></tr>`;
        }
    }

    // --- 3. FUNCIÓN PARA RENDERIZAR LA TABLA ---
    function renderTabla(riesgos) {
        riesgosTbody.innerHTML = ''; // Limpiamos el spinner

        if (riesgos.length === 0) {
            riesgosTbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay riesgos o oportunidades registrados.</td></tr>`;
            return;
        }

        riesgos.forEach(riesgo => {
            const tr = document.createElement('tr');
            
            const tipoBadge = getTipoBadge(riesgo.tipo);
            const probBadge = getProbabilidadBadge(riesgo.probabilidad);
            const impactoBadge = getImpactoBadge(riesgo.impacto);

            let filaHTML = `
                <td>${riesgo.descripcion}</td>
                <td>${tipoBadge}</td>
                <td>${probBadge}</td>
                <td>${impactoBadge}</td>
            `;

            // Si es SuperAdmin, añadimos la columna del cliente
            if (userRol === 'SuperAdmin') {
                filaHTML += `<td>${riesgo.nombre_cliente || 'N/A'}</td>`;
            }

            filaHTML += `
                <td>
                    <a href="risk-form.html?id=${riesgo.id_riesgo_oportunidad}" class="btn btn-outline-custom btn-sm">
                        <i class="fas fa-edit"></i> Editar
                    </a>
                </td>
            `;
            
            tr.innerHTML = filaHTML;
            riesgosTbody.appendChild(tr);
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

    // --- 5. Funciones Helper para Badges ---
    function getTipoBadge(tipo) {
        if (tipo === 'Riesgo') {
            return '<span class="badge bg-danger">Riesgo</span>';
        } else if (tipo === 'Oportunidad') {
            return '<span class="badge bg-success">Oportunidad</span>';
        }
        return tipo;
    }

    function getProbabilidadBadge(prob) {
        if (prob === 'Alta') return `<span class="badge bg-warning text-dark">${prob}</span>`;
        if (prob === 'Media') return `<span class="badge bg-info-custom">${prob}</span>`;
        if (prob === 'Baja') return `<span class="badge bg-secondary">${prob}</span>`;
        return prob;
    }

    function getImpactoBadge(impacto) {
        if (impacto === 'Alto') return `<span class="badge bg-warning text-dark">${impacto}</span>`;
        if (impacto === 'Medio') return `<span class="badge bg-info-custom">${impacto}</span>`;
        if (impacto === 'Bajo') return `<span class="badge bg-secondary">${impacto}</span>`;
        return impacto;
    }

})();