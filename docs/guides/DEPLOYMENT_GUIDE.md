# 🚀 DEPLOYMENT GUIDE - Campus Connect v4.0

**Deployment Stack:**
- **Frontend:** Netlify (React SPA)
- **Backend:** Render (Node.js API)
- **Database:** Your MySQL server (or Render MySQL)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Files Created/Verified:
- [x] `frontend/public/_redirects` - Netlify routing fix
- [x] `package.json` - Has `"start": "node server.js"`
- [x] `frontend/package.json` - Has `"build": "react-scripts build"`
- [x] `.env` - Environment variables configured
- [x] All code committed to GitHub

---

## 📦 STEP 1: PREPARE ENVIRONMENT VARIABLES

### Backend Environment Variables (Render)
Create these in Render dashboard:

```env
# Database
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=campus_connect
DB_SSL=true

# IMPORTANT: Set DB_SSL=true for Aiven, PlanetScale, or other cloud MySQL providers
# Set DB_SSL=false for local development or non-SSL databases

# Server
PORT=5001
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRY=2m

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=campusconnectuog@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# URLs (UPDATE AFTER DEPLOYMENT)
FRONTEND_URL=https://your-netlify-app.netlify.app
BACKEND_URL=https://your-render-app.onrender.com

# VC Email
VC_EMAIL=vc@uog.edu.pk

# Optional
REDIS_URL=redis://localhost:6379
REQUIRE_EMAIL_VERIFICATION=false

# CORS
CORS_ORIGIN=https://your-netlify-app.netlify.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables (Netlify)
Netlify doesn't need env vars if using proxy, but if needed:

```env
REACT_APP_API_URL=https://your-render-app.onrender.com
```

---

## 🌐 STEP 2: DEPLOY BACKEND TO RENDER

### 2.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repository

### 2.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `GodZilla-lct/FYP-2-`
3. Configure:
   - **Name:** `campus-connect-backend`
   - **Region:** Choose closest to you
   - **Branch:** `FYP-2-v4.0` (or your main branch)
   - **Root Directory:** Leave empty (or `.` if needed)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (uses `node server.js`)
   - **Plan:** Free (or paid for better performance)

### 2.3 Add Environment Variables
In Render dashboard:
1. Go to **Environment** tab
2. Add all variables from above
3. Click **Save Changes**

### 2.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL: `https://campus-connect-backend.onrender.com`

### 2.5 Setup Database
**Option A: Use Aiven MySQL (Recommended for Production)**
1. Go to https://aiven.io and create account
2. Create new MySQL service
3. Wait for service to start (2-3 minutes)
4. Copy connection details:
   - Host: `mysql-xxxxx.aivencloud.com`
   - Port: `12345`
   - User: `avnadmin`
   - Password: (shown once)
   - Database: `defaultdb`
5. **IMPORTANT:** Add to Render environment variables:
   ```env
   DB_HOST=mysql-xxxxx.aivencloud.com
   DB_USER=avnadmin
   DB_PASSWORD=your-aiven-password
   DB_NAME=defaultdb
   DB_SSL=true
   ```
6. Aiven requires SSL - ensure `DB_SSL=true` is set!

**Option B: Use Render MySQL**
1. Create new **MySQL** database on Render
2. Copy connection details to environment variables
3. Set `DB_SSL=false` (Render doesn't require SSL)

**Option C: Use External MySQL**
1. Ensure your MySQL server is accessible from internet
2. Update `DB_HOST`, `DB_USER`, `DB_PASSWORD` in Render env vars
3. Set `DB_SSL=false` for local/non-SSL servers

### 2.6 Run Database Setup
**SSH into Render (if available) or use local connection:**
```bash
# Run schema
node backend/scripts/run_schema.js

# Run migrations
node backend/database/run_super_admin_migration.js
node backend/database/run_tickets_migration.js

# Seed database
node backend/database/seed.js

# Create system admin
node backend/setup-superadmin.js
```

---

## 🎨 STEP 3: DEPLOY FRONTEND TO NETLIFY

### 3.1 Create Netlify Account
1. Go to https://netlify.com
2. Sign up with GitHub
3. Authorize Netlify

### 3.2 Create New Site
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **GitHub**
3. Select repository: `GodZilla-lct/FYP-2-`
4. Configure:
   - **Branch:** `FYP-2-v4.0`
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/build`

### 3.3 Build Settings
Netlify should auto-detect React, but verify:
```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/build
```

### 3.4 Deploy
1. Click **"Deploy site"**
2. Wait for build (3-5 minutes)
3. Copy your frontend URL: `https://your-app-name.netlify.app`

### 3.5 Custom Domain (Optional)
1. Go to **Domain settings**
2. Add custom domain
3. Update DNS records

---

## 🔗 STEP 4: CONNECT FRONTEND TO BACKEND

### 4.1 Update Backend Environment Variables
In Render dashboard, update:
```env
FRONTEND_URL=https://your-netlify-app.netlify.app
CORS_ORIGIN=https://your-netlify-app.netlify.app
```

### 4.2 Update Frontend API Calls
**Option A: Use Proxy (Recommended for Development)**
Already configured in `frontend/package.json`:
```json
"proxy": "http://localhost:5001"
```

**Option B: Update API Base URL (Production)**
If not using proxy, update `frontend/src/utils/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-render-app.onrender.com';
```

### 4.3 Redeploy
1. Commit changes to GitHub
2. Both Netlify and Render will auto-deploy
3. Or manually trigger deploy in dashboards

---

## ✅ STEP 5: VERIFY DEPLOYMENT

### Backend Health Check
```bash
curl https://your-render-app.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "version": "4.0",
  "timestamp": "2026-04-13T..."
}
```

### Frontend Check
1. Open `https://your-netlify-app.netlify.app`
2. Should see login page
3. Try logging in with:
   - Email: `super.admin@uog.edu.pk`
   - Password: `password123`

### Test Features
- [ ] Login works
- [ ] Dashboard loads
- [ ] Create proposal
- [ ] View proposals
- [ ] Notifications work
- [ ] Page refresh doesn't break (thanks to `_redirects`)

---

## 🐛 TROUBLESHOOTING

### Issue: 404 on Page Refresh (Netlify)
**Solution:** Verify `frontend/public/_redirects` exists with:
```
/* /index.html 200
```

### Issue: CORS Error
**Solution:** Update `CORS_ORIGIN` in Render to match Netlify URL

### Issue: Database Connection Failed
**Solution:** 
1. Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` in Render
2. **For Aiven/Cloud MySQL:** Set `DB_SSL=true` in environment variables
3. Ensure MySQL server allows external connections
4. Check firewall rules
5. Verify SSL certificate is valid (for cloud providers)

### Issue: SSL Connection Error (Aiven)
**Symptoms:** 
- "ER_NOT_SUPPORTED_AUTH_MODE"
- "SSL connection error"
- "ECONNREFUSED"

**Solution:**
1. Set `DB_SSL=true` in Render environment variables
2. Verify Aiven MySQL service is running
3. Check Aiven connection details are correct
4. Ensure your IP is whitelisted in Aiven (if applicable)

### Issue: Backend Not Starting
**Solution:**
1. Check Render logs
2. Verify `"start": "node server.js"` in `package.json`
3. Check all environment variables are set

### Issue: Frontend Build Failed
**Solution:**
1. Check Netlify build logs
2. Verify `frontend/package.json` has `"build": "react-scripts build"`
3. Check for missing dependencies

---

## 📊 MONITORING

### Render Dashboard
- View logs: Real-time server logs
- Metrics: CPU, Memory usage
- Events: Deployment history

### Netlify Dashboard
- Build logs: See build output
- Deploy previews: Test before going live
- Analytics: Traffic stats

---

## 🔒 SECURITY CHECKLIST

- [ ] Change default passwords in database
- [ ] Update `JWT_SECRET` to strong random string
- [ ] Enable HTTPS (automatic on Netlify/Render)
- [ ] Set `NODE_ENV=production`
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Enable Render auto-deploy on push
- [ ] Configure Netlify deploy notifications

---

## 📝 POST-DEPLOYMENT

### Update Documentation
1. Update `README.md` with live URLs
2. Update `LOGIN_CREDENTIALS.md` with production credentials
3. Document any deployment-specific configurations

### Share with Team
- Frontend URL: `https://your-netlify-app.netlify.app`
- Backend URL: `https://your-render-app.onrender.com`
- Admin credentials: `super.admin@uog.edu.pk` / `password123`

### Monitor First Week
- Check error logs daily
- Monitor performance
- Gather user feedback
- Fix any issues quickly

---

## 🎉 DEPLOYMENT COMPLETE!

Your Campus Connect v4.0 is now live and accessible worldwide!

**Frontend:** https://your-netlify-app.netlify.app  
**Backend:** https://your-render-app.onrender.com  
**Status:** Production Ready ✅

---

## 📞 SUPPORT

If you encounter issues:
1. Check Render/Netlify logs
2. Review this guide
3. Check `DEPLOYMENT_CHECKLIST.md`
4. Contact your team lead

**Good luck with your deployment!** 🚀
