/**
 * Safe file upload utility to prevent bundling issues
 */

interface UploadResponse {
  success: boolean;
  data?: {
    [key: string]: {
      url: string;
    };
  };
  error?: string;
  message?: string;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  success: boolean;
  error: string | null;
}

export async function uploadFile(
  file: File,
  fileType: string,
  onProgressUpdate: (progress: number) => void
): Promise<string> {
  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB');
  }

  // Validate file type
  const allowedTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only PDF, DOC, and DOCX files are allowed');
  }

  const formData = new FormData();
  formData.append(fileType, file);

  // Simulate progress for better UX
  const progressInterval = setInterval(() => {
    onProgressUpdate(Math.min(90, Math.random() * 90));
  }, 200);

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    const response = await fetch(`/api/upload/${fileType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    clearInterval(progressInterval);
    onProgressUpdate(100);

    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`;
      
      try {
        const errorText = await response.text();
        if (errorText.trim()) {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    // Parse successful response
    const responseText = await response.text();
    if (!responseText.trim()) {
      throw new Error('Empty response from server');
    }

    let result: UploadResponse;
    try {
      result = JSON.parse(responseText);
      console.log('✅ Upload response:', result);
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Invalid response format from server');
    }

    // Validate response structure
    if (!result.success) {
      throw new Error(result.error || result.message || 'Upload failed');
    }

    // Handle different response structures based on file type
    let fileUrl: string;
    
    if (fileType === 'cv') {
      fileUrl = result.data?.cv?.url;
    } else if (fileType === 'resume') {
      fileUrl = result.data?.resume?.url;
    } else if (fileType === 'profilePicture') {
      fileUrl = result.data?.profilePicture?.url;
    } else {
      // Generic fallback
      fileUrl = result.data?.[fileType]?.url;
    }
    
    if (!fileUrl) {
      console.error('Invalid response structure for fileType:', fileType);
      console.error('Full response:', result);
      throw new Error(`No file URL received from server for ${fileType}`);
    }

    return fileUrl;
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}