#!/usr/bin/env node

/**
 * Cleanup script to remove old file upload components that are no longer needed
 * after switching to Gemini AI document processing
 */

const fs = require('fs');
const path = require('path');

const filesToRemove = [
  // Old upload components
  'elearning/src/components/CourseMaterials/UploadMaterial.tsx',
  'elearning/src/services/cloudinaryService.ts',
  
  // Old upload controller (keep for now, might be used elsewhere)
  // 'backend/src/controllers/uploadController.ts',
  
  // Test files
  'test-upload-auth.js'
];

const directoriesToCheck = [
  'elearning/src/components/CourseMaterials/',
  'elearning/src/services/',
  'backend/src/controllers/',
  'backend/src/routes/'
];

console.log('🧹 Cleaning up old file upload components...\n');

// Remove files
filesToRemove.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`✅ Removed: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to remove ${filePath}:`, error.message);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

// Check for unused imports
console.log('\n🔍 Checking for unused imports...\n');

const checkUnusedImports = (filePath, searchText) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchText)) {
      console.log(`⚠️  Found unused import in: ${filePath}`);
      console.log(`   Search for: ${searchText}`);
    }
  }
};

// Check for unused cloudinary imports
checkUnusedImports('elearning/src/pages/Teacher/CourseManagement.tsx', 'UploadMaterial');
checkUnusedImports('elearning/src/pages/Teacher/CourseManagement.tsx', 'cloudinaryService');

console.log('\n✨ Cleanup completed!');
console.log('\n📋 Next steps:');
console.log('1. Review the files mentioned above for unused imports');
console.log('2. Remove any remaining references to old upload components');
console.log('3. Test the new document processing functionality');
console.log('4. Update any documentation that references the old system');

console.log('\n🚀 The new Gemini AI document processing system is now active!');
console.log('   - Documents are processed with AI to extract structured notes');
console.log('   - Students can view content in an interactive format');
console.log('   - Progress tracking and bookmarking are available');
console.log('   - No more file storage issues or upload errors');
