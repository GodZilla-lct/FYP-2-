/**
 * Society & Cabinet Validation Schemas
 * Phase 2: The Bouncer
 * 
 * Validates society and cabinet member operations
 */

const { z } = require('zod');

/**
 * Add cabinet member validation schema
 */
const addCabinetMemberSchema = z.object({
  body: z.object({
    society_id: z
      .number({
        required_error: 'Society ID is required',
        invalid_type_error: 'Society ID must be a number',
      })
      .int('Society ID must be an integer')
      .positive('Society ID must be positive'),
    
    student_name: z
      .string({
        required_error: 'Student name is required',
        invalid_type_error: 'Student name must be a string',
      })
      .min(2, 'Student name must be at least 2 characters')
      .max(100, 'Student name must not exceed 100 characters')
      .trim()
      .regex(/^[a-zA-Z\s]+$/, 'Student name must contain only letters and spaces'),
    
    roll_number: z
      .string({
        required_error: 'Roll number is required',
        invalid_type_error: 'Roll number must be a string',
      })
      .min(5, 'Roll number must be at least 5 characters')
      .max(50, 'Roll number must not exceed 50 characters')
      .trim()
      .regex(/^[A-Z0-9-]+$/i, 'Roll number must contain only letters, numbers, and hyphens'),
    
    custom_role_title: z
      .string({
        required_error: 'Role title is required',
        invalid_type_error: 'Role title must be a string',
      })
      .min(2, 'Role title must be at least 2 characters')
      .max(100, 'Role title must not exceed 100 characters')
      .trim(),
    
    academic_year: z
      .string({
        required_error: 'Academic year is required',
        invalid_type_error: 'Academic year must be a string',
      })
      .regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2023-2024)')
      .refine(
        (year) => {
          const [start, end] = year.split('-').map(Number);
          return end === start + 1;
        },
        'Academic year end must be exactly one year after start'
      ),
  }),
});

/**
 * Update cabinet member validation schema
 */
const updateCabinetMemberSchema = z.object({
  params: z.object({
    memberId: z
      .string()
      .regex(/^\d+$/, 'Member ID must be a number')
      .transform(Number),
  }),
  body: z.object({
    student_name: z
      .string()
      .min(2, 'Student name must be at least 2 characters')
      .max(100, 'Student name must not exceed 100 characters')
      .trim()
      .regex(/^[a-zA-Z\s]+$/, 'Student name must contain only letters and spaces')
      .optional(),
    
    roll_number: z
      .string()
      .min(5, 'Roll number must be at least 5 characters')
      .max(50, 'Roll number must not exceed 50 characters')
      .trim()
      .regex(/^[A-Z0-9-]+$/i, 'Roll number must contain only letters, numbers, and hyphens')
      .optional(),
    
    custom_role_title: z
      .string()
      .min(2, 'Role title must be at least 2 characters')
      .max(100, 'Role title must not exceed 100 characters')
      .trim()
      .optional(),
    
    academic_year: z
      .string()
      .regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY')
      .refine(
        (year) => {
          const [start, end] = year.split('-').map(Number);
          return end === start + 1;
        },
        'Academic year end must be exactly one year after start'
      )
      .optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  ),
});

/**
 * Get cabinet members validation schema
 */
const getCabinetMembersSchema = z.object({
  params: z.object({
    societyId: z
      .string()
      .regex(/^\d+$/, 'Society ID must be a number')
      .transform(Number),
  }),
  query: z.object({
    academic_year: z
      .string()
      .regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY')
      .optional(),
  }).optional(),
});

/**
 * Delete cabinet member validation schema
 */
const deleteCabinetMemberSchema = z.object({
  params: z.object({
    memberId: z
      .string()
      .regex(/^\d+$/, 'Member ID must be a number')
      .transform(Number),
  }),
});

/**
 * Create society validation schema
 */
const createSocietySchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Society name is required',
        invalid_type_error: 'Society name must be a string',
      })
      .min(3, 'Society name must be at least 3 characters')
      .max(100, 'Society name must not exceed 100 characters')
      .trim(),
    
    description: z
      .string()
      .max(500, 'Description must not exceed 500 characters')
      .trim()
      .optional(),
    
    category: z
      .string()
      .max(50, 'Category must not exceed 50 characters')
      .trim()
      .optional(),
  }),
});

/**
 * Update society validation schema
 */
const updateSocietySchema = z.object({
  params: z.object({
    societyId: z
      .string()
      .regex(/^\d+$/, 'Society ID must be a number')
      .transform(Number),
  }),
  body: z.object({
    name: z
      .string()
      .min(3, 'Society name must be at least 3 characters')
      .max(100, 'Society name must not exceed 100 characters')
      .trim()
      .optional(),
    
    description: z
      .string()
      .max(500, 'Description must not exceed 500 characters')
      .trim()
      .optional(),
    
    category: z
      .string()
      .max(50, 'Category must not exceed 50 characters')
      .trim()
      .optional(),
    
    is_active: z
      .boolean()
      .optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  ),
});

module.exports = {
  addCabinetMemberSchema,
  updateCabinetMemberSchema,
  getCabinetMembersSchema,
  deleteCabinetMemberSchema,
  createSocietySchema,
  updateSocietySchema,
};
