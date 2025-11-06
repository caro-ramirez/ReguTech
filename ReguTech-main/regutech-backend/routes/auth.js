// regutech-backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth'); 

// Clave secreta (debe estar en un .env)
const JWT_SECRET = 'tu_secreto_super_seguro';

// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
    const usuario = result.rows[0];
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }
    const match = await bcrypt.compare(password, usuario.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }
    const payload = { id: usuario.id_usuario, rol: usuario.rol, id_cliente: usuario.id_cliente };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Inicio de sesión exitoso.', token, rol: usuario.rol });
  } catch (err) {
    console.error('Error en la autenticación:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Ruta para crear el primer admin y cliente (SuperAdmin)
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

// --- Rutas de Perfil de Usuario ---
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


/*
 * @route   POST /api/forgot-password
 * @desc    (NUEVO) Inicia el proceso de reseteo de contraseña
 * @access  Público
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
    const usuario = result.rows[0];

    if (!usuario) {
      // No revelamos si el usuario existe o no por seguridad
      return res.json({ message: 'Si tu correo está registrado, recibirás un enlace.' });
    }

    // Creamos un token de reseteo especial que expira en 15 minutos
    const payload = { id: usuario.id_usuario, type: 'reset' };
    const resetToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

    // --- SIMULACIÓN DE ENVÍO DE EMAIL ---
    // En una app real, aquí enviarías un email al 'email' del usuario
    // con un enlace: `https://tu-sitio.com/reset-password.html?token=${resetToken}`
    
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

/*
 * @route   POST /api/reset-password
 * @desc    (NUEVO) Resetea la contraseña usando un token
 * @access  Público
 */
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ msg: 'Faltan datos.' });
  }

  try {
    // 1. Verificar el token de reseteo
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ msg: 'Token inválido o expirado.' });
    }
    
    // Asegurarnos de que es un token de tipo 'reset'
    if (decoded.type !== 'reset') {
      return res.status(401).json({ msg: 'Token inválido.' });
    }
    
    const userId = decoded.id;

    // 2. Hashear la nueva contraseña
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 3. Actualizar la contraseña en la BD
    await db.query('UPDATE USUARIO SET password_hash = $1 WHERE id_usuario = $2', [newPasswordHash, userId]);

    res.json({ msg: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.' });

  } catch (err) {
    console.error('Error en reset-password:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;