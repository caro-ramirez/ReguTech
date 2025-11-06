// regutech-backend/routes/auditorias.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, isAdmin, isSuperAdmin } = require('../middleware/auth');

/*
 * @route   GET /api/auditorias
 * @desc    Obtener todos los Planes de Auditoría (Filtrado por ROL)
 * @access  Privado (Admin o SuperAdmin)
 */
router.get('/', verifyToken, async (req, res) => {
  const userRol = req.user.rol;
  const id_cliente = req.user.id_cliente;

  try {
    let sqlQuery;
    let params = [];

    if (userRol === 'SuperAdmin') {
      // SuperAdmin: Trae todos los planes de todos los clientes
      sqlQuery = `
        SELECT p.*, c.nombre as nombre_cliente 
        FROM PLAN_AUDITORIA p
        JOIN USUARIO u ON p.id_usuario_creador = u.id_usuario
        JOIN CLIENTE c ON u.id_cliente = c.id_cliente
        ORDER BY c.nombre, p.fecha_planificada DESC
      `;
    } else if (userRol === 'Administrador') {
      // Admin: Trae solo los planes de su cliente
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

/*
 * @route   POST /api/auditorias
 * @desc    Crear un nuevo Plan de Auditoría (Admin de Cliente)
 * @access  Administrador
 */
router.post('/', [verifyToken, isAdmin], async (req, res) => {
  const id_usuario_creador = req.user.id;
  // Obtenemos los datos del formulario (que crearemos después)
  const { fecha_planificada, area_auditar, responsable_auditoria } = req.body;

  try {
    const nuevoPlan = await db.query(
      `INSERT INTO PLAN_AUDITORIA 
        (id_plan_auditoria, id_usuario_creador, fecha_planificada, area_auditar, responsable_auditoria, estado)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [uuidv4(), id_usuario_creador, fecha_planificada, area_auditar, responsable_auditoria, 'Planificado']
    );
    res.status(201).json(nuevoPlan.rows[0]);
  } catch (err)
 {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;