// js/profile.js

(function() {
    const token = localStorage.getItem('token');
    
    // Elementos del DOM (Formulario de Perfil)
    const profileForm = document.getElementById('profile-form');
    const submitProfileButton = document.getElementById('submit-profile-button');
    const profileErrorMessage = document.getElementById('profile-error-message');
    const profileNameInput = document.getElementById('profile-name');
    const profileEmailInput = document.getElementById('profile-email');
    const profileRoleInput = document.getElementById('profile-role');

    // Elementos del DOM (Formulario de Contraseña)
    const passwordForm = document.getElementById('password-form');
    const submitPasswordButton = document.getElementById('submit-password-button');
    const passwordErrorMessage = document.getElementById('password-error-message');
    const passwordSuccessMessage = document.getElementById('password-success-message');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Botón de Logout
    const logoutButton = document.getElementById('logout-button');

    // --- 1. VERIFICACIÓN Y CARGA DE DATOS ---
    document.addEventListener('DOMContentLoaded', () => {
        if (!token) {
            window.location.href = 'index.html'; 
            return;
        }
        
        // Cargar los datos del perfil
        loadProfileData();
    });

    async function loadProfileData() {
        try {
            const response = await fetch('http://localhost:3000/api/me', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) window.location.href = 'index.html';
                throw new Error('No se pudieron cargar los datos del perfil.');
            }

            const user = await response.json();
            
            // Rellenamos el formulario de perfil
            if(profileNameInput) profileNameInput.value = user.nombre_completo;
            if(profileEmailInput) profileEmailInput.value = user.email;
            if(profileRoleInput) profileRoleInput.value = user.rol;

        } catch (err) {
            console.error('Error:', err);
            showError('profile', err.message);
        }
    }

    // --- 2. LÓGICA DEL FORMULARIO DE PERFIL (Nombre) ---
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitProfileButton.disabled = true;
            submitProfileButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            hideMessages('profile');

            try {
                const nombre_completo = profileNameInput.value;
                
                const response = await fetch('http://localhost:3000/api/me', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nombre_completo })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'No se pudo actualizar el perfil.');
                }
                
                alert('¡Nombre actualizado con éxito!');

            } catch (err) {
                console.error('Error al actualizar perfil:', err);
                showError('profile', err.message);
            } finally {
                submitProfileButton.disabled = false;
                submitProfileButton.textContent = 'Guardar Cambios';
            }
        });
    }

    // --- 3. LÓGICA DEL FORMULARIO DE CONTRASEÑA ---
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitPasswordButton.disabled = true;
            submitPasswordButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando...';
            hideMessages('password');

            const oldPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Validación del frontend
            if (newPassword !== confirmPassword) {
                showError('password', 'Las nuevas contraseñas no coinciden.');
                submitPasswordButton.disabled = false;
                submitPasswordButton.textContent = 'Actualizar Contraseña';
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/change-password', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ oldPassword, newPassword })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'No se pudo cambiar la contraseña.');
                }
                
                // Éxito
                showSuccess('password', '¡Contraseña actualizada con éxito!');
                passwordForm.reset(); // Limpiar los campos

            } catch (err) {
                console.error('Error al cambiar contraseña:', err);
                showError('password', err.message);
            } finally {
                submitPasswordButton.disabled = false;
                submitPasswordButton.textContent = 'Actualizar Contraseña';
            }
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

    // --- Funciones Helper ---
    function showError(form, message) {
        const errorEl = (form === 'profile') ? profileErrorMessage : passwordErrorMessage;
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }
    
    function showSuccess(form, message) {
        const successEl = (form === 'password') ? passwordSuccessMessage : null; // Solo password tiene success
        if (successEl) {
            successEl.textContent = message;
            successEl.style.display = 'block';
        }
    }

    function hideMessages(form) {
        if (form === 'profile') {
            if(profileErrorMessage) profileErrorMessage.style.display = 'none';
        } else if (form === 'password') {
            if(passwordErrorMessage) passwordErrorMessage.style.display = 'none';
            if(passwordSuccessMessage) passwordSuccessMessage.style.display = 'none';
        }
    }

})();