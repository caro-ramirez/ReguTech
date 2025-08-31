const bcrypt = require('bcrypt');
const password = 'password123'; // La contraseña que usarás para tu usuario de prueba
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
    console.log('Hash de la contraseña:', hash);
});