// regutech-backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // <-- ¡CAMBIO IMPORTANTE!
const jwt = require('jsonwebtoken');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth'); 

const JWT_SECRET = 'tu_secreto_super_seguro';

// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // --- DEBUG 1: VER LO QUE LLEGA ---
  console.log(`\n[DEBUG] Intento de login para: ${email}`);
  console.log(`[DEBUG] Contraseña recibida: ${password}`);

  try {
    // 1. Buscar el usuario por email en la base de datos
    const result = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
    const usuario = result.rows[0];

    if (!usuario) {
      // --- DEBUG 2: ERROR DE USUARIO ---
      console.log('[DEBUG] Error: Usuario no encontrado en la BD.');
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    // --- DEBUG 3: VER LO QUE SE COMPARA ---
    console.log(`[DEBUG] Hash de la BD: ${usuario.password_hash}`);
    const match = await bcrypt.compare(password, usuario.password_hash);
    
    // --- DEBUG 4: VER EL RESULTADO ---
    console.log(`[DEBUG] Resultado de bcrypt.compare: ${match}`);

    if (!match) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }
    
    // 3. Generar el token JWT (Payload)
    const payload = { 
      id: usuario.id_usuario, 
      rol: usuario.rol, 
      id_cliente: usuario.id_cliente 
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    
    console.log('[DEBUG] ¡Éxito! Login correcto.');
    res.json({ message: 'Inicio de sesión exitoso.', token, rol: usuario.rol });

  } catch (err) {
    console.error('Error en la autenticación:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ... (El resto de tus rutas: /create-admin-user, /me, /change-password, etc.)
// (Asegúrate de que el resto de tu archivo auth.js esté aquí debajo)
// Ruta para crear manualmente el primer usuario administrador y su cliente
router.post('/create-admin-user', async (req, res) => {
  const { clientName, userName, email, password } = req.body;
  try {
    const clienteId = uuidv4();
    const userId = uuidv4();
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    await db.query('BEGIN');
    const insertClientQuery = 'INSERT INTO cliente (id_cliente, nombre) VALUES ($1, $2) RETURNING *';
    const newClient = await db.query(insertClientQuery, [clienteId, clientName]);
    const insertUserQuery = 'INSERT INTO usuario (id_usuario, id_cliente, nombre_completo, email, password_hash, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const newUser = await db.query(insertUserQuery, [userId, clienteId, userName, email, passwordHash, 'Administrador']);
    await db.query('COMMIT');
    res.status(201).json({ 
      message: 'Cliente y usuario administrador creados con éxito.', 
      cliente: newClient.rows[0], 
      usuario: newUser.rows[0] 
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error al crear cliente y usuario:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

/* --- Rutas de Perfil de Usuario --- */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT id_usuario, nombre_completo, email, rol FROM USUARIO WHERE id_usuario = $1',
      [userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

router.put('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre_completo } = req.body;
    if (!nombre_completo) return res.status(400).json({ msg: 'El nombre es obligatorio.' });
    const result = await db.query(
      'UPDATE USUARIO SET nombre_completo = $1 WHERE id_usuario = $2 RETURNING id_usuario, nombre_completo, email, rol',
      [nombre_completo, userId]
    );
    res.json(result.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
    
    const userRes = await db.query('SELECT password_hash FROM USUARIO WHERE id_usuario = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ msg: 'Usuario no encontrado.' });
    
    const isMatch = await bcrypt.compare(oldPassword, userRes.rows[0].password_hash);
    if (!isMatch) return res.status(401).json({ msg: 'La contraseña actual es incorrecta.' });
    
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await db.query('UPDATE USUARIO SET password_hash = $1 WHERE id_usuario = $2', [newPasswordHash, userId]);
    res.json({ msg: 'Contraseña actualizada con éxito.' });
    
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

/* --- Rutas de Reseteo de Contraseña --- */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.json({ message: 'Si tu correo está registrado, recibirás un enlace.' });
    }

    const payload = { id: usuario.id_usuario, type: 'reset' };
    const resetToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

    console.log('--- SIMULACIÓN DE RECUPERO DE CONTRASEÑA ---');
    console.log(`Usuario: ${email}`);
    console.log('Token (pegar en la URL):', resetToken);
    console.log('--- FIN SIMULACIÓN ---');

    res.json({ message: 'Si tu correo está registrado, recibirás un enlace.' });
  
  } catch (err) {
    console.error('Error en forgot-password:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ msg: 'Faltan datos.' });
  try {
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ msg: 'Token inválido o expirado.' });
    }
    
    if (decoded.type !== 'reset') return res.status(401).json({ msg: 'Token inválido.' });
    
    const userId = decoded.id;
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await db.query('UPDATE USUARIO SET password_hash = $1 WHERE id_usuario = $2', [newPasswordHash, userId]);
    res.json({ msg: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.' });
  } catch (err) {
    console.error('Error en reset-password:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;