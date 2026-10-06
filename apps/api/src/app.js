import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import config from './config.js';
import { pool } from './db/index.js';
import { errorHandler, notFound, redactUrl } from './lib/http.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import checkoutRoutes from './routes/checkout.js';
import orderRoutes from './routes/orders.js';
import webhookRoutes from './routes/webhooks.js';
import adminRoutes from './routes/admin.js';
import newsletterRoutes from './routes/newsletter.js';

// Same as morgan's "combined" / "dev" formats, but with the URL stripped of secrets (see redactUrl)
morgan.token('safe-url', (req) => redactUrl(req.originalUrl || req.url));
const LOG_FORMAT = config.isProd
  ? ':remote-addr - :remote-user [:date[clf]] ":method :safe-url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
  : ':method :safe-url :status :response-time ms - :res[content-length]';

// Accounts, orders, checkout and admin answers hold personal data: no browser, proxy or CDN may keep a copy
const noStore = (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); };

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Railway / Vercel sit behind a proxy
  app.disable('x-powered-by');
  app.use(helmet());

  // Webhooks are server-to-server: no CORS, accept form-encoded too
  app.use('/api/webhooks', express.json({ limit: '1mb' }), express.urlencoded({ extended: false }), webhookRoutes);

  const allowed = new Set(config.corsOrigins);
  app.use(cors({
    origin(origin, cb) {
      // allow same-origin / curl, configured origins, and Vercel preview deployments of this project
      if (!origin || allowed.has(origin) || (process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'true' && /\.vercel\.app$/.test(new URL(origin).hostname))) {
        return cb(null, true);
      }
      cb(null, false);
    },
    credentials: false,
  }));
  app.use(express.json({ limit: '1mb' }));
  if (config.env !== 'test') app.use(morgan(LOG_FORMAT));

  app.get('/health', async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'vanguard-outdoor-api', time: new Date().toISOString() });
  });

  app.use(['/api/auth', '/api/orders', '/api/checkout', '/api/admin', '/api/newsletter'], noStore);
  app.use('/api/auth', authRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/newsletter', newsletterRoutes);

  app.use((_req, _res, next) => next(notFound('Route not found')));
  app.use(errorHandler);
  return app;
}
