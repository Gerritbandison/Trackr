# Mock Data Troubleshooting Guide

## Quick Check

1. **Open the browser console** (F12 → Console tab)
2. **Navigate to** `/itam/receiving` or any ITAM page
3. **Look for these log messages:**

### Expected Logs:

```
[Mock API] Request interceptor: { url: "...", method: "get", testDataEnabled: true, isDev: true }
[Mock API] ✅ Found mock data for: /receiving/expected-assets { ... }
[Mock API] ✅ Intercepting response for: /receiving/expected-assets
[ReceivingPage] Calling getExpected with params: { page: 1, limit: 20, search: "" }
[ReceivingPage] ✅ getExpected returned: { data: [...], pagination: {...} }
```

### If You See:

- **"testDataEnabled: false"** → Test data is disabled
  - **Fix:** Open browser console and run: `localStorage.setItem('enableTestData', 'true')`
  - Then refresh the page

- **"No mock data found for: ..."** → The endpoint path doesn't match
  - **Fix:** Check the console log to see what URL is being requested
  - The path should be something like `receiving/expected-assets`

- **No logs at all** → The interceptor might not be running
  - **Fix:** Make sure you're in development mode (`npm run dev`)
  - Check that `src/config/api.js` is being loaded

## Manual Test Data Enable

In browser console:
```javascript
// Enable test data
localStorage.setItem('enableTestData', 'true');

// Verify it's enabled
console.log('Test data enabled:', localStorage.getItem('enableTestData'));

// Refresh the page
location.reload();
```

## Check What Data is Available

In browser console:
```javascript
// Check if test data loader is working
import { shouldLoadTestData } from './src/utils/testDataLoader.js';
console.log('Should load test data:', shouldLoadTestData());

// Check mock data directly
import { itamMockData } from './src/data/itamMockData.js';
console.log('Receiving data:', itamMockData.receiving.expectedAssets);
```

## Common Issues

### Issue: "Network error" but test data should be enabled
- **Cause:** The request is actually being made and failing
- **Fix:** The error interceptor should catch this and return mock data as fallback
- **Check:** Look for `[Mock API Fallback]` logs in console

### Issue: Data structure doesn't match
- **Cause:** The component expects `data.data` but mock returns `data`
- **Check:** Look at the `[ReceivingPage] ✅ getExpected returned:` log to see the structure
- **Fix:** The mock response should be `{ data: [...], pagination: {...} }` which becomes `res.data` after `.then(res => res.data)`

### Issue: No data in the table
- **Check:** Look at `[ReceivingPage] State:` log to see what `expectedAssets` contains
- **Verify:** The component uses `expectedAssets?.data` - make sure the structure matches

## Next Steps

1. Open browser console
2. Navigate to an ITAM page
3. Check the logs
4. Share the console output if you still don't see data

