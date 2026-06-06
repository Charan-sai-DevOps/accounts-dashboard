import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for Login Endpoint
 * - Max 5 attempts per 15 minutes per email address
 * - Prevents brute force attacks on credentials
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => {
    // Skip rate limiting for non-POST requests
    return req.method !== 'POST';
  },
  keyGenerator: (req) => {
    // Rate limit by email address if provided, otherwise by IP
    const email = (req.body?.email as string)?.toLowerCase();
    return email || req.ip || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
  // Store in memory (use Redis in production)
  store: undefined, // Uses default memory store
});

/**
 * Rate Limiter for OTP Verification
 * - Max 3 attempts per 5 minutes
 * - Prevents OTP brute force
 */
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 attempts per window
  message: 'Too many OTP verification attempts. Please request a new code.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Apply to specific OTP verification actions
    const action = req.body?.action;
    return !['verify', 'verify-login-otp'].includes(action);
  },
  keyGenerator: (req) => {
    const email = (req.body?.email as string)?.toLowerCase();
    return email || req.ip || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many OTP attempts. Please request a new code.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Rate Limiter for Password Change
 * - Max 3 attempts per hour
 * - Prevents account takeover attempts
 */
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many password change attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'PUT',
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many password change attempts. Please try again in 1 hour.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Rate Limiter for API Endpoints (General)
 * - Max 100 requests per 15 minutes per IP
 * - Prevents general DoS attacks
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res) => {
    res.status(429).json({
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});
