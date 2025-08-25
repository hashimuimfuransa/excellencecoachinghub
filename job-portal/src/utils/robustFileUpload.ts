/**
 * Robust file upload utility using XMLHttpRequest for better production reliability
 */

interface UploadConfig {
  maxRetries?: number;
  timeout?: number;
  chunkSize?: number;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  data?: any;
}

class RobustFileUploader {
  private config: Required<UploadConfig>;

  constructor(config: UploadConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 60000, // 60 seconds
      chunkSize: config.chunkSize ?? 1024 * 1024 // 1MB chunks
    };
  }

  async upload(
    file: File,
    fileType: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    let lastError: Error;
    
    // First, test if the endpoint is reachable
    try {
      await this.testEndpoint();
    } catch (error: any) {
      console.error('❌ Backend endpoint test failed:', error.message);
      throw new Error(`Backend is not accessible: ${error.message}`);
    }
    
    // Retry mechanism
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔄 Upload attempt ${attempt}/${this.config.maxRetries} for ${fileType}`);
        
        const result = await this.attemptUpload(file, fileType, onProgress, attempt);
        console.log(`✅ Upload successful on attempt ${attempt}`);
        return result;
        
      } catch (error: any) {
        console.warn(`⚠️ Upload attempt ${attempt} failed:`, error.message);
        lastError = error;
        
        // Don't retry on authentication errors or invalid file errors
        if (error.message?.includes('Authentication') || 
            error.message?.includes('file type') ||
            error.message?.includes('file size') ||
            error.message?.includes('HTML instead of JSON')) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < this.config.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('Upload failed after all retry attempts');
  }

  private async attemptUpload(
    file: File,
    fileType: string,
    onProgress?: (progress: number) => void,
    attempt: number = 1
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate file before upload
      if (!this.validateFile(file)) {
        reject(new Error('Invalid file type or size'));
        return;
      }

      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      const token = localStorage.getItem('token');

      if (!token) {
        reject(new Error('Authentication token not found. Please log in again.'));
        return;
      }

      // Prepare form data
      formData.append(fileType, file);
      
      // Set timeout
      xhr.timeout = this.config.timeout;

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(Math.min(progress, 95)); // Keep some buffer for server processing
        }
      });

      // Handle successful response
      xhr.addEventListener('load', () => {
        try {
          // Complete progress
          if (onProgress) onProgress(100);

          console.log(`📊 Upload response status: ${xhr.status}`);
          console.log(`📊 Upload response headers:`, xhr.getAllResponseHeaders());
          console.log(`📊 Upload response text length: ${xhr.responseText?.length || 0}`);
          console.log(`📊 Upload response text: ${xhr.responseText?.substring(0, 500)}...`);

          if (xhr.status >= 200 && xhr.status < 300) {
            const responseText = xhr.responseText?.trim();
            
            // Check if we got any response at all
            if (!responseText || responseText.length === 0) {
              console.error('❌ Completely empty response from server');
              console.error('❌ Response headers:', xhr.getAllResponseHeaders());
              console.error('❌ Status:', xhr.status, xhr.statusText);
              
              // In production, sometimes the response is empty but the upload actually succeeded
              // Let's check if this is a successful upload by examining the status and headers
              if (xhr.status === 200) {
                console.warn('⚠️ Got 200 status with empty response - this might be a server issue');
                reject(new Error('Server returned empty response. The file may have been uploaded but we cannot confirm. Please refresh and check your profile.'));
              } else {
                reject(new Error('Empty response from server. Please try again.'));
              }
              return;
            }

            let result: any;
            try {
              result = JSON.parse(responseText);
              console.log('✅ Parsed response:', result);
            } catch (parseError) {
              console.error('❌ Failed to parse JSON:', parseError);
              console.error('❌ Raw response:', responseText);
              console.error('❌ First 100 chars:', responseText.substring(0, 100));
              
              // Sometimes the server returns HTML instead of JSON when there's an error
              if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
                reject(new Error('Server returned HTML instead of JSON. This usually indicates a server error. Please try again later.'));
              } else {
                reject(new Error('Server returned invalid response format. Please try again.'));
              }
              return;
            }

            if (result && result.success) {
              const fileUrl = this.extractFileUrl(result, fileType);
              if (fileUrl) {
                console.log(`✅ Upload successful: ${fileUrl}`);
                resolve(fileUrl);
              } else {
                console.error('❌ No file URL in response:', result);
                reject(new Error('No file URL received from server. The file may have been uploaded but URL is missing.'));
              }
            } else {
              const errorMsg = result?.error || result?.message || 'Upload failed - no error details provided';
              console.error('❌ Upload failed:', errorMsg);
              reject(new Error(errorMsg));
            }
          } else {
            // HTTP error status
            let errorMessage = `Upload failed with status ${xhr.status} ${xhr.statusText}`;
            
            try {
              if (xhr.responseText && xhr.responseText.trim()) {
                const errorResponse = JSON.parse(xhr.responseText);
                errorMessage = errorResponse.error || errorResponse.message || errorMessage;
              }
            } catch (e) {
              console.warn('Could not parse error response as JSON');
              // Use the raw response if it's not empty
              if (xhr.responseText && xhr.responseText.trim() && xhr.responseText.length < 200) {
                errorMessage = xhr.responseText.trim();
              }
            }
            
            console.error('❌ HTTP Error:', errorMessage);
            reject(new Error(errorMessage));
          }
        } catch (error: any) {
          console.error('❌ Error processing response:', error);
          reject(new Error(`Failed to process server response: ${error.message}`));
        }
      });

      // Handle network errors
      xhr.addEventListener('error', () => {
        console.error('❌ Network error during upload');
        reject(new Error('Network error. Please check your connection and try again.'));
      });

      // Handle timeout
      xhr.addEventListener('timeout', () => {
        console.error('❌ Upload timeout');
        reject(new Error('Upload timed out. Please try again.'));
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        console.error('❌ Upload aborted');
        reject(new Error('Upload was cancelled.'));
      });

      // Prepare request
      xhr.open('POST', `/api/upload/${fileType}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      // Don't set Content-Type header - let browser set it with boundary for multipart/form-data

      console.log(`🚀 Starting upload for ${fileType} (attempt ${attempt})`);
      xhr.send(formData);
    });
  }

  private validateFile(file: File): boolean {
    // File size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ File too large:', file.size);
      return false;
    }

    // File type validation
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      return false;
    }

    return true;
  }

  private extractFileUrl(result: any, fileType: string): string | null {
    // Handle different response structures
    if (result.data) {
      // Try specific file type first
      if (result.data[fileType]?.url) {
        return result.data[fileType].url;
      }
      
      // Try alternative field names
      const alternatives = {
        cv: ['cv', 'resume', 'cvFile'],
        resume: ['resume', 'cv', 'resumeFile'],
        profilePicture: ['profilePicture', 'avatar']
      };

      const possibleFields = alternatives[fileType as keyof typeof alternatives] || [fileType];
      
      for (const field of possibleFields) {
        if (result.data[field]?.url) {
          return result.data[field].url;
        }
      }
    }

    // Fallback: try to find any URL in the response
    if (typeof result === 'object') {
      const searchForUrl = (obj: any): string | null => {
        if (typeof obj === 'string' && obj.startsWith('http')) {
          return obj;
        }
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            const found = searchForUrl(obj[key]);
            if (found) return found;
          }
        }
        return null;
      };

      return searchForUrl(result);
    }

    return null;
  }

  private async testEndpoint(): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('token');

      if (!token) {
        reject(new Error('Authentication token not found'));
        return;
      }

      xhr.timeout = 5000; // 5 second timeout for test
      xhr.open('GET', '/api/health');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ Backend endpoint is accessible');
          resolve();
        } else {
          reject(new Error(`Backend returned ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error - cannot reach backend'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Backend endpoint timeout'));
      });

      xhr.send();
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const robustUploader = new RobustFileUploader({
  maxRetries: 3,
  timeout: 60000
});

// Export main upload function
export async function uploadFileRobustly(
  file: File,
  fileType: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return robustUploader.upload(file, fileType, onProgress);
}