// regutech-backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'tu_secreto_super_seguro'; 

// 1. Verifica si el token es válido (EXISTENTE)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
    return res.status(401).json({ message: 'Acceso no autorizado. Se requiere un token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
    req.user = user;
    next(); 
  });
};

// 2. Verifica si es Admin de un CLIENTE (EXISTENTE)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'Administrador') {
    next(); 
  } else {
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Administrador.' });
  }
};

// 3. Verifica si es Admin de REGUTECH (NUEVO)
const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'SuperAdmin') {
    next(); 
  } else {
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de SuperAdmin.' });
  }
};

// Exportamos las tres funciones
module.exports = {
  verifyToken,
  isAdmin,
  isSuperAdmin
};