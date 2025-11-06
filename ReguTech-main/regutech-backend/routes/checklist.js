// regutech-backend/routes/checklists.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth'); 
const { v4: uuidv4 } = require('uuid');

/*
 * @route   GET /api/checklists
 * @desc    Obtener TODOS los checklists PENDIENTES del usuario logueado (para el Dashboard)
 * @access  Privado
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const id_usuario_logueado = req.user.id;
    const sqlQuery = `
      SELECT ch.*
      FROM CHECKLIST ch
      WHERE NOT EXISTS (
        SELECT 1
        FROM RESPUESTA_CHECKLIST r
        WHERE r.id_checklist = ch.id_checklist AND r.id_usuario = $1
      )
      ORDER BY ch.nombre;
    `;
    
    const { rows } = await db.query(sqlQuery, [id_usuario_logueado]);
    res.json(rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   GET /api/checklists/:id
 * @desc    Obtener un checklist específico CON SUS PREGUNTAS (para responderlo)
 * @access  Privado
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params; // Corregido, no era req.params.id.id
    
    // 1. Obtener el checklist
    const checklistRes = await db.query('SELECT * FROM CHECKLIST WHERE id_checklist = $1', [id]);
    if (checklistRes.rows.length === 0) {
      return res.status(404).json({ msg: 'Checklist no encontrado' });
    }
    
    // 2. Obtener las preguntas
    const preguntasRes = await db.query(
      'SELECT * FROM PREGUNTA_CHECKLIST WHERE id_checklist = $1 ORDER BY orden', 
      [id]
    );
    
    const checklist = checklistRes.rows[0];
    checklist.preguntas = preguntasRes.rows;
    
    res.json(checklist);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});


/*
 * @route   POST /api/checklists/:id_checklist/responder
 * @desc    Guardar las respuestas de un checklist
 * @access  Privado
 */
router.post('/:id_checklist/responder', verifyToken, async (req, res) => {
  const { id_checklist } = req.params;
  const id_usuario = req.user.id;
  const respuestas = req.body.respuestas; 

  if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
    return res.status(400).json({ msg: 'Formato de respuestas inválido.' });
  }

  // Usamos una transacción para guardar todas las respuestas juntas
  // Usamos 'pool' en lugar de 'db.getPool()' basado en tu db.js
  const client = await db.query('SELECT 1').then(() => db.getPool().connect()); 

  try {
    await client.query('BEGIN');
    
    for (const res of respuestas) {
      const sqlQuery = `
        INSERT INTO RESPUESTA_CHECKLIST 
          (id_respuesta, id_usuario, id_pregunta, id_checklist, opcion_seleccionada, observaciones, fecha_respuesta)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7)
      `;
      await client.query(sqlQuery, [
        uuidv4(),
        id_usuario,
        res.id_pregunta,
        id_checklist,
        res.opcion_seleccionada,
        res.observaciones,
        new Date()
      ]);
    }
    
    await client.query('COMMIT');
    res.status(201).json({ msg: 'Respuestas guardadas con éxito' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en transacción de respuestas:', err.message);
    res.status(500).send('Error del servidor al guardar respuestas');
  } finally {
    client.release(); // Siempre liberar el cliente al pool
  }
});


/*
 * @route   GET /api/checklists/status
 * @desc    (NUEVO) Obtener TODOS los checklists y el estado de progreso del usuario
 * @access  Privado
 */
router.get('/status', verifyToken, async (req, res) => {
  const id_usuario_logueado = req.user.id;

  try {
    // Esta consulta (query) usa "Common Table Expressions" (WITH) para:
    // 1. Contar el total de preguntas de cada checklist.
    // 2. Contar el total de respuestas que ESTE usuario ha dado para cada checklist.
    // 3. Unir todo con la tabla principal de Checklists.
    const sqlQuery = `
      WITH TotalPreguntas AS (
        SELECT 
          id_checklist, 
          COUNT(id_pregunta) AS total_preguntas
        FROM PREGUNTA_CHECKLIST
        GROUP BY id_checklist
      ),
      TotalRespuestas AS (
        SELECT 
          id_checklist, 
          COUNT(id_respuesta) AS total_respuestas
        FROM RESPUESTA_CHECKLIST
        WHERE id_usuario = $1
        GROUP BY id_checklist
      )
      SELECT
        c.id_checklist,
        c.nombre,
        COALESCE(tp.total_preguntas, 0) AS total_preguntas,
        COALESCE(tr.total_respuestas, 0) AS total_respuestas
      FROM CHECKLIST c
      LEFT JOIN TotalPreguntas tp ON c.id_checklist = tp.id_checklist
      LEFT JOIN TotalRespuestas tr ON c.id_checklist = tr.id_checklist
      ORDER BY c.nombre;
    `;
    
    const { rows } = await db.query(sqlQuery, [id_usuario_logueado]);
    res.json(rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});


module.exports = router;