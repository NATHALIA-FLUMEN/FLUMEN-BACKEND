import { verifyToken } from '../utils/jwt.js';
import { UserModel } from '../models/UserModel.js';
import { unauthorized, forbidden } from '../utils/apiResponse.js';

export async function protect(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return unauthorized(res, 'Debes iniciar sesión para acceder');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return unauthorized(res, 'Sesión expirada o inválida');
    }

    const user = await UserModel.findById(decoded.id);
    if (!user || user.role !== decoded.role) {
      return unauthorized(res, 'Usuario no encontrado');
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    return unauthorized(res, 'Error de autenticación');
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Debes iniciar sesión');
    }
    if (!roles.includes(req.user.role)) {
      return forbidden(res, 'No tienes permisos para esta acción');
    }
    next();
  };
}

// Autentica si hay token, pero no bloquea si no hay sesión (para rutas públicas condicionales)
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split(' ')[1]);
      if (decoded) {
        const user = await UserModel.findById(decoded.id);
        if (user && user.role === decoded.role) {
          req.user = user;
          req.userId = user.id;
        }
      }
    }
    next();
  } catch (err) {
    next();
  }
}
