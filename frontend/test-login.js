/**
 * Standalone Login Test Script
 * Run this with: node test-login.js
 */

import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Test credentials
const testCredentials = [
  { email: 'gerrit.johnson@company.com', password: 'password123', role: 'admin' },
  { email: 'michael.chen@company.com', password: 'password123', role: 'manager' },
  { email: 'emily.rodriguez@company.com', password: 'password123', role: 'staff' },
  { email: 'admin@company.com', password: 'password123', role: 'admin' },
];

/**
 * Test login with given credentials
 */
async function testLogin(credentials) {
  const { email, password } = credentials;
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(60));
  console.log('🔐 Testing Login');
  console.log('='.repeat(60));
  console.log('📧 Email:', email);
  console.log('⏱️  Timestamp:', new Date().toISOString());
  
  try {
    console.log('📡 Making API request to', `${API_URL}/auth/login`);
    
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
    
    console.log('✅ Login Successful!');
    console.log('📊 Response Details:');
    console.log('   Duration:', `${duration}ms`);
    console.log('   Has Token:', !!token);
    console.log('   Has Refresh Token:', !!refreshToken);
    console.log('   Token Length:', token?.length || 0);
    console.log('   User:', {
      id: user?._id || user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
    });
    
    return {
      success: true,
      duration,
      token,
      refreshToken,
      user,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log('❌ Login Failed!');
    console.log('📊 Error Details:');
    console.log('   Duration:', `${duration}ms`);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Status Text:', error.response.statusText);
      console.log('   Error Data:', error.response.data);
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
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      },
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n🚀 Starting Login Tests...');
  console.log(`📋 Total tests: ${testCredentials.length}`);
  console.log(`🌐 API URL: ${API_URL}\n`);
  
  const results = [];
  
  for (let i = 0; i < testCredentials.length; i++) {
    const credentials = testCredentials[i];
    const result = await testLogin(credentials);
    results.push({
      ...result,
      email: credentials.email,
      expectedRole: credentials.role,
    });
    
    // Wait between tests
    if (i < testCredentials.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Average Duration: ${Math.round(avgDuration)}ms`);
  
  console.log('\n📋 Detailed Results:');
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.email}`);
    console.log(`   Expected Role: ${result.expectedRole}`);
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    if (result.success) {
      console.log(`   User: ${result.user?.name || result.user?.email}`);
      console.log(`   Role: ${result.user?.role}`);
      console.log(`   Duration: ${result.duration}ms`);
      if (result.user?.role !== result.expectedRole) {
        console.log(`   ⚠️  Role mismatch! Expected ${result.expectedRole}, got ${result.user?.role}`);
      }
    } else {
      console.log(`   Error: ${result.error?.message || 'Unknown error'}`);
      console.log(`   Status: ${result.error?.status || 'N/A'}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Fatal Error:', error);
  process.exit(1);
});

