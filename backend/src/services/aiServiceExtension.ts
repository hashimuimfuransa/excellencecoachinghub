// Enhanced AI Service Extension with Central AI Manager
import { aiService } from './aiService';
import { centralAIManager } from './centralAIManager';

// Rate limiting for availability checks
let lastAvailabilityCheck = 0;
let cachedAvailability = false;
const AVAILABILITY_CACHE_DURATION = 60000; // 1 minute

// Enhanced availability check using Central AI Manager
if (aiService) {
  // Override the isAvailable method with enhanced functionality
  (aiService as any).isAvailable = async function(): Promise<boolean> {
    try {
      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY) {
        console.warn('🔑 Gemini API key not configured');
        return false;
      }

      // Use cached result if recent
      const now = Date.now();
      if (now - lastAvailabilityCheck < AVAILABILITY_CACHE_DURATION) {
        return cachedAvailability;
      }

      // Use Central AI Manager's availability check
      const isAvailable = await centralAIManager.isAvailable();
      
      // Cache the result
      lastAvailabilityCheck = now;
      cachedAvailability = isAvailable;
      
      console.log(`🔍 AI Service availability check: ${isAvailable ? '✅ Available' : '❌ Unavailable'}`);
      return isAvailable;
      
    } catch (error: any) {
      console.error('❌ AI service availability check failed:', error);
      
      // Cache negative result for shorter duration on overload
      if (error.message?.includes('overloaded') || error.message?.includes('503')) {
        lastAvailabilityCheck = Date.now();
        cachedAvailability = false;
      }
      
      return false;
    }
  };

  // Add model management methods
  (aiService as any).getCurrentModel = function() {
    return centralAIManager.getCurrentModel();
  };

  (aiService as any).getModelStats = function() {
    return centralAIManager.getModelStats();
  };

  (aiService as any).migrateToModel = async function(modelName: string) {
    return await centralAIManager.migrateToModel(modelName);
  };

  (aiService as any).checkForNewerVersions = async function() {
    return await centralAIManager.checkForNewerVersions();
  };

  (aiService as any).getSystemStatus = function() {
    return centralAIManager.getSystemStatus();
  };

  console.log('🚀 AI Service extended with Central AI Manager capabilities');
} else {
  console.warn('⚠️ aiService is not available for extension');
}

export { aiService, centralAIManager };