// Extension to add isAvailable method to AIService
import { aiService } from './aiService';

// Add the isAvailable method to the existing service
(aiService as any).isAvailable = async function(): Promise<boolean> {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not configured');
      return false;
    }

    // Test with a simple prompt
    const result = await this.model.generateContent('Hello');
    const response = await result.response;
    return !!response.text();
  } catch (error) {
    console.error('AI service availability check failed:', error);
    return false;
  }
};

export { aiService };