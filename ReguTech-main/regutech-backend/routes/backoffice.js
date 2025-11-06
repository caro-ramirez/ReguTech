// regutech-backend/routes/backoffice.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, isAdmin, isSuperAdmin } = require('../middleware/auth');

/*
 * @route   GET /api/backoffice/checklists
 * @desc    (SuperAdmin) Obtener TODOS los checklists de la plataforma
 * @access  SuperAdmin
 */
router.get('/checklists', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM CHECKLIST ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   POST /api/backoffice/checklists/:id_checklist/preguntas
 * @desc    (SuperAdmin) Añadir una nueva pregunta a un checklist (Punto de auditoría)
 * @access  SuperAdmin
 */
router.post('/checklists/:id_checklist/preguntas', [verifyToken, isSuperAdmin], async (req, res) => {
  const { id_checklist } = req.params;
  const { texto_pregunta, obligatoria, orden } = req.body;

  try {
    const nuevaPregunta = await db.query(
      `INSERT INTO PREGUNTA_CHECKLIST (id_pregunta, id_checklist, texto_pregunta, obligatoria, orden)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [uuid_generate_v4(), id_checklist, texto_pregunta, obligatoria, orden]
    );
    res.status(201).json(nuevaPregunta.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   GET /api/backoffice/clientes/:id
 * @desc    (SuperAdmin) Obtener los detalles de un cliente
 * @access  SuperAdmin
 */
router.get('/clientes/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT id_cliente, nombre FROM CLIENTE WHERE id_cliente = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Cliente no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   GET /api/backoffice/clientes/:id/usuarios
 * @desc    (SuperAdmin) Obtener todos los usuarios de un cliente
 * @access  SuperAdmin
 */
router.get('/clientes/:id/usuarios', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id_usuario, nombre_completo, email, rol, estado_cuenta FROM USUARIO WHERE id_cliente = $1 ORDER BY rol, nombre_completo', 
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   GET /api/backoffice/usuarios/:id
 * @desc    (NUEVO) (SuperAdmin) Obtener los detalles de un usuario
 * @access  SuperAdmin
 */
router.get('/usuarios/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id_usuario, nombre_completo, email, rol, estado_cuenta FROM USUARIO WHERE id_usuario = $1', 
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   PUT /api/backoffice/usuarios/:id
 * @desc    (NUEVO) (SuperAdmin) Actualizar un usuario
 * @access  SuperAdmin
 */
router.put('/usuarios/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    // El email no se puede cambiar, pero sí el nombre, rol y estado.
    const { nombre_completo, rol, estado_cuenta } = req.body;

    if (!nombre_completo || !rol || !estado_cuenta) {
      return res.status(400).json({ msg: 'Todos los campos son requeridos.' });
    }

    const result = await db.query(
      `UPDATE USUARIO 
       SET nombre_completo = $1, rol = $2, estado_cuenta = $3
       WHERE id_usuario = $4
       RETURNING id_usuario, nombre_completo, email, rol, estado_cuenta`,
      [nombre_completo, rol, estado_cuenta, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    res.json(result.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;