// js/reset-password.js

(function() {
    const resetForm = document.getElementById('reset-password-form');
    const submitButton = document.getElementById('submit-button');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const messageContainer = document.getElementById('message-container');

    let resetToken = null;

    // 1. Obtener el token de la URL al cargar la página
    document.addEventListener('DOMContentLoaded', () => {
        const params = new URLSearchParams(window.location.search);
        resetToken = params.get('token');

        if (!resetToken) {
            resetForm.style.display = 'none';
            messageContainer.innerHTML = `
                <div class="alert alert-danger">
                    Token de reseteo no encontrado. Por favor, solicita un nuevo enlace.
                </div>
            `;
        }
    });

    // 2. Manejar el envío del formulario
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Validación
            if (newPassword !== confirmPassword) {
                messageContainer.innerHTML = '<div class="alert alert-danger">Las contraseñas no coinciden.</div>';
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Contraseña';
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        token: resetToken, 
                        newPassword: newPassword 
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.msg || 'Error al restablecer la contraseña.');
                }

                // ¡Éxito!
                resetForm.style.display = 'none';
                messageContainer.innerHTML = `
                    <div class="alert alert-success">
                        <h4 class="alert-heading">¡Éxito!</h4>
                        <p>${data.msg}</p>
                        <hr>
                        <a href="login.html" class="btn btn-primary-custom">Ir a Iniciar Sesión</a>
                    </div>
                `;

            } catch (err) {
                messageContainer.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Contraseña';
            }
        });
    }

})();