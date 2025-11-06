// regutech-backend/routes/backoffice.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
// Importamos los 3 middlewares
const { verifyToken, isAdmin, isSuperAdmin } = require('../middleware/auth');

/*
 * @route   GET /api/backoffice/checklists
 * @desc    (SuperAdmin) Obtener TODOS los checklists de la plataforma
 * @access  SuperAdmin
 */
router.get('/checklists', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    // No filtramos por cliente, traemos todo
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

module.exports = router;