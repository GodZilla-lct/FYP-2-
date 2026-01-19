# 🚀 START HERE - Campus Connect MVP

## The Fastest Way to Run the Project

### Prerequisites Check
- ✅ MySQL running with `campus_connect` database
- ✅ Backend running on port 5000
- ✅ Node.js installed

---

## Step 1: Keep Backend Running (Window 1)

If backend is already running, skip this. Otherwise:

```powershell
npm start
```

You should see:
```
Server running on port 5000
Database connected successfully
```

---

## Step 2: Start Frontend (Window 2 - NEW PowerShell)

```powershell
cd frontend
npm install
npm start
```

Wait for compilation to complete. Browser will open automatically at `http://localhost:3000`

---

## What You Can Do Now

### 👨‍💼 President Dashboard (Default View)
- **Create Proposal** - Fill form, upload documents, submit
- **View Proposals** - See status (Pending, Approved, Returned)
- **Edit & Resubmit** - If proposal is returned for revision

### 👔 Admin Hierarchy (Click "Admin View")
- **View Societies** - All 14 societies with presidents/coordinators
- **Edit Hierarchy** - Change president or coordinator assignments
- **Note**: Only Director SSC can access this

---

## Test Data Available

| Role | User ID | Name |
|------|---------|------|
| President | 1 | Test President |
| Director SSC | 8 | Director SSC |
| Coordinator | 2-7 | Various coordinators |

| Society | President | Coordinator |
|---------|-----------|-------------|
| Debating Society | Test President | Assigned |
| Sports Club | - | None (tests skip logic) |
| Environmental Club | - | None (tests skip logic) |
| + 11 more | - | - |

---

## Workflow in Action

### Happy Path (Approval Chain)
```
Proposal Created
    ↓
Coordinator Review (if exists) or skip
    ↓
Director SSC Review
    ↓
Assistant Director Review
    ↓
Finance Secretary Review
    ↓
Registrar Review
    ↓
VC Review
    ↓
APPROVED ✅
```

### Rejection Path
```
Any Approver Rejects
    ↓
Status: RETURNED_FOR_REVISION
    ↓
President Edits & Resubmits
    ↓
Back to Step 1
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `$env:PORT=3001; npm start` |
| Port 5000 in use | Kill process: `taskkill /PID <PID> /F` |
| npm install fails | `npm cache clean --force` then retry |
| Can't connect to DB | Check `.env` file credentials |
| Blank page on 3000 | Wait 30 seconds, refresh browser |

---

## File Locations

- **Backend**: Root directory (`server.js`, `proposalRoutes.js`, etc.)
- **Frontend**: `frontend/` folder
- **Database**: `schema.sql` (already executed)
- **Docs**: `README.md`, `ARCHITECTURE.md`, `INTEGRATION_GUIDE.md`

---

## Next Steps

1. ✅ **Run the project** (follow steps above)
2. 📝 **Create a proposal** in President Dashboard
3. 👁️ **Switch to Admin View** to manage societies
4. 📚 **Read ARCHITECTURE.md** for system design
5. 🔧 **Customize** components as needed

---

## Need Help?

- **API Issues**: Check `WORKFLOW_API_DOCUMENTATION.md`
- **Integration**: Read `INTEGRATION_GUIDE.md`
- **Testing**: See `TEST_SCENARIOS.md`
- **Setup**: Refer to `SETUP_GUIDE.md`

---

**You're all set! Open two PowerShell windows and follow Step 1 & 2 above.** 🎉
