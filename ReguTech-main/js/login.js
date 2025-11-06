// js/login.js

(function() {
    const loginForm = document.getElementById('login-form');
    const submitButton = document.getElementById('submit-button');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // Ocultar el error al empezar
    if(errorMessage) errorMessage.style.display = 'none';

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Ingresando...';
            if(errorMessage) errorMessage.style.display = 'none';

            try {
                // Ahora 'emailInput' y 'passwordInput' no serán 'null'
                const email = emailInput.value;
                const password = passwordInput.value;
                
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    // Si es 401 (Unauthorized) u otro error
                    throw new Error(data.message || 'Error al iniciar sesión.');
                }

                // ¡ÉXITO!
                localStorage.setItem('token', data.token);
                localStorage.setItem('user_rol', data.rol);
                
                // Redirigimos al dashboard
                window.location.href = 'dashboard.html';

            } catch (err) {
                console.error('Error de login:', err);
                if(errorMessage) {
                    errorMessage.textContent = err.message;
                    errorMessage.style.display = 'block';
                }
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
            }
        });
    }
})();