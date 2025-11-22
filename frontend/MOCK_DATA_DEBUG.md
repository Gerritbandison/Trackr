# Mock Data Debug Guide

## Quick Fix

If you're not seeing mock data:

1. **Enable Test Data in Browser Console:**
   ```javascript
   localStorage.setItem('enableTestData', 'true');
   location.reload();
   ```

2. **Check Browser Console:**
   - Look for `[Mock API]` logs
   - Check for any errors

3. **Verify Test Data is Enabled:**
   ```javascript
   // In browser console
   localStorage.getItem('enableTestData')
   // Should return 'true' or null (which defaults to enabled in dev mode)
   ```

4. **Check Network Tab:**
   - API calls should be intercepted and return mock data
   - Look for requests to `/receiving/expected-assets` etc.

## Common Issues

### Issue: Mock data not showing
**Solution:** The mock interceptor might not be matching the URL correctly. Check the browser console for `[Mock API]` logs.

### Issue: Empty data
**Solution:** The response format might not match what React Query expects. Mock data should be in format:
```javascript
{
  data: {
    data: [...],  // Array of items
    pagination: {...}
  }
}
```

### Issue: Test data disabled
**Solution:** In development mode, test data is enabled by default unless explicitly disabled. Check:
```javascript
localStorage.getItem('enableTestData') !== 'false'
```

