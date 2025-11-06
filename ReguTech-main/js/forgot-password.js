// js/forgot-password.js

(function() {
    const forgotForm = document.getElementById('forgot-password-form');
    const submitButton = document.getElementById('submit-button');
    const emailInput = document.getElementById('email-recuperar');
    const messageContainer = document.getElementById('message-container');

    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';

            try {
                const email = emailInput.value;
                const response = await fetch('http://localhost:3000/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Error en el servidor.');
                }

                // ¡Éxito!
                // Ocultamos el formulario y mostramos el mensaje de éxito.
                forgotForm.style.display = 'none';
                messageContainer.innerHTML = `
                    <div class="alert alert-success">
                        <h4 class="alert-heading">¡Solicitud Enviada!</h4>
                        <p>${data.message}</p>
                        <hr>
                        <p class="mb-0"><b>(SIMULACIÓN)</b> Revisa la consola de tu backend (Node.js) para ver el token de reseteo.</p>
                    </div>
                `;

            } catch (err) {
                messageContainer.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar Enlace';
            }
        });
    }

})();