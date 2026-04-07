# 🧪 RBAC Testing Guide

**Quick guide to test Role-Based Access Control implementation**

---

## 🎯 FRONTEND TESTING

### Test 1: Student Login - Navigation Check

1. **Login as Student:**
   ```
   Email: bs-cs-001@uog.edu.pk
   Password: password123
   ```

2. **Expected Navigation Items:**
   - ✅ My Proposals
   - ✅ Calendar
   - ✅ Search
   - ✅ Notifications
   - ✅ Profile

3. **Should NOT See:**
   - ❌ Analytics
   - ❌ Budget
   - ❌ Manage Societies

---

### Test 2: Admin Login - Navigation Check

1. **Login as Director:**
   ```
   Email: director.ssc@uog.edu.pk
   Password: password123
   ```

2. **Expected Navigation Items:**
   - ✅ Manage Societies
   - ✅ Budget
   - ✅ Analytics
   - ✅ Calendar
   - ✅ Search
   - ✅ Notifications
   - ✅ Profile

3. **Should NOT See:**
   - ❌ My Proposals (student feature)

---

### Test 3: Profile Edit - Read-Only Fields

1. **Login as any user**
2. **Go to Profile page**
3. **Click "Edit Profile"**

4. **Expected Behavior:**
   - ✅ Email field is DISABLED (grayed out)
   - ✅ Role is shown as READ-ONLY badge
   - ✅ Name field is EDITABLE
   - ✅ Bio field is EDITABLE
   - ✅ Phone field is EDITABLE

5. **Try to edit:**
   - Change name → Should work ✅
   - Try to click email field → Should not be editable ❌
   - Try to click role badge → Should not be editable ❌

---

## 🔐 BACKEND TESTING

### Test 4: Profile Update - Role Spoofing Prevention

**Using PowerShell:**

```powershell
# Login first to get token
$loginBody = @{
    email = "bs-cs-001@uog.edu.pk"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

# Attempt to change role via Postman/API (SHOULD FAIL)
$attackBody = @{
    name = "Hacker"
    role = "VC"
    email = "admin@uog.edu.pk"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri "http://localhost:5001/api/users/profile" -Method PUT -Headers $headers -Body $attackBody

# Check response
$response
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "updatedFields": ["name"]
}
```

**Verify in Database:**
```sql
SELECT name, role, email FROM users WHERE email = 'bs-cs-001@uog.edu.pk';
```

**Expected:**
- ✅ Name changed to "Hacker"
- ✅ Role is STILL "STUDENT" (not changed to VC)
- ✅ Email is STILL "bs-cs-001@uog.edu.pk" (not changed)

---

### Test 5: Profile Update - Valid Fields Only

**Using PowerShell:**

```powershell
# Update only allowed fields
$validBody = @{
    name = "Ahmed Khan Updated"
    bio = "Computer Science Student"
    phone = "+92 300 1234567"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5001/api/users/profile" -Method PUT -Headers $headers -Body $validBody

# Check response
$response
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "updatedFields": ["name", "bio", "phone"]
}
```

---

### Test 6: Profile Update - Empty Fields Rejection

**Using PowerShell:**

```powershell
# Try to update with empty data
$emptyBody = @{
    role = "VC"
    email = "admin@uog.edu.pk"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5001/api/users/profile" -Method PUT -Headers $headers -Body $emptyBody
```

**Expected Result:**
```json
{
  "error": "No valid fields to update",
  "message": "Please provide at least one field to update (name, bio, or phone)"
}
```

---

## 🔍 SERVER LOG VERIFICATION

### Check Audit Logs

After running Test 4 (role spoofing attempt), check server logs:

**Expected Log Entry:**
```
[PROFILE UPDATE] User 13 updated profile: [ 'name' ]
```

**Should NOT see:**
```
[PROFILE UPDATE] User 13 updated profile: [ 'name', 'role', 'email' ]
```

This confirms that dangerous fields were stripped before database update.

---

## ✅ COMPLETE TEST CHECKLIST

### Frontend Tests
- [ ] Student sees only student navigation items
- [ ] Admin sees only admin navigation items
- [ ] Email field is disabled in profile edit
- [ ] Role field is read-only badge in profile edit
- [ ] Name, bio, phone are editable
- [ ] Profile update shows success message

### Backend Tests
- [ ] Role spoofing attempt is blocked
- [ ] Email change attempt is blocked
- [ ] Valid profile updates work correctly
- [ ] Empty update requests are rejected
- [ ] Audit logs show correct fields updated
- [ ] Database shows only allowed fields changed

### Security Tests
- [ ] JWT token is required for profile update
- [ ] User can only update their own profile
- [ ] Dangerous fields are ignored even if sent
- [ ] Input is trimmed and validated
- [ ] Error messages are user-friendly

---

## 🚨 FAILURE SCENARIOS

### If Role Changes After Attack:
```sql
-- Check user role
SELECT id, name, email, role FROM users WHERE email = 'bs-cs-001@uog.edu.pk';

-- If role changed to VC, RBAC is BROKEN
-- Expected: role should still be 'STUDENT'
```

**Fix:** Review `updateUserProfile` function in `userController.js`

### If Email Changes After Attack:
```sql
-- Check user email
SELECT id, name, email FROM users WHERE id = 13;

-- If email changed to admin email, RBAC is BROKEN
-- Expected: email should still be original
```

**Fix:** Ensure email is not in allowed fields list

---

## 📊 TEST RESULTS TEMPLATE

```
RBAC Testing Results - [Date]
================================

Frontend Tests:
✅ Student navigation - PASS
✅ Admin navigation - PASS
✅ Profile read-only fields - PASS

Backend Tests:
✅ Role spoofing prevention - PASS
✅ Email change prevention - PASS
✅ Valid updates - PASS
✅ Empty request rejection - PASS

Security Tests:
✅ JWT authentication - PASS
✅ Field whitelisting - PASS
✅ Audit logging - PASS

Overall Status: ✅ ALL TESTS PASSED
```

---

## 🎯 QUICK VERIFICATION

**One-Line Test (PowerShell):**

```powershell
# Login and attempt role escalation
$login = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body (@{email="bs-cs-001@uog.edu.pk";password="password123"}|ConvertTo-Json) -ContentType "application/json"; Invoke-RestMethod -Uri "http://localhost:5001/api/users/profile" -Method PUT -Headers @{Authorization="Bearer $($login.token)"} -Body (@{name="Test";role="VC"}|ConvertTo-Json) -ContentType "application/json"
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "updatedFields": ["name"]
}
```

If you see `"updatedFields": ["name", "role"]`, RBAC is broken!

---

**Status:** Ready for Testing  
**Estimated Time:** 15 minutes for complete test suite
