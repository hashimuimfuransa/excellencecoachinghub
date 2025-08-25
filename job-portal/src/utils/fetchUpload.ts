/**
 * Alternative fetch-based upload for production debugging
 */

export const uploadCVWithFetch = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  // First test: Just hit the debug endpoint
  console.log('🔍 Testing debug endpoint with fetch...');
  
  try {
    const debugResponse = await fetch('/api/upload/cv-debug', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: true })
    });

    console.log('Debug response status:', debugResponse.status);
    console.log('Debug response headers:', [...debugResponse.headers.entries()]);
    
    const debugText = await debugResponse.text();
    console.log('Debug response text length:', debugText.length);
    console.log('Debug response text:', debugText);

    if (!debugResponse.ok || !debugText) {
      throw new Error(`Debug endpoint failed: ${debugResponse.status} - ${debugText}`);
    }

    const debugResult = JSON.parse(debugText);
    console.log('✅ Debug endpoint working:', debugResult.message);

  } catch (debugError) {
    console.error('❌ Debug endpoint failed:', debugError);
    throw new Error(`Server connectivity test failed: ${debugError}`);
  }

  // If debug works, try actual upload
  console.log('🚀 Debug successful, attempting actual upload...');
  
  const formData = new FormData();
  formData.append('cv', file);

  const uploadResponse = await fetch('/api/upload/cv', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type - let browser set it for FormData
    },
    body: formData
  });

  console.log('Upload response status:', uploadResponse.status);
  const uploadText = await uploadResponse.text();
  console.log('Upload response text length:', uploadText.length);

  if (!uploadResponse.ok || !uploadText) {
    throw new Error(`Upload failed: ${uploadResponse.status} - Empty response`);
  }

  const result = JSON.parse(uploadText);
  
  if (!result.success || !result.data?.url) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.data.url;
};