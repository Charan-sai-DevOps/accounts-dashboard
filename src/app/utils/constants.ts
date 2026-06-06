/**
 * Application Constants
 * Addresses issue 32: Extract magic numbers into named constants
 * Centralized source of truth for configuration values
 */

// ─── Session & Authentication ────────────────────────────────────────────────

/** Session timeout in milliseconds (30 minutes) */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/** Warning time before session expires in milliseconds (5 minutes) */
export const SESSION_WARNING_MS = 5 * 60 * 1000;

/** Password minimum length */
export const PASSWORD_MIN_LENGTH = 8;

/** Password generation length */
export const PASSWORD_GENERATION_LENGTH = 12;

// ─── Rate Limiting ───────────────────────────────────────────────────────────

/** Max login attempts */
export const LOGIN_MAX_ATTEMPTS = 5;

/** Login rate limit window in minutes */
export const LOGIN_RATE_LIMIT_MINUTES = 15;

/** Max password change attempts */
export const PASSWORD_CHANGE_MAX_ATTEMPTS = 3;

/** Password change rate limit window in minutes */
export const PASSWORD_CHANGE_RATE_LIMIT_MINUTES = 60;

/** Max user creations per minute */
export const USER_CREATION_MAX_ATTEMPTS = 5;

/** User creation rate limit window in milliseconds */
export const USER_CREATION_RATE_LIMIT_MS = 60000;

// ─── Debouncing & Delays ────────────────────────────────────────────────────

/** Search input debounce delay in milliseconds */
export const SEARCH_DEBOUNCE_MS = 300;

/** General debounce delay in milliseconds */
export const DEBOUNCE_MS = 300;

/** Auto-dismiss toast/message duration in milliseconds */
export const AUTO_DISMISS_MS = 3000;

/** Fade out animation duration in milliseconds */
export const FADE_DURATION_MS = 200;

// ─── OTP & Verification ─────────────────────────────────────────────────────

/** OTP/Verification code length */
export const OTP_LENGTH = 6;

/** OTP expiration time in minutes */
export const OTP_EXPIRY_MINUTES = 10;

/** CSRF token expiration in milliseconds (1 hour) */
export const CSRF_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

// ─── Pagination & Lists ─────────────────────────────────────────────────────

/** Default page size for lists */
export const PAGE_SIZE = 10;

/** Maximum items per page */
export const MAX_PAGE_SIZE = 100;

/** Max cache size for storage */
export const MAX_CACHE_ITEMS = 1000;

// ─── UI/UX Constants ────────────────────────────────────────────────────────

/** Maximum line length for readable text */
export const MAX_LINE_LENGTH = 80;

/** Input max length for email */
export const EMAIL_MAX_LENGTH = 254;

/** Input max length for names */
export const NAME_MAX_LENGTH = 100;

/** Input max length for descriptions */
export const DESCRIPTION_MAX_LENGTH = 500;

// ─── Limits & Thresholds ────────────────────────────────────────────────────

/** Maximum users per account */
export const MAX_USERS = 100;

/** Maximum subscriptions per account */
export const MAX_SUBSCRIPTIONS = 999;

/** Maximum custom categories */
export const MAX_CATEGORIES = 50;

/** Maximum teams */
export const MAX_TEAMS = 20;

// ─── Storage Keys ───────────────────────────────────────────────────────────

/** localStorage key for cached users */
export const STORAGE_KEY_USERS_CACHE = 'appUsersCache';

/** localStorage key for cached settings */
export const STORAGE_KEY_SETTINGS_CACHE = 'appSettingsCache';

/** localStorage key for theme preference */
export const STORAGE_KEY_THEME = 'theme';

/** localStorage key for layout preference */
export const STORAGE_KEY_LAYOUT = 'layout';

/** sessionStorage key for auth token */
export const SESSION_KEY_AUTH_TOKEN = 'authToken';

/** sessionStorage key for user role */
export const SESSION_KEY_USER_ROLE = 'userRole';

// ─── API Endpoints ──────────────────────────────────────────────────────────

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  SETTINGS: '/api/settings',
  OTP_2FA: '/api/2fa',
  SUBSCRIPTIONS: '/api/subscriptions',
} as const;

// ─── Status Codes ───────────────────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;

// ─── Error Messages ─────────────────────────────────────────────────────────

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  INVALID_CREDENTIALS: 'Invalid email or password',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNEXPECTED_ERROR: 'Something went wrong. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  RATE_LIMITED: 'Too many attempts. Please try again later.',
} as const;

// ─── Success Messages ───────────────────────────────────────────────────────

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  SAVE_SUCCESS: 'Changes saved successfully',
  DELETE_SUCCESS: 'Deleted successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  USER_CREATED: 'User created successfully',
  USER_DELETED: 'User deleted successfully',
} as const;

// ─── Validation Rules ───────────────────────────────────────────────────────

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_REGEX: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/,
  URL_REGEX: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  PHONE_REGEX: /^[\d\s\-\+\(\)]{10,}$/,
} as const;

// ─── API Retry Policy ───────────────────────────────────────────────────────

/** Maximum retry attempts for failed requests */
export const MAX_RETRIES = 3;

/** Initial retry delay in milliseconds */
export const INITIAL_RETRY_DELAY_MS = 1000;

/** Exponential backoff multiplier for retries */
export const RETRY_BACKOFF_MULTIPLIER = 2;

// ─── Accessibility ──────────────────────────────────────────────────────────

/** Minimum touch target size for mobile (48x48px) */
export const MIN_TOUCH_TARGET = 48;

/** Minimum color contrast ratio for WCAG AA compliance */
export const MIN_CONTRAST_RATIO = 4.5;

/** Focus outline width */
export const FOCUS_OUTLINE_WIDTH = 2;

// ─── Type Exports for strict typing ─────────────────────────────────────────

export const ROLES = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  PUSH: 'push',
  IN_APP: 'in-app',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export const REMINDER_OPTIONS = [
  '7 days before',
  '5 days before',
  '3 days before',
  '2 days before',
  '1 day before',
  '12 hours before',
  '6 hours before',
  '1 hour before',
] as const;

export type ReminderOption = typeof REMINDER_OPTIONS[number];
