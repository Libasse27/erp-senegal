const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');

const corsOptions = require('./src/config/cors');
const logger = require('./src/config/logger');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middlewares/errorHandler');

const app = express();

// --- Swagger UI (désactivé en production sauf si SWAGGER_ENABLED=true) ---
if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
  try {
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpec = require('./src/config/swagger');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'ERP Sénégal — API Docs',
      swaggerOptions: { persistAuthorization: true },
    }));
    app.get('/api-docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  } catch (_) {
    // swagger-ui-express non installé — ignoré
  }
}

// --- Trust proxy (needed for rate-limiter behind reverse proxy / webpack dev server) ---
app.set('trust proxy', 1);

// --- Security middleware ---
const isProd = process.env.NODE_ENV === 'production';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(isProd ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    xContentTypeOptions: true,
    xFrameOptions: { action: 'deny' },
  })
);
app.use(cors(corsOptions));

// --- Body parsing ---
// verify capture le corps brut (Buffer) pour la vérification HMAC des webhooks PSP
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// --- Data sanitization ---
app.use(mongoSanitize());
app.use(hpp());

// --- Compression ---
app.use(compression());

// --- Logging HTTP ---
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: logger.stream,
    })
  );
}

// --- Static files ---
app.use('/uploads', express.static('uploads'));

// --- Root & favicon (Vercel crawler / browser requests) ---
app.get('/', (_req, res) => {
  res.json({
    success: true,
    name: process.env.APP_NAME || 'ERP Senegal',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    docs: '/api/health',
  });
});
app.get('/favicon.ico', (_req, res) => res.status(204).end());
app.get('/favicon.png', (_req, res) => res.status(204).end());

// --- Health check (avant les routes pour garantir l'accessibilité) ---
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API ERP Senegal operationnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// --- API Routes ---
app.use('/api', routes);

// --- 404 handler ---
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvee',
  });
});

// --- Error handler ---
app.use(errorHandler);

module.exports = app;
