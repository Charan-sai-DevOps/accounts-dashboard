# Security Implementation Checklist

## 🟢 Phase 1: Core Security Hardening (COMPLETED)

### Completed Tasks:
- [x] Install bcrypt for password hashing
- [x] Implement async password hashing with bcrypt (12 rounds)
- [x] Update authentication handlers to use bcrypt verify
- [x] Add environment variable validation
- [x] Remove hardcoded credentials from code execution path
- [x] Clean up sensitive console logging
- [x] Add basic audit logging for authentication events
- [x] Create `.env.example` template (no secrets)
- [x] Enhanced `.gitignore` with credential patterns
- [x] Add password length validation (minimum 8 characters)
- [x] Add IP address logging for audit trail

---

## 🟠 Phase 2: High Priority Fixes (NEXT)

### Target Completion: Days 4-7

#### 2.1 Rate Limiting on Auth Endpoints
- [ ] Install: `npm install express-rate-limit`
- [ ] Create `api/middleware/rateLimiter.ts`
- [ ] Configure:
  - [ ] 5 login attempts per 15 minutes
  - [ ] 3 OTP attempts per 5 minutes
  - [ ] Rate limit by email address
- [ ] Apply to endpoints:
  - [ ] POST `/api/auth`
  - [ ] POST `/api/2fa`
- [ ] Test with curl/Postman

#### 2.2 Move OTP from Memory to Firestore
- [ ] Create `verification_codes` Firestore collection
- [ ] Implement code storage function
- [ ] Implement code retrieval function
- [ ] Add automatic expiration cleanup
- [ ] Test OTP flow end-to-end
- [ ] Remove in-memory OTP storage

#### 2.3 Secure OTP Generation
- [ ] Replace `Math.random()` with `crypto.randomBytes()`
- [ ] Implement cryptographic random generation
- [ ] Test OTP randomness
- [ ] Verify entropy is sufficient

#### 2.4 CORS & CSRF Protection
- [ ] Install: `npm install cors csurf cookie-parser`
- [ ] Create `api/middleware/security.ts`
- [ ] Configure CORS:
  - [ ] Set `origin` to allowed domains only
  - [ ] Enable `credentials: true`
  - [ ] Set `maxAge: 86400` (24 hours)
- [ ] Implement CSRF tokens:
  - [ ] Generate token on GET requests
  - [ ] Validate token on POST/PUT/DELETE
  - [ ] Use secure, httpOnly cookies
  - [ ] Set SameSite=Strict
- [ ] Test CSRF protection

---

## 🟡 Phase 3: Medium Priority (Days 8-14)

### 3.1 Security Headers
- [ ] Add Content-Security-Policy (CSP)
  - [ ] Allow Firebase scripts
  - [ ] Allow OAuth2 URLs
  - [ ] Restrict inline scripts
- [ ] Add X-Frame-Options: SAMEORIGIN
- [ ] Add X-Content-Type-Options: nosniff
- [ ] Add Strict-Transport-Security (HSTS)
  - [ ] max-age=31536000
  - [ ] includeSubDomains
  - [ ] preload
- [ ] Add Referrer-Policy: strict-origin-when-cross-origin
- [ ] Add Permissions-Policy
- [ ] Test with security.mozilla.org

### 3.2 Input Validation with Zod
- [ ] Install: `npm install zod`
- [ ] Create validation schemas:
  - [ ] Login schema (email, password)
  - [ ] OTP schema (email, code, action)
  - [ ] Password change schema
  - [ ] User creation schema
- [ ] Apply validation to all API endpoints
- [ ] Return 400 status for invalid input
- [ ] Log validation failures

### 3.3 Expand Audit Logging
- [ ] Log user creation
- [ ] Log user deletion
- [ ] Log role changes
- [ ] Log 2FA enable/disable
- [ ] Log settings changes
- [ ] Add user agent to logs
- [ ] Set up log retention (30 days)

### 3.4 Implement Security Monitoring
- [ ] Set up Firestore index on audit_logs
- [ ] Create alerts for:
  - [ ] 10+ failed logins in 1 hour
  - [ ] Multiple failed OTP attempts
  - [ ] Unusual IP addresses
  - [ ] Password changes
- [ ] Create dashboard for security monitoring

---

## 🔵 Phase 4: Long Term Improvements (Ongoing)

### 4.1 Automated Security Scanning
- [ ] Set up GitHub Actions for:
  - [ ] npm audit
  - [ ] SAST scanning
  - [ ] Dependency updates
  - [ ] Secret scanning
- [ ] Configure pre-commit hooks
- [ ] Block commits with vulnerabilities

### 4.2 Regular Security Testing
- [ ] Monthly penetration testing
- [ ] Quarterly security audit
- [ ] Annual third-party assessment
- [ ] Bug bounty program setup

### 4.3 Team Security
- [ ] Security training for developers
- [ ] Secure coding guidelines
- [ ] Code review for security
- [ ] Incident response playbook

### 4.4 Infrastructure Security
- [ ] Enable HTTPS everywhere
- [ ] Configure WAF (Web Application Firewall)
- [ ] Set up DDoS protection
- [ ] Implement API rate limiting globally

---

## Critical Action Items (DO IMMEDIATELY)

### 🔴 URGENT: Firebase Credentials
- [ ] **TODAY:** Revoke exposed service account key in Google Cloud Console
- [ ] **TODAY:** Generate new service account key
- [ ] **TODAY:** Store in Vercel environment variables ONLY:
  ```
  FIREBASE_PROJECT_ID
  FIREBASE_CLIENT_EMAIL
  FIREBASE_PRIVATE_KEY
  ```
- [ ] **TODAY:** Delete JSON file from local machine
- [ ] **TODAY:** Never commit credentials to git

### 🔴 URGENT: Admin Password
- [ ] **TODAY:** Change default admin password
- [ ] Use strong password (16+ characters, mixed case, numbers, symbols)
- [ ] Update in deployment platform environment variables

### 🔴 URGENT: Verify Fixes
- [ ] **TODAY:** Test login with new bcrypt hashing
- [ ] **TODAY:** Verify audit logs are being created
- [ ] **TODAY:** Check `.gitignore` is preventing credential commits

---

## Testing Plan

### Unit Tests
```bash
npm test api/_auth.ts
npm test api/auth.ts
```

### Integration Tests
```bash
# Test login with valid credentials
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"correct-password"}'

# Test login with invalid credentials
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"wrong-password"}'

# Test password change
curl -X PUT http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"old-password","newPassword":"new-password-123"}'
```

### Security Tests
```bash
# Check for credentials in git
grep -r "BEGIN PRIVATE KEY" src/ api/
grep -r "password.*=" .env

# Verify .gitignore
git status --ignored

# Check npm vulnerabilities
npm audit

# Check for exposed secrets
git log --all --source -- '*.json' | grep -i firebase
```

---

## Rollback Plan

If issues arise with new authentication system:

1. Keep original `_auth.ts.backup` and `auth.ts.backup`
2. Test in staging environment first
3. Have rollback command ready:
   ```bash
   git revert <commit-hash>
   ```
4. Keep old password hashes for users during transition

---

## Success Criteria

After Phase 1:
- ✅ Bcrypt hashing working
- ✅ Audit logs created
- ✅ No credentials in git
- ✅ `.gitignore` protecting secrets
- ✅ Admin password changed

After Phase 2:
- ✅ Rate limiting active
- ✅ OTP persisted in Firestore
- ✅ CORS/CSRF configured
- ✅ Cryptographic random OTP

After Phase 3:
- ✅ Security headers present
- ✅ Input validation on all endpoints
- ✅ Comprehensive audit logging
- ✅ Security monitoring enabled

After Phase 4:
- ✅ Automated security scanning
- ✅ Regular pentesting
- ✅ Team training completed
- ✅ Infrastructure hardened

---

## Sign-Off

- **Responsible:** Charan (charan@webomindapps.com)
- **Security Contact:** security@webomindapps.com
- **Start Date:** June 6, 2026
- **Target Completion:** June 27, 2026 (Phase 4 optional)

---

**Remember:** Security is an ongoing process. Complete these phases in order and maintain vigilance going forward.
