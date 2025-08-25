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

  // First test: Raw endpoint (no middleware)
  console.log('🆘 Testing raw endpoint (no auth, no middleware)...');
  
  try {
    const rawResponse = await fetch('/api/upload/cv-raw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'raw' })
    });

    console.log('Raw response status:', rawResponse.status);
    console.log('Raw response headers:', [...rawResponse.headers.entries()]);
    
    const rawText = await rawResponse.text();
    console.log('Raw response text length:', rawText.length);
    console.log('Raw response text:', rawText);

    if (rawResponse.status === 200 && rawText.length > 0) {
      console.log('✅ Raw endpoint working - proxy issue confirmed');
      
      // Try to parse the response
      const rawResult = JSON.parse(rawText);
      console.log('Raw endpoint data:', rawResult);
      
      // Now test auth endpoint
      console.log('🔍 Testing auth endpoint...');
      const debugResponse = await fetch('/api/upload/cv-debug', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      
      const debugText = await debugResponse.text();
      console.log('Auth endpoint response length:', debugText.length);
      
      if (debugText.length === 0) {
        throw new Error('Auth middleware is stripping response body');
      }
      
    } else {
      throw new Error(`Raw endpoint failed: ${rawResponse.status} - ${rawText}`);
    }

  } catch (rawError) {
    console.error('❌ Raw endpoint test failed:', rawError);
    throw new Error(`Server connectivity test failed: ${rawError}`);
  }

  // If debug works, try no-auth endpoint first
  console.log('🔓 Testing no-auth endpoint...');
  
  try {
    const noAuthResponse = await fetch('/api/upload/cv-no-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'no-auth' })
    });

    const noAuthText = await noAuthResponse.text();
    console.log('No-auth endpoint response length:', noAuthText.length);
    console.log('No-auth endpoint response:', noAuthText);

    if (noAuthResponse.status === 200 && noAuthText.length > 0) {
      console.log('✅ No-auth endpoint working - will use this for actual upload');
      
      // Parse the test response
      const testResult = JSON.parse(noAuthText);
      console.log('✅ Successfully got mock upload response');
      
      // For now, return the test URL - later we'll implement real upload
      return testResult.data.url;
    }
    
  } catch (noAuthError) {
    console.error('❌ No-auth endpoint failed:', noAuthError);
  }
  
  // Fallback to original upload endpoint
  console.log('🚀 Fallback to auth endpoint...');
  
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