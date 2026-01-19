# Git Setup Guide for Campus Connect v3.0

## 🚀 Repository Information
**GitHub URL**: https://github.com/GodZilla-lct/FYP-2-.git

## 📋 Prerequisites

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/windows
   - Or use: `winget install Git.Git`

2. **Configure Git** (first time setup):
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

## 🔧 Initial Setup

### Step 1: Initialize Git Repository
```bash
# Navigate to project root
cd C:\Users\chahm\FYP

# Initialize git repository
git init

# Add remote repository
git remote add origin https://github.com/GodZilla-lct/FYP-2-.git
```

### Step 2: Stage All Files
```bash
# Add all files to staging
git add .

# Check what will be committed
git status
```

### Step 3: Create Initial Commit
```bash
# Create initial commit
git commit -m "Initial commit: Campus Connect v3.0 - Restructured project

✨ Features:
- Creative UI with masonry grid design
- Dynamic hierarchy management
- Multi-tier approval workflow
- File upload support
- Responsive design

🏗️ Structure:
- Organized backend/ folder structure
- Clean frontend/ components
- Centralized docs/ folder
- Professional project organization

🎯 Ready for production deployment"
```

### Step 4: Push to GitHub
```bash
# Push to main branch
git push -u origin main

# Or if the default branch is master:
git push -u origin master
```

## 📁 What Will Be Committed

### ✅ Included Files
```
✅ backend/                 # All backend code
✅ frontend/                # React application
✅ docs/                    # Documentation
✅ README.md                # Main documentation
✅ PROJECT_STRUCTURE.md     # Structure guide
✅ package.json             # Dependencies
✅ server.js                # Entry point
✅ .env.example             # Environment template
✅ .gitignore               # Git ignore rules
```

### ❌ Excluded Files (via .gitignore)
```
❌ node_modules/            # Dependencies (will be installed via npm)
❌ .env                     # Environment variables (sensitive)
❌ uploads/                 # User uploaded files
❌ *.log                    # Log files
❌ .vscode/                 # Editor settings
❌ coverage/                # Test coverage
```

## 🔄 Future Workflow

### Making Changes
```bash
# Check status
git status

# Add specific files
git add filename.js

# Or add all changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"

# Push to GitHub
git push
```

### Pulling Updates
```bash
# Pull latest changes
git pull origin main
```

### Creating Branches
```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Push branch to GitHub
git push -u origin feature/new-feature
```

## 📝 Commit Message Convention

Use conventional commits for better organization:

```bash
# Features
git commit -m "feat: add user authentication"

# Bug fixes
git commit -m "fix: resolve login validation issue"

# Documentation
git commit -m "docs: update API documentation"

# Refactoring
git commit -m "refactor: reorganize project structure"

# Styling
git commit -m "style: improve responsive design"

# Tests
git commit -m "test: add unit tests for proposals"
```

## 🚀 Deployment Preparation

### Environment Variables
Before deployment, ensure you have:
```bash
# Copy example environment file
cp .env.example .env

# Edit with your actual values
# DB_HOST=your_database_host
# DB_USER=your_database_user
# DB_PASSWORD=your_database_password
# DB_NAME=campus_connect
```

### Database Setup
```bash
# Run database setup
node backend/scripts/run_schema.js
```

### Install Dependencies
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install
```

## 📊 Repository Structure on GitHub

After pushing, your GitHub repository will have:

```
GodZilla-lct/FYP-2-/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── database/
│   ├── scripts/
│   └── config/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/
│   ├── archive/
│   └── *.md files
├── README.md
├── PROJECT_STRUCTURE.md
├── package.json
├── server.js
├── .gitignore
└── .env.example
```

## 🔐 Security Notes

### ✅ Safe to Commit
- Source code
- Documentation
- Configuration templates (.env.example)
- Package.json files

### ❌ Never Commit
- Environment variables (.env)
- Database credentials
- API keys
- User uploaded files
- Node modules
- Log files

## 🎯 Next Steps

1. **Install Git** if not already installed
2. **Run the setup commands** above
3. **Push to GitHub**
4. **Set up GitHub Actions** (optional) for CI/CD
5. **Configure deployment** environment

## 📞 Troubleshooting

### Common Issues

**Git not recognized:**
```bash
# Install Git first, then restart terminal
winget install Git.Git
```

**Permission denied:**
```bash
# Set up SSH key or use HTTPS with token
git remote set-url origin https://username:token@github.com/GodZilla-lct/FYP-2-.git
```

**Large file warning:**
```bash
# Check .gitignore is working
git status
```

## ✅ Verification

After setup, verify with:
```bash
# Check remote
git remote -v

# Check status
git status

# Check commit history
git log --oneline
```

Your Campus Connect v3.0 project is now ready for GitHub! 🚀