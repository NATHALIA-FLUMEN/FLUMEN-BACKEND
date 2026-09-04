import Stripe from 'stripe';
import { VideoModel } from '../models/VideoModel.js';
import { OrderModel } from '../models/OrderModel.js';
import { ok, badRequest, notFound, unauthorized } from '../utils/apiResponse.js';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripeConfigured = stripeSecret && stripeSecret.startsWith('sk_');
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

let stripe = null;
if (stripeConfigured) {
  stripe = new Stripe(stripeSecret);
}

const CURRENCY = process.env.STRIPE_CURRENCY || 'usd';

/**
 * Crea un Checkout Session de Stripe que acepta todos los métodos de pago
 * habilitados para la cuenta (tarjetas, wallets, transferencia, etc.)
 */
export async function createCheckoutSession(req, res, next) {
  try {
    if (!stripeConfigured) {
      return badRequest(res, 'Pagos no configurados en el servidor. Agrega STRIPE_SECRET_KEY.');
    }

    const { videoId } = req.body;
    const id = Number(videoId);
    if (!Number.isInteger(id) || id <= 0) {
      return badRequest(res, 'Video no válido');
    }

    const video = await VideoModel.findById(id);
    if (!video) {
      return notFound(res, 'Video no encontrado');
    }

    const price = Number(video.price);
    if (price <= 0) {
      return badRequest(res, 'Este video es gratuito');
    }

    // Evitar pagos duplicados: si ya lo compró
    const already = await OrderModel.create({
      userId: req.user.id,
      videoId: video.id,
      amount: price,
      status: 'pending'
    });
    if (already && already.duplicate) {
      return ok(res, null, 'Ya tienes acceso a este video');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: [
        'card',
        'link',
        'paypal',
        'google_pay',
        'apple_pay',
        'us_bank_account',
        'ideal',
        'bancontact',
        'sepa_debit',
        'klarna',
        'sofort',
        'afterpay_clearpay',
        'acss_debit'
      ],
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: video.title,
              description: video.description || '',
              images: video.thumbnail ? [video.thumbnail] : []
            },
            unit_amount: Math.round(price * 100)
          },
          quantity: 1
        }
      ],
      metadata: {
        userId: req.user.id,
        videoId: video.id,
        price: String(price)
      },
      success_url: `${CLIENT_URL}/pago/exito?session_id={CHECKOUT_SESSION_ID}&video=${video.id}`,
      cancel_url: `${CLIENT_URL}/video/${video.id}?cancelado=1`,
      customer_email: req.user.email,
      client_reference_id: req.user.id
    });

    return ok(res, { sessionId: session.id, url: session.url }, 'Sesión de pago creada');
  } catch (err) {
    next(err);
  }
}

/**
 * Endpoint para confirmar el pago y crear la orden de acceso al video.
 * Se llama desde el frontend tras el redirect exitoso.
 */
export async function confirmPayment(req, res, next) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return badRequest(res, 'session_id requerido');
    }

    if (!stripeConfigured) {
      return badRequest(res, 'Pagos no configurados');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return badRequest(res, 'El pago no fue completado');
    }

    const { userId, videoId, price } = session.metadata || {};

    // Verificar que la sesión pertenezca al usuario autenticado
    if (String(session.client_reference_id) !== String(req.user.id)) {
      return unauthorized(res, 'Esta sesión de pago no pertenece a tu cuenta');
    }

    const order = await OrderModel.create({
      userId: req.user.id,
      videoId: Number(videoId),
      amount: Number(price),
      status: 'completed',
      paymentMethod: session.payment_method_types?.[0] || 'card'
    });

    return ok(res, order, 'Pago confirmado, acceso otorgado');
  } catch (err) {
    next(err);
  }
}

/**
 * Verifica si el usuario tiene acceso a un video (compró o es gratis)
 */
export async function checkAccess(req, res, next) {
  try {
    const videoId = Number(req.params.videoId);

    const video = await VideoModel.findById(videoId);
    if (!video) {
      return notFound(res, 'Video no encontrado');
    }
    if (Number(video.price) === 0) {
      return ok(res, { access: true, isFree: true });
    }

    const has = await OrderModel.hasAccess(req.user.id, videoId);
    return ok(res, { access: has, isFree: false });
  } catch (err) {
    next(err);
  }
}

export { stripe, stripeConfigured };
