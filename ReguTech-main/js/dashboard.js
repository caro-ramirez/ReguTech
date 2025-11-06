// js/dashboard.js

// Función anónima que se ejecuta al cargar la página (IIFE)
(function() {
  const token = localStorage.getItem('token');
  const userRol = localStorage.getItem('user_rol');

  // --- 1. VERIFICACIÓN DE SEGURIDAD ---
  if (!token) {
    console.log('No hay token. Redirigiendo a login...');
    window.location.href = 'index.html'; 
    return; // Detiene la ejecución del script
  }

  console.log('Usuario logueado. Rol:', userRol);

  // --- 2. LÓGICA DE VISTAS POR ROL (CAMBIO IMPORTANTE) ---
  const colaboradorView = document.getElementById('colaborador-view');
  const adminView = document.getElementById('admin-view');
  const superAdminView = document.getElementById('super-admin-view');

  if (userRol === 'SuperAdmin') {
    // Si es SuperAdmin (Soporte), solo muestra el panel de SuperAdmin.
    if (superAdminView) superAdminView.style.display = 'block';
  
  } else if (userRol === 'Administrador') {
    // Si es Admin de Cliente, muestra TAREAS y panel de ADMIN.
    if (colaboradorView) colaboradorView.style.display = 'block';
    if (adminView) adminView.style.display = 'block';
    
    // Carga las tareas pendientes
    cargarPoliticas(token);
    cargarChecklists(token);

  } else if (userRol === 'Colaborador') {
    // Si es Colaborador, solo muestra TAREAS.
    if (colaboradorView) colaboradorView.style.display = 'block';

    // Carga las tareas pendientes
    cargarPoliticas(token);
    cargarChecklists(token);
  }
  
  // --- 3. LÓGICA DE CERRAR SESIÓN ---
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault(); 
      console.log('Cerrando sesión...');
      localStorage.removeItem('token');
      localStorage.removeItem('user_rol');
      window.location.href = 'index.html'; 
    });
  }

  
  // --- 4. INICIALIZACIÓN DE GRÁFICOS (Charts.js) ---
  // (Este código se movió dentro de 'DOMContentLoaded' para asegurar que todo cargue)

  
  // --- 5. CARGA DE DATOS DINÁMICOS (MOVIDA) ---
  // Las llamadas (cargarPoliticas, cargarChecklists) se movieron
  // dentro de la lógica de roles (paso 2)


  // --- INICIO DE BLOQUE DE GRÁFICOS ---
  document.addEventListener('DOMContentLoaded', function() {
      try {
        const root = document.documentElement;
        const colors = {
            darkBlue: getComputedStyle(root).getPropertyValue('--color-primary-dark') || '#0d3b66',
            primary: getComputedStyle(root).getPropertyValue('--color-primary') || '#2a9d8f',
            secondary: getComputedStyle(root).getPropertyValue('--color-secondary') || '#e9c46a',
            accent: getComputedStyle(root).getPropertyValue('--color-accent') || '#f4a261',
            danger: getComputedStyle(root).getPropertyValue('--color-danger') || '#e76f51'
        };

        // Gráfico de Cumplimiento (para Colaborador/Admin)
        const complianceCtx = document.getElementById('complianceChart')?.getContext('2d');
        if (complianceCtx) {
            new Chart(complianceCtx, {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Cumplimiento (%)',
                        data: [75, 80, 85, 88, 92, 95], 
                        backgroundColor: 'rgba(32, 178, 170, 0.2)',
                        borderColor: colors.primary,
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, max: 100 } }
                }
            });
        }

        // --- Gráficos solo para Admin ---
        if (userRol === 'Administrador' || userRol === 'SuperAdmin') {
            const barCtx = document.getElementById('barChart')?.getContext('2d');
            if (barCtx) {
                new Chart(barCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Operaciones', 'RRHH', 'Legal', 'IT'],
                        datasets: [{
                            label: 'Hallazgos Abiertos',
                            data: [5, 2, 1, 3], 
                            backgroundColor: colors.primary
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
            const riskCtx = document.getElementById('riskChart')?.getContext('2d');
            if (riskCtx) {
                new Chart(riskCtx, {
                    type: 'pie',
                    data: {
                        labels: ['Operativos', 'Estratégicos', 'Financieros', 'De Cumplimiento'],
                        datasets: [{
                            label: 'Tipos de Riesgo',
                            data: [35, 20, 25, 20], 
                            backgroundColor: [ colors.primary, colors.accent, colors.secondary, colors.darkBlue ],
                            hoverOffset: 4
                        }]
                    },
                    options: { responsive: true }
                });
            }
        }
      } catch (e) {
        console.error("Error al inicializar los gráficos:", e);
      }
  });
  // --- FIN DE BLOQUE DE GRÁFICOS ---


})(); // Fin de la función IIFE


// --- FUNCIONES PARA CARGAR DATOS (Sin cambios) ---

async function cargarPoliticas(token) {
  const listaUl = document.getElementById('lista-politicas-pendientes');
  if (!listaUl) return;

  try {
    const response = await fetch('http://localhost:3000/api/policies', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
         localStorage.clear();
         window.location.href = 'index.html'; 
      }
      throw new Error('Error al cargar políticas');
    }
    const politicas = await response.json();
    listaUl.innerHTML = ''; 
    if (politicas.length === 0) {
        listaUl.innerHTML = '<li class="list-group-item">¡No hay políticas pendientes!</li>';
        return;
    }
    politicas.forEach(politica => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <span>${politica.nombre} (v${politica.version})</span>
        <a href="policy-view.html?id=${politica.id_politica}" class="btn btn-sm btn-primary-custom">Ver y Confirmar</a>
      `;
      listaUl.appendChild(li);
    });
  } catch (err) {
    console.error('Error de red al cargar políticas:', err);
    listaUl.innerHTML = '<li class="list-group-item text-danger">Error al cargar políticas.</li>';
  }
}

async function cargarChecklists(token) {
  const listaUl = document.getElementById('lista-checklists-pendientes');
  if (!listaUl) return;
  try {
    const response = await fetch('http://localhost:3000/api/checklists', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error al cargar checklists');
    const checklists = await response.json();
    listaUl.innerHTML = ''; 
    if (checklists.length === 0) {
        listaUl.innerHTML = '<li class="list-group-item">¡No hay checklists pendientes!</li>';
        return;
    }
    checklists.forEach(checklist => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <span>${checklist.nombre}</span>
        <a href="respond-checklist.html?id=${checklist.id_checklist}" class="btn btn-sm btn-primary-custom">Responder</a>
      `;
      listaUl.appendChild(li);
    });
  } catch (err) {
    console.error('Error de red al cargar checklists:', err);
    listaUl.innerHTML = '<li class="list-group-item text-danger">Error al cargar checklists.</li>';
  }
}