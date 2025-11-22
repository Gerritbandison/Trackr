/**
 * Login Test Utility
 * Tests login functionality and logs results
 */

import { authAPI } from '../../config/api';

/**
 * Test login with given credentials
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Test result with success status and details
 */
export async function testLogin(credentials) {
  const { email, password } = credentials;
  const startTime = Date.now();

  console.log('🔐 Testing Login...');
  console.log('📧 Email:', email);
  console.log('⏱️  Timestamp:', new Date().toISOString());

  try {
    console.log('📡 Making API request to /auth/login...');
    const response = await authAPI.login({ email, password });
    const duration = Date.now() - startTime;

    // Handle both response formats
    let token, refreshToken, user;
    if (response.data?.data) {
      ({ token, refreshToken, user } = response.data.data);
    } else {
      ({ token, refreshToken, user } = response.data);
    }

    console.log('✅ Login Successful!');
    console.log('📊 Response Details:', {
      duration: `${duration}ms`,
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      user: {
        id: user?._id || user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
      },
      tokenLength: token?.length || 0,
    });

    // Check localStorage
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    console.log('💾 LocalStorage Status:', {
      token: storedToken ? `✅ Stored (${storedToken.length} chars)` : '❌ Not stored',
      refreshToken: storedRefreshToken ? `✅ Stored (${storedRefreshToken.length} chars)` : '❌ Not stored',
      user: storedUser ? `✅ Stored` : '❌ Not stored',
    });

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('👤 Stored User Data:', parsedUser);
      } catch (e) {
        console.warn('⚠️ Could not parse stored user:', e);
      }
    }

    return {
      success: true,
      duration,
      token,
      refreshToken,
      user,
      storedToken,
      storedRefreshToken,
      storedUser: storedUser ? JSON.parse(storedUser) : null,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ Login Failed!');
    console.error('📊 Error Details:', {
      duration: `${duration}ms`,
      error: {
        message: error.message || 'Unknown error',
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      },
    });

    // Check if it's a network error
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn('⚠️ Network Error - Backend may not be running');
      console.warn('💡 Tip: Ensure backend is running on port 5000');
    } else if (error.response?.status === 401) {
      console.warn('⚠️ Authentication Failed - Invalid credentials');
    } else if (error.response?.status === 404) {
      console.warn('⚠️ Endpoint Not Found - Check API configuration');
    }

    return {
      success: false,
      duration,
      error: {
        message: error.message || 'Unknown error',
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      },
    };
  }
}

/**
 * Test multiple login credentials
 * @param {Array<Object>} credentialsList - Array of credentials to test
 * @returns {Promise<Array>} Array of test results
 */
export async function testMultipleLogins(credentialsList) {
  console.log('🧪 Testing Multiple Logins...');
  console.log(`📋 Total tests: ${credentialsList.length}\n`);

  const results = [];

  for (let i = 0; i < credentialsList.length; i++) {
    const credentials = credentialsList[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test ${i + 1}/${credentialsList.length}`);
    console.log('='.repeat(60));

    const result = await testLogin(credentials);
    results.push({
      ...result,
      email: credentials.email,
    });

    // Wait a bit between tests
    if (i < credentialsList.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.email}:`);
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    if (result.success) {
      console.log(`   User: ${result.user?.name || result.user?.email}`);
      console.log(`   Role: ${result.user?.role}`);
      console.log(`   Duration: ${result.duration}ms`);
    } else {
      console.log(`   Error: ${result.error?.message || 'Unknown error'}`);
      console.log(`   Status: ${result.error?.status || 'N/A'}`);
    }
  });

  return results;
}

/**
 * Quick test with default credentials
 */
export async function quickTestLogin() {
  const testCredentials = [
    { email: 'gerrit.johnson@company.com', password: 'password123' },
    { email: 'michael.chen@company.com', password: 'password123' },
    { email: 'emily.rodriguez@company.com', password: 'password123' },
    { email: 'admin@company.com', password: 'password123' },
  ];

  return await testMultipleLogins(testCredentials);
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testLogin = testLogin;
  window.testMultipleLogins = testMultipleLogins;
  window.quickTestLogin = quickTestLogin;

  console.log('🧪 Login test utilities loaded!');
  console.log('Available functions:');
  console.log('  - testLogin({ email, password })');
  console.log('  - testMultipleLogins([{ email, password }, ...])');
  console.log('  - quickTestLogin()');
  console.log('\nExample:');
  console.log('  testLogin({ email: "admin@company.com", password: "password123" })');
}

