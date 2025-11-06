// regutech-backend/routes/policies.js

const express = require('express');
const router = express.Router();
const db = require('../db'); 
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth');

/*
 * @route   GET /api/policies
 * @desc    Obtener TODAS las políticas PENDIENTES del usuario logueado (para el Dashboard)
 * @access  Privado
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const id_usuario_logueado = req.user.id;
    const sqlQuery = `
      SELECT p.* FROM POLITICA_COMPLIANCE p
      LEFT JOIN CONFIRMACION_LECTURA c 
        ON p.id_politica = c.id_politica AND c.id_usuario = $1
      WHERE c.id_confirmacion IS NULL
      ORDER BY p.nombre;
    `;
    const { rows } = await db.query(sqlQuery, [id_usuario_logueado]);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   GET /api/policies/:id
 * @desc    Obtener el detalle de UNA política (para leerla)
 * @access  Privado
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM POLITICA_COMPLIANCE WHERE id_politica = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Política no encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   POST /api/policies/:id/confirm
 * @desc    Confirmar la lectura de una política (CU-001-001)
 * @access  Privado
 */
router.post('/:id/confirm', verifyToken, async (req, res) => {
  const id_politica = req.params.id;
  const id_usuario = req.user.id; 

  try {
    const yaConfirmo = await db.query(
      'SELECT * FROM CONFIRMACION_LECTURA WHERE id_usuario = $1 AND id_politica = $2',
      [id_usuario, id_politica]
    );

    if (yaConfirmo.rows.length > 0) {
      return res.status(400).json({ msg: 'Esta política ya fue confirmada' });
    }

    const nuevaConfirmacion = await db.query(
      `INSERT INTO CONFIRMACION_LECTURA (id_confirmacion, id_usuario, id_politica, fecha_confirmacion)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [uuidv4(), id_usuario, id_politica, new Date()]
    );

    res.status(201).json({
      msg: 'Lectura confirmada con éxito',
      data: nuevaConfirmacion.rows[0]
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   GET /api/policies/status
 * @desc    (NUEVO) Obtener TODAS las políticas y el estado de lectura del usuario
 * @access  Privado
 */
router.get('/status', verifyToken, async (req, res) => {
  const id_usuario_logueado = req.user.id;
  try {
    // Usamos un LEFT JOIN. Si c.id_confirmacion no es NULL, el usuario la ha leído.
    const sqlQuery = `
      SELECT 
        p.id_politica,
        p.nombre,
        p.version,
        c.id_confirmacion IS NOT NULL AS leida
      FROM POLITICA_COMPLIANCE p
      LEFT JOIN CONFIRMACION_LECTURA c 
        ON p.id_politica = c.id_politica AND c.id_usuario = $1
      ORDER BY p.nombre;
    `;
    const { rows } = await db.query(sqlQuery, [id_usuario_logueado]);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;