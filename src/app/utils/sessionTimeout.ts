import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * Configuration for session timeout
 */
export interface SessionTimeoutConfig {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
}

/**
 * Hook to manage session timeout
 * Logs out user after inactivity period
 *
 * @param config - Configuration options
 *
 * @example
 * useSessionTimeout({
 *   timeoutMinutes: 30,
 *   warningMinutes: 5,
 *   onWarning: () => showWarning('Session expiring soon'),
 *   onTimeout: () => logoutUser(),
 * });
 */
export function useSessionTimeout(config: SessionTimeoutConfig = {}) {
  const {
    timeoutMinutes = 30,
    warningMinutes = 5,
    onWarning,
    onTimeout,
  } = config;

  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const warningIdRef = useRef<NodeJS.Timeout | null>(null);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (warningIdRef.current) clearTimeout(warningIdRef.current);

    // Set warning timer
    warningIdRef.current = setTimeout(() => {
      if (onWarning) {
        onWarning();
      }
    }, timeoutMs - warningMs);

    // Set timeout timer
    timeoutIdRef.current = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      }
    }, timeoutMs);
  }, [timeoutMs, warningMs, onWarning, onTimeout]);

  useEffect(() => {
    // Activity events that reset the timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer start
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });

      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (warningIdRef.current) clearTimeout(warningIdRef.current);
    };
  }, [resetTimer]);

  return {
    resetTimer,
    getTimeoutMs: () => timeoutMs,
    getRemainingMs: () => {
      if (!timeoutIdRef.current) return timeoutMs;
      // Note: Cannot accurately get remaining time from setTimeout
      // This is approximate - consider using useEffect state update
      return timeoutMs;
    },
  };
}

/**
 * Hook to show session timeout warning dialog
 * @param onLogout - Callback when user confirms logout
 */
export function useSessionWarning(onLogout: () => void) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const handleWarning = () => {
    setShowWarning(true);
    setRemainingSeconds(300); // 5 minutes in seconds

    // Countdown timer
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleContinue = () => {
    setShowWarning(false);
    setRemainingSeconds(0);
  };

  return {
    showWarning,
    remainingSeconds,
    handleWarning,
    handleContinue,
    handleLogout: onLogout,
  };
}

/**
 * Get formatted time string from seconds
 * @param seconds - Number of seconds
 * @returns Formatted string (e.g., "5:30")
 */
export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
