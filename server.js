require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const http = require('http');
const apiRoutes = require('./backend/routes');
const { notFoundHandler, errorHandler } = require('./backend/middleware/errorHandler');
const { initializeRedis } = require('./backend/config/redis');
const { initializeSocket } = require('./backend/config/socket');

const app = express();
const server = http.createServer(app);

// ============================================================================
// SECURITY MIDDLEWARE (Order is critical!)
// ============================================================================

// 1. HELMET - Secure HTTP headers (MUST BE FIRST)
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:3000'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' }, // Prevent clickjacking
  hidePoweredBy: true, // Hide X-Powered-By header
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true, // Prevent MIME type sniffing
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true,
}));

// 2. CORS - Restrict to specific origin (NOT wildcard *)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // Cache preflight for 10 minutes
}));

// 3. RATE LIMITING - Prevent brute-force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again after 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RATE LIMIT] IP ${req.ip} exceeded limit on ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// 4. COMPRESSION - Reduce response size
app.use(compression());

// 5. BODY PARSING - Parse JSON and URL-encoded data
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString(); // Store raw body for webhook verification
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 10000, // Prevent parameter pollution
}));

// 6. XSS PROTECTION - Sanitize user input (AFTER body parsing)
app.use(xss());

// 7. NoSQL INJECTION PROTECTION - Remove $ and . from user input
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SANITIZE] Removed malicious key "${key}" from request by ${req.ip}`);
  },
}));

// 8. HTTP PARAMETER POLLUTION PROTECTION
app.use(hpp({
  whitelist: [
    // Allow duplicate parameters for these fields
    'status',
    'societyId',
    'startDate',
    'endDate',
    'sortBy',
    'sortOrder',
    'page',
    'limit',
    'role',
    'tags',
  ],
}));

// 9. CUSTOM SECURITY HEADERS
app.use((req, res, next) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove fingerprinting headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
});

// ============================================================================
// APPLICATION ROUTES
// ============================================================================

// Serve uploaded files (with security headers)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Prevent execution of uploaded files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
  },
}));

// API Routes (rate limiting already applied above)
app.use('/api', apiRoutes);

// Health check (no authentication required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    version: '4.0',
    timestamp: new Date().toISOString(),
    security: {
      helmet: 'enabled',
      cors: 'restricted',
      rateLimiting: 'enabled',
      xssProtection: 'enabled',
      sqlInjectionProtection: 'enabled',
    },
    features: [
      'Authentication & Authorization',
      'Email Notifications',
      'Real-time Updates (WebSocket)',
      'Analytics Dashboard',
      'Advanced Search & Filters',
      'Comments System',
      'Draft Proposals',
      'Budget Management',
      'Calendar Integration',
      'User Profiles',
      'Activity Logs',
      'Caching (Redis)',
    ]
  });
});

// ============================================================================
// ERROR HANDLERS
// ============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

async function startServer() {
  try {
    // Initialize Redis (optional)
    await initializeRedis();

    // Initialize Socket.IO
    initializeSocket(server);

    // Start server
    const PORT = process.env.PORT || 5000;
    const ENV = process.env.NODE_ENV || 'development';
    
    server.listen(PORT, () => {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                                                            ║');
      console.log('║       🔒 Campus Connect v4.0 - Secured Edition 🔒         ║');
      console.log('║                                                            ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${ENV}`);
      console.log(`✓ API: http://localhost:${PORT}/api`);
      console.log(`✓ Health: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🔒 Security Features Enabled:');
      console.log('  • Helmet - Secure HTTP Headers');
      console.log('  • CORS - Restricted Origin');
      console.log('  • Rate Limiting - 100 req/15min per IP');
      console.log('  • XSS Protection - Input Sanitization');
      console.log('  • NoSQL Injection Protection');
      console.log('  • HTTP Parameter Pollution Protection');
      console.log('  • JWT Authentication & Authorization');
      console.log('  • Activity Logging & Monitoring');
      console.log('');
      console.log('✨ Application Features:');
      console.log('  • Email Notifications (SMTP)');
      console.log('  • Real-time Updates (WebSocket)');
      console.log('  • Analytics & Reporting');
      console.log('  • Advanced Search & Filters');
      console.log('  • Comments & Collaboration');
      console.log('  • Draft Proposals');
      console.log('  • Budget Management');
      console.log('  • Calendar Integration');
      console.log('  • User Profiles & Activity Logs');
      console.log('  • Redis Caching (optional)');
      console.log('');
      
      if (ENV === 'production') {
        console.log('⚠️  PRODUCTION MODE - Enhanced security active');
      } else {
        console.log('⚠️  DEVELOPMENT MODE - Some security features relaxed');
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();
