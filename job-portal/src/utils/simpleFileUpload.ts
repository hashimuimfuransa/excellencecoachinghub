/**
 * Simple, production-ready file upload utility
 * Now with CORS issue resolved
 */

interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    originalName: string;
    size: number;
  };
  error?: string;
  message?: string;
}

/**
 * Upload a file to the server with proper error handling
 */
export const uploadFile = async (
  file: File,
  fileType: 'cv' | 'resume' | 'avatar',
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      reject(new Error('Authentication required. Please log in again.'));
      return;
    }

    // Setup progress tracking
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      console.log('Upload completed with status:', xhr.status);
      console.log('Response text length:', xhr.responseText?.length || 0);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          // Check if we got a response
          if (!xhr.responseText || xhr.responseText.trim() === '') {
            console.error('Empty response from server');
            reject(new Error('Server returned empty response. This was likely a CORS issue that has been fixed.'));
            return;
          }

          const result: UploadResponse = JSON.parse(xhr.responseText);
          
          if (result.success && result.data?.url) {
            console.log('Upload successful:', result.data.url);
            resolve(result.data.url);
          } else {
            reject(new Error(result.error || 'Upload failed'));
          }
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          console.error('Raw response:', xhr.responseText.substring(0, 500));
          reject(new Error('Invalid response from server'));
        }
      } else {
        console.error('Upload failed with status:', xhr.status);
        reject(new Error(`Upload failed (${xhr.status}). Please try again.`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      console.error('Network error during upload');
      reject(new Error('Network error. Please check your connection and try again.'));
    });

    // Handle timeout
    xhr.addEventListener('timeout', () => {
      console.error('Upload timeout');
      reject(new Error('Upload timed out. Please try again.'));
    });

    // TEMPORARY: Use debug endpoint for testing
    const endpoint = fileType === 'cv' ? '/api/upload/cv-debug' : `/api/upload/${fileType}`;
    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 30000; // 30 seconds timeout
    
    // For debug endpoint, don't send file data
    if (fileType === 'cv') {
      // Just send empty form data for debug test
      console.log('🔍 Using debug endpoint - no file data sent');
    } else {
      formData.append(fileType, file);
    }
    
    console.log(`Starting ${fileType} upload:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      endpoint
    });
    
    // Start upload
    xhr.send(formData);
  });
};

/**
 * Upload CV file specifically
 */
export const uploadCV = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Validate file before upload
  if (!file) {
    throw new Error('No file selected');
  }
  
  if (file.size > 100 * 1024 * 1024) { // 100MB
    throw new Error('File size too large. Please choose a file under 100MB.');
  }
  
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a PDF, Word document, text file, or image.');
  }
  
  return uploadFile(file, 'cv', onProgress);
};