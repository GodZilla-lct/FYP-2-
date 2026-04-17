/**
 * Cabinet Service
 * Handles all API calls for Society Cabinet management
 * 
 * IMPORTANT: Cabinet members are historical records only.
 * They do NOT receive portal access or login credentials.
 */

import { api } from '../utils/api';

/**
 * Add a new cabinet member
 * @param {Object} memberData - Cabinet member data
 * @param {number} memberData.society_id - Society ID
 * @param {string} memberData.student_name - Student's full name
 * @param {string} memberData.roll_number - Student's roll number
 * @param {string} memberData.custom_role_title - Custom role title (e.g., "Graphics Head")
 * @param {string} memberData.academic_year - Academic year (format: YYYY-YYYY)
 * @returns {Promise<Object>} Response with created member data
 */
export const addCabinetMember = async (memberData) => {
  try {
    const response = await api.post('/cabinet/add', memberData);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add cabinet member');
    }
    
    return await response.json();
  } catch (error) {
    console.error('[CABINET SERVICE] Add member error:', error);
    throw error;
  }
};

/**
 * Get all cabinet members for a society
 * @param {number} societyId - Society ID
 * @param {string} academicYear - Optional academic year filter (format: YYYY-YYYY)
 * @returns {Promise<Object>} Response with members array
 */
export const getCabinetMembers = async (societyId, academicYear = null) => {
  try {
    let endpoint = `/cabinet/${societyId}`;
    if (academicYear) {
      endpoint += `?academic_year=${encodeURIComponent(academicYear)}`;
    }
    
    const response = await api.get(endpoint);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch cabinet members');
    }
    
    return await response.json();
  } catch (error) {
    console.error('[CABINET SERVICE] Get members error:', error);
    throw error;
  }
};

/**
 * Get a single cabinet member by ID
 * @param {number} memberId - Cabinet member ID
 * @returns {Promise<Object>} Response with member data
 */
export const getCabinetMemberById = async (memberId) => {
  try {
    const response = await api.get(`/cabinet/member/${memberId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch cabinet member');
    }
    
    return await response.json();
  } catch (error) {
    console.error('[CABINET SERVICE] Get member by ID error:', error);
    throw error;
  }
};

/**
 * Update a cabinet member
 * @param {number} memberId - Cabinet member ID
 * @param {Object} updateData - Fields to update
 * @param {string} updateData.student_name - Student's full name (optional)
 * @param {string} updateData.roll_number - Student's roll number (optional)
 * @param {string} updateData.custom_role_title - Custom role title (optional)
 * @param {string} updateData.academic_year - Academic year (optional)
 * @returns {Promise<Object>} Response with updated member data
 */
export const updateCabinetMember = async (memberId, updateData) => {
  try {
    const response = await api.put(`/cabinet/${memberId}`, updateData);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update cabinet member');
    }
    
    return await response.json();
  } catch (error) {
    console.error('[CABINET SERVICE] Update member error:', error);
    throw error;
  }
};

/**
 * Delete a cabinet member
 * @param {number} memberId - Cabinet member ID
 * @returns {Promise<Object>} Response with deletion confirmation
 */
export const deleteCabinetMember = async (memberId) => {
  try {
    const response = await api.delete(`/cabinet/${memberId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete cabinet member');
    }
    
    return await response.json();
  } catch (error) {
    console.error('[CABINET SERVICE] Delete member error:', error);
    throw error;
  }
};

/**
 * Get unique academic years from cabinet members
 * @param {Array} members - Array of cabinet members
 * @returns {Array<string>} Sorted array of unique academic years
 */
export const getUniqueAcademicYears = (members) => {
  const years = [...new Set(members.map(m => m.academic_year))];
  return years.sort().reverse(); // Most recent first
};

/**
 * Validate academic year format
 * @param {string} year - Academic year string
 * @returns {boolean} True if valid format (YYYY-YYYY)
 */
export const validateAcademicYear = (year) => {
  const pattern = /^\d{4}-\d{4}$/;
  return pattern.test(year);
};

/**
 * Generate current academic year
 * @returns {string} Current academic year (e.g., "2023-2024")
 */
export const getCurrentAcademicYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-indexed
  
  // Academic year typically starts in August/September
  if (currentMonth >= 8) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
};

export default {
  addCabinetMember,
  getCabinetMembers,
  getCabinetMemberById,
  updateCabinetMember,
  deleteCabinetMember,
  getUniqueAcademicYears,
  validateAcademicYear,
  getCurrentAcademicYear
};
