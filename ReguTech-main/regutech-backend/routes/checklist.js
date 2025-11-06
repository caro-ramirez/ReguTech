// routes/checklists.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Importa tu conexión a la BD

/*
 * @route   GET /api/checklists
 * @desc    Obtener todos los checklists (Listado checklists )
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM CHECKLIST');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   GET /api/checklists/:id
 * @desc    Obtener un checklist específico con sus preguntas
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el checklist
    const checklistRes = await db.query('SELECT * FROM CHECKLIST WHERE id_checklist = $1', [id]);
    if (checklistRes.rows.length === 0) {
      return res.status(404).json({ msg: 'Checklist no encontrado' });
    }

    // Obtener las preguntas
    const preguntasRes = await db.query('SELECT * FROM PREGUNTA_CHECKLIST WHERE id_checklist = $1 ORDER BY orden', [id]);

    const checklist = checklistRes.rows[0];
    checklist.preguntas = preguntasRes.rows;

    res.json(checklist);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// Aquí puedes agregar los POST para las respuestas (Responder checklists )

module.exports = router;