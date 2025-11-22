# Login Credentials & Testing Guide

## 🚀 App Status

✅ **Frontend Dev Server**: Running on http://localhost:5173  
✅ **Backend API**: Running on http://localhost:5000  
✅ **Browser**: Opened automatically  

## 🔐 Available Login Credentials

### Quick Login Buttons (In Login Page)

The login page has quick login buttons for easy testing:

1. **Admin User** (Full Access)
   - Email: `gerrit.johnson@company.com`
   - Password: `password123`
   - Role: Admin
   - Permissions: Full system access, user management, settings configuration

2. **Manager User** (Asset Management)
   - Email: `michael.chen@company.com`
   - Password: `password123`
   - Role: Manager
   - Permissions: Asset and license management, user viewing, department management

3. **Staff User** (View Only)
   - Email: `emily.rodriguez@company.com`
   - Password: `password123`
   - Role: Staff
   - Permissions: View own assets and licenses, view asset inventory

### Alternative Credentials (From README)

These may also work depending on backend configuration:

1. **Admin User**
   - Email: `admin@company.com`
   - Password: `password123`

2. **Manager User**
   - Email: `john.smith@company.com`
   - Password: `password123`

3. **Staff User**
   - Email: `sarah.johnson@company.com`
   - Password: `password123`

## 📝 How to Login

### Option 1: Quick Login (Recommended for Testing)
1. Open http://localhost:5173 in your browser
2. Click on one of the quick login buttons at the bottom of the login form
3. The app will automatically log you in and redirect to the dashboard

### Option 2: Manual Login
1. Enter email and password in the login form
2. Click "Sign In to Dashboard"
3. Wait for authentication to complete

## 🔧 Authentication Flow

1. **API Endpoint**: `/api/v1/auth/login`
2. **Request Format**:
   ```json
   {
     "email": "user@company.com",
     "password": "password123"
   }
   ```
3. **Response Format**: The app handles both formats:
   - Nested: `{ data: { token, refreshToken, user } }`
   - Direct: `{ token, refreshToken, user }`
4. **Token Storage**: JWT token stored in `localStorage` as `token`
5. **Refresh Token**: Stored in `localStorage` as `refreshToken`
6. **Auto-redirect**: After successful login, redirects to dashboard (`/`)

## 🐛 Troubleshooting

### Cannot Connect to Server
- **Error**: "Cannot connect to server. Please ensure the backend is running on port 5000."
- **Solution**: 
  1. Check if backend is running on port 5000
  2. Verify API URL in `src/config/api.js` (defaults to `/api/v1`)
  3. Check Vite proxy configuration in `vite.config.js`

### Invalid Credentials
- **Error**: "Invalid email or password"
- **Solution**: 
  1. Verify credentials match those in the backend database
  2. Check if user exists in backend
  3. Try the quick login buttons first

### Login Endpoint Not Found
- **Error**: "Login endpoint not found"
- **Solution**: 
  1. Verify backend API routes are configured correctly
  2. Check if `/api/v1/auth/login` endpoint exists
  3. Verify CORS settings in backend

### Token Storage Issues
- If tokens are not persisting:
  1. Check browser localStorage (DevTools > Application > Local Storage)
  2. Clear localStorage and try logging in again
  3. Check for browser privacy settings blocking localStorage

## ✅ Testing Checklist

- [x] Frontend dev server running on port 5173
- [x] Backend API running on port 5000
- [x] Browser opened to login page
- [ ] Test Admin login (gerrit.johnson@company.com)
- [ ] Test Manager login (michael.chen@company.com)
- [ ] Test Staff login (emily.rodriguez@company.com)
- [ ] Verify dashboard loads after login
- [ ] Verify role-based access control works
- [ ] Test logout functionality
- [ ] Test token refresh on page reload

## 🎯 Next Steps

1. **Test Login**: Use the quick login buttons to test authentication
2. **Explore Dashboard**: Once logged in, explore the dashboard and features
3. **Test Role-Based Access**: Try accessing admin-only features with different roles
4. **Check Console**: Monitor browser console for any errors
5. **Verify API Calls**: Check Network tab in DevTools to see API requests

## 📚 Related Files

- Login Component: `src/pages/Auth/Login.jsx`
- Auth Context: `src/contexts/AuthContext.jsx`
- API Configuration: `src/config/api.js`
- App Routes: `src/App.jsx`

---

**Note**: If you encounter any issues, check the browser console and network tab for detailed error messages.

