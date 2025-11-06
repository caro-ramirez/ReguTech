// regutech-backend/routes/auditorias.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, isAdmin, isSuperAdmin } = require('../middleware/auth');

// ... (Rutas GET / y POST / de auditorias - sin cambios)
router.get('/', verifyToken, async (req, res) => {
  const userRol = req.user.rol;
  const id_cliente = req.user.id_cliente;
  try {
    let sqlQuery;
    let params = [];
    if (userRol === 'SuperAdmin') {
      sqlQuery = `
        SELECT p.*, c.nombre as nombre_cliente 
        FROM PLAN_AUDITORIA p
        JOIN USUARIO u ON p.id_usuario_creador = u.id_usuario
        JOIN CLIENTE c ON u.id_cliente = c.id_cliente
        ORDER BY c.nombre, p.fecha_planificada DESC
      `;
    } else if (userRol === 'Administrador') {
      sqlQuery = `
        SELECT p.* FROM PLAN_AUDITORIA p
        JOIN USUARIO u ON p.id_usuario_creador = u.id_usuario
        WHERE u.id_cliente = $1
        ORDER BY p.fecha_planificada DESC
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
router.post('/', [verifyToken, isAdmin], async (req, res) => {
  const id_usuario_creador = req.user.id;
  const { fecha_planificada, area_auditar, responsable_auditoria, objetivo } = req.body;
  if (!fecha_planificada || !area_auditar || !responsable_auditoria) {
      return res.status(400).json({ msg: 'Por favor complete todos los campos obligatorios.' });
  }
  try {
    const nuevoPlan = await db.query(
      `INSERT INTO PLAN_AUDITORIA 
        (id_plan_auditoria, id_usuario_creador, fecha_planificada, area_auditar, responsable_auditoria, objetivo, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [uuidv4(), id_usuario_creador, fecha_planificada, area_auditar, responsable_auditoria, objetivo, 'Planificado']
    );
    res.status(201).json(nuevoPlan.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// ... (Ruta GET /:id - sin cambios)
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { rol, id_cliente } = req.user;
  try {
    let sqlQuery;
    let params = [id];
    if (rol === 'SuperAdmin') {
      sqlQuery = 'SELECT * FROM PLAN_AUDITORIA WHERE id_plan_auditoria = $1';
    } else if (rol === 'Administrador') {
      sqlQuery = `
        SELECT p.* FROM PLAN_AUDITORIA p
        JOIN USUARIO u ON p.id_usuario_creador = u.id_usuario
        WHERE p.id_plan_auditoria = $1 AND u.id_cliente = $2
      `;
      params.push(id_cliente);
    } else {
      return res.status(403).json({ msg: 'Acceso denegado.' });
    }
    const result = await db.query(sqlQuery, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Plan de auditoría no encontrado o no tiene permiso.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// ... (Ruta POST /:id/hallazgos - sin cambios)
router.post('/:id/hallazgos', [verifyToken, isAdmin], async (req, res) => {
  const id_plan_auditoria = req.params.id;
  const { tipo_hallazgo, descripcion } = req.body; 
  if (!tipo_hallazgo || !descripcion) {
      return res.status(400).json({ msg: 'El tipo y la descripción del hallazgo son obligatorios.' });
  }
  try {
    const nuevoHallazgo = await db.query(
      `INSERT INTO HALLAZGO_AUDITORIA 
        (id_hallazgo, id_plan_auditoria, descripcion, tipo_hallazgo, fecha_registro)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [uuidv4(), id_plan_auditoria, descripcion, tipo_hallazgo, new Date()]
    );
    res.status(201).json(nuevoHallazgo.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// ... (Ruta GET /:id/hallazgos - sin cambios)
router.get('/:id/hallazgos', verifyToken, async (req, res) => {
  const id_plan_auditoria = req.params.id;
  const { rol, id_cliente } = req.user;
  try {
    let checkQuery;
    let checkParams = [id_plan_auditoria];
    if (rol === 'SuperAdmin') {
      checkQuery = 'SELECT 1 FROM PLAN_AUDITORIA WHERE id_plan_auditoria = $1';
    } else if (rol === 'Administrador') {
      checkQuery = `
        SELECT 1 FROM PLAN_AUDITORIA p
        JOIN USUARIO u ON p.id_usuario_creador = u.id_usuario
        WHERE p.id_plan_auditoria = $1 AND u.id_cliente = $2
      `;
      checkParams.push(id_cliente);
    } else {
      return res.status(403).json({ msg: 'Acceso denegado.' });
    }
    const checkResult = await db.query(checkQuery, checkParams);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Plan de auditoría no encontrado o sin permiso.' });
    }
    const hallazgosResult = await db.query(
      'SELECT * FROM HALLAZGO_AUDITORIA WHERE id_plan_auditoria = $1 ORDER BY fecha_registro DESC',
      [id_plan_auditoria]
    );
    res.json(hallazgosResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   GET /api/auditorias/hallazgos/:id
 * @desc    (NUEVO) Obtener un hallazgo específico por su ID
 * @access  Privado (Admin o SuperAdmin)
 */
router.get('/hallazgos/:id', verifyToken, async (req, res) => {
  const id_hallazgo = req.params.id;
  const { rol, id_cliente } = req.user;

  try {
    // 1. Verificar que el usuario tiene permiso para ver este hallazgo
    let checkQuery;
    let checkParams = [id_hallazgo];
    if (rol === 'SuperAdmin') {
      checkQuery = 'SELECT * FROM HALLAZGO_AUDITORIA WHERE id_hallazgo = $1';
    } else if (rol === 'Administrador') {
      checkQuery = `
        SELECT h.* FROM HALLAZGO_AUDITORIA h
        JOIN PLAN_AUDITORIA p ON h.id_plan_auditoria = p.id_plan_auditoria
        JOIN USUARIO u ON p.id_usuario_creador = u.id_usuario
        WHERE h.id_hallazgo = $1 AND u.id_cliente = $2
      `;
      checkParams.push(id_cliente);
    } else {
      return res.status(403).json({ msg: 'Acceso denegado.' });
    }

    const result = await db.query(checkQuery, checkParams);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Hallazgo no encontrado o sin permiso.' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;