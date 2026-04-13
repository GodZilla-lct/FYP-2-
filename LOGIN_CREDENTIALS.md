# 🔐 LOGIN CREDENTIALS

## SYSTEM_ADMIN Account
**Email:** `super.admin@uog.edu.pk`  
**Password:** `password123`  
**Role:** SYSTEM_ADMIN  
**Access:** Super Admin Dashboard with full system control

---

## Other Admin Accounts (from seed.js)

### Vice Chancellor
**Email:** `vc@uog.edu.pk`  
**Password:** `password123`  
**Role:** VC  
**Note:** VC approves via email Magic Links (no frontend access by design)

### Registrar
**Email:** `registrar@uog.edu.pk`  
**Password:** `password123`  
**Role:** REGISTRAR

### Director SSC
**Email:** `director.ssc@uog.edu.pk`  
**Password:** `password123`  
**Role:** DIRECTOR_SSC

### Finance Secretary
**Email:** `finance@uog.edu.pk`  
**Password:** `password123`  
**Role:** FINANCE_SECRETARY

### Assistant Director
**Email:** `asst.director@uog.edu.pk`  
**Password:** `password123`  
**Role:** ASST_DIRECTOR

### Coordinator
**Email:** `coordinator@uog.edu.pk`  
**Password:** `password123`  
**Role:** COORDINATOR

---

## Society Presidents
All society presidents have accounts with:
- **Email Pattern:** `president.{acronym}@uog.edu.pk`
- **Password:** `password123`
- **Role:** STUDENT

**Examples:**
- `president.hbs@uog.edu.pk` (Hayatian Blood Society)
- `president.dsc@uog.edu.pk` (Debating Society)
- `president.lsc@uog.edu.pk` (Literary Society)

---

## 🚀 SYSTEM STATUS

**Backend:** ✅ Running on http://localhost:5001  
**Frontend:** ✅ Running on http://localhost:3000  
**Database:** ✅ All tables created and seeded  
**SYSTEM_ADMIN:** ✅ Account created and ready

---

## ✅ FIXED ISSUES

1. ✅ Database config now loads .env properly
2. ✅ SYSTEM_ADMIN role added to database ENUM
3. ✅ SYSTEM_ADMIN account created (ID: 19)
4. ✅ `system_settings` table created
5. ✅ `super_admin_logs` table created
6. ✅ `support_tickets` table created
7. ✅ Backend restarted with all features

---

## 🎯 NEXT STEPS

1. Open http://localhost:3000
2. Login with `super.admin@uog.edu.pk` / `password123`
3. You should see the Super Admin Dashboard
4. Test system controls and user management

---

## ⚠️ NON-CRITICAL WARNINGS

The following warnings in backend logs are **safe to ignore**:
- Redis connection failed (optional feature, graceful fallback)
- Rate limiter proxy warnings (only affects reverse proxy setups)

All core functionality is working correctly.
