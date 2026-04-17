/**
 * Authentication Validation Schemas
 * Phase 2: The Bouncer
 * 
 * Uses Zod for strict input validation
 * Prevents garbage data from reaching the database
 */

const { z } = require('zod');

/**
 * Login validation schema
 */
const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
      })
      .email('Invalid email format')
      .min(5, 'Email must be at least 5 characters')
      .max(100, 'Email must not exceed 100 characters')
      .toLowerCase()
      .trim(),
    
    password: z
      .string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string',
      })
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must not exceed 100 characters'),
  }),
});

/**
 * Registration validation schema
 */
const registerSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Name is required',
        invalid_type_error: 'Name must be a string',
      })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .trim()
      .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),
    
    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
      })
      .email('Invalid email format')
      .min(5, 'Email must be at least 5 characters')
      .max(100, 'Email must not exceed 100 characters')
      .toLowerCase()
      .trim(),
    
    password: z
      .string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string',
      })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    
    rollNumber: z
      .string({
        required_error: 'Roll number is required',
        invalid_type_error: 'Roll number must be a string',
      })
      .min(5, 'Roll number must be at least 5 characters')
      .max(50, 'Roll number must not exceed 50 characters')
      .trim()
      .regex(/^[A-Z0-9-]+$/i, 'Roll number must contain only letters, numbers, and hyphens'),
  }),
});

/**
 * Forgot password validation schema
 */
const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
      })
      .email('Invalid email format')
      .min(5, 'Email must be at least 5 characters')
      .max(100, 'Email must not exceed 100 characters')
      .toLowerCase()
      .trim(),
  }),
});

/**
 * Verify OTP validation schema
 */
const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
      })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    
    otp: z
      .string({
        required_error: 'OTP is required',
        invalid_type_error: 'OTP must be a string',
      })
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  }),
});

/**
 * Reset password validation schema
 */
const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
      })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    
    otp: z
      .string({
        required_error: 'OTP is required',
        invalid_type_error: 'OTP must be a string',
      })
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only numbers'),
    
    newPassword: z
      .string({
        required_error: 'New password is required',
        invalid_type_error: 'New password must be a string',
      })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
});

/**
 * Change password validation schema
 */
const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({
        required_error: 'Current password is required',
        invalid_type_error: 'Current password must be a string',
      })
      .min(1, 'Current password is required'),
    
    newPassword: z
      .string({
        required_error: 'New password is required',
        invalid_type_error: 'New password must be a string',
      })
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'New password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
});

/**
 * Refresh token validation schema
 */
const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({
        required_error: 'Refresh token is required',
        invalid_type_error: 'Refresh token must be a string',
      })
      .min(10, 'Invalid refresh token'),
  }),
});

/**
 * Email verification validation schema
 */
const verifyEmailSchema = z.object({
  body: z.object({
    token: z
      .string({
        required_error: 'Verification token is required',
        invalid_type_error: 'Verification token must be a string',
      })
      .min(10, 'Invalid verification token'),
  }),
});

module.exports = {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
  verifyEmailSchema,
};
