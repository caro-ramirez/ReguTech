const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Obtener el token de la cabecera 'Authorization'
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // El formato es "Bearer TOKEN"

  if (token == null) {
    // Si no hay token, no está autorizado
    return res.status(401).json({ message: 'Acceso no autorizado. Se requiere un token.' });
  }

  jwt.verify(token, 'tu_secreto_super_seguro', (err, user) => {
    if (err) {
      // Si el token no es válido o ha expirado
      return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
    // El token es válido, guardamos la información del usuario en la petición
    req.user = user;
    next(); // Pasa al siguiente middleware o a la lógica de la ruta
  });
};

module.exports = authMiddleware;