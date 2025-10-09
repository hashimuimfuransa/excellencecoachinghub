/**
 * Cloudinary URL Processor for Document Viewing
 * 
 * This utility handles Cloudinary URLs to ensure they work properly
 * with document viewers like PDFTron WebViewer.
 */

export interface CloudinaryUrlInfo {
  isCloudinary: boolean;
  originalUrl: string;
  processedUrl: string;
  publicId: string;
  format: string;
  needsProcessing: boolean;
}

/**
 * Check if a URL is a Cloudinary URL
 */
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

/**
 * Extract Cloudinary public ID from URL
 */
export const extractCloudinaryPublicId = (url: string): string => {
  if (!isCloudinaryUrl(url)) return '';
  
  try {
    // Extract public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.format
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
      // Get the part after 'upload' which should be the public_id.format
      const publicIdWithFormat = urlParts[urlParts.length - 1];
      return publicIdWithFormat;
    }
    
    return '';
  } catch (error) {
    console.warn('Failed to extract Cloudinary public ID:', error);
    return '';
  }
};

/**
 * Extract file format from Cloudinary URL
 */
export const extractCloudinaryFormat = (url: string): string => {
  if (!isCloudinaryUrl(url)) return '';
  
  try {
    const publicId = extractCloudinaryPublicId(url);
    const format = publicId.split('.').pop()?.toLowerCase() || '';
    return format;
  } catch (error) {
    console.warn('Failed to extract Cloudinary format:', error);
    return '';
  }
};

/**
 * Process Cloudinary URL for document viewing
 */
export const processCloudinaryUrl = (url: string): CloudinaryUrlInfo => {
  const isCloudinary = isCloudinaryUrl(url);
  
  if (!isCloudinary) {
    return {
      isCloudinary: false,
      originalUrl: url,
      processedUrl: url,
      publicId: '',
      format: '',
      needsProcessing: false
    };
  }
  
  const publicId = extractCloudinaryPublicId(url);
  const format = extractCloudinaryFormat(url);
  
  // For document viewing, we need to ensure the URL is publicly accessible
  // and has the right format for the viewer
  let processedUrl = url;
  
  // Fix 401 Unauthorized errors by ensuring public access
  // Remove any authentication parameters and ensure public access
  processedUrl = processedUrl.replace(/\/v\d+\//, '/v1/');
  
  // Add flags for better document viewing and public access
  if (format && ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'rtf'].includes(format)) {
    // Add flags for document viewing
    const flags = [
      'fl_attachment', // Ensure proper content disposition
      'q_auto', // Auto quality
      'f_auto' // Auto format
    ].join(',');
    
    // Insert flags after 'upload' and before public_id
    const urlParts = processedUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex !== -1) {
      // Remove any existing transformation parameters
      const cleanParts = urlParts.slice(0, uploadIndex + 1);
      const publicIdPart = urlParts[urlParts.length - 1];
      
      // Rebuild URL with proper transformations
      processedUrl = [...cleanParts, flags, publicIdPart].join('/');
    }
  }
  
  // Ensure the URL is publicly accessible by removing any auth parameters
  processedUrl = processedUrl.replace(/[?&]auth_token=[^&]*/g, '');
  processedUrl = processedUrl.replace(/[?&]expires=[^&]*/g, '');
  processedUrl = processedUrl.replace(/[?&]signature=[^&]*/g, '');
  
  return {
    isCloudinary: true,
    originalUrl: url,
    processedUrl,
    publicId,
    format,
    needsProcessing: true
  };
};

/**
 * Get the best URL for document viewing
 */
export const getDocumentViewingUrl = (url: string): string => {
  const urlInfo = processCloudinaryUrl(url);
  
  if (urlInfo.isCloudinary) {
    console.log('Processing Cloudinary URL for document viewing:', {
      original: urlInfo.originalUrl,
      processed: urlInfo.processedUrl,
      format: urlInfo.format,
      isPublic: isCloudinaryUrlPublic(url)
    });
    
    // For Cloudinary documents, always use proxy to avoid 401 errors
    if (shouldUseProxy(url)) {
      const proxyUrl = getProxyUrl(urlInfo.processedUrl);
      console.log('Using proxy URL for Cloudinary document to avoid 401 errors:', proxyUrl);
      return proxyUrl;
    }
    
    // Fallback: try to create a public URL
    if (!isCloudinaryUrlPublic(url)) {
      console.log('Cloudinary URL is not publicly accessible, creating public URL');
      const publicUrl = createPublicCloudinaryUrl(url);
      return publicUrl;
    }
    
    return urlInfo.processedUrl;
  }
  
  return url;
};

/**
 * Check if a Cloudinary URL needs special handling for document viewing
 */
export const needsCloudinarySpecialHandling = (url: string): boolean => {
  if (!isCloudinaryUrl(url)) return false;
  
  const format = extractCloudinaryFormat(url);
  const documentFormats = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'rtf'];
  
  return documentFormats.includes(format);
};

/**
 * Get Cloudinary URL with proper headers for document viewing
 */
export const getCloudinaryDocumentUrl = (url: string): string => {
  const urlInfo = processCloudinaryUrl(url);
  
  if (!urlInfo.isCloudinary) return url;
  
  // For Cloudinary documents, we might need to use a proxy or special handling
  // This is a placeholder for future implementation
  return urlInfo.processedUrl;
};

/**
 * Check if we need to use a proxy for Cloudinary documents
 */
export const shouldUseProxy = (url: string): boolean => {
  if (!isCloudinaryUrl(url)) return false;
  
  // Use proxy for documents that might have CORS issues or authentication problems
  const format = extractCloudinaryFormat(url);
  const documentFormats = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'];
  
  // Always use proxy for Cloudinary documents to avoid 401 errors
  return documentFormats.includes(format);
};

/**
 * Get proxy URL for Cloudinary documents
 */
export const getProxyUrl = (url: string): string => {
  if (!shouldUseProxy(url)) return url;
  
  // Use backend proxy endpoint for Cloudinary documents
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return `${apiUrl}/api/documents/proxy?url=${encodeURIComponent(url)}`;
};

/**
 * Create a public Cloudinary URL that should work without authentication
 */
export const createPublicCloudinaryUrl = (url: string): string => {
  if (!isCloudinaryUrl(url)) return url;
  
  try {
    // Extract cloud name and public ID from the URL
    const urlParts = url.split('/');
    const cloudNameIndex = urlParts.findIndex(part => part.includes('cloudinary.com'));
    
    if (cloudNameIndex !== -1 && cloudNameIndex < urlParts.length - 1) {
      const cloudName = urlParts[cloudNameIndex + 1];
      const publicId = extractCloudinaryPublicId(url);
      const format = extractCloudinaryFormat(url);
      
      if (cloudName && publicId) {
        // Create a clean public URL
        const publicUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1/fl_attachment,q_auto,f_auto/${publicId}`;
        console.log('Created public Cloudinary URL:', publicUrl);
        return publicUrl;
      }
    }
    
    return url;
  } catch (error) {
    console.warn('Failed to create public Cloudinary URL:', error);
    return url;
  }
};

/**
 * Check if a Cloudinary URL is publicly accessible
 */
export const isCloudinaryUrlPublic = (url: string): boolean => {
  if (!isCloudinaryUrl(url)) return true;
  
  // Check if URL has authentication parameters
  const hasAuth = url.includes('auth_token') || url.includes('signature') || url.includes('expires');
  return !hasAuth;
};
