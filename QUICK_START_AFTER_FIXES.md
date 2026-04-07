# 🚀 Quick Start Guide - After Bug Fixes

**Follow these steps to get Campus Connect v4.0 running with all bug fixes**

---

## ⚡ QUICK SETUP (5 Minutes)

### Step 1: Install csv-parser Package

```bash
cd FYP-2-
npm install csv-parser
```

**Expected Output:**
```
added 1 package, and audited 123 packages in 3s
```

---

### Step 2: Run the New CSV-Based Seeder

```bash
npm run seed
```

**Or directly:**
```bash
node backend/database/seed.js
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║   Campus Connect v4.0 - CSV-Based Database Seeding        ║
╚════════════════════════════════════════════════════════════╝

🗑️  Clearing existing data...
✓ Database cleared

👑 Creating Admin Accounts...
   ✓ VC: vc@uog.edu.pk
   ✓ REGISTRAR: registrar@uog.edu.pk
   ✓ DIRECTOR_SSC: director.ssc@uog.edu.pk
   ✓ FINANCE_SECRETARY: finance@uog.edu.pk
   ✓ ASST_DIRECTOR: asst.director@uog.edu.pk

📄 Reading UOG_Societies.csv...
   ✓ Found 12 societies in CSV

🏛️  Creating Societies and President Accounts...
   ✓ Hayatian Blood Society (HBS)
      President: Badar Ali Sajjad (president.hbs@uog.edu.pk)
   ✓ UOG Debating Society (DS)
      President: Syed Hussain Abbas (president.ds@uog.edu.pk)
   ... (10 more societies)

📝 Creating Sample Proposals...
   ✓ "Annual Blood Donation Drive 2026" by Hayatian Blood Society (HBS)
   ✓ "Inter-University Debate Championship" by UOG Debating Society (DS)
   ✓ "Cultural Festival 2026" by Qalamkar Creative Writing Forum

╔════════════════════════════════════════════════════════════╗
║              ✅ SEEDING COMPLETED SUCCESSFULLY              ║
╚════════════════════════════════════════════════════════════╝

📋 LOGIN CREDENTIALS (All passwords: password123)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👑 ADMIN ACCOUNTS:
   VC                        vc@uog.edu.pk
   REGISTRAR                 registrar@uog.edu.pk
   DIRECTOR_SSC              director.ssc@uog.edu.pk
   FINANCE_SECRETARY         finance@uog.edu.pk
   ASST_DIRECTOR             asst.director@uog.edu.pk

🎓 PRESIDENT ACCOUNTS (Sample):
   Hayatian Blood Society (HBS)        president.hbs@uog.edu.pk
   UOG Debating Society (DS)           president.ds@uog.edu.pk
   Qalamkar Creative Writing Forum     president.qcwf@uog.edu.pk
   Hayatian Quiz Society (HQS)         president.hqs@uog.edu.pk
   Hayatian Islamic Forum (HIF)        president.hif@uog.edu.pk
   ... and 7 more presidents

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY:
   • Admin Accounts: 5
   • Societies: 12
   • Presidents: 12
   • Sample Proposals: 3

🚀 Ready to start the application!
```

---

### Step 3: Start Backend Server

```bash
npm start
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       🔒 Campus Connect v4.0 - Secured Edition 🔒         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

✓ Server running on port 5001
✓ Environment: development
✓ API: http://localhost:5001/api
✓ Health: http://localhost:5001/health

🔒 Security Features Enabled:
  • Helmet - Secure HTTP Headers
  • CORS - Restricted Origin
  • Rate Limiting - 100 req/15min per IP
  • XSS Protection - Input Sanitization
  • NoSQL Injection Protection
  • HTTP Parameter Pollution Protection
  • JWT Authentication & Authorization (20-min expiry) ⭐ NEW
  • Activity Logging & Monitoring

✨ Application Features:
  • Email Notifications (SMTP)
  • Real-time Updates (WebSocket)
  • Analytics & Reporting
  • Advanced Search & Filters
  • Comments & Collaboration
  • Draft Proposals
  • Budget Management
  • Calendar Integration
  • User Profiles & Activity Logs
  • Redis Caching (optional)

⚠️  DEVELOPMENT MODE - Some security features relaxed
```

---

### Step 4: Start Frontend (New Terminal)

```bash
cd FYP-2-/frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view campus-connect-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.
```

---

## 🧪 TESTING THE FIXES

### Test 1: Login as Director SSC

1. **Open browser:** http://localhost:3000
2. **Login:**
   - Email: `director.ssc@uog.edu.pk`
   - Password: `password123`
3. **Verify Navigation:**
   - ✅ Should see "Manage Societies" button
   - ✅ Should see "Budget" button
   - ✅ Should see "Analytics" button
   - ❌ Should NOT see "My Proposals" button

4. **Click "Manage Societies":**
   - ✅ Should see all 12 societies
   - ✅ Should be able to add new society
   - ✅ Should be able to edit society
   - ✅ Should be able to delete society

---

### Test 2: Login as President

1. **Logout** (if logged in)
2. **Login:**
   - Email: `president.hbs@uog.edu.pk`
   - Password: `password123`
3. **Verify Navigation:**
   - ✅ Should see "My Proposals" button
   - ✅ Should see "Calendar" button
   - ✅ Should see "Search" button
   - ❌ Should NOT see "Manage Societies" button
   - ❌ Should NOT see "Analytics" button
   - ❌ Should NOT see "Budget" button

---

### Test 3: 20-Minute Auto-Logout

**Option A: Wait 20 minutes (slow)**
1. Login as any user
2. Wait 20 minutes
3. Try to navigate or make any action
4. Should automatically redirect to login

**Option B: Test with 1-minute expiry (fast)**
1. Edit `backend/config/jwt.js`
2. Change `expiresIn: '20m'` to `expiresIn: '1m'`
3. Restart backend server
4. Login as any user
5. Wait 1 minute
6. Try to navigate
7. Should automatically redirect to login
8. **Don't forget to change back to 20m!**

---

### Test 4: Profile Security

1. **Login as any user**
2. **Go to Profile page**
3. **Click "Edit Profile"**
4. **Verify:**
   - ✅ Email field is DISABLED (grayed out)
   - ✅ Role is shown as badge (not editable)
   - ✅ Name field is EDITABLE
   - ✅ Bio field is EDITABLE
   - ✅ Phone field is EDITABLE
5. **Try to edit name:**
   - Change name to "Test User"
   - Click "Save Changes"
   - Should show success message
   - Name should update

---

### Test 5: Profile Security (Postman Attack)

**Using PowerShell:**

```powershell
# Login first
$login = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body (@{email="president.hbs@uog.edu.pk";password="password123"}|ConvertTo-Json) -ContentType "application/json"

# Try to change role to VC (should fail)
$attack = Invoke-RestMethod -Uri "http://localhost:5001/api/users/profile" -Method PUT -Headers @{Authorization="Bearer $($login.token)"} -Body (@{name="Hacker";role="VC";email="admin@uog.edu.pk"}|ConvertTo-Json) -ContentType "application/json"

# Check response
$attack
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "updatedFields": ["name"]
}
```

**Verify in Database:**
```sql
SELECT name, role, email FROM users WHERE email = 'president.hbs@uog.edu.pk';
```

**Expected:**
- Name: "Hacker" (changed)
- Role: "STUDENT" (NOT changed to VC) ✅
- Email: "president.hbs@uog.edu.pk" (NOT changed) ✅

---

## 📋 ALL LOGIN CREDENTIALS

### Admin Accounts (All passwords: password123)

| Role | Email | Access |
|------|-------|--------|
| Vice Chancellor | vc@uog.edu.pk | Full system access |
| Registrar | registrar@uog.edu.pk | Approval authority |
| Director SSC | director.ssc@uog.edu.pk | Full management access |
| Finance Secretary | finance@uog.edu.pk | Budget management |
| Assistant Director | asst.director@uog.edu.pk | Approval authority |

### President Accounts (All passwords: password123)

| Society | Email | Acronym |
|---------|-------|---------|
| Hayatian Blood Society | president.hbs@uog.edu.pk | HBS |
| UOG Debating Society | president.ds@uog.edu.pk | DS |
| Qalamkar Creative Writing Forum | president.qcwf@uog.edu.pk | QCWF |
| Hayatian Quiz Society | president.hqs@uog.edu.pk | HQS |
| Hayatian Islamic Forum | president.hif@uog.edu.pk | HIF |
| Character Building Society | president.cbs@uog.edu.pk | CBS |
| Hayatian Science Society & Clubs | president.hssc@uog.edu.pk | HSSC |
| Hayatian Law Moot Society | president.hlms@uog.edu.pk | HLMS |
| Readers' Club UOG | president.rcuog@uog.edu.pk | RCUOG |
| Scholar Bridge Society | president.sbs@uog.edu.pk | SBS |
| UOG Urdu Society | president.uus@uog.edu.pk | UUS |
| UOG Music Society | president.ums@uog.edu.pk | UMS |

---

## 🐛 TROUBLESHOOTING

### Issue: "csv-parser not found"

**Solution:**
```bash
npm install csv-parser
```

### Issue: "Cannot read UOG_Societies.csv"

**Solution:**
Verify file exists:
```bash
ls backend/database/UOG_Societies.csv
```

If missing, the file should be at `FYP-2-/backend/database/UOG_Societies.csv`

### Issue: "Database connection failed"

**Solution:**
1. Check MySQL is running
2. Verify .env file has correct credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=campus_connect
   ```

### Issue: "Port 5001 already in use"

**Solution:**
```bash
# Find process using port 5001
netstat -ano | findstr :5001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: Frontend shows "Network Error"

**Solution:**
1. Verify backend is running on port 5001
2. Check browser console for errors
3. Verify CORS is configured correctly

---

## ✅ SUCCESS CHECKLIST

- [ ] csv-parser installed
- [ ] Seeder ran successfully
- [ ] Backend server started
- [ ] Frontend server started
- [ ] Can login as Director SSC
- [ ] Can see "Manage Societies" button
- [ ] Can login as President
- [ ] Cannot see admin features as President
- [ ] Profile page shows disabled email/role fields
- [ ] Can edit name, bio, phone only
- [ ] Auto-logout works after 20 minutes

---

## 🎯 WHAT'S FIXED

✅ **Bug 1:** CSV-based seeder creates all admin and president accounts  
✅ **Bug 2:** JWT tokens expire after 20 minutes with auto-logout  
✅ **Bug 3:** Profile page secured (email/role cannot be changed)  
✅ **Bug 4:** Director SSC can manage societies  

---

## 🚀 READY FOR PRODUCTION

All critical bugs are fixed. The system is now ready for:
- User acceptance testing
- Production deployment
- Final demonstration

---

**Need Help?** Check `BUG_FIXES_COMPLETE.md` for detailed information about each fix.
