# Campus Connect v3.0

> A comprehensive proposal management system for University of Gujrat societies with dynamic hierarchy management and multi-tier approval workflow.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8+-orange.svg)](https://mysql.com/)
[![License](https://img.shields.io/badge/License-Educational-yellow.svg)](#)

## 🎯 Features

### For Admins (Director SSC)
- **🎨 Creative Hierarchy Manager**: Masonry grid layout with floating label inputs
- **📊 Proposal Dashboard**: View and process all society proposals
- **👥 Dynamic Role Management**: Add/remove society roles with auto-user creation
- **🔄 Multi-tier Approval Workflow**: 7-level approval system with null coordinator check

### For Society Leaders
- **📝 Proposal Creation**: Create proposals with file attachments
- **👥 My Cabinet View**: Read-only view of society leadership structure
- **📈 Proposal Tracking**: Track proposal status through approval workflow
- **🔄 SOFT vs HARD Rejection**: Edit and resubmit soft-rejected proposals

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/GodZilla-lct/FYP-2-.git
cd FYP-2-

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
node backend/scripts/run_schema.js

# Start development servers
npm start                    # Backend (port 5000)
cd frontend && npm start     # Frontend (port 3000)
```

## 📁 Project Structure

```
campus-connect/
├── 📂 backend/              # Backend application
│   ├── controllers/         # Business logic
│   ├── routes/              # API routes
│   ├── middleware/          # Auth middleware
│   ├── database/            # Schema & seeds
│   └── scripts/             # Utility scripts
├── 📂 frontend/             # React application
│   └── src/components/      # UI components
├── 📂 docs/                 # Documentation
├── 📄 server.js             # Entry point
└── 📄 README.md             # This file
```

## 🔐 Demo Credentials

**Admin (Director SSC):**
- Email: `director@uog.edu.pk`
- Password: `password123`

**Society President:**
- Email: `2021-CS-001@uog.edu.pk`
- Password: `password123`

## 🛠️ Technology Stack

**Backend:**
- Node.js + Express
- MySQL (with mysql2)
- Multer (file uploads)
- JWT Authentication

**Frontend:**
- React 18
- CSS3 (with creative animations)
- Fetch API

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campus_connect

# Server
PORT=5000
CORS_ORIGIN=http://localhost:3000

# JWT (optional)
JWT_SECRET=your_secret_key
```

## 🎨 UI Features

- **Creative Masonry Grid**: Modern card-based layout for societies
- **Floating Label Inputs**: Professional form styling
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Role Icons**: Visual indicators for different positions
- **Smooth Animations**: Hover effects and transitions

## 🚦 Approval Workflow

1. **PENDING_COORDINATOR** (if coordinator exists)
2. **PENDING_DIRECTOR_SSC**
3. **PENDING_ASST_DIRECTOR**
4. **PENDING_FINANCE_SECRETARY**
5. **PENDING_REGISTRAR**
6. **PENDING_VC**
7. **APPROVED**

**Rejection Types:**
- **SOFT**: Returned for revision (editable)
- **HARD**: Final rejection (cannot be resubmitted)

## 📚 Documentation

- [📖 Setup Guide](docs/SETUP_GUIDE.md) - Detailed installation instructions
- [🏗️ Architecture](docs/ARCHITECTURE.md) - System architecture overview
- [🔌 API Documentation](docs/WORKFLOW_API_DOCUMENTATION.md) - API endpoints reference
- [🚀 Deployment Guide](docs/RUN_SERVERS.md) - Server management guide
- [📁 Project Structure](PROJECT_STRUCTURE.md) - Detailed structure guide

## 🚀 Deployment

### Development
```bash
npm run dev          # Start both servers
```

### Production
```bash
npm run build        # Build frontend
npm start           # Start production server
```

## 🧪 Testing

```bash
npm test            # Run backend tests
cd frontend && npm test  # Run frontend tests
```

## 📦 Database Schema

The system uses a dynamic role-based hierarchy with the following key tables:
- `users` - User accounts
- `societies` - Society information
- `society_roles` - Dynamic role assignments
- `proposals` - Event proposals
- `proposal_attachments` - File attachments
- `approval_history` - Approval workflow tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is for educational purposes - University of Gujrat.

## 👥 Contributors

Campus Connect v3.0 - University of Gujrat

---

**🎓 University of Gujrat | Final Year Project | 2026**
