// regutech-backend/index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db'); 

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); 
app.use(bodyParser.json()); 

// --- ¡¡ESTA ES LA LÍNEA QUE FALTABA!! ---
// Le dice a Express que sirva todos los archivos (HTML, CSS, JS) 
// de la carpeta superior (la que contiene 'regutech-backend' y tus .html).
app.use(express.static(path.join(__dirname, '..'))); 
// ------------------------------------------

// --- Rutas de API ---
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes); 

const policyRoutes = require('./routes/policies.js');
app.use('/api/policies', policyRoutes);

const checklistRoutes = require('./routes/checklist'); // Usamos el singular 'checklist.js'
app.use('/api/checklists', checklistRoutes);

const riesgoRoutes = require('./routes/riesgos.js');
app.use('/api/riesgos', riesgoRoutes);

const auditoriaRoutes = require('./routes/auditorias.js');
app.use('/api/auditorias', auditoriaRoutes);

const planesRoutes = require('./routes/planes.js');
app.use('/api/planes', planesRoutes);

const backofficeRoutes = require('./routes/backoffice.js');
app.use('/api/backoffice', backofficeRoutes);

// --- Iniciar el servidor ---
app.listen(PORT, () => {
  console.log(`Servidor de ReguTech escuchando en el puerto ${PORT}`);
});