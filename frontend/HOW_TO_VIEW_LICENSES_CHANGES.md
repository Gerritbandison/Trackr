# How to View the New Licenses Features

## 🚀 Quick Start

### 1. Open Your Browser
Go to: **http://localhost:5174** (or http://localhost:5173 if that's your port)

### 2. Login
- Use your admin or manager credentials
- The role must be either 'admin' or 'manager' to access the licenses dashboard

### 3. Navigate to Licenses Dashboard
**Direct URL:** `http://localhost:5174/licenses/dashboard`

**Or via the app:**
1. Click on **"Software & Licenses"** in the sidebar
2. On the licenses list page, click the **"Dashboard"** button (top right)

## 📍 What You Should See

### Licenses Dashboard Page
The new comprehensive dashboard with:

1. **Stats Cards** (top of page):
   - Total Licenses (blue card)
   - Total Seats (green card)
   - Monthly Cost (purple card)
   - Expiring Soon (red card)

2. **Tabs** (below stats):
   - Overview
   - Traditional Licenses
   - Microsoft 365
   - Expiring Soon
   - Cost Analysis

3. **Quick Links** (top right):
   - Dashboard button
   - Microsoft 365 button
   - Renewal Timeline button
   - Add License button

## ✅ What Changed

### Backend Changes
1. **User Model** - Added `entraId` field for Azure AD linking
2. **Microsoft Graph Controller** - Added license assignment/removal functions
3. **Routes** - Added assignment endpoints

### Frontend Changes
1. **New Dashboard** - `LicensesDashboard.jsx` (complete overview)
2. **API Updates** - Added assignment endpoints
3. **Navigation** - Added dashboard link to LicenseList

## 🔍 Troubleshooting

### I don't see the Dashboard button
- Make sure you're logged in as admin or manager
- Refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Check browser console for errors

### Dashboard shows empty data
- This is normal! You need to add licenses first
- Click "Add License" to create traditional licenses
- For Microsoft licenses, configure Azure AD credentials

### Can't access the dashboard route
- Verify your role is 'admin' or 'manager'
- Check the URL: `/licenses/dashboard`
- Try logging out and back in

## 📝 Testing the Features

### Test Traditional Licenses
1. Go to `/licenses`
2. Click "Add License"
3. Fill in the form
4. Create a license
5. Go back to `/licenses/dashboard`
6. You should see your license in the "Traditional Licenses" tab

### Test Microsoft Licenses
1. Go to `/licenses/microsoft`
2. You'll see mock Microsoft license data
3. Click "View Users" on any license
4. See the users assigned to that license

### Test the Dashboard
1. Go to `/licenses/dashboard`
2. Navigate through all tabs
3. Check the stats cards
4. View expiring licenses
5. Review cost analysis

## 🎯 Expected Behavior

### Overview Tab
- Shows combined stats from traditional + Microsoft licenses
- Displays license type breakdown
- Shows overall utilization percentage
- Lists expiring licenses (if any)

### Traditional Licenses Tab
- Lists all traditional licenses
- Shows utilization per license
- Displays assigned users
- Shows license status

### Microsoft 365 Tab
- Shows Microsoft license summary
- Displays total seats
- Shows assigned seats
- Link to detailed Microsoft page

### Expiring Soon Tab
- Lists licenses expiring in next 90 days
- Color-coded by urgency (red/yellow/blue)
- Shows days until expiration
- Displays assigned user count

### Cost Analysis Tab
- Shows total monthly cost
- Displays annual cost
- Breaks down by license type
- Provides cost visibility

## 🔗 Related Pages

- **License List:** `/licenses` - Manage all licenses
- **Microsoft Licenses:** `/licenses/microsoft` - Microsoft 365 details
- **Renewals:** `/licenses/renewals` - Renewal timeline
- **Dashboard:** `/licenses/dashboard` - Comprehensive overview

## 💡 Next Steps

1. **Add Licenses** - Start adding traditional licenses
2. **Configure Azure AD** - Set up Microsoft Graph integration
3. **Assign Licenses** - Assign licenses to users
4. **Monitor** - Use dashboard to track licenses
5. **Optimize** - Review utilization and costs

## 📞 Still Not Working?

Check these:
1. Backend server running? (should be on port 5000)
2. Frontend server running? (should be on port 5173 or 5174)
3. Any console errors?
4. Browser cache cleared?
5. Right role permissions?

## 🎉 Success Indicators

You'll know it's working when you see:
- ✅ Stats cards with numbers
- ✅ Multiple tabs working
- ✅ License data displaying
- ✅ No console errors
- ✅ Dashboard responsive and interactive

