import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import apiRoutes from './routes/index.js';

const app = express();

app.set('trust proxy', 1);

const CLIENT_URLS = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  hsts: process.env.NODE_ENV === 'production'
}));

if (process.env.NODE_ENV === 'production') {
  app.use(cors({ origin: CLIENT_URLS, credentials: true }));
} else {
  app.use(cors({ origin: true, credentials: true }));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas peticiones. Intenta de nuevo más tarde.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.'
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    console.error('[ERROR]', new Date().toISOString(), err);
  }

  res.status(status).json({
    success: false,
    message: isProd && status >= 500 ? 'Error interno del servidor' : err.message
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Flumen API corriendo en http://localhost:${PORT}`);
});
