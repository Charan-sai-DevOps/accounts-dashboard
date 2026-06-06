import cors from 'cors';

/**
 * CORS Configuration
 * - Allows requests from approved origins only
 * - Enables credentials (cookies, auth headers)
 * - Specifies allowed HTTP methods
 */
export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allowed origins (add to environment variables in production)
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ];

    // Allow requests with no origin (like mobile apps, Postman, curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    const originIsAllowed = allowedOrigins.some((allowed) => {
      // Exact match
      if (allowed === origin) return true;
      // Wildcard match (e.g., *.example.com)
      const pattern = new RegExp(allowed.replace(/\*/g, '.*'));
      return pattern.test(origin);
    });

    if (originIsAllowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true, // Allow cookies and auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours - time preflight request is cached
  optionsSuccessStatus: 200, // For legacy browser support
});

/**
 * Security Headers Middleware
 * Adds protective HTTP headers to all responses
 */
export function securityHeaders(req: any, res: any, next?: any) {
  // Content Security Policy (CSP)
  // Restricts which resources can be loaded and executed
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'", // Only allow same-origin by default
      "script-src 'self' 'unsafe-inline' https://firebase.googleapis.com", // Allow Firebase scripts
      "style-src 'self' 'unsafe-inline'", // Allow inline styles
      "img-src 'self' data: https:", // Allow images from self, data URIs, and HTTPS
      "font-src 'self' data:", // Allow fonts from self and data URIs
      "connect-src 'self' https://firebase.googleapis.com https://*.firebaseio.com https://oauth2.googleapis.com", // API calls
      "frame-ancestors 'self'", // Only allow framing from same origin
      "base-uri 'self'", // Restrict base URL
      "form-action 'self'", // Restrict form submissions
    ].join('; ')
  );

  // X-Frame-Options: Clickjacking Protection
  // Prevents the page from being embedded in iframes on other sites
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // X-Content-Type-Options: MIME Sniffing Protection
  // Prevents browsers from guessing MIME types
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Strict-Transport-Security (HSTS): Force HTTPS
  // Tells browsers to always use HTTPS for this domain
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Referrer-Policy: Control referrer information
  // Don't send referrer to other origins
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // X-XSS-Protection: XSS Protection (Legacy)
  // Legacy header for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Permissions-Policy: Feature Policy
  // Disable potentially dangerous browser features
  res.setHeader(
    'Permissions-Policy',
    [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', ')
  );

  // Cache-Control: Prevent caching of sensitive data
  if (req.url.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  if (next) next();
}

/**
 * Apply all security headers to a response
 */
export function applySecurityHeaders(res: any) {
  securityHeaders(null, res);
}
