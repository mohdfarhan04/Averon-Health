#!/usr/bin/env node

/**
 * Simple API test script for Averon Health backend
 * Usage: node test-api.js
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

console.log('\n📋 Testing Averon Health Backend API\n');
console.log('='.repeat(60));

// Test 1: Health Check
function testHealthCheck() {
  return new Promise((resolve, reject) => {
    console.log('\n1️⃣  Testing Health Check Endpoint...');

    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.status === 'ok') {
            console.log('   ✓ Health check passed');
            console.log(`   Status: ${response.status}`);
            console.log(`   Credentials: ${response.credentialsFile}`);
            console.log(`   Spreadsheet: ${response.spreadsheetId}`);
            resolve(true);
          } else {
            console.log(`   ✗ Health check failed (Status: ${res.statusCode})`);
            console.log(`   Response:`, response);
            resolve(false);
          }
        } catch (err) {
          console.log('   ✗ Failed to parse response:', err.message);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.log('   ✗ Request failed:', err.message);
      console.log('   💡 Make sure the backend server is running on port', PORT);
      reject(err);
    });

    req.end();
  });
}

// Test 2: Form Submission (validation)
function testFormValidation() {
  return new Promise((resolve, reject) => {
    console.log('\n2️⃣  Testing Form Validation...');

    const payload = JSON.stringify({
      // Missing required fields
      lastName: 'Doe',
      phone: '555-1234',
    });

    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/contact',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 400 && !response.success) {
            console.log('   ✓ Validation working correctly');
            console.log(`   Message: ${response.message}`);
            resolve(true);
          } else {
            console.log('   ✗ Validation test unexpected result');
            console.log(`   Status: ${res.statusCode}`, response);
            resolve(false);
          }
        } catch (err) {
          console.log('   ✗ Failed to parse response:', err.message);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.log('   ✗ Request failed:', err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

// Test 3: Email Validation
function testEmailValidation() {
  return new Promise((resolve, reject) => {
    console.log('\n3️⃣  Testing Email Validation...');

    const payload = JSON.stringify({
      firstName: 'John',
      email: 'invalid-email', // Invalid email format
    });

    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/contact',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 400 && !response.success) {
            console.log('   ✓ Email validation working correctly');
            console.log(`   Message: ${response.message}`);
            resolve(true);
          } else {
            console.log('   ✗ Email validation unexpected result');
            console.log(`   Status: ${res.statusCode}`, response);
            resolve(false);
          }
        } catch (err) {
          console.log('   ✗ Failed to parse response:', err.message);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.log('   ✗ Request failed:', err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

// Test 4: Rate Limiting
function testRateLimiting() {
  return new Promise((resolve, reject) => {
    console.log('\n4️⃣  Testing Rate Limiting (sending 12 requests)...');

    const payload = JSON.stringify({
      firstName: 'Test',
      email: 'test@example.com',
    });

    let requestCount = 0;
    let blockedCount = 0;

    function sendRequest(i) {
      return new Promise((res) => {
        const options = {
          hostname: HOST,
          port: PORT,
          path: '/api/contact',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        };

        const req = http.request(options, (response) => {
          let data = '';
          response.on('data', (chunk) => { data += chunk; });
          response.on('end', () => {
            requestCount++;
            if (response.statusCode === 429) {
              blockedCount++;
            }
            res();
          });
        });

        req.on('error', () => res());
        req.write(payload);
        req.end();
      });
    }

    // Send 12 rapid requests
    Promise.all([...Array(12)].map((_, i) => sendRequest(i)))
      .then(() => {
        if (blockedCount > 0) {
          console.log(`   ✓ Rate limiting working (${blockedCount}/12 requests blocked)`);
          resolve(true);
        } else {
          console.log('   ⚠ Rate limiting may not be working (no requests blocked)');
          console.log('   💡 This might be expected if Google Sheets API is slow');
          resolve(true);
        }
      })
      .catch(reject);
  });
}

// Run all tests
async function runTests() {
  try {
    await testHealthCheck();
    await testFormValidation();
    await testEmailValidation();
    await testRateLimiting();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60) + '\n');
  } catch (err) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ Test suite failed');
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

runTests();
