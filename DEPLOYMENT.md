# 🚀 Campus Connect v3.0 - Deployment Guide

## 📋 Prerequisites

### System Requirements
- **Node.js**: 16.0.0 or higher
- **npm**: 8.0.0 or higher
- **MySQL**: 8.0 or higher
- **Git**: Latest version

### Development Tools
- **Code Editor**: VS Code (recommended)
- **Database Client**: MySQL Workbench or phpMyAdmin
- **API Testing**: Postman (optional)

## 🔧 Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/GodZilla-lct/FYP-2-.git
cd FYP-2-
```

### 2. Install Dependencies
```bash
# Install all dependencies (backend + frontend)
npm run install:all

# Or install separately
npm install                  # Backend dependencies
cd frontend && npm install   # Frontend dependencies
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit with your database credentials
nano .env  # or use any text editor
```

**Required Environment Variables:**
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_connect

# Server Configuration
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Security (optional)
JWT_SECRET=your_jwt_secret_key_here
```

### 4. Database Setup
```bash
# Create database and tables
npm run setup

# Seed with sample data (12 UOG societies + 84 leaders)
npm run seed
```

### 5. Start Development Servers
```bash
# Option 1: Start both servers simultaneously
npm run dev:full

# Option 2: Start servers separately
npm run dev              # Backend (port 5000)
cd frontend && npm start # Frontend (port 3000)
```

### 6. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🌐 Production Deployment

### Option 1: Traditional Server (VPS/Dedicated)

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

#### 2. Deploy Application
```bash
# Clone repository
git clone https://github.com/GodZilla-lct/FYP-2-.git
cd FYP-2-

# Install dependencies
npm run install:all

# Build frontend
npm run build

# Setup environment
cp .env.example .env
nano .env  # Configure production values

# Setup database
npm run setup
npm run seed

# Start with PM2
pm2 start server.js --name "campus-connect"
pm2 startup
pm2 save
```

#### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/FYP-2-/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads {
        proxy_pass http://localhost:5000;
    }
}
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile
```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

#### 2. Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=password
      - DB_NAME=campus_connect
    depends_on:
      - mysql
    volumes:
      - ./uploads:/app/uploads

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=campus_connect
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

#### 3. Deploy with Docker
```bash
# Build and start
docker-compose up -d

# Setup database
docker-compose exec app npm run setup
docker-compose exec app npm run seed
```

### Option 3: Cloud Deployment (Heroku)

#### 1. Prepare for Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create campus-connect-v3
```

#### 2. Configure Environment
```bash
# Set environment variables
heroku config:set DB_HOST=your_db_host
heroku config:set DB_USER=your_db_user
heroku config:set DB_PASSWORD=your_db_password
heroku config:set DB_NAME=campus_connect
heroku config:set JWT_SECRET=your_jwt_secret
```

#### 3. Deploy
```bash
# Add Heroku remote
git remote add heroku https://git.heroku.com/campus-connect-v3.git

# Deploy
git push heroku main

# Setup database
heroku run npm run setup
heroku run npm run seed
```

## 🔒 Security Configuration

### 1. Environment Variables
```env
# Production values
NODE_ENV=production
JWT_SECRET=complex_random_string_here
DB_PASSWORD=strong_database_password

# CORS for production
CORS_ORIGIN=https://your-domain.com
```

### 2. Database Security
```sql
-- Create dedicated database user
CREATE USER 'campus_connect'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON campus_connect.* TO 'campus_connect'@'localhost';
FLUSH PRIVILEGES;
```

### 3. File Upload Security
```javascript
// Already configured in proposalController.js
const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
const maxFileSize = 10 * 1024 * 1024; // 10MB
```

## 📊 Monitoring & Maintenance

### 1. PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs campus-connect

# Restart application
pm2 restart campus-connect

# Update application
git pull origin main
npm install
npm run build
pm2 restart campus-connect
```

### 2. Database Backup
```bash
# Create backup
mysqldump -u root -p campus_connect > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u root -p campus_connect < backup_20260116.sql
```

### 3. Log Management
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/campus-connect

# Content:
/path/to/FYP-2-/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 www-data www-data
}
```

## 🧪 Testing Deployment

### 1. Health Checks
```bash
# Backend health
curl http://localhost:5000/health

# Database connection
curl http://localhost:5000/api/societies
```

### 2. Load Testing
```bash
# Install artillery
npm install -g artillery

# Create test script
artillery quick --count 10 --num 5 http://localhost:5000/health
```

### 3. Frontend Testing
```bash
# Build and serve
cd frontend
npm run build
npx serve -s build -l 3000
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check MySQL status
sudo systemctl status mysql

# Check connection
mysql -u root -p -e "SHOW DATABASES;"
```

#### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### Permission Denied (uploads)
```bash
# Fix upload directory permissions
chmod 755 uploads/
chown -R www-data:www-data uploads/
```

#### Frontend Build Issues
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📈 Performance Optimization

### 1. Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_proposals_status ON proposals(current_status);
CREATE INDEX idx_society_roles_user ON society_roles(user_id);
CREATE INDEX idx_proposals_society ON proposals(society_id);
```

### 2. Frontend Optimization
```bash
# Analyze bundle size
cd frontend
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

### 3. Server Optimization
```javascript
// Enable gzip compression (already in server.js)
app.use(compression());

// Set proper cache headers
app.use('/uploads', express.static('uploads', {
  maxAge: '1d'
}));
```

## ✅ Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database setup completed
- [ ] Dependencies installed
- [ ] Frontend built
- [ ] Security configurations applied

### Post-deployment
- [ ] Health check passes
- [ ] Database connection working
- [ ] File uploads working
- [ ] Authentication working
- [ ] All API endpoints responding
- [ ] Frontend loading correctly
- [ ] Responsive design working

### Production Monitoring
- [ ] PM2 process running
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Backup system setup
- [ ] Log monitoring active
- [ ] Performance monitoring setup

## 🎯 Next Steps

1. **Setup CI/CD Pipeline** with GitHub Actions
2. **Configure SSL Certificate** with Let's Encrypt
3. **Setup Monitoring** with tools like New Relic
4. **Implement Caching** with Redis
5. **Setup CDN** for static assets

Your Campus Connect v3.0 is now ready for production! 🚀