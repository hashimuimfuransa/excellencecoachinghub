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

  // First test: GET endpoint (to see if proxy strips only POST responses)
  console.log('🔍 Testing GET endpoint...');
  
  try {
    const getResponse = await fetch('/api/upload/cv-test', {
      method: 'GET'
    });

    console.log('GET response status:', getResponse.status);
    console.log('GET response headers:', [...getResponse.headers.entries()]);
    
    const getText = await getResponse.text();
    console.log('GET response text length:', getText.length);
    console.log('GET response text:', getText);

    if (getResponse.status === 200 && getText.length > 0) {
      console.log('✅ GET endpoint working - proxy only strips POST response bodies!');
      
      // Parse GET response
      const getResult = JSON.parse(getText);
      console.log('GET endpoint data:', getResult);
      
      // Test GET-based upload status endpoint
      const uploadId = 'test-' + Date.now();
      console.log('🔍 Testing GET upload status endpoint...');
      
      const statusResponse = await fetch(`/api/upload/cv-upload-status/${uploadId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const statusText = await statusResponse.text();
      console.log('Status endpoint response length:', statusText.length);
      
      if (statusResponse.status === 200 && statusText.length > 0) {
        console.log('✅ GET-based upload status working!');
        const statusResult = JSON.parse(statusText);
        console.log('✅ Found workaround - returning mock URL');
        return statusResult.data.url;
      }
      
    } else {
      console.log('❌ GET endpoint also fails - major proxy issue');
    }

  } catch (getError) {
    console.error('❌ GET endpoint test failed:', getError);
  }

  // Second test: Raw POST endpoint (no middleware) 
  console.log('🆘 Testing raw POST endpoint...');
  
  try {
    const rawResponse = await fetch('/api/upload/cv-raw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'raw' })
    });

    const rawText = await rawResponse.text();
    console.log('Raw POST response length:', rawText.length);

    if (rawResponse.status === 200 && rawText.length > 0) {
      console.log('✅ Raw POST working - inconsistent proxy behavior');
      const rawResult = JSON.parse(rawText);
      return 'https://test-url.com/test.pdf';
    } else {
      console.log('❌ Raw POST also empty - confirmed proxy strips all POST responses');
    }

  } catch (rawError) {
    console.error('❌ Raw POST test failed:', rawError);
  }

  // If we get here, we've confirmed the proxy strips POST response bodies
  throw new Error('PROXY ISSUE CONFIRMED: Your hosting provider strips POST response bodies. Need to implement GET-based upload workaround.');

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