// createHash.js
const bcrypt = require('bcryptjs');

const password = 'superadmin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error al crear el hash:', err);
    return;
  }
  console.log('\n---¡HASH CREADO CON ÉXITO!---');
  console.log('Copiá la línea de abajo y usala en tu script SQL:\n');
  console.log(hash);
  console.log('\n---------------------------------');
});