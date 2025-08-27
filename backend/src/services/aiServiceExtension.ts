// Extension to add isAvailable method to AIService
import { aiService } from './aiService';

// Rate limiting for availability checks
let lastAvailabilityCheck = 0;
let cachedAvailability = false;
const AVAILABILITY_CACHE_DURATION = 60000; // 1 minute

// Add the isAvailable method to the existing service
if (aiService) {
  (aiService as any).isAvailable = async function(): Promise<boolean> {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not configured');
      return false;
    }

    // Use cached result if recent
    const now = Date.now();
    if (now - lastAvailabilityCheck < AVAILABILITY_CACHE_DURATION) {
      return cachedAvailability;
    }

    // Test with a simple prompt
    const result = await this.model.generateContent('Hi');
    const response = await result.response;
    const isAvailable = !!response.text();
    
    // Cache the result
    lastAvailabilityCheck = now;
    cachedAvailability = isAvailable;
    
    return isAvailable;
  } catch (error: any) {
    console.error('AI service availability check failed:', error);
    
    // Cache negative result for shorter duration on overload
    if (error.message?.includes('overloaded') || error.message?.includes('503')) {
      lastAvailabilityCheck = Date.now();
      cachedAvailability = false;
    }
    
    return false;
  }
  };
} else {
  console.warn('aiService is not available for extension');
}

export { aiService };