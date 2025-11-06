// js/platform-stats.js

(function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('user_rol');
    
    // Elementos del DOM
    const logoutButton = document.getElementById('logout-button');
    
    // Tarjetas de estadísticas
    const statsTotalClientes = document.getElementById('stats-total-clientes');
    const statsTotalUsuarios = document.getElementById('stats-total-usuarios');
    const statsTotalHallazgos = document.getElementById('stats-total-hallazgos');

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
        cargarEstadisticas();
        
        // Dibujamos los gráficos (con datos estáticos por ahora)
        dibujarGraficos();
    });

    // --- 2. LÓGICA DE CARGA DE DATOS ---
    async function cargarEstadisticas() {
        try {
            const response = await fetch('http://localhost:3000/api/backoffice/stats', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.clear();
                    window.location.href = 'index.html';
                }
                throw new Error('Error al cargar las estadísticas.');
            }

            const stats = await response.json();
            
            // Actualizamos las tarjetas
            if(statsTotalClientes) statsTotalClientes.textContent = stats.total_clientes;
            if(statsTotalUsuarios) statsTotalUsuarios.textContent = stats.total_usuarios;
            if(statsTotalHallazgos) statsTotalHallazgos.textContent = stats.total_hallazgos;

        } catch (err) {
            console.error('Error:', err);
            if(statsTotalClientes) statsTotalClientes.textContent = 'Error';
            if(statsTotalUsuarios) statsTotalUsuarios.textContent = 'Error';
            if(statsTotalHallazgos) statsTotalHallazgos.textContent = 'Error';
        }
    }

    // --- 3. LÓGICA DE LOGOUT ---
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            localStorage.clear();
            window.location.href = 'index.html'; 
        });
    }

    // --- 4. LÓGICA DE GRÁFICOS (Tu código original) ---
    function dibujarGraficos() {
        try {
            const root = document.documentElement;
            const colors = {
                darkBlue: getComputedStyle(root).getPropertyValue('--color-primary-dark') || '#0d3b66',
                primary: getComputedStyle(root).getPropertyValue('--color-primary') || '#2a9d8f',
                secondary: getComputedStyle(root).getPropertyValue('--color-secondary') || '#e9c46a',
                accent: getComputedStyle(root).getPropertyValue('--color-accent') || '#f4a261',
                success: '#28a745',
                info: '#17a2b8'
            };

            // Gráfico de adopción de módulos
            const moduleAdoptionCtx = document.getElementById('moduleAdoptionChart').getContext('2d');
            new Chart(moduleAdoptionCtx, {
                type: 'bar',
                data: {
                    labels: ['ISO 9001', 'PCI DSS', 'Auditorías', 'Riesgos'],
                    datasets: [{
                        label: 'Porcentaje de Clientes',
                        data: [85, 60, 90, 75], // Datos estáticos
                        backgroundColor: [colors.primary, colors.accent, colors.secondary, colors.darkBlue],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true, max: 100 } }
                }
            });

            // Gráfico de crecimiento de clientes
            const clientGrowthCtx = document.getElementById('clientGrowthChart').getContext('2d');
            new Chart(clientGrowthCtx, {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Nuevos Clientes',
                        data: [10, 15, 20, 25, 30, 45], // Datos estáticos
                        borderColor: colors.accent,
                        backgroundColor: colors.accent + '40',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true } }
                }
            });
        } catch(e) {
            console.error('Error al dibujar gráficos:', e);
        }
    }

})();