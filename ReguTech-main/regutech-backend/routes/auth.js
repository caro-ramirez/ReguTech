const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { v4: uuidv4 } = require('uuid'); // <-- CORRECCIÓN 1: Importar UUID

// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar el usuario por email en la base de datos
    const result = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    // 2. Comparar la contraseña hasheada
    const match = await bcrypt.compare(password, usuario.password_hash);

    if (!match) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }
    
    // 3. Generar el token JWT (Payload)
    const payload = { 
      id: usuario.id_usuario, 
      rol: usuario.rol, 
      id_cliente: usuario.id_cliente 
    };

    const token = jwt.sign(
      payload,
      'tu_secreto_super_seguro', 
      { expiresIn: '1h' }
    );

    // 4. Enviar el token y el ROL al cliente
    res.json({ 
        message: 'Inicio de sesión exitoso.', 
        token, 
        rol: usuario.rol // <-- CORRECCIÓN 2: Enviar el rol al frontend
    });

  } catch (err) {
    console.error('Error en la autenticación:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

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

module.exports = router;