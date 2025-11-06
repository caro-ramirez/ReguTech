
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', // Tu usuario
  host: 'localhost',
  database: 'regutech_db', // Tu base de datos
  password: 'AguilA!2028', // Tu contraseña
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getPool: () => pool // <-- AÑADE ESTA LÍNEA (para poder hacer transacciones)
};