# Troubleshooting Guide - Dashboard Not Working

## 🚨 Quick Fix Steps

### Step 1: Start Servers Properly (PowerShell)

Open TWO terminal windows:

**Terminal 1 - Frontend:**
```powershell
cd c:\frontend
npm run dev
```

**Terminal 2 - Backend:**
```powershell
cd c:\backend
npm run dev
```

**Note:** Use `;` instead of `&&` in PowerShell, or just run commands separately.

### Step 2: Check What's Not Working

#### If Dashboard Won't Load:

1. **Check Port Numbers:**
   - Frontend should be on: http://localhost:5173 or 5174
   - Backend should be on: http://localhost:5000

2. **Verify Backend is Running:**
   - Open: http://localhost:5000/api/v1/health
   - Should return: `{"status":"ok"}`

3. **Verify Frontend is Running:**
   - Open: http://localhost:5173 or 5174
   - Should show login page

#### If Dashboard Loads But Widgets Missing:

1. **Clear Browser Cache:**
   - Press `Ctrl + Shift + Delete`
   - Clear cache and reload

2. **Hard Refresh:**
   - Press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

3. **Check Browser Console:**
   - Press `F12`
   - Look for red errors
   - Share any error messages

#### If "Module Not Found" Errors:

1. **New components need to be recognized:**
   - Wait for Vite to auto-reload
   - If not, restart frontend server

2. **Check file structure:**
```
src/components/Dashboard/
├── QuickActions.jsx      ✅ Should exist
├── AlertsWidget.jsx     ✅ Should exist
└── RecentActivity.jsx   ✅ Should exist
```

## 🔍 Common Issues

### Issue 1: "Cannot find module"
**Solution:** Check if files exist in correct location
```bash
# In frontend directory
ls src/components/Dashboard/
```

### Issue 2: Blank Screen
**Solution:** Check console for errors
- Open DevTools (F12)
- Check Console tab
- Look for red errors

### Issue 3: Widgets Not Showing
**Solution:** Dashboard.jsx imports need to be correct
- Check line 22-24 in Dashboard.jsx
- Should have:
  ```javascript
  import QuickActions from '../../components/Dashboard/QuickActions';
  import AlertsWidget from '../../components/Dashboard/AlertsWidget';
  import RecentActivity from '../../components/Dashboard/RecentActivity';
  ```

### Issue 4: PowerShell Error with &&
**Problem:** PowerShell doesn't support `&&`
**Solution:** Use `;` or run commands separately:
```powershell
cd c:\frontend; npm run dev
# OR
cd c:\frontend
npm run dev
```

## ✅ What Should Work

### When Everything is Running:

1. **Open:** http://localhost:5173 or 5174
2. **Login:**
   - Email: admin@company.com
   - Password: password123
3. **See Dashboard with:**
   - ✅ Stats cards at top
   - ✅ Quick Actions widget (left side)
   - ✅ Alerts Widget (right side)
   - ✅ Recent Activity feed
   - ✅ System Health monitor
   - ✅ Charts and graphs

## 🔧 Manual Verification

### Check Files Exist:
```powershell
# In c:\frontend directory
Get-ChildItem src\components\Dashboard\
```

Should show:
- QuickActions.jsx
- AlertsWidget.jsx
- RecentActivity.jsx

### Check Dashboard Imports:
```powershell
# View first 30 lines
Get-Content src\pages\Dashboard\Dashboard.jsx -TotalCount 30
```

Should show imports around line 22-24.

### Check Servers:
```powershell
# Frontend running?
curl http://localhost:5173

# Backend running?
curl http://localhost:5000/api/v1/health
```

## 📞 Still Not Working?

### Gather This Information:

1. **What error message do you see?**
   - Screenshot of browser
   - Screenshot of console

2. **What browser are you using?**
   - Chrome, Firefox, Edge, etc.

3. **What port numbers?**
   - Frontend: ?
   - Backend: ?

4. **Can you access login page?**
   - Yes/No

5. **After login, what do you see?**
   - Blank screen?
   - Old dashboard?
   - Error message?

## 🎯 Quick Test

1. Open http://localhost:5173
2. Should see login page
3. Login as admin
4. Should see dashboard with:
   - 4 stat cards
   - Quick Actions widget
   - Alerts widget
   - Recent Activity

If you see this, everything is working! ✅

## 📝 Expected Behavior

### Dashboard Layout (Top to Bottom):

1. **Header** - "Dashboard" title with quick links
2. **Stats Cards** - 4 cards (Assets, Users, Licenses, Expiring)
3. **Quick Actions Row** - Large widget on left, Alerts on right
4. **Activity Row** - Recent Activity on left, System Health on right
5. **Charts** - Asset availability, status, category

### Quick Actions Should Show:
- 🔵 Add Asset
- 🟢 Add User
- 🟣 Add License
- 🟠 Generate QR
- 🔷 Export Data
- 🔴 Alerts (with badge if any)

## 🐛 Debug Mode

Enable verbose logging:

```javascript
// In browser console
localStorage.setItem('debug', 'true')
// Reload page
```

## ⚡ Fast Reset

If completely stuck:

```powershell
# Stop all servers (Ctrl+C in each terminal)

# Clean and restart frontend
cd c:\frontend
npm run dev

# In new terminal, clean and restart backend
cd c:\backend
npm run dev

# Clear browser cache
# Hard refresh (Ctrl+F5)
# Try again
```

---

**Need More Help?** Share:
1. What you see on screen
2. Console errors (F12)
3. Terminal output
4. Browser used

