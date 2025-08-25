/**
 * Ultra-simple CV upload for production reliability
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
 * Upload CV file with minimal complexity
 */
export const uploadCV = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Basic validation
  if (!file) {
    throw new Error('No file selected');
  }
  
  if (file.size > 50 * 1024 * 1024) { // 50MB limit for production
    throw new Error('File too large. Please choose a file under 50MB.');
  }

  // Get auth token
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Please log in to upload files');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    // Set up progress tracking
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }

    // Handle response
    xhr.onload = () => {
      console.log('Upload response status:', xhr.status);
      console.log('Response length:', xhr.responseText?.length || 0);
      
      if (xhr.status === 200) {
        try {
          const response = xhr.responseText?.trim();
          if (!response) {
            console.error('Empty response from server');
            reject(new Error('Server error. Please try again.'));
            return;
          }

          const result: UploadResponse = JSON.parse(response);
          if (result.success && result.data?.url) {
            resolve(result.data.url);
          } else {
            reject(new Error(result.error || 'Upload failed'));
          }
        } catch (error) {
          console.error('Parse error:', error);
          reject(new Error('Server response error'));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    // Handle errors
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.ontimeout = () => reject(new Error('Upload timeout'));

    // Setup and send request
    xhr.open('POST', '/api/upload/cv');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 45000; // 45 seconds
    
    formData.append('cv', file);
    
    console.log('Starting CV upload:', file.name);
    xhr.send(formData);
  });
};