# 🏛️ UOG Hall & Venue Management System

## 🎯 What Is This?

A complete venue/hall booking system for the University of Gujrat Campus Connect platform. Built exactly as requested - like building with blocks!

---

## 📦 Quick Start (3 Steps)

### 1️⃣ Run Migration
```powershell
.\run-venues-migration.ps1
```

### 2️⃣ Restart Backend
```powershell
cd FYP-2-
node server.js
```

### 3️⃣ Test It!
- Login as **SYSTEM_ADMIN** → Manage venues
- Login as **PRESIDENT** → Book venues
- View **Calendar** → See events with venues

---

## 🎨 The 4 Building Blocks

### Block 1: The "Halls" Toy Box (Database) ✅
- Created `venues` table
- Seeded 5 halls
- Added `venue_id` to proposals

### Block 2: The "Boss" Controls (System Admin) ✅
- New "Venue Management" tab
- Add/Edit/Delete/Toggle venues
- Only SYSTEM_ADMIN can access

### Block 3: The "President's" Form ✅
- Venue dropdown (replaces text box)
- Shows only available venues
- **Magic Blocker:** Prevents double-booking

### Block 4: The "Big Picture" (Calendar) ✅
- Shows approved events
- Displays venue information
- Read-only for everyone

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `VENUE_SYSTEM_SUMMARY.md` | Quick overview |
| `VENUE_MANAGEMENT_GUIDE.md` | Complete guide |
| `VENUE_IMPLEMENTATION_CHECKLIST.md` | Testing checklist |
| `VENUE_SYSTEM_ARCHITECTURE.md` | Technical details |

---

## 🎮 How to Use

### System Admin:
1. Super Admin Dashboard → Venue Management tab
2. Add/Edit/Delete/Toggle venues

### President:
1. Dashboard → Create Proposal
2. Select venue from dropdown
3. Submit (blocked if already booked)

### Everyone:
1. Calendar tab
2. View events with venue info

---

## ✅ Features

- ✅ Venue CRUD operations
- ✅ Availability toggle
- ✅ Automatic conflict detection
- ✅ Venue dropdown for presidents
- ✅ Calendar integration
- ✅ Export to iCal
- ✅ Access control (RBAC)
- ✅ 6-stage workflow preserved

---

## 🔒 Security

- Only SYSTEM_ADMIN can manage venues
- Presidents see only available venues
- Automatic double-booking prevention
- Cannot delete venues used in proposals

---

## 🗂️ Files Created

### Backend (7 files):
- `backend/database/migrations/create_venues.sql`
- `backend/database/scripts/run_venues_migration.js`
- `backend/controllers/venueController.js`
- `backend/routes/venues.routes.js`
- Modified: `proposalController.js`, `calendarController.js`, `protected.routes.js`

### Frontend (4 files):
- `frontend/src/components/admin/VenueManagement.jsx`
- Modified: `SuperAdminDashboard.jsx`, `SocietyDashboard.jsx`, `Calendar.jsx`

### Scripts & Docs (5 files):
- `run-venues-migration.ps1`
- `VENUE_SYSTEM_SUMMARY.md`
- `VENUE_MANAGEMENT_GUIDE.md`
- `VENUE_IMPLEMENTATION_CHECKLIST.md`
- `VENUE_SYSTEM_ARCHITECTURE.md`

---

## 🧪 Testing

See `VENUE_IMPLEMENTATION_CHECKLIST.md` for complete testing guide.

**Quick Test:**
1. ✅ Add venue as admin
2. ✅ Create proposal with venue as president
3. ✅ Try to book same venue+date (should fail)
4. ✅ View calendar (should show venue)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Migration fails | Table already exists - skip or drop first |
| Dropdown empty | Check venues are marked `is_available = TRUE` |
| Cannot delete venue | Venue is used in proposals - use toggle instead |
| Conflict not detected | Verify proposal is APPROVED status |

---

## 📊 Database Schema

```sql
-- Venues Table
CREATE TABLE venues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Proposals Table (Updated)
ALTER TABLE proposals 
ADD COLUMN venue_id INT AFTER event_date,
ADD FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL;
```

---

## 🚀 API Endpoints

```
GET    /api/venues                      - Get all venues
GET    /api/venues?availableOnly=true   - Get available venues
POST   /api/venues                      - Create venue (ADMIN)
PUT    /api/venues/:id                  - Update venue (ADMIN)
DELETE /api/venues/:id                  - Delete venue (ADMIN)
POST   /api/venues/check-availability   - Check conflicts
```

---

## 🎉 Success!

All 4 blocks built exactly as requested:
1. ✅ Database (venues table)
2. ✅ System Admin controls
3. ✅ President's form with dropdown
4. ✅ Campus calendar

**Status: PRODUCTION READY** 🚀

---

## 📞 Need Help?

1. Check `VENUE_MANAGEMENT_GUIDE.md` for detailed docs
2. Review `VENUE_IMPLEMENTATION_CHECKLIST.md` for testing
3. See `VENUE_SYSTEM_ARCHITECTURE.md` for technical details

---

**Built with ❤️ for University of Gujrat**
**Campus Connect System - Venue Management Module**
