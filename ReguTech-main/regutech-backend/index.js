// regutech-backend/index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(express.static(path.join(__dirname, '..'))); 

// Rutas
app.get('/', (req, res) => {
  res.send('Servidor de ReguTech funcionando');
});

// Importamos las rutas de autenticación
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes); // Prefijo /api (tus rutas serán /api/login, /api/register)

const policyRoutes = require('./routes/policies.js');
app.use('/api/policies', policyRoutes);

const checklistRoutes = require('./routes/checklists');
app.use('/api/checklists', checklistRoutes);

const riesgoRoutes = require('./routes/riesgos.js');
app.use('/api/riesgos', riesgoRoutes);

const backofficeRoutes = require('./routes/backoffice.js');
app.use('/api/backoffice', backofficeRoutes);

// --- AÑADIR ESTAS DOS LÍNEAS ---
const auditoriaRoutes = require('./routes/auditorias.js');
app.use('/api/auditorias', auditoriaRoutes);
// ---------------------------------

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor de ReguTech escuchando en el puerto ${PORT}`);
});