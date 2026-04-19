# 🏛️ UOG Hall & Venue Management System - Implementation Guide

## Overview
This system allows System Admins to manage campus venues/halls and enables Presidents to book venues for their events with automatic conflict detection.

---

## 🎯 Features Implemented

### ✅ Step 1: Database - The "Halls" Toy Box
- **venues table** created with:
  - `id` (Primary Key)
  - `name` (Venue name)
  - `capacity` (Number of people)
  - `is_available` (TRUE/FALSE toggle)
- **5 Initial Venues Seeded:**
  1. Main Auditorium
  2. Hafiz Hayat Hall
  3. SSC Ground
  4. Departmental Grounds
  5. Departmental Conference Halls
- **venue_id** added to `proposals` table (Foreign Key)

### ✅ Step 2: System Admin Controls
- **New Tab:** "Venue Management" in Super Admin Dashboard
- **Features:**
  - View all venues in a table
  - **[Add New Hall]** button - Create new venues
  - **[Edit Name]** button - Update venue details
  - **[Delete Hall]** button - Remove venues (with safety check)
  - **Toggle Switch** - Enable/Disable venue availability
- **Access Control:** Only SYSTEM_ADMIN can manage venues

### ✅ Step 3: President's Proposal Form
- **Dropdown Menu** replaces text box for venue selection
- **Only shows available venues** (where `is_available = TRUE`)
- **Magic Blocker Rule:**
  - Checks if (Selected Venue + Selected Date) is already APPROVED
  - Shows error: "Sorry! This hall is already booked for this date"
  - Prevents double-booking automatically

### ✅ Step 4: Campus Calendar
- **Read-Only Calendar** for everyone
- **Shows APPROVED proposals only**
- **Event Details Display:**
  - Society Name
  - Venue Name
  - Event Date
  - Time Slot (if available)
- **Export to iCal** functionality included

---

## 📦 Installation Steps

### 1. Run the Migration
```powershell
# From the project root directory
.\run-venues-migration.ps1
```

This will:
- Create the `venues` table
- Seed 5 initial venues
- Add `venue_id` column to `proposals` table

### 2. Restart Backend Server
```powershell
# Stop current server (Ctrl+C)
# Then restart
cd FYP-2-
node server.js
```

### 3. Restart Frontend (if needed)
```powershell
cd FYP-2-/frontend
npm start
```

---

## 🎮 How to Use

### For System Admin:

1. **Login** as SYSTEM_ADMIN
2. Go to **Super Admin Dashboard**
3. Click **"🏛️ Venue Management"** tab
4. **Manage Venues:**
   - **Add:** Click "Add New Hall" → Enter name & capacity → Create
   - **Edit:** Click edit icon → Update details → Save
   - **Delete:** Click delete icon → Confirm (only if no proposals use it)
   - **Toggle:** Click toggle icon to enable/disable venue

### For Society Presidents:

1. **Login** as President
2. Go to **Dashboard** → **"Create New Proposal"**
3. **Fill the form:**
   - Title
   - Description
   - Event Date
   - **Venue/Hall** (Select from dropdown - only available venues shown)
   - Budget
4. **Submit:**
   - If venue is available → Proposal created ✅
   - If venue is booked → Error shown ❌

### For Everyone:

1. Go to **Calendar** tab
2. View all **APPROVED events**
3. See **Society Name**, **Venue**, **Date**, **Time**
4. Export to iCal if needed

---

## 🔒 Security & Rules

### Access Control:
- **Venue Management:** SYSTEM_ADMIN only
- **Venue Selection:** All core society leaders
- **Calendar View:** Everyone (read-only)

### Business Rules:
1. **No Double Booking:** System automatically checks for conflicts
2. **Only Available Venues:** Presidents can only see enabled venues
3. **Cannot Delete Used Venues:** If a venue is referenced in proposals, it cannot be deleted
4. **Workflow Preserved:** The 6-stage approval workflow remains unchanged

---

## 🗂️ Files Created/Modified

### Backend:
- ✅ `backend/database/migrations/create_venues.sql` - Migration file
- ✅ `backend/database/scripts/run_venues_migration.js` - Migration runner
- ✅ `backend/controllers/venueController.js` - Venue CRUD operations
- ✅ `backend/routes/venues.routes.js` - Venue API routes
- ✅ `backend/routes/protected.routes.js` - Added venue routes
- ✅ `backend/controllers/proposalController.js` - Added venue validation
- ✅ `backend/controllers/calendarController.js` - Added venue display

### Frontend:
- ✅ `frontend/src/components/admin/VenueManagement.jsx` - Venue management UI
- ✅ `frontend/src/components/admin/SuperAdminDashboard.jsx` - Added venue tab
- ✅ `frontend/src/components/admin/SuperAdminDashboard.css` - Tab navigation styles
- ✅ `frontend/src/components/dashboard/SocietyDashboard.jsx` - Added venue dropdown
- ✅ `frontend/src/components/calendar/Calendar.jsx` - Display venue info

### Scripts:
- ✅ `run-venues-migration.ps1` - PowerShell migration script

---

## 🧪 Testing Checklist

### System Admin Tests:
- [ ] Login as SYSTEM_ADMIN
- [ ] Navigate to Venue Management tab
- [ ] Add a new venue
- [ ] Edit venue name and capacity
- [ ] Toggle venue availability OFF
- [ ] Try to delete a venue (should work if unused)
- [ ] Toggle venue availability ON

### President Tests:
- [ ] Login as President
- [ ] Create new proposal
- [ ] Check venue dropdown shows only available venues
- [ ] Select a venue and date
- [ ] Submit proposal
- [ ] Try to create another proposal with same venue + date (should fail)
- [ ] Create proposal with different date (should succeed)

### Calendar Tests:
- [ ] Login as any user
- [ ] Go to Calendar tab
- [ ] Verify only APPROVED proposals are shown
- [ ] Click on an event
- [ ] Verify Society Name, Venue Name, Date are displayed
- [ ] Export calendar to iCal

---

## 🐛 Troubleshooting

### Migration Fails:
```
Error: Table 'venues' already exists
```
**Solution:** Table already created. Skip migration or drop table first.

### Venue Dropdown Empty:
**Check:**
1. Are there venues in the database?
2. Are venues marked as `is_available = TRUE`?
3. Is the API endpoint `/api/venues?availableOnly=true` working?

### Cannot Delete Venue:
**Reason:** Venue is referenced in existing proposals.
**Solution:** This is by design. You can disable it instead using the toggle.

### Venue Not Showing in Calendar:
**Check:**
1. Is the proposal APPROVED?
2. Does the proposal have a venue_id?
3. Is the calendar fetching events correctly?

---

## 📊 Database Schema

### venues Table:
```sql
CREATE TABLE venues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### proposals Table (Updated):
```sql
ALTER TABLE proposals 
ADD COLUMN venue_id INT AFTER event_date,
ADD FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL;
```

---

## 🎉 Success Criteria

✅ System Admin can manage venues (Add/Edit/Delete/Toggle)
✅ Presidents see dropdown with available venues only
✅ Double-booking is prevented automatically
✅ Calendar shows venue information for approved events
✅ 6-stage workflow remains unchanged
✅ No breaking changes to existing functionality

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all files are created correctly
3. Ensure migration ran successfully
4. Check browser console for errors
5. Check backend logs for API errors

---

## 🚀 Next Steps (Optional Enhancements)

- [ ] Add venue images
- [ ] Add venue facilities/amenities
- [ ] Add time slot booking (morning/afternoon/evening)
- [ ] Add venue booking calendar view
- [ ] Add email notifications for venue conflicts
- [ ] Add venue capacity warnings
- [ ] Add venue booking reports

---

**Built with ❤️ for University of Gujrat Campus Connect System**
