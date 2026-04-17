/**
 * Phase 2: The Safety Net - Test Script
 * Verifies all Phase 2 implementations
 */

const fs = require('fs');
const path = require('path');

async function testPhase2() {
  console.log('========================================');
  console.log('  Phase 2: The Safety Net - Tests');
  console.log('========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Error Middleware Exists
  console.log('Test 1: Error Middleware');
  try {
    const errorMiddleware = require('./backend/middleware/errorMiddleware');
    
    if (typeof errorMiddleware.globalErrorHandler === 'function') {
      console.log('  ✓ globalErrorHandler exists');
      passedTests++;
    }
    
    if (typeof errorMiddleware.notFoundHandler === 'function') {
      console.log('  ✓ notFoundHandler exists');
      passedTests++;
    }
    
    if (typeof errorMiddleware.asyncHandler === 'function') {
      console.log('  ✓ asyncHandler exists');
      passedTests++;
    }
    
    if (typeof errorMiddleware.createError === 'function') {
      console.log('  ✓ createError exists');
      passedTests++;
    }
    
    if (typeof errorMiddleware.AppError === 'function') {
      console.log('  ✓ AppError class exists');
      passedTests++;
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 2: Logger Configuration
  console.log('\nTest 2: Logger Configuration');
  try {
    const logger = require('./backend/config/logger');
    
    if (typeof logger.info === 'function') {
      console.log('  ✓ logger.info exists');
      passedTests++;
    }
    
    if (typeof logger.error === 'function') {
      console.log('  ✓ logger.error exists');
      passedTests++;
    }
    
    if (typeof logger.warn === 'function') {
      console.log('  ✓ logger.warn exists');
      passedTests++;
    }
    
    if (typeof logger.logRequest === 'function') {
      console.log('  ✓ logger.logRequest exists');
      passedTests++;
    }
    
    if (typeof logger.logAuth === 'function') {
      console.log('  ✓ logger.logAuth exists');
      passedTests++;
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 3: Request Logger Middleware
  console.log('\nTest 3: Request Logger Middleware');
  try {
    const requestLogger = require('./backend/middleware/requestLogger');
    
    if (typeof requestLogger.getRequestLogger === 'function') {
      console.log('  ✓ getRequestLogger exists');
      passedTests++;
    }
    
    if (typeof requestLogger.addRequestId === 'function') {
      console.log('  ✓ addRequestId exists');
      passedTests++;
    }
    
    if (typeof requestLogger.trackResponseTime === 'function') {
      console.log('  ✓ trackResponseTime exists');
      passedTests++;
    }
    
    if (typeof requestLogger.addSecurityHeaders === 'function') {
      console.log('  ✓ addSecurityHeaders exists');
      passedTests++;
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 4: Validation Middleware
  console.log('\nTest 4: Validation Middleware');
  try {
    const validateRequest = require('./backend/middleware/validateRequest');
    
    if (typeof validateRequest.validate === 'function') {
      console.log('  ✓ validate exists');
      passedTests++;
    }
    
    if (typeof validateRequest.validateBody === 'function') {
      console.log('  ✓ validateBody exists');
      passedTests++;
    }
    
    if (typeof validateRequest.validateParams === 'function') {
      console.log('  ✓ validateParams exists');
      passedTests++;
    }
    
    if (typeof validateRequest.validateQuery === 'function') {
      console.log('  ✓ validateQuery exists');
      passedTests++;
    }
    
    if (typeof validateRequest.sanitizeRequest === 'function') {
      console.log('  ✓ sanitizeRequest exists');
      passedTests++;
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 5: Auth Validation Schemas
  console.log('\nTest 5: Auth Validation Schemas');
  try {
    const authValidator = require('./backend/validators/authValidator');
    
    const schemas = [
      'loginSchema',
      'registerSchema',
      'forgotPasswordSchema',
      'verifyOtpSchema',
      'resetPasswordSchema',
      'changePasswordSchema',
      'refreshTokenSchema',
      'verifyEmailSchema',
    ];
    
    let missingSchemas = [];
    for (const schema of schemas) {
      if (!authValidator[schema]) {
        missingSchemas.push(schema);
      }
    }
    
    if (missingSchemas.length === 0) {
      console.log(`  ✓ All ${schemas.length} auth schemas exist`);
      passedTests++;
    } else {
      console.log(`  ✗ Missing schemas: ${missingSchemas.join(', ')}`);
      failedTests++;
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 6: Society Validation Schemas
  console.log('\nTest 6: Society Validation Schemas');
  try {
    const societyValidator = require('./backend/validators/societyValidator');
    
    const schemas = [
      'addCabinetMemberSchema',
      'updateCabinetMemberSchema',
      'getCabinetMembersSchema',
      'deleteCabinetMemberSchema',
      'createSocietySchema',
      'updateSocietySchema',
    ];
    
    let missingSchemas = [];
    for (const schema of schemas) {
      if (!societyValidator[schema]) {
        missingSchemas.push(schema);
      }
    }
    
    if (missingSchemas.length === 0) {
      console.log(`  ✓ All ${schemas.length} society schemas exist`);
      passedTests++;
    } else {
      console.log(`  ✗ Missing schemas: ${missingSchemas.join(', ')}`);
      failedTests++;
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 7: Server.js Integration
  console.log('\nTest 7: Server.js Integration');
  try {
    const serverContent = fs.readFileSync('./FYP-2-/server.js', 'utf8');
    
    if (serverContent.includes('errorMiddleware')) {
      console.log('  ✓ errorMiddleware imported');
      passedTests++;
    }
    
    if (serverContent.includes('logger')) {
      console.log('  ✓ logger imported');
      passedTests++;
    }
    
    if (serverContent.includes('requestLogger')) {
      console.log('  ✓ requestLogger imported');
      passedTests++;
    }
    
    if (serverContent.includes('globalErrorHandler')) {
      console.log('  ✓ globalErrorHandler used');
      passedTests++;
    }
    
    if (serverContent.includes('getRequestLogger')) {
      console.log('  ✓ getRequestLogger used');
      passedTests++;
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 8: Routes Updated with Validation
  console.log('\nTest 8: Routes Updated with Validation');
  try {
    const publicRoutesContent = fs.readFileSync('./FYP-2-/backend/routes/public.routes.js', 'utf8');
    
    if (publicRoutesContent.includes('validate')) {
      console.log('  ✓ public.routes.js uses validate middleware');
      passedTests++;
    }
    
    if (publicRoutesContent.includes('loginSchema')) {
      console.log('  ✓ public.routes.js uses loginSchema');
      passedTests++;
    }
    
    const cabinetRoutesContent = fs.readFileSync('./FYP-2-/backend/routes/cabinet.routes.js', 'utf8');
    
    if (cabinetRoutesContent.includes('validate')) {
      console.log('  ✓ cabinet.routes.js uses validate middleware');
      passedTests++;
    }
    
    if (cabinetRoutesContent.includes('addCabinetMemberSchema')) {
      console.log('  ✓ cabinet.routes.js uses addCabinetMemberSchema');
      passedTests++;
    }
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 9: Zod Package Installed
  console.log('\nTest 9: Required Packages');
  try {
    require('zod');
    console.log('  ✓ zod package installed');
    passedTests++;
    
    require('winston');
    console.log('  ✓ winston package installed');
    passedTests++;
    
    require('morgan');
    console.log('  ✓ morgan package installed');
    passedTests++;
  } catch (error) {
    console.log('  ✗ Failed:', error.message);
    failedTests++;
  }

  // Test 10: Documentation Created
  console.log('\nTest 10: Documentation');
  try {
    if (fs.existsSync('./FYP-2-/PHASE2_SAFETY_NET_COMPLETE.md')) {
      console.log('  ✓ PHASE2_SAFETY_NET_COMPLETE.md exists');
      passedTests++;
    } else {
      throw new Error('Documentation not found');
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
    console.log('✅ All tests passed! Phase 2 is complete.\n');
    console.log('Next steps:');
    console.log('  1. Start the server: node server.js');
    console.log('  2. Check logs directory: ls logs/');
    console.log('  3. Test validation endpoints');
    console.log('  4. Review PHASE2_SAFETY_NET_COMPLETE.md\n');
  } else {
    console.log('❌ Some tests failed. Please review the errors above.\n');
  }

  process.exit(failedTests === 0 ? 0 : 1);
}

// Run tests
testPhase2().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});
