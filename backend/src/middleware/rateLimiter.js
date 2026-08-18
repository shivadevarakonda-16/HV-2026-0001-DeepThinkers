const rateLimit = require('express-rate-limit');

// Rate limiter for verification endpoints (30 requests per minute)
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification requests from this IP. Please try again after 1 minute.',
  },
});

// Rate limiter for voting endpoints (20 requests per minute)
const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many vote actions from this IP. Please slow down.',
  },
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { verifyLimiter, voteLimiter, apiLimiter };
