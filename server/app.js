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

// --- Trust proxy (needed for rate-limiter behind reverse proxy / webpack dev server) ---
app.set('trust proxy', 1);

// --- Security middleware ---
app.use(helmet());
app.use(cors(corsOptions));

// --- Body parsing ---
app.use(express.json({ limit: '10mb' }));
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

// --- API Routes ---
app.use('/api', routes);

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API ERP Senegal operationnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

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
