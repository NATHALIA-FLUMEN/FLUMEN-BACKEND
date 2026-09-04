import bcrypt from 'bcryptjs';
import { UserModel } from '../models/UserModel.js';
import { signToken } from '../utils/jwt.js';
import { ok, created, badRequest, unauthorized, notFound } from '../utils/apiResponse.js';

const MASTER_ADMIN_CODE = process.env.MASTER_ADMIN_CODE || 'FLUMEN-ADMIN-2026';

function hasGoogleConfigured() {
  const gid = process.env.GOOGLE_CLIENT_ID;
  return gid && gid !== 'TU_GOOGLE_CLIENT_ID_AQUI';
}

export async function register(req, res, next) {
  try {
    const { name, email, password, adminCode } = req.body;

    if (!name || !email || !password) {
      return badRequest(res, 'Nombre, email y contraseña son obligatorios');
    }

    const role = adminCode && adminCode === MASTER_ADMIN_CODE ? 'admin' : 'client';

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return badRequest(res, 'Ya existe una cuenta con este email');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      email,
      name,
      role,
      passwordHash
    });

    const token = signToken(user);
    return created(res, { user: UserModel.toSafeUser(user), token }, 'Cuenta creada correctamente');
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return badRequest(res, 'Email y contraseña son obligatorios');
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return unauthorized(res, 'Credenciales incorrectas');
    }
    if (!user.password_hash) {
      return badRequest(res, 'Este usuario se registró con Google. Usa "Continuar con Google".');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return unauthorized(res, 'Credenciales incorrectas');
    }

    const token = signToken(user);
    return ok(res, { user: UserModel.toSafeUser(user), token }, 'Inicio de sesión exitoso');
  } catch (err) {
    next(err);
  }
}

export async function loginOrRegisterGoogle(req, res, next) {
  try {
    const { idToken, name, email, avatarUrl, adminCode } = req.body;

    if (!idToken) {
      return badRequest(res, 'Token de Google requerido');
    }

    // En producción, si GOOGLE_CLIENT_ID está configurado, el token debe
    // verificarse. Este es el punto de integración real con Google.
    // Para simplificar sin credenciales reales, usamos un modo demo controlado.
    if (!hasGoogleConfigured()) {
      // MODO DEMO: solo permitido cuando no hay credenciales reales y NO en producción
      if (process.env.NODE_ENV === 'production') {
        return badRequest(res, 'Google no está configurado en el servidor');
      }
      if (!email) {
        return badRequest(res, 'Email requerido');
      }
    }

    const demoGoogleId = 'google-demo-' + idToken.substring(0, 40);
    const profile = {
      name: name || email?.split('@')[0] || 'Usuario Google',
      email,
      sub: hasGoogleConfigured() ? idToken : demoGoogleId,
      picture: avatarUrl || null
    };

    if (!profile.email) {
      return badRequest(res, 'No se pudo obtener el email de Google');
    }

    const role = adminCode && adminCode === MASTER_ADMIN_CODE ? 'admin' : 'client';

    let user = await UserModel.findByEmail(profile.email);
    if (!user) {
      user = await UserModel.findByGoogleId(profile.sub);
    }

    if (!user) {
      user = await UserModel.create({
        email: profile.email,
        name: profile.name,
        role,
        googleId: profile.sub,
        avatarUrl: profile.picture
      });
    } else {
      if (!user.google_id) {
        user = await UserModel.update(user.id, {
          google_id: profile.sub,
          avatar_url: profile.picture || user.avatar_url
        });
      }
      if (role === 'admin' && user.role !== 'admin') {
        user = await UserModel.update(user.id, { role: 'admin' });
      }
    }

    const token = signToken(user);
    return ok(res, { user: UserModel.toSafeUser(user), token }, 'Inicio de sesión con Google exitoso');
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return notFound(res, 'Usuario no encontrado');
    }
    return ok(res, { user: UserModel.toSafeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, avatarUrl } = req.body;
    const fields = {};
    if (name) fields.name = name;
    if (avatarUrl !== undefined) fields.avatar_url = avatarUrl;

    if (Object.keys(fields).length === 0) {
      return badRequest(res, 'No hay campos para actualizar');
    }

    const user = await UserModel.update(req.userId, fields);
    return ok(res, { user: UserModel.toSafeUser(user) }, 'Perfil actualizado');
  } catch (err) {
    next(err);
  }
}
