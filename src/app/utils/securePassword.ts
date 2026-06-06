// Secure password generation utility using cryptographic randomness
// NEVER use Math.random() for security-sensitive operations

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SPECIAL = "!@#$%^&*()_+-=[]{}|;:,.<>?";

/**
 * Generate a cryptographically secure random password
 * Uses crypto.getRandomValues() instead of Math.random()
 * Guarantees at least one character from each class
 *
 * @param length - Password length (default 12)
 * @returns Secure random password string
 */
export function generateSecurePassword(length = 12): string {
  // Guarantee at least one of each required character class
  const required = [
    UPPER[getSecureRandomIndex(UPPER.length)],
    LOWER[getSecureRandomIndex(LOWER.length)],
    DIGITS[getSecureRandomIndex(DIGITS.length)],
    SPECIAL[getSecureRandomIndex(SPECIAL.length)],
  ];

  const all = UPPER + LOWER + DIGITS + SPECIAL;
  const rest = Array.from({ length: length - required.length }, () =>
    all[getSecureRandomIndex(all.length)]
  );

  // Shuffle so required chars aren't predictably positioned
  return shuffleArray([...required, ...rest]).join("");
}

/**
 * Get cryptographically secure random index
 * Uses crypto.getRandomValues() for unpredictable randomness
 *
 * @param max - Maximum index (exclusive)
 * @returns Secure random index
 */
function getSecureRandomIndex(max: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % max;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * Ensures unpredictable password character ordering
 *
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getSecureRandomIndex(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Validate password strength
 * Returns details about password compliance
 *
 * @param password - Password to check
 * @returns Object with strength indicators
 */
export interface PasswordStrength {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isStrong: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const strength: PasswordStrength = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    isStrong: false,
  };

  // Password is strong if it meets all criteria and is long enough
  strength.isStrong =
    strength.minLength &&
    strength.hasUpper &&
    strength.hasLower &&
    strength.hasNumber;

  return strength;
}

/**
 * Get password strength message for UI
 *
 * @param strength - PasswordStrength object
 * @returns User-friendly strength message
 */
export function getPasswordStrengthMessage(strength: PasswordStrength): string {
  const checks = [strength.minLength, strength.hasUpper, strength.hasLower, strength.hasNumber];
  const passedChecks = checks.filter(Boolean).length;

  if (passedChecks === 0) return "Very weak";
  if (passedChecks === 1) return "Weak";
  if (passedChecks === 2) return "Fair";
  if (passedChecks === 3) return "Good";
  return "Strong";
}

/**
 * Get password strength color for UI indicator
 *
 * @param strength - PasswordStrength object
 * @returns Hex color code
 */
export function getPasswordStrengthColor(strength: PasswordStrength): string {
  const checks = [strength.minLength, strength.hasUpper, strength.hasLower, strength.hasNumber];
  const passedChecks = checks.filter(Boolean).length;

  if (passedChecks === 0) return "#ef4444"; // Red
  if (passedChecks === 1) return "#f97316"; // Orange
  if (passedChecks === 2) return "#f59e0b"; // Amber
  if (passedChecks === 3) return "#84cc16"; // Lime
  return "#10b981"; // Green
}
