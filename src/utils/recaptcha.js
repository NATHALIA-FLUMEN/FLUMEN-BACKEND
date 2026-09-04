import axios from 'axios';

/**
 * Verifica el token de reCAPTCHA v3 contra la API de Google.
 * Devuelve true si la respuesta es válida y el score es >= umbral.
 */
export async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  // Si no hay secret configurado, modo demo: acepta cualquier token o vacío
  if (!secret || secret === 'TU_RECAPTCHA_SECRET_KEY_AQUI') {
    return { success: true, score: 1, demo: true };
  }

  if (!token) {
    return { success: false, score: 0, error: 'Token de reCAPTCHA faltante' };
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data;
    const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);
    const success = data.success && data.score >= minScore;

    return {
      success,
      score: data.score || 0,
      hostname: data.hostname,
      errors: data['error-codes'] || []
    };
  } catch (err) {
    return { success: false, score: 0, error: err.message };
  }
}
