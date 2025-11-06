// regutech-backend/routes/backoffice.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, isAdmin, isSuperAdmin } = require('../middleware/auth');

/*
 * @route   GET /api/backoffice/stats
 * @desc    (NUEVO) (SuperAdmin) Obtener estadísticas globales de la plataforma
 * @access  SuperAdmin
 */
router.get('/stats', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    // Usamos Promise.all para correr las consultas en paralelo
    const [clientCountRes, userCountRes, hallazgoCountRes] = await Promise.all([
      db.query('SELECT COUNT(*) FROM CLIENTE'),
      db.query("SELECT COUNT(*) FROM USUARIO WHERE rol != 'SuperAdmin'"), // Contar solo usuarios de clientes
      db.query('SELECT COUNT(*) FROM HALLAZGO_AUDITORIA')
    ]);

    const stats = {
      total_clientes: parseInt(clientCountRes.rows[0].count, 10),
      total_usuarios: parseInt(userCountRes.rows[0].count, 10),
      total_hallazgos: parseInt(hallazgoCountRes.rows[0].count, 10)
      // Puedes añadir más queries aquí (ej. total_riesgos)
    };

    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

/*
 * @route   POST /api/backoffice/checklists
 * @desc    (SuperAdmin) Crear una nueva plantilla de checklist
 * @access  SuperAdmin
 */
router.post('/checklists', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ msg: 'El nombre es obligatorio.' });
    const newChecklist = await db.query(
      `INSERT INTO CHECKLIST (id_checklist, nombre, descripcion, version, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [uuidv4(), nombre, descripcion, 'v1.0', new Date()]
    );
    res.status(201).json(newChecklist.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

/*
 * @route   POST /api/backoffice/politicas
 * @desc    (SuperAdmin) Crear una nueva plantilla de política
 * @access  SuperAdmin
 */
router.post('/politicas', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { nombre, contenido } = req.body;
    if (!nombre) return res.status(400).json({ msg: 'El nombre es obligatorio.' });
    const newPolicy = await db.query(
      `INSERT INTO POLITICA_COMPLIANCE (id_politica, nombre, contenido, version, fecha_publicacion)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [uuidv4(), nombre, contenido, 'v1.0', new Date()]
    );
    res.status(201).json(newPolicy.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});


/*
 * @route   GET /api/backoffice/clientes
 * @desc    (SuperAdmin) Obtener TODOS los clientes (empresas)
 * @access  SuperAdmin
 */
router.get('/clientes', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const sqlQuery = `
      SELECT
          c.id_cliente,
          c.nombre,
          c.fecha_creacion,
          COUNT(u.id_usuario) AS user_count
      FROM CLIENTE c
      LEFT JOIN USUARIO u ON c.id_cliente = u.id_cliente
      GROUP BY c.id_cliente, c.nombre, c.fecha_creacion
      ORDER BY c.nombre;
    `;
    const { rows } = await db.query(sqlQuery);
    res.json(rows);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});


/*
 * @route   GET /api/backoffice/checklists
 * @desc    (SuperAdmin) Obtener TODOS los checklists de la plataforma
 * @access  SuperAdmin
 */
router.get('/checklists', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM CHECKLIST ORDER BY nombre');
    res.json(rows);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

/*
 * @route   GET /api/backoffice/politicas
 * @desc    (SuperAdmin) Obtener TODAS las políticas de la plataforma
 * @access  SuperAdmin
 */
router.get('/politicas', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM POLITICA_COMPLIANCE ORDER BY nombre');
    res.json(rows);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

/*
 * @route   GET /api/backoffice/checklists/:id
 * @desc    (SuperAdmin) Obtener una plantilla de checklist
 * @access  SuperAdmin
 */
router.get('/checklists/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM CHECKLIST WHERE id_checklist = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Checklist no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

/*
 * @route   PUT /api/backoffice/checklists/:id
 * @desc    (SuperAdmin) Actualizar una plantilla de checklist
 * @access  SuperAdmin
 */
router.put('/checklists/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ msg: 'El nombre es obligatorio.' });
    const result = await db.query(
      `UPDATE CHECKLIST SET nombre = $1, descripcion = $2
       WHERE id_checklist = $3 RETURNING *`,
      [nombre, descripcion, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Checklist no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

/*
 * @route   GET /api/backoffice/politicas/:id
 * @desc    (SuperAdmin) Obtener una plantilla de política
 * @access  SuperAdmin
 */
router.get('/politicas/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM POLITICA_COMPLIANCE WHERE id_politica = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Política no encontrada.' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

/*
 * @route   PUT /api/backoffice/politicas/:id
 * @desc    (SuperAdmin) Actualizar una plantilla de política
 * @access  SuperAdmin
 */
router.put('/politicas/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contenido } = req.body;
    if (!nombre) return res.status(400).json({ msg: 'El nombre es obligatorio.' });
    const result = await db.query(
      `UPDATE POLITICA_COMPLIANCE SET nombre = $1, contenido = $2
       WHERE id_politica = $3 RETURNING *`,
      [nombre, contenido, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Política no encontrada.' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});


/* --- RUTAS DE CLIENTES Y USUARIOS --- */

router.get('/clientes/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT id_cliente, nombre FROM CLIENTE WHERE id_cliente = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Cliente no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

router.get('/clientes/:id/usuarios', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id_usuario, nombre_completo, email, rol, estado_cuenta FROM USUARIO WHERE id_cliente = $1 ORDER BY rol, nombre_completo', [id]
    );
    res.json(result.rows);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

router.get('/usuarios/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id_usuario, nombre_completo, email, rol, estado_cuenta FROM USUARIO WHERE id_usuario = $1', [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

router.put('/usuarios/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, rol, estado_cuenta } = req.body;
    if (!nombre_completo || !rol || !estado_cuenta) return res.status(400).json({ msg: 'Todos los campos son requeridos.' });
    const result = await db.query(
      `UPDATE USUARIO SET nombre_completo = $1, rol = $2, estado_cuenta = $3
       WHERE id_usuario = $4 RETURNING id_usuario, nombre_completo, email, rol, estado_cuenta`,
      [nombre_completo, rol, estado_cuenta, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

router.delete('/usuarios/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === id) return res.status(400).json({ msg: 'No puedes eliminar tu propia cuenta.' });
    const result = await db.query('DELETE FROM USUARIO WHERE id_usuario = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Usuario no encontrado.' });
    res.json({ msg: 'Usuario eliminado con éxito.' });
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

/* --- RUTAS DE GESTIÓN DE PREGUNTAS --- */

router.post('/checklists/:id/preguntas', [verifyToken, isSuperAdmin], async (req, res) => {
  const  id_checklist = req.params.id;
  const { texto_pregunta, obligatoria, orden } = req.body;
  try {
    const nuevaPregunta = await db.query(
      `INSERT INTO PREGUNTA_CHECKLIST (id_pregunta, id_checklist, texto_pregunta, obligatoria, orden)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [uuidv4(), id_checklist, texto_pregunta, obligatoria, orden]
    );
    res.status(201).json(nuevaPregunta.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

router.get('/checklists/:id/preguntas', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT 1 FROM CHECKLIST WHERE id_checklist = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ msg: 'Checklist no encontrado.' });
    const result = await db.query(
      'SELECT * FROM PREGUNTA_CHECKLIST WHERE id_checklist = $1 ORDER BY orden, texto_pregunta',
      [id]
    );
    res.json(result.rows);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

router.delete('/preguntas/:id', [verifyToken, isSuperAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM PREGUNTA_CHECKLIST WHERE id_pregunta = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Pregunta no encontrada.' });
    res.json({ msg: 'Pregunta eliminada con éxito.' });
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

module.exports = router;