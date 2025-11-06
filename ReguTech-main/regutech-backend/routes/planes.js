// regutech-backend/routes/planes.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, isAdmin } = require('../middleware/auth');

/*
 * @route   POST /api/planes
 * @desc    Crear un nuevo Plan de Acción de Mejora
 * @access  Administrador
 */
router.post('/', [verifyToken, isAdmin], async (req, res) => {
  const id_usuario_creador = req.user.id;
  const {
    id_hallazgo, // El ID del hallazgo que estamos solucionando
    area_afectada,
    accion_propuesta,
    responsable_asignado,
    fecha_limite,
    descripcion_detallada
  } = req.body;

  // Validación
  if (!area_afectada || !accion_propuesta || !responsable_asignado || !fecha_limite) {
    return res.status(400).json({ msg: 'Por favor complete todos los campos obligatorios.' });
  }

  try {
    const nuevoPlan = await db.query(
      `INSERT INTO PLAN_ACCION_MEJORA 
        (id_plan_accion, id_usuario_creador, id_hallazgo, area_afectada, accion_propuesta, responsable_asignado, fecha_limite, descripcion_detallada, estado, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        uuidv4(),
        id_usuario_creador,
        id_hallazgo, // Puede ser null si se crea sin hallazgo
        area_afectada,
        accion_propuesta,
        responsable_asignado,
        fecha_limite,
        descripcion_detallada,
        'Pendiente', // Estado inicial
        new Date()
      ]
    );
    res.status(201).json(nuevoPlan.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;