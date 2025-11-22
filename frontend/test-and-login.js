/**
 * Test and Login Script
 * Tests login functionality and performs a login with detailed logging
 */

import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Test credentials (working ones from test results)
const workingCredentials = [
  { email: 'michael.chen@company.com', password: 'password123', role: 'manager' },
  { email: 'emily.rodriguez@company.com', password: 'password123', role: 'staff' },
];

/**
 * Test login with given credentials
 */
async function testLogin(credentials) {
  const { email, password } = credentials;
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(70));
  console.log('🔐 TESTING LOGIN');
  console.log('='.repeat(70));
  console.log('📧 Email:', email);
  console.log('⏱️  Timestamp:', new Date().toISOString());
  
  try {
    console.log('📡 Making API request to:', `${API_URL}/auth/login`);
    
    const response = await axios.post(
      `${API_URL}/auth/login`,
      { email, password },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    
    const duration = Date.now() - startTime;
    
    // Handle both response formats
    let token, refreshToken, user;
    if (response.data?.data) {
      ({ token, refreshToken, user } = response.data.data);
    } else {
      ({ token, refreshToken, user } = response.data);
    }
    
    console.log('\n✅ LOGIN SUCCESSFUL!');
    console.log('📊 Response Details:');
    console.log('   ⏱️  Duration:', `${duration}ms`);
    console.log('   🔑 Token:', token ? `✅ Received (${token.length} chars)` : '❌ Missing');
    console.log('   🔄 Refresh Token:', refreshToken ? `✅ Received (${refreshToken.length} chars)` : '❌ Missing');
    console.log('   👤 User:', {
      id: user?._id || user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
    });
    
    console.log('\n💾 TOKEN STORAGE:');
    console.log('   In a browser environment, these would be stored in localStorage:');
    console.log('   - localStorage.setItem("token", token)');
    console.log('   - localStorage.setItem("refreshToken", refreshToken)');
    console.log('   - localStorage.setItem("user", JSON.stringify(user))');
    
    // If in browser environment, actually store it
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(user));
      console.log('   ✅ Tokens stored in browser localStorage!');
    }
    
    console.log('\n📋 LOGIN SUMMARY:');
    console.log('   ✅ Authentication: SUCCESS');
    console.log('   ✅ Token: Received');
    console.log('   ✅ User: Authenticated');
    console.log('   ✅ Role:', user?.role);
    console.log('   ⏱️  Response Time:', `${duration}ms`);
    
    return {
      success: true,
      duration,
      token,
      refreshToken,
      user,
      credentials: { email, password },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log('\n❌ LOGIN FAILED!');
    console.log('📊 Error Details:');
    console.log('   ⏱️  Duration:', `${duration}ms`);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Status Text:', error.response.statusText);
      console.log('   Error Message:', error.response.data?.message || 'Unknown error');
      console.log('   Error Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('   Error: Network Error - No response received');
      console.log('   💡 Tip: Ensure backend is running on port 5000');
    } else {
      console.log('   Error:', error.message);
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
      credentials: { email, password },
    };
  }
}

/**
 * Test all credentials and log in with the first successful one
 */
async function testAndLogin() {
  console.log('\n🚀 TEST AND LOGIN SCRIPT');
  console.log('='.repeat(70));
  console.log(`🌐 API URL: ${API_URL}`);
  console.log(`📋 Testing ${workingCredentials.length} credentials\n`);
  
  const results = [];
  
  // Test all credentials
  for (let i = 0; i < workingCredentials.length; i++) {
    const credentials = workingCredentials[i];
    const result = await testLogin(credentials);
    results.push(result);
    
    // If successful, this is our login
    if (result.success) {
      console.log('\n' + '='.repeat(70));
      console.log('🎉 LOGIN COMPLETE!');
      console.log('='.repeat(70));
      console.log(`✅ Successfully logged in as: ${result.user.name}`);
      console.log(`📧 Email: ${result.user.email}`);
      console.log(`👤 Role: ${result.user.role}`);
      console.log(`🔑 Token: ${result.token.substring(0, 20)}...`);
      console.log('\n💡 You can now use this token for authenticated API requests:');
      console.log(`   Authorization: Bearer ${result.token.substring(0, 20)}...`);
      break;
    }
    
    // Wait between tests
    if (i < workingCredentials.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Average Duration: ${Math.round(avgDuration)}ms`);
  
  if (successful > 0) {
    const successResult = results.find(r => r.success);
    console.log('\n✅ LOGGED IN AS:');
    console.log(`   Name: ${successResult.user.name}`);
    console.log(`   Email: ${successResult.user.email}`);
    console.log(`   Role: ${successResult.user.role}`);
    console.log(`   Token: ${successResult.token.substring(0, 30)}...`);
  }
  
  console.log('\n' + '='.repeat(70));
  
  return results;
}

// Run the script
testAndLogin().catch(error => {
  console.error('\n💥 Fatal Error:', error);
  process.exit(1);
});

