export function ok(res, data, message, meta = {}) {
  res.status(200).json({ success: true, message, data, ...meta });
}

export function created(res, data, message) {
  res.status(201).json({ success: true, message, data });
}

export function badRequest(res, message) {
  res.status(400).json({ success: false, message });
}

export function unauthorized(res, message = 'No autorizado') {
  res.status(401).json({ success: false, message });
}

export function forbidden(res, message = 'Acceso denegado') {
  res.status(403).json({ success: false, message });
}

export function notFound(res, message = 'Recurso no encontrado') {
  res.status(404).json({ success: false, message });
}
