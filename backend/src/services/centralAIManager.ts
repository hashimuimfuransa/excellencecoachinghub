import { EventEmitter } from 'events';
import axios from 'axios';

// API Key Configuration for fallback support
export interface APIKeyConfig {
  key: string;
  name: string;
  dailyLimit: number;
  used: number;
  lastReset: string;
  status: 'active' | 'quota_exceeded' | 'failed' | 'blocked';
  lastError?: string;
}

// AI Model Configuration with version management
export interface AIModelConfig {
  name: string;
  version: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  safetySettings?: any[];
  description?: string;
}

export interface AIGenerationOptions {
  retries?: number;
  timeout?: number;
  temperature?: number;
  maxTokens?: number;
  priority?: 'low' | 'normal' | 'high';
}

export class CentralAIManager extends EventEmitter {
  private static instance: CentralAIManager;
  private currentConfig: AIModelConfig;
  private isInitialized: boolean = false;
  private lastVersionCheck: string = '';
  private readonly VERSION_CHECK_INTERVAL_HOURS = 24;
  
  // API Key management for fallback support
  private apiKeys: APIKeyConfig[] = [];
  private currentAPIKeyIndex: number = 0;
  
  private requestCount: number = 0;
  private dailyRequestLimit: number = 300; // Reduced due to quota issues
  private minuteRequestCount: number = 0;
  private lastMinuteReset: number = Date.now();
  private readonly MINUTE_REQUEST_LIMIT = 2; // Reduced to prevent quota issues
  private readonly MIN_REQUEST_INTERVAL = 30000; // Increased to 30 seconds to prevent quota issues
  private lastRequestTime: number = 0;
  private requestQueue: Array<{
    resolve: (value: string) => void;
    reject: (error: Error) => void;
    prompt: string;
    options: AIGenerationOptions;
  }> = [];

  // Available model configurations (newest first for easy migration)
  // TO ADD NEW VERSIONS: Add new configurations at the TOP of this array
  private static readonly MODEL_CONFIGS: AIModelConfig[] = [
    // VERIFIED WORKING MODELS (ordered by preference - fastest first for quota conservation)
    {
      name: 'gemini-2.5-flash',
      version: '2.5-flash',
      maxTokens: 4096, // Reduced for faster processing
      temperature: 0.3, // Lower temperature for faster, more consistent responses
      topP: 0.8,
      topK: 40,
      description: 'Gemini 2.5 Flash - Latest fast model with best performance (v1beta API)',
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ]
    },
    {
      name: 'gemini-2.0-flash',
      version: '2.0-flash',
      maxTokens: 4096, // Reduced for faster processing
      temperature: 0.3, // Lower temperature for faster, more consistent responses
      topP: 0.8,
      topK: 40,
      description: 'Gemini 2.0 Flash - Fast processing, good accuracy (v1beta API)',
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ]
    }
  ];

  private constructor() {
    super();
    
    // Initialize API keys with fallback support
    this.initializeAPIKeys();
    
    // Use the first available API key
    const currentAPIKey = this.getCurrentAPIKey();
    this.currentConfig = this.getBestAvailableModel();
    this.isInitialized = true;
    
    console.log(`🤖 Central AI Manager initialized with ${this.apiKeys.length} API key(s)`);
    console.log(`🔑 Active API Key: ${currentAPIKey?.name || 'Unknown'}`);
    this.emit('initialized', { 
      model: this.currentConfig.name,
      apiKeyName: currentAPIKey?.name || 'Unknown',
      totalAPIKeys: this.apiKeys.length
    });
  }

  public static getInstance(): CentralAIManager {
    if (!CentralAIManager.instance) {
      CentralAIManager.instance = new CentralAIManager();
    }
    return CentralAIManager.instance;
  }

  /**
   * Initialize API keys from environment variables and fallback keys
   */
  private initializeAPIKeys(): void {
    const today = new Date().toISOString().split('T')[0];
    
    // Primary API key from environment
    const primaryKey = process.env.GEMINI_API_KEY;
    if (primaryKey && primaryKey.trim()) {
      this.apiKeys.push({
        key: primaryKey.trim(),
        name: 'Primary (ENV)',
        dailyLimit: 300,
        used: 0,
        lastReset: today,
        status: 'active'
      });
    }

    // Fallback API keys
    const fallbackKeys = [
      'AIzaSyBrQhEtPsUQHlxWR1GdkIPRpHJlBlw58f4',
      'AIzaSyDZw17oFP3WV-pbw_i_txgLX9qEQN7VUBo'
    ];

    fallbackKeys.forEach((key, index) => {
      if (key && key.trim()) {
        this.apiKeys.push({
          key: key.trim(),
          name: `Fallback-${index + 1}`,
          dailyLimit: 300,
          used: 0,
          lastReset: today,
          status: 'active'
        });
      }
    });

    // Add a placeholder for user to add their own key
    console.log('ℹ️ To add your own API key, set GEMINI_API_KEY in your environment variables');
    
    if (this.apiKeys.length === 0) {
      console.warn('⚠️ No valid Gemini API keys found. AI features will use fallback questions only.');
    } else {
      console.log(`✅ Initialized ${this.apiKeys.length} API keys for fallback support`);
    }
  }

  /**
   * Get the current active API key
   */
  private getCurrentAPIKey(): APIKeyConfig {
    // Reset daily usage if needed
    this.resetDailyUsageIfNeeded();
    
    // Find the first available API key
    for (let i = 0; i < this.apiKeys.length; i++) {
      const keyConfig = this.apiKeys[i];
      if (keyConfig.status === 'active' && keyConfig.used < keyConfig.dailyLimit) {
        this.currentAPIKeyIndex = i;
        return keyConfig;
      }
    }
    
    // If all keys are exhausted, return the first one (will handle quota errors)
    this.currentAPIKeyIndex = 0;
    return this.apiKeys[0] || { key: '', name: 'No Key', dailyLimit: 0, used: 0, lastReset: '', status: 'failed' as const };
  }

  /**
   * Switch to next available API key
   */
  private switchToNextAPIKey(): boolean {
    const originalIndex = this.currentAPIKeyIndex;
    
    // Try each API key starting from the next one
    for (let attempts = 0; attempts < this.apiKeys.length; attempts++) {
      this.currentAPIKeyIndex = (this.currentAPIKeyIndex + 1) % this.apiKeys.length;
      const keyConfig = this.apiKeys[this.currentAPIKeyIndex];
      
      if (keyConfig.status === 'active' && keyConfig.used < keyConfig.dailyLimit) {
        // Switch to the new API key
        console.log(`🔄 Switched to API key: ${keyConfig.name}`);
        this.emit('apiKeySwitched', {
          from: this.apiKeys[originalIndex].name,
          to: keyConfig.name,
          reason: 'fallback'
        });
        
        return true;
      }
    }
    
    console.warn('⚠️ No available API keys found for fallback');
    return false;
  }

  /**
   * Mark current API key as failed and switch to next
   */
  private markCurrentAPIKeyAsFailed(error: string): boolean {
    const currentKey = this.apiKeys[this.currentAPIKeyIndex];
    
    if (error.includes('quota') || error.includes('429')) {
      currentKey.status = 'quota_exceeded';
      currentKey.lastError = `Quota exceeded: ${error}`;
      console.log(`🚫 API key ${currentKey.name} marked as quota exceeded`);
    } else if (error.includes('403') || error.includes('401')) {
      currentKey.status = 'blocked';
      currentKey.lastError = `Access denied: ${error}`;
      console.log(`🚫 API key ${currentKey.name} marked as blocked`);
    } else {
      currentKey.status = 'failed';
      currentKey.lastError = error;
      console.log(`❌ API key ${currentKey.name} marked as failed`);
    }
    
    return this.switchToNextAPIKey();
  }

  /**
   * Reset daily usage counters if needed
   */
  private resetDailyUsageIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.apiKeys.forEach(keyConfig => {
      if (keyConfig.lastReset !== today) {
        keyConfig.used = 0;
        keyConfig.lastReset = today;
        // Reset status if it was quota exceeded (give it another chance)
        if (keyConfig.status === 'quota_exceeded') {
          keyConfig.status = 'active';
          keyConfig.lastError = undefined;
        }
      }
    });
  }

  /**
   * Increment usage counter for current API key
   */
  private incrementCurrentAPIKeyUsage(): void {
    const currentKey = this.apiKeys[this.currentAPIKeyIndex];
    currentKey.used++;
    
    // Check if approaching limit
    if (currentKey.used >= currentKey.dailyLimit * 0.9) {
      console.warn(`⚠️ API key ${currentKey.name} approaching daily limit: ${currentKey.used}/${currentKey.dailyLimit}`);
    }
  }

  private getBestAvailableModel(): AIModelConfig {
    // Try each model configuration starting with the newest
    for (const config of CentralAIManager.MODEL_CONFIGS) {
      try {
        console.log(`🤖 Selected AI model: ${config.name} (${config.version}) - ${config.description}`);
        return config;
      } catch (error) {
        console.warn(`Model ${config.name} not available, trying next...`);
        continue;
      }
    }
    
    // Fallback to the last config if all fail
    return CentralAIManager.MODEL_CONFIGS[CentralAIManager.MODEL_CONFIGS.length - 1] || {
      name: 'gemini-2.0-flash',
      version: '2.0-flash',
      maxTokens: 8192,
      temperature: 0.4,
      topP: 0.8,
      topK: 40,
      description: 'Fallback model'
    };
  }

  private getCurrentAPIKeyString(): string {
    const currentKey = this.apiKeys[this.currentAPIKeyIndex];
    return currentKey ? currentKey.key : '';
  }

  private getAPIUrl(): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.currentConfig.name}:generateContent`;
  }

  private async makeHTTPRequest(prompt: string, options: AIGenerationOptions = {}): Promise<string> {
    const apiKey = this.getCurrentAPIKeyString();
    const url = this.getAPIUrl();
    
    // DEBUG: Log the exact model name being used
    console.log(`🔍 DEBUG - Model name: "${this.currentConfig.name}"`);
    console.log(`🔍 DEBUG - API URL: ${url}`);
    
    const requestBody: any = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: options.temperature || this.currentConfig.temperature || 0.4,
        topP: this.currentConfig.topP || 0.8,
        topK: this.currentConfig.topK || 40,
        maxOutputTokens: options.maxTokens || this.currentConfig.maxTokens || 8192,
      }
    };

    if (this.currentConfig.safetySettings) {
      requestBody.safetySettings = this.currentConfig.safetySettings;
    }

    try {
      // DEBUG: Log the exact URL being sent
      const fullUrl = `${url}?key=${apiKey}`;
      console.log(`🔍 DEBUG - Full API URL: ${fullUrl}`);
      console.log(`🔍 DEBUG - Request body model: ${JSON.stringify(requestBody).substring(0, 200)}...`);
      
      const response = await axios.post(fullUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000 // Increased timeout to 60 seconds
      });

      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const candidate = response.data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
          return candidate.content.parts[0].text || '';
        }
      }

      throw new Error('Invalid response format from Gemini API');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.error;
        const errorCode = errorData?.code;
        const errorMessage = errorData?.message || error.message;
        
        console.log(`🔍 DEBUG - Error response: ${JSON.stringify(error.response?.data)}`);
        
        // Handle specific error types
        if (errorCode === 429) {
          console.warn('⚠️ Gemini API quota exceeded. Consider upgrading or waiting.');
          throw new Error('QUOTA_EXCEEDED: Gemini API quota exceeded. Please try again later or contact support.');
        } else if (errorCode === 400) {
          console.warn('⚠️ Bad request to Gemini API. Check prompt content.');
          throw new Error('BAD_REQUEST: Invalid request to Gemini API. Please check your input.');
        } else if (errorCode === 403) {
          console.warn('⚠️ Gemini API access forbidden. Check API key permissions.');
          throw new Error('FORBIDDEN: Gemini API access denied. Please check your API key.');
        } else if (errorCode === 500) {
          console.warn('⚠️ Gemini API server error. Retrying may help.');
          throw new Error('SERVER_ERROR: Gemini API server error. Please try again.');
        }
        
        throw new Error(`Gemini API error (${errorCode}): ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Main content generation method with enhanced features and rate limiting
   */
  public async generateContent(
    prompt: string, 
    options: AIGenerationOptions = {}
  ): Promise<string> {
    const {
      retries = 3,
      timeout = 60000, // Increased timeout to 60 seconds
      priority = 'normal'
    } = options;

    // Return queued promise for rate limiting
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, prompt, options });
      this.processQueue();
    });
  }

  /**
   * Process queued requests with proper rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) return;

    // Check daily limit
    if (this.requestCount >= this.dailyRequestLimit) {
      const request = this.requestQueue.shift();
      if (request) {
        request.reject(new Error('Daily AI request limit exceeded'));
      }
      return;
    }

    // Check minute limit
    const now = Date.now();
    if (now - this.lastMinuteReset > 60000) {
      this.minuteRequestCount = 0;
      this.lastMinuteReset = now;
    }

    if (this.minuteRequestCount >= this.MINUTE_REQUEST_LIMIT) {
      console.log(`⏳ Rate limit: Waiting for next minute (${this.minuteRequestCount}/${this.MINUTE_REQUEST_LIMIT} requests used)`);
      setTimeout(() => this.processQueue(), 65000); // Wait just over a minute
      return;
    }

    // Ensure minimum interval between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`⏳ Throttling: Waiting ${Math.round(waitTime/1000)}s before next request`);
      setTimeout(() => this.processQueue(), waitTime);
      return;
    }

    const request = this.requestQueue.shift();
    if (!request) return;

    try {
      const result = await this.executeGeneration(request.prompt, request.options);
      this.lastRequestTime = Date.now();
      this.minuteRequestCount++;
      request.resolve(result);
    } catch (error) {
      request.reject(error as Error);
    }

    // Process next request with a small delay
    setTimeout(() => this.processQueue(), 1000);
  }

  /**
   * Execute the actual AI generation with retries
   */
  private async executeGeneration(
    prompt: string,
    options: AIGenerationOptions = {}
  ): Promise<string> {
    const {
      retries = 3,
      timeout = 30000,
      temperature,
      maxTokens,
      priority = 'normal'
    } = options;

    // Perform version check if needed
    await this.checkForNewerVersionsIfNeeded();

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🤖 AI Generation attempt ${attempt}/${retries} using ${this.currentConfig.name} (Priority: ${priority})`);
        
        // Custom configuration is handled in makeHTTPRequest method

        const result = await Promise.race([
          this.makeHTTPRequest(prompt, options),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI request timeout')), timeout)
          )
        ]) as any;

        const text = result;
        
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from AI model');
        }
        
        // Increment usage counters
        this.requestCount++;
        this.incrementCurrentAPIKeyUsage();
        
        const currentAPIKey = this.apiKeys[this.currentAPIKeyIndex];
        console.log(`✅ AI Generation successful (${text.length} characters)`);
        console.log(`📊 Usage: Global ${this.requestCount} | ${currentAPIKey.name}: ${currentAPIKey.used}/${currentAPIKey.dailyLimit}`);
        
        this.emit('contentGenerated', { 
          model: this.currentConfig.name, 
          apiKey: currentAPIKey.name,
          length: text.length,
          attempt,
          requestCount: this.requestCount,
          apiKeyUsage: currentAPIKey.used
        });
        
        return text;
        
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ AI Generation attempt ${attempt} failed:`, error.message);
        
        // Emit error event for monitoring
        this.emit('generationError', { 
          attempt, 
          error: error.message, 
          model: this.currentConfig.name 
        });
        
        // Check for specific error types that might require API key or model fallback
        if (error.message.includes('quota') || error.message.includes('429') || 
            error.message.includes('403') || error.message.includes('401')) {
          
          console.log(`🚫 API key issue detected: ${error.message}`);
          
          // Try to switch to a different API key first
          const apiKeySwitched = this.markCurrentAPIKeyAsFailed(error.message);
          
          if (apiKeySwitched) {
            console.log('🔄 Switched to fallback API key, retrying immediately...');
            continue; // Retry immediately with new API key
          } else {
            console.log('⚠️ No fallback API keys available, trying model fallback...');
            // If no API keys available, try model fallback
            if (attempt < retries) {
              const quotaDelay = Math.min(30000 * Math.pow(2, attempt - 1), 300000); // 30s to 5min
              console.log(`⏳ Quota delay: Waiting ${Math.round(quotaDelay/1000)}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, quotaDelay));
            }
            await this.tryFallbackModel();
          }
        } else if (error.message.includes('404') || error.message.includes('not found') || error.message.includes('is not found')) {
          console.log(`❌ Model ${this.currentConfig.name} not found, trying fallback model`);
          await this.tryFallbackModel();
        } else if (error.message.includes('400') || error.message.includes('invalid')) {
          console.log('⚠️ Invalid request, adjusting parameters');
          await this.adjustModelParameters();
        } else {
          // Regular retry delay for other errors (exponential backoff)
          if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }
    
    const errorMessage = `AI generation failed after ${retries} attempts. Last error: ${lastError?.message}`;
    this.emit('generationFailed', { 
      retries, 
      lastError: lastError?.message, 
      model: this.currentConfig.name 
    });
    throw new Error(errorMessage);
  }

  private async tryFallbackModel(): Promise<void> {
    const currentIndex = CentralAIManager.MODEL_CONFIGS.findIndex(
      config => config.name === this.currentConfig.name
    );
    
    if (currentIndex < CentralAIManager.MODEL_CONFIGS.length - 1) {
      const previousModel = this.currentConfig.name;
      this.currentConfig = CentralAIManager.MODEL_CONFIGS[currentIndex + 1];
      console.log(`🔄 Falling back to model: ${this.currentConfig.name}`);
      
      this.emit('modelFallback', { 
        from: previousModel, 
        to: this.currentConfig.name 
      });
    } else {
      console.warn('⚠️ No fallback models available');
    }
  }

  private async adjustModelParameters(): Promise<void> {
    // Reduce complexity for problematic requests
    if (this.currentConfig.temperature && this.currentConfig.temperature > 0.2) {
      this.currentConfig.temperature = Math.max(0.2, this.currentConfig.temperature - 0.1);
    }
    if (this.currentConfig.maxTokens && this.currentConfig.maxTokens > 2048) {
      this.currentConfig.maxTokens = Math.max(2048, this.currentConfig.maxTokens - 1024);
    }
    
      console.log(`🔧 Adjusted model parameters: temp=${this.currentConfig.temperature}, maxTokens=${this.currentConfig.maxTokens}`);
    
    this.emit('parametersAdjusted', { 
      temperature: this.currentConfig.temperature,
      maxTokens: this.currentConfig.maxTokens
    });
  }

  /**
   * Test model availability
   */
  public async testModelAvailability(): Promise<boolean> {
    try {
      const testPrompt = "Test prompt for model availability check.";
      await this.generateContent(testPrompt, { retries: 1, timeout: 10000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check for newer model versions periodically
   */
  private async checkForNewerVersionsIfNeeded(): Promise<void> {
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if we need to check for updates (daily)
    if (this.lastVersionCheck === now) {
      return; // Already checked today
    }
    
    try {
      await this.checkForNewerVersions();
      this.lastVersionCheck = now;
    } catch (error) {
      console.warn('⚠️ Version check failed:', error);
    }
  }

  /**
   * Check for newer model versions and migrate if available
   */
  public async checkForNewerVersions(): Promise<boolean> {
    console.log('🔍 Checking for newer AI model versions...');
    
    // Get the index of the current model
    const currentIndex = CentralAIManager.MODEL_CONFIGS.findIndex(
      config => config.name === this.currentConfig.name
    );
    
    // Check if there are newer models available (lower index = newer)
    for (let i = 0; i < currentIndex; i++) {
      const newerConfig = CentralAIManager.MODEL_CONFIGS[i];
      
      try {
        console.log(`🧪 Testing newer model: ${newerConfig.name}`);
        
        // Temporarily switch to the newer model for testing
        const previousConfig = this.currentConfig;
        this.currentConfig = newerConfig;
        
        // Test the newer model
        const isAvailable = await this.testModelAvailability();
        
        if (isAvailable) {
          console.log(`✅ Successfully migrated to newer model: ${newerConfig.name} (${newerConfig.version})`);
          console.log(`📊 Model upgrade: ${previousConfig.name} → ${newerConfig.name}`);
          
          this.emit('modelUpgraded', { 
            from: previousConfig.name, 
            to: newerConfig.name 
          });
          
          return true;
        } else {
          // Revert to previous config if test fails
          this.currentConfig = previousConfig;
          console.log(`❌ Newer model ${newerConfig.name} not available, staying with ${previousConfig.name}`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Error testing model ${newerConfig.name}:`, error);
        // Continue checking other models
      }
    }
    
    console.log(`ℹ️ No newer models available, staying with ${this.currentConfig.name}`);
    return false;
  }

  /**
   * Force migration to a specific model version
   */
  public async migrateToModel(modelName: string): Promise<boolean> {
    const targetConfig = CentralAIManager.MODEL_CONFIGS.find(
      config => config.name === modelName
    );
    
    if (!targetConfig) {
      console.error(`❌ Model ${modelName} not found in available configurations`);
      return false;
    }
    
    const previousConfig = this.currentConfig;
    
    try {
      console.log(`🔄 Attempting migration to ${modelName}...`);
      this.currentConfig = targetConfig;
      
      // Test the target model
      const isAvailable = await this.testModelAvailability();
      
      if (isAvailable) {
        console.log(`✅ Successfully migrated to ${modelName}`);
        this.emit('modelMigrated', { 
          from: previousConfig.name, 
          to: modelName 
        });
        return true;
      } else {
        // Revert on failure
        this.currentConfig = previousConfig;
        console.error(`❌ Migration to ${modelName} failed, reverted to ${previousConfig.name}`);
        return false;
      }
      
    } catch (error) {
      // Revert on error
      this.currentConfig = previousConfig;
      console.error(`❌ Migration to ${modelName} failed with error:`, error);
      return false;
    }
  }

  /**
   * Get current model information
   */
  public getCurrentModel(): AIModelConfig {
    return { ...this.currentConfig };
  }

  /**
   * Get model usage statistics
   */
  public getModelStats(): {
    currentModel: AIModelConfig;
    availableModels: AIModelConfig[];
    isLatest: boolean;
    requestCount: number;
    dailyLimit: number;
  } {
    const currentIndex = CentralAIManager.MODEL_CONFIGS.findIndex(
      config => config.name === this.currentConfig.name
    );
    
    return {
      currentModel: { ...this.currentConfig },
      availableModels: [...CentralAIManager.MODEL_CONFIGS],
      isLatest: currentIndex === 0,
      requestCount: this.requestCount,
      dailyLimit: this.dailyRequestLimit
    };
  }

  /**
   * Get API key statistics and status
   */
  public getAPIKeyStats(): {
    currentAPIKey: string;
    totalAPIKeys: number;
    activeKeys: number;
    quotaExceededKeys: number;
    failedKeys: number;
    keys: Array<{
      name: string;
      status: string;
      used: number;
      dailyLimit: number;
      usagePercentage: number;
      lastError?: string;
    }>;
  } {
    const activeKeys = this.apiKeys.filter(k => k.status === 'active').length;
    const quotaExceededKeys = this.apiKeys.filter(k => k.status === 'quota_exceeded').length;
    const failedKeys = this.apiKeys.filter(k => k.status === 'failed' || k.status === 'blocked').length;
    
    return {
      currentAPIKey: this.apiKeys[this.currentAPIKeyIndex]?.name || 'Unknown',
      totalAPIKeys: this.apiKeys.length,
      activeKeys,
      quotaExceededKeys,
      failedKeys,
      keys: this.apiKeys.map(key => ({
        name: key.name,
        status: key.status,
        used: key.used,
        dailyLimit: key.dailyLimit,
        usagePercentage: Math.round((key.used / key.dailyLimit) * 100),
        lastError: key.lastError
      }))
    };
  }

  /**
   * Manually switch to a specific API key by name
   */
  public switchToAPIKey(keyName: string): boolean {
    const targetIndex = this.apiKeys.findIndex(key => key.name === keyName);
    
    if (targetIndex === -1) {
      console.error(`❌ API key '${keyName}' not found`);
      return false;
    }
    
    const targetKey = this.apiKeys[targetIndex];
    
    if (targetKey.status !== 'active') {
      console.warn(`⚠️ API key '${keyName}' is not active (status: ${targetKey.status})`);
      return false;
    }
    
    if (targetKey.used >= targetKey.dailyLimit) {
      console.warn(`⚠️ API key '${keyName}' has exceeded daily limit`);
      return false;
    }
    
    const previousKey = this.apiKeys[this.currentAPIKeyIndex];
    this.currentAPIKeyIndex = targetIndex;
    
    console.log(`🔄 Manually switched to API key: ${keyName}`);
    this.emit('apiKeySwitched', {
      from: previousKey.name,
      to: keyName,
      reason: 'manual'
    });
    
    return true;
  }

  /**
   * Reset API key status (useful for recovering from temporary issues)
   */
  public resetAPIKeyStatus(keyName: string): boolean {
    const keyIndex = this.apiKeys.findIndex(key => key.name === keyName);
    
    if (keyIndex === -1) {
      console.error(`❌ API key '${keyName}' not found`);
      return false;
    }
    
    const key = this.apiKeys[keyIndex];
    const previousStatus = key.status;
    
    key.status = 'active';
    key.lastError = undefined;
    
    console.log(`🔄 Reset API key '${keyName}' status: ${previousStatus} → active`);
    this.emit('apiKeyStatusReset', {
      keyName,
      previousStatus,
      newStatus: 'active'
    });
    
    return true;
  }

  /**
   * Add a new API key for fallback
   */
  public addAPIKey(apiKey: string, name: string, dailyLimit: number = 300): boolean {
    if (!apiKey || !apiKey.trim()) {
      console.error('❌ Invalid API key provided');
      return false;
    }
    
    // Check if key already exists
    const existingKey = this.apiKeys.find(key => key.key === apiKey.trim());
    if (existingKey) {
      console.warn(`⚠️ API key already exists: ${existingKey.name}`);
      return false;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    this.apiKeys.push({
      key: apiKey.trim(),
      name: name || `Custom-${this.apiKeys.length + 1}`,
      dailyLimit,
      used: 0,
      lastReset: today,
      status: 'active'
    });
    
    console.log(`✅ Added new API key: ${name} (Limit: ${dailyLimit}/day)`);
    this.emit('apiKeyAdded', {
      name,
      dailyLimit,
      totalKeys: this.apiKeys.length
    });
    
    return true;
  }

  /**
   * Remove an API key (except if it's the only one active)
   */
  public removeAPIKey(keyName: string): boolean {
    const keyIndex = this.apiKeys.findIndex(key => key.name === keyName);
    
    if (keyIndex === -1) {
      console.error(`❌ API key '${keyName}' not found`);
      return false;
    }
    
    if (this.apiKeys.length === 1) {
      console.error(`❌ Cannot remove the last API key`);
      return false;
    }
    
    // If removing the current key, switch to another one first
    if (keyIndex === this.currentAPIKeyIndex) {
      const switched = this.switchToNextAPIKey();
      if (!switched) {
        console.error(`❌ Cannot remove current API key: no fallback available`);
        return false;
      }
      // Adjust index after removal
      if (this.currentAPIKeyIndex > keyIndex) {
        this.currentAPIKeyIndex--;
      }
    } else if (this.currentAPIKeyIndex > keyIndex) {
      // Adjust current index if it's after the removed key
      this.currentAPIKeyIndex--;
    }
    
    const removedKey = this.apiKeys.splice(keyIndex, 1)[0];
    
    console.log(`🗑️ Removed API key: ${removedKey.name}`);
    this.emit('apiKeyRemoved', {
      name: removedKey.name,
      totalKeys: this.apiKeys.length
    });
    
    return true;
  }

  /**
   * Reset daily request count (typically called at midnight)
   */
  public resetDailyRequestCount(): void {
    this.requestCount = 0;
    // Also reset API key usage counters
    this.resetDailyUsageIfNeeded();
    console.log('🔄 Daily AI request count and API key usage reset');
    this.emit('requestCountReset');
  }

  /**
   * Update daily request limit
   */
  public setDailyRequestLimit(limit: number): void {
    this.dailyRequestLimit = Math.max(100, limit); // Minimum 100 requests
    console.log(`⚙️ Daily AI request limit updated to: ${this.dailyRequestLimit}`);
    this.emit('requestLimitUpdated', { limit: this.dailyRequestLimit });
  }

  /**
   * Check if AI service is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      return await this.testModelAvailability();
    } catch (error) {
      return false;
    }
  }

  /**
   * Process large datasets in chunks to avoid rate limiting
   */
  public async processInChunks<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
      chunkSize?: number;
      delayBetweenChunks?: number;
      maxConcurrent?: number;
    } = {}
  ): Promise<R[]> {
    const {
      chunkSize = 5,
      delayBetweenChunks = 60000, // 1 minute between chunks
      maxConcurrent = 1
    } = options;

    const results: R[] = [];
    const chunks = [];
    
    // Split into chunks
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    console.log(`📦 Processing ${items.length} items in ${chunks.length} chunks (${chunkSize} items per chunk)`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) continue;
      
      console.log(`🔄 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} items)`);

      try {
        // Process items in chunk with limited concurrency
        const chunkResults = await this.processConcurrent(chunk, processor, maxConcurrent);
        results.push(...chunkResults);

        console.log(`✅ Chunk ${i + 1} completed successfully (${chunkResults.length} results)`);

        // Wait between chunks (except for the last one)
        if (i < chunks.length - 1) {
          console.log(`⏳ Waiting ${delayBetweenChunks/1000}s before next chunk...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
        }

      } catch (error) {
        console.error(`❌ Error processing chunk ${i + 1}:`, error);
        throw error;
      }
    }

    console.log(`🎉 All chunks processed successfully (${results.length} total results)`);
    return results;
  }

  /**
   * Process items with controlled concurrency
   */
  private async processConcurrent<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    maxConcurrent: number = 1
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = processor(item).then(result => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= maxConcurrent) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Generate content for multiple prompts with chunking and rate limiting
   */
  public async generateContentBatch(
    prompts: string[],
    options: AIGenerationOptions & {
      chunkSize?: number;
      delayBetweenChunks?: number;
    } = {}
  ): Promise<string[]> {
    const {
      chunkSize = 2, // Very conservative for free tier
      delayBetweenChunks = 120000, // 2 minutes between chunks
      ...generationOptions
    } = options;

    return this.processInChunks(
      prompts,
      async (prompt: string) => {
        return this.generateContent(prompt, generationOptions);
      },
      {
        chunkSize,
        delayBetweenChunks,
        maxConcurrent: 1 // No concurrency for AI requests
      }
    );
  }

  /**
   * Get queue status for monitoring
   */
  public getQueueStatus(): {
    queueLength: number;
    requestCount: number;
    dailyLimit: number;
    minuteRequestCount: number;
    minuteLimit: number;
    timeSinceLastRequest: number;
    minInterval: number;
  } {
    return {
      queueLength: this.requestQueue.length,
      requestCount: this.requestCount,
      dailyLimit: this.dailyRequestLimit,
      minuteRequestCount: this.minuteRequestCount,
      minuteLimit: this.MINUTE_REQUEST_LIMIT,
      timeSinceLastRequest: Date.now() - this.lastRequestTime,
      minInterval: this.MIN_REQUEST_INTERVAL
    };
  }

  /**
   * Get detailed system status
   */
  public getSystemStatus(): {
    isInitialized: boolean;
    currentModel: string;
    isLatest: boolean;
    requestCount: number;
    dailyLimit: number;
    isAvailable: boolean;
    apiKeyInfo: {
      currentAPIKey: string;
      totalAPIKeys: number;
      activeKeys: number;
      quotaExceededKeys: number;
      failedKeys: number;
    };
    queueStatus: {
      queueLength: number;
      requestCount: number;
      dailyLimit: number;
      minuteRequestCount: number;
      minuteLimit: number;
      timeSinceLastRequest: number;
      minInterval: number;
    };
  } {
    const stats = this.getModelStats();
    const apiKeyStats = this.getAPIKeyStats();
    
    return {
      isInitialized: this.isInitialized,
      currentModel: this.currentConfig.name,
      isLatest: stats.isLatest,
      requestCount: this.requestCount,
      dailyLimit: this.dailyRequestLimit,
      isAvailable: true, // We'll assume it's available if initialized
      apiKeyInfo: {
        currentAPIKey: apiKeyStats.currentAPIKey,
        totalAPIKeys: apiKeyStats.totalAPIKeys,
        activeKeys: apiKeyStats.activeKeys,
        quotaExceededKeys: apiKeyStats.quotaExceededKeys,
        failedKeys: apiKeyStats.failedKeys
      },
      queueStatus: this.getQueueStatus()
    };
  }
}

// Export singleton instance
export const centralAIManager = CentralAIManager.getInstance();
export default centralAIManager;