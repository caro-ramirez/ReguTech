// regutech-backend/routes/riesgos.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, isAdmin, isSuperAdmin } = require('../middleware/auth');

/*
 * @route   POST /api/riesgos
 * @desc    Crear un nuevo Riesgo/Oportunidad (Solo Admin de Cliente)
 * @access  Administrador
 */
router.post('/', [verifyToken, isAdmin], async (req, res) => {
  const id_usuario_creador = req.user.id;
  const { descripcion, tipo, probabilidad, impacto } = req.body;

  try {
    const nuevoRiesgo = await db.query(
      `INSERT INTO RIESGO_OPORTUNIDAD (id_riesgo_oportunidad, id_usuario_creador, descripcion, tipo, probabilidad, impacto, fecha_identificacion, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [uuidv4(), id_usuario_creador, descripcion, tipo, probabilidad, impacto, new Date(), 'Abierto']
    );
    res.status(201).json(nuevoRiesgo.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   GET /api/riesgos
 * @desc    Obtener todos los Riesgos (Filtrado por ROL)
 * @access  Privado (Admin o SuperAdmin)
 */
router.get('/', verifyToken, async (req, res) => {
  const userRol = req.user.rol;
  const id_cliente = req.user.id_cliente;

  try {
    let sqlQuery;
    let params = [];

    if (userRol === 'SuperAdmin') {
      sqlQuery = `
        SELECT r.*, c.nombre as nombre_cliente 
        FROM RIESGO_OPORTUNIDAD r
        JOIN USUARIO u ON r.id_usuario_creador = u.id_usuario
        JOIN CLIENTE c ON u.id_cliente = c.id_cliente
        ORDER BY c.nombre, r.fecha_identificacion DESC
      `;
    } else if (userRol === 'Administrador') {
      sqlQuery = `
        SELECT r.* FROM RIESGO_OPORTUNIDAD r
        JOIN USUARIO u ON r.id_usuario_creador = u.id_usuario
        WHERE u.id_cliente = $1
        ORDER BY r.fecha_identificacion DESC
      `;
      params = [id_cliente];
    } else {
      return res.status(403).json({ msg: 'Acceso denegado.' });
    }

    const { rows } = await db.query(sqlQuery, params);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   GET /api/riesgos/:id
 * @desc    (NUEVO) Obtener un riesgo específico por ID
 * @access  Privado (Admin o SuperAdmin)
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userRol = req.user.rol;
    const id_cliente = req.user.id_cliente;

    let sqlQuery;
    let params = [id];

    if (userRol === 'SuperAdmin') {
      // SuperAdmin puede ver cualquiera
      sqlQuery = 'SELECT * FROM RIESGO_OPORTUNIDAD WHERE id_riesgo_oportunidad = $1';
    } else if (userRol === 'Administrador') {
      // Admin solo puede ver los de su cliente
      sqlQuery = `
        SELECT r.* FROM RIESGO_OPORTUNIDAD r
        JOIN USUARIO u ON r.id_usuario_creador = u.id_usuario
        WHERE r.id_riesgo_oportunidad = $1 AND u.id_cliente = $2
      `;
      params.push(id_cliente);
    } else {
      return res.status(403).json({ msg: 'Acceso denegado.' });
    }

    const result = await db.query(sqlQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Riesgo no encontrado o no tiene permiso para verlo.' });
    }
    
    res.json(result.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   PUT /api/riesgos/:id
 * @desc    (NUEVO) Actualizar un riesgo específico
 * @access  Privado (Admin o SuperAdmin)
 */
router.put('/:id', [verifyToken, isAdmin], async (req, res) => {
  // Por ahora, solo los Admins de cliente pueden editar (no SuperAdmins)
  // Podríamos mejorar esto con un middleware más complejo
  try {
    const { id } = req.params;
    const id_cliente = req.user.id_cliente;
    const { descripcion, tipo, probabilidad, impacto } = req.body;

    // 1. Verificar que el riesgo pertenece al cliente del admin
    const checkOwner = await db.query(
      `SELECT r.id_riesgo_oportunidad FROM RIESGO_OPORTUNIDAD r
       JOIN USUARIO u ON r.id_usuario_creador = u.id_usuario
       WHERE r.id_riesgo_oportunidad = $1 AND u.id_cliente = $2`,
      [id, id_cliente]
    );

    if (checkOwner.rows.length === 0) {
      return res.status(403).json({ msg: 'No tiene permiso para editar este riesgo.' });
    }
    
    // 2. Si es el dueño, actualizar
    const updateQuery = `
      UPDATE RIESGO_OPORTUNIDAD
      SET descripcion = $1, tipo = $2, probabilidad = $3, impacto = $4
      WHERE id_riesgo_oportunidad = $5
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [descripcion, tipo, probabilidad, impacto, id]);
    
    res.json(result.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;