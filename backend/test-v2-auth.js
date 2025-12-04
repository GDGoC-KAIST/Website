/**
 * Test script for Backend 2.0 Auth Middleware
 *
 * Usage:
 *   node test-v2-auth.js
 *
 * This script will:
 * 1. Generate test JWT tokens
 * 2. Test the /v2/users/me endpoint
 * 3. Test error cases
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-at-least-32-characters-long';
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/website-7ee8f/us-central1/apiV2';

// ==================== Token Generation ====================

function generateAccessToken(payload) {
  const fullPayload = {
    sub: payload.userId,
    roles: payload.roles,
    memberId: payload.memberId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
    sid: payload.sessionId || `session-${Date.now()}`,
  };

  return jwt.sign(fullPayload, JWT_SECRET);
}

// ==================== Test Scenarios ====================

const testUsers = {
  regularUser: {
    userId: 'user-123',
    roles: ['USER'],
    sessionId: 'session-abc',
  },
  member: {
    userId: 'user-456',
    roles: ['USER', 'MEMBER'],
    memberId: 'member-789',
    sessionId: 'session-def',
  },
  admin: {
    userId: 'user-admin',
    roles: ['USER', 'MEMBER', 'ADMIN'],
    memberId: 'member-admin',
    sessionId: 'session-admin',
  },
};

// ==================== Display Tokens ====================

console.log('='.repeat(80));
console.log('🔐 Backend 2.0 Auth Middleware Test Script');
console.log('='.repeat(80));
console.log();

console.log('📝 Generated JWT Tokens:');
console.log();

for (const [name, user] of Object.entries(testUsers)) {
  const token = generateAccessToken(user);
  console.log(`${name.toUpperCase()}:`);
  console.log(`  Roles: ${user.roles.join(', ')}`);
  console.log(`  Token: ${token}`);
  console.log();
}

// ==================== Test Commands ====================

console.log('='.repeat(80));
console.log('🧪 Test Commands (use with Firebase Emulator):');
console.log('='.repeat(80));
console.log();

const memberToken = generateAccessToken(testUsers.member);
const adminToken = generateAccessToken(testUsers.admin);

console.log('1️⃣  Test valid token (should return user info):');
console.log();
console.log(`curl -X GET "${BASE_URL}/v2/users/me" \\`);
console.log(`  -H "Authorization: Bearer ${memberToken}"`);
console.log();

console.log('2️⃣  Test missing token (should return 401):');
console.log();
console.log(`curl -X GET "${BASE_URL}/v2/users/me"`);
console.log();

console.log('3️⃣  Test invalid token (should return 401):');
console.log();
console.log(`curl -X GET "${BASE_URL}/v2/users/me" \\`);
console.log(`  -H "Authorization: Bearer invalid.jwt.token"`);
console.log();

console.log('4️⃣  Test expired token:');
console.log();
const expiredPayload = {
  sub: 'user-expired',
  roles: ['USER'],
  iat: Math.floor(Date.now() / 1000) - 3600,
  exp: Math.floor(Date.now() / 1000) - 1800, // expired 30 min ago
  sid: 'session-expired',
};
const expiredToken = jwt.sign(expiredPayload, JWT_SECRET);
console.log(`curl -X GET "${BASE_URL}/v2/users/me" \\`);
console.log(`  -H "Authorization: Bearer ${expiredToken}"`);
console.log();

console.log('='.repeat(80));
console.log('📋 Expected Responses:');
console.log('='.repeat(80));
console.log();

console.log('✅ Valid token (200):');
console.log(JSON.stringify({
  user: {
    sub: 'user-456',
    roles: ['USER', 'MEMBER'],
    memberId: 'member-789',
    iat: 1234567890,
    exp: 1234568790,
    sid: 'session-def',
  },
}, null, 2));
console.log();

console.log('❌ Missing token (401):');
console.log(JSON.stringify({
  error: {
    code: 'UNAUTHORIZED',
    message: 'Missing or invalid Authorization header',
  },
}, null, 2));
console.log();

console.log('❌ Invalid token (401):');
console.log(JSON.stringify({
  error: {
    code: 'INVALID_TOKEN',
    message: 'Invalid access token',
  },
}, null, 2));
console.log();

console.log('❌ Expired token (401):');
console.log(JSON.stringify({
  error: {
    code: 'TOKEN_EXPIRED',
    message: 'Access token has expired',
  },
}, null, 2));
console.log();

console.log('='.repeat(80));
console.log('🚀 Next Steps:');
console.log('='.repeat(80));
console.log();
console.log('1. Start Firebase Emulator:');
console.log('   cd backend && npm run serve');
console.log();
console.log('2. Copy and paste the curl commands above to test');
console.log();
console.log('3. Or use the tokens directly in your API client (Postman, Insomnia, etc.)');
console.log();

// ==================== Auto-test with fetch (if running in Node 18+) ====================

if (process.argv.includes('--auto-test')) {
  console.log('='.repeat(80));
  console.log('🤖 Running Automated Tests...');
  console.log('='.repeat(80));
  console.log();

  (async () => {
    try {
      // Test 1: Valid token
      console.log('Test 1: Valid token...');
      const res1 = await fetch(`${BASE_URL}/v2/users/me`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      const data1 = await res1.json();
      console.log(`Status: ${res1.status}`);
      console.log('Response:', JSON.stringify(data1, null, 2));
      console.log();

      // Test 2: Missing token
      console.log('Test 2: Missing token...');
      const res2 = await fetch(`${BASE_URL}/v2/users/me`);
      const data2 = await res2.json();
      console.log(`Status: ${res2.status}`);
      console.log('Response:', JSON.stringify(data2, null, 2));
      console.log();

      // Test 3: Invalid token
      console.log('Test 3: Invalid token...');
      const res3 = await fetch(`${BASE_URL}/v2/users/me`, {
        headers: { Authorization: 'Bearer invalid.token' },
      });
      const data3 = await res3.json();
      console.log(`Status: ${res3.status}`);
      console.log('Response:', JSON.stringify(data3, null, 2));
      console.log();

      console.log('✅ All tests completed!');
    } catch (error) {
      console.error('❌ Error running tests:', error.message);
      console.log('Make sure Firebase Emulator is running: npm run serve');
    }
  })();
}
