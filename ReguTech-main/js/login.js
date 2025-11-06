// js/login.js

// Espera a que el contenido del HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorP = document.getElementById('error-message');

  if (!loginForm) {
    console.warn('No se encontró el formulario #login-form en esta página.');
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
      errorP.textContent = 'Por favor, completa ambos campos.';
      return;
    }

    try {
      // 1. Llama a tu API de backend
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si el servidor responde con 401, 500, etc.
        errorP.textContent = data.message || 'Error al iniciar sesión.';
        return;
      }

      // 2. ¡ÉXITO! Guarda los datos en el navegador
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_rol', data.rol); // Guardamos el ROL
      
      // 3. Redirige al dashboard
      window.location.href = 'dashboard.html';

    } catch (err) {
      console.error('Error de red:', err);
      errorP.textContent = 'Error de conexión con el servidor. ¿El backend está funcionando?';
    }
  });
});