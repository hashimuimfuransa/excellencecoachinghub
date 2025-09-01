import { Response } from 'express';

/**
 * Validate if a string is a valid MongoDB ObjectId
 * @param id - The ID to validate
 * @returns true if valid ObjectId, false otherwise
 */
export const isValidObjectId = (id: string): boolean => {
  if (!id || id === 'undefined' || id.trim() === '') {
    return false;
  }
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate ObjectId and send error response if invalid
 * @param id - The ID to validate
 * @param res - Express response object
 * @param fieldName - Name of the field for error message (default: 'ID')
 * @returns true if valid, false if invalid (response already sent)
 */
export const validateObjectIdParam = (
  id: string, 
  res: Response, 
  fieldName: string = 'ID'
): boolean => {
  if (!id || id === 'undefined' || id.trim() === '') {
    console.error(`❌ Invalid ${fieldName}:`, id);
    res.status(400).json({
      success: false,
      error: `Valid ${fieldName.toLowerCase()} is required`
    });
    return false;
  }

  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    console.error(`❌ Invalid ObjectId format for ${fieldName}:`, id);
    res.status(400).json({
      success: false,
      error: `Invalid ${fieldName.toLowerCase()} format`
    });
    return false;
  }

  return true;
};

/**
 * Validate multiple ObjectId parameters
 * @param params - Object containing id parameters to validate
 * @param res - Express response object
 * @returns true if all valid, false if any invalid (response already sent)
 */
export const validateMultipleObjectIds = (
  params: { [key: string]: string },
  res: Response
): boolean => {
  for (const [fieldName, id] of Object.entries(params)) {
    if (!validateObjectIdParam(id, res, fieldName)) {
      return false;
    }
  }
  return true;
};