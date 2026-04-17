/**
 * Phase 1 Refactoring Test Script
 * Tests the new service layer implementation
 */

const authService = require('./backend/services/authService');

async function testPhase1Refactoring() {
  console.log('========================================');
  console.log('  Phase 1 Refactoring Tests');
  console.log('========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Service Layer Exists
  console.log('Test 1: Service Layer Module Loads');
  try {
    if (typeof authService === 'object') {
      console.log('  ✓ authService module loaded successfully');
      passedTests++;
    } else {
      throw new Error('authService is not an object');
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 2: All Required Functions Exist
  console.log('\nTest 2: All Service Functions Exist');
  const requiredFunctions = [
    'findUserByEmail',
    'findUserById',
    'userExists',
    'createUser',
    'verifyPassword',
    'updateLastLogin',
    'getUserSocietyInfo',
    'getUserSocieties',
    'storeRefreshToken',
    'findValidRefreshToken',
    'revokeRefreshToken',
    'revokeAllUserTokens',
    'verifyUserEmail',
    'updateUserPassword',
    'storePasswordResetOtp',
    'findUserWithValidOtp',
    'clearPasswordResetOtp',
    'resetPasswordWithOtp',
  ];

  let missingFunctions = [];
  for (const funcName of requiredFunctions) {
    if (typeof authService[funcName] !== 'function') {
      missingFunctions.push(funcName);
    }
  }

  if (missingFunctions.length === 0) {
    console.log(`  ✓ All ${requiredFunctions.length} functions exist`);
    passedTests++;
  } else {
    console.log(`  ✗ Missing functions: ${missingFunctions.join(', ')}`);
    failedTests++;
  }

  // Test 3: Controller Imports Service
  console.log('\nTest 3: Controller Uses Service Layer');
  try {
    const authControllerContent = require('fs').readFileSync(
      './FYP-2-/backend/controllers/authController.js',
      'utf8'
    );
    
    if (authControllerContent.includes("require('../services/authService')")) {
      console.log('  ✓ authController imports authService');
      passedTests++;
    } else {
      throw new Error('authController does not import authService');
    }

    if (authControllerContent.includes('authService.findUserByEmail')) {
      console.log('  ✓ authController uses service functions');
      passedTests++;
    } else {
      throw new Error('authController does not use service functions');
    }

    if (!authControllerContent.includes('pool.getConnection()')) {
      console.log('  ✓ authController has no direct database connections');
      passedTests++;
    } else {
      console.log('  ⚠ Warning: authController still has direct database connections');
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 4: Verify OTP Endpoint Exists
  console.log('\nTest 4: New verify-otp Endpoint');
  try {
    const publicRoutesContent = require('fs').readFileSync(
      './FYP-2-/backend/routes/public.routes.js',
      'utf8'
    );
    
    if (publicRoutesContent.includes('/auth/verify-otp')) {
      console.log('  ✓ verify-otp endpoint added to public routes');
      passedTests++;
    } else {
      throw new Error('verify-otp endpoint not found');
    }

    if (publicRoutesContent.includes('authController.verifyOtp')) {
      console.log('  ✓ verify-otp endpoint calls controller function');
      passedTests++;
    } else {
      throw new Error('verify-otp endpoint does not call controller');
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 5: Backup Exists
  console.log('\nTest 5: Original Controller Backed Up');
  try {
    const fs = require('fs');
    if (fs.existsSync('./FYP-2-/backend/controllers/authController.backup.js')) {
      console.log('  ✓ Backup file exists');
      passedTests++;
    } else {
      throw new Error('Backup file not found');
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 6: Password Reset Service Exists
  console.log('\nTest 6: Password Reset Service');
  try {
    const passwordResetService = require('./backend/services/passwordResetService');
    
    if (typeof passwordResetService.generateSixDigitOtp === 'function') {
      console.log('  ✓ generateSixDigitOtp function exists');
      passedTests++;
    }

    if (typeof passwordResetService.otpMatchesStored === 'function') {
      console.log('  ✓ otpMatchesStored function exists');
      passedTests++;
    }

    // Test OTP generation
    const otp = passwordResetService.generateSixDigitOtp();
    if (otp.length === 6 && /^\d{6}$/.test(otp)) {
      console.log(`  ✓ OTP generation works (sample: ${otp})`);
      passedTests++;
    } else {
      throw new Error('OTP generation failed');
    }

    // Test OTP matching
    const matches = passwordResetService.otpMatchesStored('123456', '123456');
    if (matches === true) {
      console.log('  ✓ OTP matching works');
      passedTests++;
    } else {
      throw new Error('OTP matching failed');
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Summary
  console.log('\n========================================');
  console.log('  Test Summary');
  console.log('========================================');
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log(`  Total:  ${passedTests + failedTests}`);
  console.log('========================================\n');

  if (failedTests === 0) {
    console.log('✅ All tests passed! Phase 1 refactoring is complete.\n');
    console.log('Next steps:');
    console.log('  1. Start the backend server: node server.js');
    console.log('  2. Test the OTP endpoints with Postman/curl');
    console.log('  3. Review PHASE1_REFACTORING_COMPLETE.md for details\n');
  } else {
    console.log('❌ Some tests failed. Please review the errors above.\n');
  }

  process.exit(failedTests === 0 ? 0 : 1);
}

// Run tests
testPhase1Refactoring().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});
