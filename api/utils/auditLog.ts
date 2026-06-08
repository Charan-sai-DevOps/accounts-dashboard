import { firestore } from "../_firebaseAdmin.js";
import type { Query } from "firebase-admin/firestore";

const AUDIT_LOGS_COLLECTION = "audit_logs";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGIN_RATE_LIMITED"
  | "PASSWORD_CHANGE_SUCCESS"
  | "PASSWORD_CHANGE_FAILURE"
  | "PASSWORD_CHANGE_RATE_LIMITED"
  | "OTP_GENERATED"
  | "OTP_VERIFIED"
  | "OTP_FAILED"
  | "2FA_ENABLED"
  | "2FA_DISABLED"
  | "USER_CREATED"
  | "USER_DELETED"
  | "USER_UPDATED"
  | "ROLE_CHANGED"
  | "SETTINGS_CHANGED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_DELETED"
  | "PERMISSION_DENIED"
  | "INVALID_REQUEST"
  | "SUSPICIOUS_ACTIVITY";

export interface AuditLogEntry {
  timestamp: string;
  action: AuditAction;
  actor?: string; // User who performed the action (email)
  email?: string; // Target email (for login, password change, etc.)
  ipAddress: string;
  userAgent?: string;
  status: "success" | "failure";
  statusCode?: number;
  message?: string;
  details?: Record<string, any>;
  resourceType?: string; // subscription, settings, user, etc.
  resourceId?: string; // ID of the affected resource
  changesSummary?: Record<string, any>; // Summary of what changed
}

/**
 * Log an audit event to Firestore
 * Used for security monitoring and compliance
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
  try {
    // Sanitize sensitive data
    const sanitized = { ...entry };
    if (sanitized.details?.password) delete sanitized.details.password;
    if (sanitized.details?.token) delete sanitized.details.token;
    if (sanitized.changesSummary?.password) delete sanitized.changesSummary.password;

    const docData: AuditLogEntry = {
      ...sanitized,
      timestamp: new Date().toISOString(),
    };

    // Add with auto-generated ID (timestamp-based for ordering)
    await firestore.collection(AUDIT_LOGS_COLLECTION).add(docData);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[AUDIT] ${entry.action}:`, {
        actor: entry.actor,
        status: entry.status,
        ipAddress: entry.ipAddress,
      });
    }
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log authentication success
 */
export async function logAuthSuccess(
  email: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action: "LOGIN_SUCCESS",
    email,
    ipAddress,
    userAgent,
    status: "success",
    statusCode: 200,
  });
}

/**
 * Log authentication failure
 */
export async function logAuthFailure(
  email: string,
  reason: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action: "LOGIN_FAILURE",
    email,
    ipAddress,
    userAgent,
    status: "failure",
    statusCode: 401,
    message: reason,
  });
}

/**
 * Log rate limiting
 */
export async function logRateLimited(
  action: AuditAction,
  identifier: string, // email or IP
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action,
    email: identifier.includes("@") ? identifier : undefined,
    ipAddress,
    userAgent,
    status: "failure",
    statusCode: 429,
    message: "Rate limit exceeded",
  });
}

/**
 * Log password change
 */
export async function logPasswordChange(
  email: string,
  success: boolean,
  ipAddress: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    action: success ? "PASSWORD_CHANGE_SUCCESS" : "PASSWORD_CHANGE_FAILURE",
    email,
    ipAddress,
    userAgent,
    status: success ? "success" : "failure",
    statusCode: success ? 200 : 401,
    message: reason,
  });
}

/**
 * Log 2FA changes
 */
export async function log2FAChange(
  email: string,
  action: "2FA_ENABLED" | "2FA_DISABLED",
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action,
    email,
    ipAddress,
    userAgent,
    status: "success",
    statusCode: 200,
  });
}

/**
 * Log OTP events
 */
export async function logOTPEvent(
  email: string,
  action: "OTP_GENERATED" | "OTP_VERIFIED" | "OTP_FAILED",
  ipAddress: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    action,
    email,
    ipAddress,
    userAgent,
    status: action === "OTP_FAILED" ? "failure" : "success",
    statusCode: action === "OTP_FAILED" ? 401 : 200,
    message: reason,
  });
}

/**
 * Log subscription changes
 */
export async function logSubscriptionChange(
  action: "SUBSCRIPTION_CREATED" | "SUBSCRIPTION_UPDATED" | "SUBSCRIPTION_DELETED",
  actor: string,
  subscriptionId: string,
  ipAddress: string,
  changesSummary?: Record<string, any>,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action,
    actor,
    ipAddress,
    userAgent,
    status: "success",
    statusCode: 200,
    resourceType: "subscription",
    resourceId: subscriptionId,
    changesSummary,
  });
}

/**
 * Log permission/authorization failures
 */
export async function logPermissionDenied(
  email: string,
  reason: string,
  ipAddress: string,
  resourceType?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action: "PERMISSION_DENIED",
    email,
    ipAddress,
    userAgent,
    status: "failure",
    statusCode: 403,
    message: reason,
    resourceType,
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  description: string,
  ipAddress: string,
  email?: string,
  details?: Record<string, any>,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action: "SUSPICIOUS_ACTIVITY",
    email,
    ipAddress,
    userAgent,
    status: "failure",
    statusCode: 400,
    message: description,
    details,
  });
}

/**
 * Query audit logs for analysis
 */
export async function queryAuditLogs(
  filters: {
    action?: AuditAction;
    email?: string;
    ipAddress?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
): Promise<AuditLogEntry[]> {
  try {
    let query: Query = firestore.collection(AUDIT_LOGS_COLLECTION);

    if (filters.action) {
      query = query.where("action", "==", filters.action);
    }

    if (filters.email) {
      query = query.where("email", "==", filters.email);
    }

    if (filters.ipAddress) {
      query = query.where("ipAddress", "==", filters.ipAddress);
    }

    // Order by most recent first
    query = query.orderBy("timestamp", "desc");

    // Apply limit
    query = query.limit(filters.limit || 100);

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as AuditLogEntry);
  } catch (error) {
    console.error("Error querying audit logs:", error);
    return [];
  }
}

/**
 * Clean up old audit logs (older than 90 days by default)
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const snapshot = await firestore
      .collection(AUDIT_LOGS_COLLECTION)
      .where("timestamp", "<", cutoffDate.toISOString())
      .limit(500) // Batch cleanup
      .get();

    if (snapshot.docs.length === 0) return 0;

    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`[Cleanup] Removed ${snapshot.docs.length} audit logs older than ${daysToKeep} days`);
    return snapshot.docs.length;
  } catch (error) {
    console.error("Error cleaning up audit logs:", error);
    return 0;
  }
}

/**
 * Generate a security report from audit logs
 */
export async function generateSecurityReport(days: number = 7): Promise<{
  totalEvents: number;
  successfulLogins: number;
  failedLogins: number;
  failureRate: number;
  suspiciousIPs: string[];
  suspiciousEmails: string[];
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshot = await firestore
      .collection(AUDIT_LOGS_COLLECTION)
      .where("timestamp", ">=", startDate.toISOString())
      .get();

    const logs = snapshot.docs.map((doc) => doc.data() as AuditLogEntry);

    const loginAttempts = logs.filter(
      (log) => log.action === "LOGIN_SUCCESS" || log.action === "LOGIN_FAILURE"
    );
    const successful = loginAttempts.filter((log) => log.action === "LOGIN_SUCCESS").length;
    const failed = loginAttempts.filter((log) => log.action === "LOGIN_FAILURE").length;

    // Find suspicious patterns
    const ipAttempts: Record<string, number> = {};
    const emailAttempts: Record<string, number> = {};

    logs.forEach((log) => {
      if (log.ipAddress) {
        ipAttempts[log.ipAddress] = (ipAttempts[log.ipAddress] || 0) + 1;
      }
      if (log.email && log.action === "LOGIN_FAILURE") {
        emailAttempts[log.email] = (emailAttempts[log.email] || 0) + 1;
      }
    });

    // Consider >10 failed attempts as suspicious
    const suspiciousEmails = Object.entries(emailAttempts)
      .filter(([_, count]) => count > 10)
      .map(([email]) => email);

    const suspiciousIPs = Object.entries(ipAttempts)
      .filter(([_, count]) => count > 50) // More lenient for IPs
      .map(([ip]) => ip);

    return {
      totalEvents: logs.length,
      successfulLogins: successful,
      failedLogins: failed,
      failureRate: loginAttempts.length > 0 ? failed / loginAttempts.length : 0,
      suspiciousIPs,
      suspiciousEmails,
    };
  } catch (error) {
    console.error("Error generating security report:", error);
    return {
      totalEvents: 0,
      successfulLogins: 0,
      failedLogins: 0,
      failureRate: 0,
      suspiciousIPs: [],
      suspiciousEmails: [],
    };
  }
}
