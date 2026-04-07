# 🔒 Role-Based Access Control (RBAC) Implementation

**Project:** Campus Connect v4.0  
**Last Updated:** April 5, 2026  
**Security Level:** Enterprise-Grade

---

## 🎯 OVERVIEW

This document describes the comprehensive RBAC implementation across frontend and backend to prevent unauthorized access and privilege escalation attacks.

---

## 👥 USER ROLES & PERMISSIONS

### Role Hierarchy

```
┌─────────────────────────────────────────────────┐
│                    VC (Top)                     │
│              Vice Chancellor                    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│                 REGISTRAR                       │
│           Administrative Approver               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            FINANCE_SECRETARY                    │
│              Budget Approver                    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              DIRECTOR_SSC                       │
│    Student Societies Council Director          │
│         (Full System Access)                    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│             ASST_DIRECTOR                       │
│           Assistant Director                    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              COORDINATOR                        │
│           Faculty Coordinator                   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│                 STUDENT                         │
│          Society Members/Leaders                │
└─────────────────────────────────────────────────┘
```

---

## 🚫 FRONTEND RBAC RULES

### Navigation Menu Access Control

#### STUDENT & SOCIETY LEADERS CAN SEE:
- ✅ **My Proposals** - Create and manage proposals
- ✅ **Calendar** - View event calendar
- ✅ **Search** - Search proposals and users
- ✅ **Notifications** - View notifications
- ✅ **Profile** - Edit own profile

#### STUDENT & SOCIETY LEADERS CANNOT SEE:
- ❌ **Analytics** - System analytics (admin only)
- ❌ **Budget** - Budget management (admin only)
- ❌ **Manage Societies** - Society hierarchy (admin only)

---

#### ADMIN ROLES CAN SEE:
(DIRECTOR_SSC, ASST_DIRECTOR, FINANCE_SECRETARY, REGISTRAR, VC)

- ✅ **Analytics** - System-wide analytics and reports
- ✅ **Calendar** - View event calendar
- ✅ **Search** - Search proposals and users
- ✅ **Notifications** - View notifications
- ✅ **Profile** - Edit own profile

#### DIRECTOR_SSC ADDITIONALLY CAN SEE:
- ✅ **Manage Societies** - Full society hierarchy management
- ✅ **Budget** - Budget allocation and management

#### ADMIN ROLES CANNOT SEE:
- ❌ **My Proposals** - Proposal creation (society feature)
- ❌ **My Drafts** - Draft proposals (society feature)
- ❌ **My Cabinet** - Society cabinet (society feature)

---

## 🔐 PROFILE SECURITY

### Protected Fields (Cannot Be Modified by Users)

#### Frontend Protection
- **Email** - Displayed as disabled/readonly input
- **Role** - Displayed as read-only badge
- **Roll Number** - View only (not editable)
- **Account Status** - System managed
- **Email Verified** - System managed

#### Backend Protection
The backend explicitly strips these fields from update requests:

```javascript
// BLOCKED FIELDS (ignored even if sent via Postman)
- role              // Prevents privilege escalation
- email             // Prevents account takeover
- society_id        // Prevents unauthorized society access
- is_active         // Prevents account status manipulation
- email_verified    // Prevents verification bypass
- password_hash     // Prevents direct password manipulation
- roll_number       // Prevents identity spoofing
```

### Allowed Fields (User Can Modify)

```javascript
// ALLOWED FIELDS
✅ name     // User's display name
✅ bio      // User biography
✅ phone    // Contact number
```

---

## 🛡️ BACKEND SECURITY IMPLEMENTATION

### Profile Update Endpoint Security

**Endpoint:** `PUT /api/users/profile`

#### Security Measures:

1. **JWT Authentication Required**
   - User must be logged in
   - Token verified before processing

2. **Field Whitelisting**
   - Only `name`, `bio`, `phone` are extracted from request
   - All other fields are ignored

3. **User ID from Token**
   - User ID taken from JWT token (not request body)
   - Prevents users from updating other profiles

4. **Input Validation**
   - Fields are trimmed
   - Empty strings are rejected
   - At least one field must be provided

5. **Audit Logging**
   - All profile updates are logged
   - Includes user ID and updated fields

#### Attack Prevention:

```javascript
// ❌ ATTACK ATTEMPT (via Postman):
POST /api/users/profile
{
  "name": "Hacker",
  "role": "VC",              // IGNORED
  "email": "admin@uog.edu.pk", // IGNORED
  "is_active": true          // IGNORED
}

// ✅ ACTUAL UPDATE (only safe fields):
{
  "name": "Hacker"  // Only this is updated
}
```

---

## 🔍 SECURITY TESTING

### Test Cases

#### Test 1: Role Spoofing Prevention
```bash
# Attempt to escalate privileges
curl -X PUT http://localhost:5001/api/users/profile \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "VC", "name": "Test"}'

# Expected: Role is NOT updated, only name is updated
```

#### Test 2: Email Takeover Prevention
```bash
# Attempt to change email to admin
curl -X PUT http://localhost:5001/api/users/profile \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "director.ssc@uog.edu.pk", "name": "Test"}'

# Expected: Email is NOT updated, only name is updated
```

#### Test 3: Account Status Manipulation
```bash
# Attempt to activate deactivated account
curl -X PUT http://localhost:5001/api/users/profile \
  -H "Authorization: Bearer <deactivated_user_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": true, "name": "Test"}'

# Expected: is_active is NOT updated
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Frontend ✅
- [x] Navigation menu shows role-appropriate items only
- [x] Admin features hidden from students/coordinators
- [x] Student features hidden from admins
- [x] Email field is disabled in profile edit
- [x] Role field is read-only badge in profile edit
- [x] Profile update uses correct API endpoint
- [x] Error messages displayed to user

### Backend ✅
- [x] Profile update endpoint uses JWT user ID
- [x] Dangerous fields are stripped from request
- [x] Only safe fields (name, bio, phone) are allowed
- [x] Input validation and sanitization
- [x] Audit logging for profile updates
- [x] Proper error handling and messages
- [x] No route parameter for user ID (uses token)

---

## 🚨 SECURITY WARNINGS

### For Developers

1. **NEVER trust client-side validation alone**
   - Always validate on backend
   - Client-side is for UX, not security

2. **NEVER use request body for user identification**
   - Always use JWT token for user ID
   - Never trust `req.body.userId` or `req.params.id` for profile updates

3. **NEVER allow role updates via profile endpoint**
   - Role changes must go through admin-only endpoints
   - Require additional authorization checks

4. **ALWAYS whitelist allowed fields**
   - Never use `req.body` directly in UPDATE queries
   - Extract only known-safe fields

5. **ALWAYS log security-sensitive operations**
   - Profile updates
   - Role changes
   - Permission grants

---

## 🔄 FUTURE ENHANCEMENTS

### Recommended Additions

1. **Two-Factor Authentication (2FA)**
   - Add 2FA for admin roles
   - Require 2FA for sensitive operations

2. **Email Change Verification**
   - If email changes are allowed, require verification
   - Send confirmation to both old and new email

3. **Role Change Audit Trail**
   - Separate table for role change history
   - Track who changed what and when

4. **Session Management**
   - Invalidate all sessions on role change
   - Force re-login after privilege changes

5. **IP Whitelisting for Admins**
   - Restrict admin access to specific IPs
   - Add IP-based rate limiting

---

## 📊 RBAC MATRIX

| Feature | STUDENT | COORDINATOR | ASST_DIR | DIRECTOR | FINANCE | REGISTRAR | VC |
|---------|---------|-------------|----------|----------|---------|-----------|-----|
| Create Proposal | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Own Proposals | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View All Proposals | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve Proposals | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Societies | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Budget Management | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Analytics | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calendar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Profile Edit | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change Own Role | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🎯 COMPLIANCE

### Security Standards Met

- ✅ **OWASP Top 10** - Broken Access Control Prevention
- ✅ **Principle of Least Privilege** - Users have minimum necessary permissions
- ✅ **Defense in Depth** - Multiple layers of security (frontend + backend)
- ✅ **Secure by Default** - Restrictive permissions by default
- ✅ **Audit Trail** - All sensitive operations logged

---

## 📞 SUPPORT

For security concerns or questions about RBAC implementation:

1. Review this documentation
2. Check `SECURITY_IMPLEMENTATION_GUIDE.md`
3. Test with provided test cases
4. Verify audit logs

---

**Status:** 🟢 RBAC Fully Implemented and Tested  
**Security Level:** Enterprise-Grade  
**Last Security Audit:** April 5, 2026
