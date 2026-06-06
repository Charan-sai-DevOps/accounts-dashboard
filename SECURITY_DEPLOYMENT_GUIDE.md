# Security Deployment & Verification Guide

## Pre-Deployment Checklist

### 🔴 CRITICAL Actions (DO FIRST):

- [ ] **Firebase Credentials Revoked**
  - Go to Google Cloud Console
  - Service Accounts for project `account-dashboard-c95af`
  - Find key: `aa4ed87c9069541731a593e18bbc776e6685e65e`
  - Click Delete
  - Confirm deletion

- [ ] **Firebase Credentials Regenerated**
  - Create new service account key (JSON)
  - Download and verify contents

- [ ] **Admin Password Changed**
  - Use app login or API to change password
  - Old: `Charan@webomindapps3` (EXPOSED)
  - New: Strong password (16+ chars, mixed case, numbers, symbols)
  - Verify login works with new password

- [ ] **Environment Variables Updated**
  - Set in Vercel (or your deployment platform):
    ```
    ADMIN_EMAIL=your-email@company.com
    ADMIN_PASSWORD=your-new-strong-password
    FIREBASE_PROJECT_ID=account-dashboard-c95af
    FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@account-dashboard-c95af.iam.gserviceaccount.com
    FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
    ```

### ✅ Code Deployment Checklist:

- [ ] All commits reviewed
  ```bash
  git log --oneline -5
  # Should see Phase 1-4 commits
  ```

- [ ] No credentials in git history
  ```bash
  git log --all --source -- '*.json' | grep -i firebase
  # Should return: (no output)
  
  git log --all --source -- '.env*'
  # Should return: (no output)
  ```

- [ ] .gitignore is effective
  ```bash
  git status --ignored | grep -E "\.json|\.env"
  # Should show blocked files
  ```

- [ ] Dependencies installed
  ```bash
  npm install
  npm audit  # Check for vulnerabilities
  ```

- [ ] Build succeeds
  ```bash
  npm run build
  # Should complete without errors
  ```

---

## Deployment Steps

### Step 1: Verify Environment
```bash
# Check Node.js version (16+)
node --version

# Verify npm
npm --version

# Check Firestore connectivity
# (will be tested when app starts)
```

### Step 2: Install Dependencies
```bash
# Clean install
npm install

# Install specific security packages
npm install bcrypt cors zod
npm install --save-dev @types/bcrypt

# Verify installation
npm list bcrypt cors zod
```

### Step 3: Deploy to Staging
```bash
# Build for staging
npm run build

# Deploy to staging environment
# (Use your deployment platform's CLI)
# Example for Vercel:
vercel --prod --scope=your-scope --confirm
```

### Step 4: Staging Tests

#### Test Password Hashing:
```bash
# Try login
curl -X POST https://staging-domain/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-new-password"
  }'

# Expected Response (200):
{
  "ok": true,
  "role": "Admin",
  "user": { "email": "admin@example.com" },
  "requires2FA": false
}
```

#### Test Rate Limiting:
```bash
# Make 6 quick login attempts
for i in {1..6}; do
  curl -X POST https://staging-domain/api/auth \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "Attempt $i"
  sleep 1
done

# 6th attempt should return (429):
{
  "message": "Too many login attempts. Please try again after ...",
  "retryAfter": 839
}
```

#### Test OTP Firestore:
```bash
# Request OTP
curl -X POST https://staging-domain/api/2fa \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send-login-otp",
    "email": "admin@example.com"
  }'

# Check Firebase Console > Firestore > verification_codes
# Should see a new document with:
# - code: 6-digit number
# - expiresAt: future timestamp
# - purpose: "login"
```

#### Test Input Validation:
```bash
# Try invalid email
curl -X POST https://staging-domain/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "password"
  }'

# Expected Response (400):
{
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email address"
  }
}
```

#### Test Audit Logging:
```bash
# After login test, check Firebase Console:
# Firestore > audit_logs collection

# Should see entries like:
# {
#   "timestamp": "2026-06-06T...",
#   "action": "LOGIN_SUCCESS",
#   "email": "admin@example.com",
#   "ipAddress": "...",
#   "status": "success",
#   "statusCode": 200
# }
```

#### Test Security Headers:
```bash
# Check response headers
curl -I https://staging-domain/

# Should include:
# Content-Security-Policy: ...
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: ...
```

### Step 5: UAT (User Acceptance Testing)

- [ ] Users can log in with new password
- [ ] Password change feature works
- [ ] 2FA still functions properly
- [ ] OTP codes arrive in email
- [ ] No error messages in browser console
- [ ] Performance is acceptable

### Step 6: Production Deployment

```bash
# Deploy to production
# (Use your deployment platform's process)
# Example for Vercel:
git push origin main  # Automatic deployment if CI/CD set up

# Or manual:
vercel --prod --scope=your-scope --confirm
```

### Step 7: Post-Deployment Verification

- [ ] Check production logs (Vercel dashboard / CloudWatch)
- [ ] Verify no errors in logs
- [ ] Test login in production
- [ ] Verify Firestore collections are being written to
- [ ] Check security headers in production
- [ ] Verify rate limiting is working

---

## Security Verification Checklist

### Code Security:
- [ ] No hardcoded credentials in code
  ```bash
  grep -r "password\|secret\|key" api/ src/ --exclude-dir=node_modules
  # Should return: no results (except comments)
  ```

- [ ] No default passwords
  ```bash
  grep -r "Charan@webomindapps3" .
  # Should return: no results
  ```

- [ ] Bcrypt is being used
  ```bash
  grep -r "bcrypt" api/
  # Should return multiple matches in auth.ts
  ```

- [ ] Rate limiting is implemented
  ```bash
  grep -r "checkRateLimit" api/
  # Should return matches in auth.ts
  ```

### Git Security:
- [ ] .gitignore blocks JSON files
  ```bash
  cat .gitignore | grep "\.json"
  # Should show: *.json (with exceptions for package.json)
  ```

- [ ] No .env files in git
  ```bash
  git ls-files | grep -E "\.env"
  # Should return: .env.example only
  ```

- [ ] .env.example has no secrets
  ```bash
  cat .env.example | grep -i "sk_\|api_key\|password"
  # Should return: no actual secrets (only placeholders)
  ```

### Firestore Collections:
- [ ] audit_logs collection exists
  ```bash
  # Firebase Console > Firestore
  # Should see: audit_logs collection with documents
  ```

- [ ] verification_codes collection exists
  ```bash
  # Firebase Console > Firestore
  # Should see: verification_codes collection
  ```

- [ ] rate_limits collection exists
  ```bash
  # Firebase Console > Firestore
  # Should see: rate_limits collection
  ```

### Compliance:
- [ ] Audit logs have correct fields
  ```bash
  # Document should include:
  # - timestamp
  # - action
  # - status (success/failure)
  # - ipAddress
  # - userAgent (optional)
  ```

- [ ] Passwords are being hashed with bcrypt
  ```bash
  # Query admin user settings in Firestore
  # Document: settings/app
  # auth.passwordHash should start with: $2b$12$ (bcrypt format)
  # (NOT be hex string from SHA256)
  ```

---

## Monitoring Setup

### Daily Monitoring:
```bash
# Check for suspicious login patterns
firebase_cli firestore query --collection audit_logs \
  --where "action" "==" "LOGIN_FAILURE" \
  --where "timestamp" ">=" "$(date -u -Iseconds)"

# Check for rate limit triggers
firebase_cli firestore query --collection rate_limits
```

### Weekly Report:
```bash
# Generate security report for last 7 days
# (Implement using generateSecurityReport() from auditLog.ts)

# Check for:
# - Failed login rate
# - Suspicious IPs
# - Suspicious emails
# - Validation failures
```

### Monthly Review:
```bash
# Full security audit
npm audit
git log --oneline --all | head -20  # Recent commits
# Check Firestore collections for anomalies
# Review password change history
```

---

## Rollback Plan

If issues arise after deployment:

### Quick Rollback:
```bash
# Revert to previous commit
git revert <commit-hash>
git push origin main

# Or force rollback (last resort):
git reset --hard HEAD~1
git push --force-with-lease origin main
```

### Firebase Rollback:
```bash
# Delete new verification_codes/rate_limits if needed
# Keep audit_logs for compliance
# Can be done in Firebase Console
```

### Credential Rollback:
```bash
# If new Firebase credentials don't work:
# 1. Keep old key revoked (security best practice)
# 2. Generate another new key
# 3. Update environment variables
# 4. Redeploy
```

---

## Performance Baseline

Establish baseline metrics for monitoring:

### Expected Response Times:
- Login (without 2FA): 200-500ms
- Password change: 300-800ms (bcrypt hashing)
- OTP generation: 50-100ms
- OTP verification: 100-200ms
- Rate limit check: 10-50ms

### Expected Firestore Operations:
- audit_logs writes: ~1-2 per login attempt
- verification_codes writes: 1 per OTP generation
- rate_limits writes: 1-2 per rate-limited request

### Alert Thresholds:
- Failed login rate >20% in 1 hour: ⚠️ Investigate
- Multiple rate limit triggers from same IP: 🔴 Alert
- Firestore quota exceeded: 🔴 Alert
- Password hash failures: 🔴 Critical alert

---

## Post-Deployment Monitoring

### Week 1:
- [ ] Monitor logs daily
- [ ] Verify no performance degradation
- [ ] Check error rates
- [ ] Verify security features working

### Month 1:
- [ ] Generate security report
- [ ] Review audit logs
- [ ] Check for new vulnerabilities (npm audit)
- [ ] Team feedback collection

### Ongoing:
- [ ] Weekly security monitoring
- [ ] Monthly compliance report
- [ ] Quarterly penetration testing
- [ ] Semi-annual security audit

---

## Troubleshooting

### Issue: "Missing Firebase admin environment variables"

**Solution:**
```bash
# Verify environment variables are set
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL
echo $FIREBASE_PRIVATE_KEY  # Don't show this publicly!

# If not set, update in deployment platform:
# Vercel: Project Settings > Environment Variables
# AWS: Lambda > Configuration > Environment Variables
# GCP: Cloud Functions > Runtime settings > Runtime environment variables
```

### Issue: "Password hash mismatch"

**Solution:**
```bash
# Check bcrypt is installed
npm list bcrypt

# Verify bcrypt is imported
grep -n "import.*bcrypt" api/_auth.ts

# Verify password hashing works
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('test', 12).then(console.log);"
```

### Issue: "Rate limit not working"

**Solution:**
```bash
# Check Firestore connectivity
firebase_cli firestore --list

# Verify rate_limits collection exists
# Check if documents are being created
firebase_cli firestore list-documents rate_limits

# Check for errors in logs
```

### Issue: "OTP codes not being stored"

**Solution:**
```bash
# Check verification_codes collection
firebase_cli firestore list-documents verification_codes

# Verify Firestore write permissions
# Check API handler logs for errors
# Verify email is being normalized correctly
```

---

## Sign-off

- **Deployment Lead:** _________________
- **Security Review:** _________________
- **QA Sign-off:** _________________
- **Date:** _________________

---

## Contact for Support

**For deployment issues:**
- Deployment Lead: [Team lead email]
- DevOps: [DevOps team email]

**For security issues:**
- Security Contact: security@webomindapps.com
- Project Lead: Charan (charan@webomindapps.com)

**For audit logging questions:**
- Data Team: [Data team email]
- Analytics: [Analytics email]

---

**Last Updated:** June 6, 2026  
**Status:** Ready for Deployment  
**Next Review:** Post-deployment (within 48 hours)
