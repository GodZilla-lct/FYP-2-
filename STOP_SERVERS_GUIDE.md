# How to Stop Servers

## Quick Stop (Recommended)

### Option 1: Use the Stop Script
```powershell
cd FYP-2-
.\stop-servers.ps1
```

### Option 2: Manual Stop

**Stop Backend (Port 5001):**
```powershell
# Find the process
netstat -ano | findstr :5001

# Kill it (replace <PID> with the actual PID from above)
taskkill /PID <PID> /F
```

**Stop Frontend (Port 3000):**
```powershell
# Find the process
netstat -ano | findstr :3000

# Kill it (replace <PID> with the actual PID from above)
taskkill /PID <PID> /F
```

### Option 3: Stop from Terminal
If you have the terminal windows open:
1. Click on the terminal window
2. Press `Ctrl + C`
3. Wait for the process to stop

### Option 4: Kill All Node.js Processes (Nuclear Option)
```powershell
# This will stop ALL Node.js processes
Get-Process node | Stop-Process -Force
```

⚠️ **Warning:** This will stop all Node.js processes, not just your servers!

## Verify Servers are Stopped

```powershell
# Check if ports are free
netstat -ano | findstr :5001  # Should return nothing
netstat -ano | findstr :3000  # Should return nothing
```

If nothing is returned, the ports are free and servers are stopped.

## Troubleshooting

### Port Still in Use After Killing Process

Sometimes the port takes a few seconds to be released. Wait 5-10 seconds and check again.

### Can't Find PID

If `netstat` doesn't show the PID clearly:
```powershell
# More detailed view
netstat -ano | findstr LISTENING | findstr :5001
netstat -ano | findstr LISTENING | findstr :3000
```

The last number in each line is the PID.

### Process Won't Die

If `taskkill /F` doesn't work:
```powershell
# Try without /F flag first
taskkill /PID <PID>

# If that doesn't work, use /F
taskkill /PID <PID> /F

# If still doesn't work, restart your computer
```

## After Stopping Servers

To start them again:
```powershell
# Start both
.\restart-both.ps1

# Or start individually
.\restart-backend.ps1
.\restart-frontend.ps1
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `.\stop-servers.ps1` | Stop both servers |
| `netstat -ano \| findstr :5001` | Check backend port |
| `netstat -ano \| findstr :3000` | Check frontend port |
| `taskkill /PID <PID> /F` | Kill specific process |
| `Get-Process node \| Stop-Process -Force` | Kill all Node.js |
| `Ctrl + C` | Stop in terminal |

## Manual Steps (If Script Fails)

1. **Open PowerShell as Administrator**

2. **Find Backend Process:**
   ```powershell
   netstat -ano | findstr :5001
   ```
   Note the PID (last number)

3. **Kill Backend:**
   ```powershell
   taskkill /PID <PID> /F
   ```

4. **Find Frontend Process:**
   ```powershell
   netstat -ano | findstr :3000
   ```
   Note the PID

5. **Kill Frontend:**
   ```powershell
   taskkill /PID <PID> /F
   ```

6. **Verify:**
   ```powershell
   netstat -ano | findstr :5001
   netstat -ano | findstr :3000
   ```
   Both should return nothing.

## Common Scenarios

### Scenario 1: Server Won't Start (Port in Use)
```powershell
# Stop the old process
.\stop-servers.ps1

# Wait 5 seconds
Start-Sleep -Seconds 5

# Start fresh
.\restart-both.ps1
```

### Scenario 2: Can't Access Application
```powershell
# Stop everything
.\stop-servers.ps1

# Restart
.\restart-both.ps1

# Wait for servers to start (check console output)
```

### Scenario 3: Making Code Changes
```powershell
# Stop servers
.\stop-servers.ps1

# Make your code changes

# Restart servers
.\restart-both.ps1
```

## Summary

✅ Use `.\stop-servers.ps1` for quick stop
✅ Use `Ctrl + C` in terminal windows
✅ Use `taskkill /PID <PID> /F` for manual stop
✅ Verify with `netstat -ano | findstr :5000` and `:3000`
✅ Restart with `.\restart-both.ps1`
