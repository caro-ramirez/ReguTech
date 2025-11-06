// regutech-backend/routes/checklists.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth'); // <-- 1. IMPORTAMOS EL MIDDLEWARE
const { v4: uuidv4 } = require('uuid');

/*
 * @route   GET /api/checklists
 * @desc    Obtener TODOS los checklists PENDIENTES del usuario logueado
 * @access  Privado (necesita estar logueado)
 */
// 2. PROTEGEMOS LA RUTA
router.get('/', verifyToken, async (req, res) => {
  try {
    // 3. Obtenemos el ID del usuario desde el token
    const id_usuario_logueado = req.user.id;

    // 4. Nueva consulta SQL:
    // Selecciona todos los checklists (ch) donde NO EXISTA
    // una respuesta (r) de este usuario para ese checklist.
    // (Esta es una forma simple de definir "pendiente")
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
 * @desc    Obtener un checklist específico CON SUS PREGUNTAS
 * @access  Privado
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params.id;
    
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
  const respuestas = req.body.respuestas; // Esperamos un array: [{ id_pregunta, opcion, observaciones }, ...]

  if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
    return res.status(400).json({ msg: 'Formato de respuestas inválido.' });
  }

  // Usamos una transacción para guardar todas las respuestas juntas
  const client = await db.getPool().connect(); // Necesitamos un cliente del pool para transacciones

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


module.exports = router;