# Campus Connect v3.0 - Project Structure

## 📁 Clean Project Organization

```
campus-connect/
│
├── 📂 backend/                      # Backend application
│   ├── 📂 config/                   # Configuration files
│   │   └── database.js              # MySQL connection pool
│   │
│   ├── 📂 controllers/              # Business logic controllers
│   │   ├── proposalController.js   # Proposal CRUD & file upload
│   │   ├── societyController.js    # Society & role management
│   │   └── proposalWorkflowController.js  # Approval workflow logic
│   │
│   ├── 📂 routes/                   # API route definitions
│   │   └── proposalRoutes.js       # All API endpoints
│   │
│   ├── 📂 middleware/               # Express middleware
│   │   └── auth.js                  # Authentication & authorization
│   │
│   ├── 📂 database/                 # Database files
│   │   ├── schema.sql               # Database schema (v3.0)
│   │   └── seed_v3.js               # Seed data (12 UOG societies)
│   │
│   └── 📂 scripts/                  # Utility scripts
│       └── run_schema.js            # Database setup script
│
├── 📂 frontend/                     # React frontend application
│   ├── 📂 public/                   # Static files
│   │   ├── index.html
│   │   └── manifest.json
│   │
│   └── 📂 src/
│       ├── 📂 components/           # React components
│       │   ├── Login.jsx            # Login page
│       │   ├── Login.css
│       │   ├── AdminHierarchy.jsx   # Creative hierarchy manager
│       │   ├── AdminHierarchy.css
│       │   ├── AdminDashboard.jsx   # Admin proposal dashboard
│       │   ├── AdminDashboard.css
│       │   ├── SocietyDashboard.jsx # Society leader dashboard
│       │   └── SocietyDashboard.css
│       │
│       ├── 📂 utils/                # Utility functions
│       │   └── auth.js              # Auth helpers & session management
│       │
│       ├── App.js                   # Main app component
│       ├── App.css                  # Global styles
│       └── index.js                 # React entry point
│
├── 📂 docs/                         # Documentation
│   ├── 📂 archive/                  # Historical documentation
│   │   ├── REFACTORING_*.md
│   │   ├── ERRORS_FIXED_v3.md
│   │   ├── DELIVERABLES.md
│   │   └── ... (old docs)
│   │
│   ├── README.md                    # Docs index
│   ├── ARCHITECTURE.md              # System architecture
│   ├── SETUP_GUIDE.md               # Installation guide
│   ├── START_HERE.md                # Quick start guide
│   ├── RUN_SERVERS.md               # Server management
│   ├── RUN_PROJECT.md               # Project execution
│   ├── TEST_SCENARIOS.md            # Testing guide
│   └── WORKFLOW_API_DOCUMENTATION.md # API reference
│
├── 📂 uploads/                      # File uploads directory
│   └── proposals/                   # Proposal attachments
│
├── 📂 node_modules/                 # Backend dependencies
├── 📂 .vscode/                      # VS Code settings
│
├── 📄 server.js                     # Express server entry point
├── 📄 package.json                  # Backend dependencies
├── 📄 package-lock.json
├── 📄 .env                          # Environment variables (gitignored)
├── 📄 .env.example                  # Environment template
├── 📄 README.md                     # Main project README
└── 📄 PROJECT_STRUCTURE.md          # This file

```

## 🗂️ File Purposes

### Backend Controllers
- **proposalController.js**: Handles proposal creation, fetching, file uploads (multer)
- **societyController.js**: Manages societies, roles, auto-user creation
- **proposalWorkflowController.js**: Approval workflow logic, status transitions

### Backend Routes
- **proposalRoutes.js**: Defines all API endpoints (proposals, societies, auth)

### Backend Middleware
- **auth.js**: JWT authentication, role-based authorization

### Frontend Components
- **Login.jsx**: Authentication interface
- **AdminHierarchy.jsx**: Creative masonry grid for managing society hierarchies
- **AdminDashboard.jsx**: Admin view for processing proposals
- **SocietyDashboard.jsx**: Society leader view with "My Cabinet" tab

### Database Files
- **schema.sql**: Complete database schema with dynamic roles
- **seed_v3.js**: Seed data for 12 real UOG societies + 84 leaders

## 🚫 Removed Files (Cleanup)

### Temporary Scripts (Deleted)
- ❌ `add_new_tables.js`
- ❌ `check_proposals.js`
- ❌ `check_tables.js`
- ❌ `drop_constraints.js`
- ❌ `fix_proposals.js`
- ❌ `fix_societies_properly.js`
- ❌ `fix_societies_table.js`

### Outdated Seeds (Deleted)
- ❌ `seed.js`
- ❌ `seed_simple.js`

### Duplicate Components (Deleted)
- ❌ Root: `AdminHierarchy.jsx`, `AdminHierarchy.css`
- ❌ Root: `PresidentDashboard.jsx`, `PresidentDashboard.css`
- ❌ Frontend: `AdminHierarchyManager.jsx`, `AdminHierarchyManager.css`
- ❌ Frontend: `PresidentDashboard.jsx`, `PresidentDashboard.css`

### Archived Documentation (Moved to docs/archive/)
- 📦 `REFACTORING_COMPLETE.md`
- 📦 `REFACTORING_COMPLETE_v3.md`
- 📦 `REFACTORING_GUIDE_v2.md`
- 📦 `REFACTORING_SUMMARY.md`
- 📦 `REFACTORING_SUMMARY_v2.md`
- 📦 `ERRORS_FIXED_v3.md`
- 📦 `ADMIN_DASHBOARD_FIX.md`
- 📦 `DELIVERABLES.md`
- 📦 `DELIVERY_SUMMARY.md`
- 📦 `IMPLEMENTATION_NOTES.md`
- 📦 `INTEGRATION_GUIDE.md`
- 📦 `QUICK_REFERENCE.md`
- 📦 `QUICK_REFERENCE_v2.md`
- 📦 `FRONTEND_SETUP.md`
- 📦 `INDEX.md`
- 📦 `FILES_SUMMARY.txt`

## 📊 Project Statistics

### Backend
- **Controllers**: 3 files
- **Routes**: 1 file
- **Middleware**: 1 file
- **Database**: 2 files (schema + seed)
- **Scripts**: 1 file

### Frontend
- **Components**: 4 main components (8 files with CSS)
- **Utils**: 1 file
- **Core**: 3 files (App.js, App.css, index.js)

### Documentation
- **Active Docs**: 8 files
- **Archived Docs**: 16 files

## 🎯 Key Improvements

1. ✅ **Organized Backend**: All backend code in `backend/` folder
2. ✅ **Clean Controllers**: Separated business logic by domain
3. ✅ **Centralized Routes**: Single route file with clear organization
4. ✅ **Removed Duplicates**: Deleted redundant component files
5. ✅ **Archived Old Docs**: Moved historical docs to `docs/archive/`
6. ✅ **Deleted Temp Scripts**: Removed debugging/migration scripts
7. ✅ **Clear Structure**: Easy to navigate and maintain
8. ✅ **No Breaking Changes**: All imports updated correctly

## 🚀 Quick Navigation

- **Start Development**: See `docs/RUN_SERVERS.md`
- **Setup Database**: Run `node backend/scripts/run_schema.js`
- **API Reference**: See `docs/WORKFLOW_API_DOCUMENTATION.md`
- **Architecture**: See `docs/ARCHITECTURE.md`
- **Main README**: See `README.md`

## 📝 Notes

- All file paths have been updated in imports
- No functionality was broken during restructuring
- The project is now production-ready with clean organization
- Easy to onboard new developers with clear structure
