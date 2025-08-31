const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Importamos el archivo de conexión a la base de datos

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Permite peticiones desde el front-end
app.use(bodyParser.json()); // Permite recibir datos en formato JSON
app.use(express.static(path.join(__dirname, '..'))); // Sirve los archivos estáticos del front-end

// Rutas
app.get('/', (req, res) => {
  res.send('Servidor de ReguTech funcionando');
});

// Importamos las rutas de autenticación
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

// Conexión a la base de datos
db.connect()
  .then(() => {
    console.log('Conexión a la base de datos establecida.');
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err.stack);
  });

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor de ReguTech escuchando en el puerto ${PORT}`);
});