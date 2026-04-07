# Campus Connect v4.0 - Complete Installation Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **MySQL** v8.0 or higher ([Download](https://dev.mysql.com/downloads/))
- **Redis** v6.0 or higher (Optional but recommended)
- **Git** ([Download](https://git-scm.com/downloads))
- **SMTP Email Account** (Gmail, SendGrid, etc.)

---

## 🚀 Step-by-Step Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/GodZilla-lct/FYP-2-.git
cd FYP-2-
```

### Step 2: Install Backend Dependencies

```bash
npm install
```

This will install all backend dependencies including:
- express
- mysql2
- socket.io
- redis
- nodemailer
- bcryptjs
- jsonwebtoken
- multer
- helmet
- compression
- express-rate-limit

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

This will install all frontend dependencies including:
- react
- react-dom
- socket.io-client
- react-router-dom
- recharts
- axios

### Step 4: Install and Configure Redis

#### On Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### On macOS:
```bash
brew install redis
brew services start redis
```

#### On Windows:
Download Redis from [https://redis.io/download](https://redis.io/download) or use WSL.

#### Verify Redis Installation:
```bash
redis-cli ping
# Should return: PONG
```

### Step 5: Configure MySQL Database

1. **Login to MySQL:**
```bash
mysql -u root -p
```

2. **Create Database:**
```sql
CREATE DATABASE campus_connect;
EXIT;
```

3. **Update MySQL credentials** (if needed) in the `.env` file (next step).

### Step 6: Configure Environment Variables

1. **Copy the example environment file:**
```bash
cp .env.example .env
```

2. **Edit `.env` file with your configuration:**

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_connect

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-too
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (SMTP)
# For Gmail: Enable "Less secure app access" or use App Password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@campusconnect.edu

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### 📧 Gmail SMTP Setup:
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → App passwords
3. Generate an app password for "Mail"
4. Use this password in `SMTP_PASS`

### Step 7: Create Upload Directories

```bash
node backend/scripts/setup_directories.js
```

This creates:
- `uploads/`
- `uploads/proposals/`
- `uploads/profiles/`

### Step 8: Initialize Database Schema

```bash
node backend/scripts/run_schema.js
```

This will create all necessary tables:
- users
- societies
- society_roles
- proposals
- proposal_attachments
- approval_history
- refresh_tokens
- password_reset_tokens
- notifications
- notification_preferences
- proposal_comments
- draft_proposals
- budget_allocations
- saved_search_filters
- calendar_events
- activity_logs

### Step 9: Seed Database with Sample Data

```bash
node backend/database/seed_v3.js
```

This creates:
- Admin users (Director SSC, VC, etc.)
- Sample societies
- Society roles and members
- Sample proposals

---

## 🎯 Running the Application

### Development Mode

#### Option 1: Run Both Servers Simultaneously
```bash
npm run dev
```

#### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Production Mode

1. **Build Frontend:**
```bash
cd frontend
npm run build
cd ..
```

2. **Start Production Server:**
```bash
NODE_ENV=production npm start
```

---

## 🔐 Default Login Credentials

### Admin Accounts:

**Director SSC:**
- Email: `director@uog.edu.pk`
- Password: `password123`

**Vice Chancellor:**
- Email: `vc@uog.edu.pk`
- Password: `password123`

**Assistant Director:**
- Email: `asst.director@uog.edu.pk`
- Password: `password123`

### Society President:
- Email: `2021-CS-001@uog.edu.pk`
- Password: `password123`

**⚠️ IMPORTANT:** Change these passwords immediately after first login in production!

---

## 🧪 Verify Installation

### 1. Check Backend Health:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "version": "4.0",
  "timestamp": "2026-04-03T...",
  "features": [...]
}
```

### 2. Check Redis Connection:
```bash
redis-cli ping
```

Expected: `PONG`

### 3. Check MySQL Connection:
```bash
mysql -u root -p campus_connect -e "SHOW TABLES;"
```

Should list all tables.

### 4. Access Frontend:
Open browser: [http://localhost:3000](http://localhost:3000)

### 5. Test Login:
Use any of the default credentials above.

---

## 📦 Package Scripts

```json
{
  "start": "node server.js",
  "dev": "concurrently \"npm start\" \"cd frontend && npm start\"",
  "test": "jest",
  "setup": "node backend/scripts/setup_directories.js && node backend/scripts/run_schema.js && node backend/database/seed_v3.js"
}
```

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to MySQL"
**Solution:**
- Verify MySQL is running: `sudo systemctl status mysql`
- Check credentials in `.env`
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Issue: "Redis connection failed"
**Solution:**
- Start Redis: `redis-server` or `sudo systemctl start redis`
- Check Redis status: `redis-cli ping`
- If Redis is optional, the app will still work without it (caching disabled)

### Issue: "Port 5000 already in use"
**Solution:**
- Change `PORT` in `.env` to another port (e.g., 5001)
- Or kill the process: `lsof -ti:5000 | xargs kill -9`

### Issue: "Email not sending"
**Solution:**
- Verify SMTP credentials
- For Gmail, use App Password (not regular password)
- Check firewall settings for port 587

### Issue: "File upload fails"
**Solution:**
- Run: `node backend/scripts/setup_directories.js`
- Check folder permissions: `chmod -R 755 uploads/`

### Issue: "Frontend can't connect to backend"
**Solution:**
- Verify backend is running on port 5000
- Check `proxy` in `frontend/package.json`: `"proxy": "http://localhost:5000"`
- Clear browser cache

---

## 🌐 Deployment to Production

### Environment Setup:
1. Set `NODE_ENV=production` in `.env`
2. Change all default passwords
3. Use strong JWT secrets
4. Configure proper CORS origins
5. Enable HTTPS
6. Set up proper firewall rules

### Recommended Hosting:
- **Backend**: Heroku, AWS EC2, DigitalOcean
- **Database**: AWS RDS, DigitalOcean Managed MySQL
- **Redis**: Redis Cloud, AWS ElastiCache
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront

### PM2 Process Manager (Recommended):
```bash
npm install -g pm2
pm2 start server.js --name campus-connect
pm2 startup
pm2 save
```

---

## 📚 Next Steps

After successful installation:

1. **Read Documentation:**
   - [V4.0 Features](docs/V4_FEATURES.md)
   - [API Documentation](docs/WORKFLOW_API_DOCUMENTATION.md)
   - [Architecture](docs/ARCHITECTURE.md)

2. **Customize:**
   - Update university branding
   - Modify email templates
   - Adjust approval workflow

3. **Test:**
   - Create test proposals
   - Test approval workflow
   - Verify notifications
   - Test real-time updates

4. **Secure:**
   - Change default passwords
   - Update JWT secrets
   - Configure firewall
   - Enable HTTPS

---

## 🆘 Support

If you encounter issues:

1. Check [Troubleshooting](#-troubleshooting) section
2. Review logs: `tail -f logs/error.log`
3. Check GitHub Issues
4. Contact development team

---

## ✅ Installation Checklist

- [ ] Node.js installed (v16+)
- [ ] MySQL installed and running
- [ ] Redis installed and running
- [ ] Repository cloned
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] `.env` file configured
- [ ] Upload directories created
- [ ] Database schema initialized
- [ ] Database seeded
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Can login with default credentials
- [ ] Email notifications working
- [ ] Redis caching working
- [ ] WebSocket connections working

---

**🎉 Congratulations! Campus Connect v4.0 is now installed and ready to use!**

For questions or support, refer to the documentation in the `docs/` folder.
