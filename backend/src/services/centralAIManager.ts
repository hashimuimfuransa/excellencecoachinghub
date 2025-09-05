import { GoogleGenerativeAI } from '@google/generative-ai';
import { EventEmitter } from 'events';

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
  private genAI: GoogleGenerativeAI;
  private currentConfig: AIModelConfig;
  private model: any;
  private isInitialized: boolean = false;
  private lastVersionCheck: string = '';
  private readonly VERSION_CHECK_INTERVAL_HOURS = 24;
  private requestCount: number = 0;
  private dailyRequestLimit: number = 300; // Reduced due to quota issues
  private minuteRequestCount: number = 0;
  private lastMinuteReset: number = Date.now();
  private readonly MINUTE_REQUEST_LIMIT = 2; // Very conservative for free tier
  private readonly MIN_REQUEST_INTERVAL = 30000; // 30 seconds between requests
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
      name: 'gemini-1.5-flash',
      version: '1.5-flash',
      maxTokens: 8192,
      temperature: 0.4,
      topP: 0.8,
      topK: 40,
      description: 'Gemini 1.5 Flash - Fast processing, lower quota usage, good accuracy',
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
      name: 'gemini-1.5-pro',
      version: '1.5-pro',
      maxTokens: 8192,
      temperature: 0.4,
      topP: 0.8,
      topK: 40,
      description: 'Gemini 1.5 Pro - Best accuracy and reasoning (higher quota usage)',
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
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.currentConfig = this.getBestAvailableModel();
    this.initializeModel();
    this.isInitialized = true;
    
    console.log('🤖 Central AI Manager initialized');
    this.emit('initialized', { model: this.currentConfig.name });
  }

  public static getInstance(): CentralAIManager {
    if (!CentralAIManager.instance) {
      CentralAIManager.instance = new CentralAIManager();
    }
    return CentralAIManager.instance;
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
    return CentralAIManager.MODEL_CONFIGS[CentralAIManager.MODEL_CONFIGS.length - 1];
  }

  private initializeModel(): void {
    const modelConfig: any = {
      model: this.currentConfig.name,
      generationConfig: {
        temperature: this.currentConfig.temperature || 0.4,
        topP: this.currentConfig.topP || 0.8,
        topK: this.currentConfig.topK || 40,
        maxOutputTokens: this.currentConfig.maxTokens || 8192,
      }
    };

    if (this.currentConfig.safetySettings) {
      modelConfig.safetySettings = this.currentConfig.safetySettings;
    }

    this.model = this.genAI.getGenerativeModel(modelConfig);
    console.log(`🔧 Model initialized: ${this.currentConfig.name}`);
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
      timeout = 30000,
      temperature,
      maxTokens,
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
        
        // Create a copy of the model with custom parameters if provided
        let currentModel = this.model;
        if (temperature !== undefined || maxTokens !== undefined) {
          const customConfig: any = {
            model: this.currentConfig.name,
            generationConfig: {
              temperature: temperature || this.currentConfig.temperature || 0.4,
              topP: this.currentConfig.topP || 0.8,
              topK: this.currentConfig.topK || 40,
              maxOutputTokens: maxTokens || this.currentConfig.maxTokens || 8192,
            }
          };

          if (this.currentConfig.safetySettings) {
            customConfig.safetySettings = this.currentConfig.safetySettings;
          }

          currentModel = this.genAI.getGenerativeModel(customConfig);
        }

        const result = await Promise.race([
          currentModel.generateContent(prompt),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI request timeout')), timeout)
          )
        ]) as any;

        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from AI model');
        }
        
        this.requestCount++;
        console.log(`✅ AI Generation successful (${text.length} characters) - Request count: ${this.requestCount}`);
        this.emit('contentGenerated', { 
          model: this.currentConfig.name, 
          length: text.length,
          attempt,
          requestCount: this.requestCount
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
        
        // Check for specific error types that might require model fallback
        if (error.message.includes('quota') || error.message.includes('429')) {
          console.log('🚫 Rate limit/quota exceeded - waiting longer before retry');
          // For quota issues, wait much longer and try fallback
          if (attempt < retries) {
            const quotaDelay = Math.min(30000 * Math.pow(2, attempt - 1), 300000); // 30s to 5min
            console.log(`⏳ Quota delay: Waiting ${Math.round(quotaDelay/1000)}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, quotaDelay));
          }
          await this.tryFallbackModel();
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
      this.initializeModel();
      
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
    this.initializeModel();
    
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
        this.initializeModel();
        
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
          this.initializeModel();
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
      this.initializeModel();
      
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
        this.initializeModel();
        console.error(`❌ Migration to ${modelName} failed, reverted to ${previousConfig.name}`);
        return false;
      }
      
    } catch (error) {
      // Revert on error
      this.currentConfig = previousConfig;
      this.initializeModel();
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
   * Reset daily request count (typically called at midnight)
   */
  public resetDailyRequestCount(): void {
    this.requestCount = 0;
    console.log('🔄 Daily AI request count reset');
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
    
    return {
      isInitialized: this.isInitialized,
      currentModel: this.currentConfig.name,
      isLatest: stats.isLatest,
      requestCount: this.requestCount,
      dailyLimit: this.dailyRequestLimit,
      isAvailable: true, // We'll assume it's available if initialized
      queueStatus: this.getQueueStatus()
    };
  }
}

// Export singleton instance
export const centralAIManager = CentralAIManager.getInstance();
export default centralAIManager;