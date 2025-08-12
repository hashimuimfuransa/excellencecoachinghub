import VideoProvider, { IVideoProvider } from '../models/VideoProvider';
import { asyncHandler } from '../middleware/asyncHandler';

// Agora token generation
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

export interface VideoTokenResponse {
  provider: 'agora' | '100ms';
  token: string;
  appId?: string;
  channelName?: string;
  uid?: string;
  role?: string;
  // 100ms specific
  roomId?: string;
  userId?: string;
  userName?: string;
  templateId?: string;
}

export class VideoProviderService {
  private static instance: VideoProviderService;
  private activeProvider: IVideoProvider | null = null;
  private fallbackProvider: IVideoProvider | null = null;

  private constructor() {}

  public static getInstance(): VideoProviderService {
    if (!VideoProviderService.instance) {
      VideoProviderService.instance = new VideoProviderService();
    }
    return VideoProviderService.instance;
  }

  // Initialize providers from database
  public async initialize(): Promise<void> {
    try {
      this.activeProvider = await VideoProvider.findOne({ isActive: true });
      if (this.activeProvider?.fallbackProvider) {
        this.fallbackProvider = await VideoProvider.findOne({ 
          name: this.activeProvider.fallbackProvider 
        });
      }
      console.log(`🎥 Video provider initialized: ${this.activeProvider?.name || 'none'}`);
    } catch (error) {
      console.error('❌ Error initializing video providers:', error);
    }
  }

  // Get active provider
  public getActiveProvider(): IVideoProvider | null {
    return this.activeProvider;
  }

  // Get fallback provider
  public getFallbackProvider(): IVideoProvider | null {
    return this.fallbackProvider;
  }

  // Switch active provider
  public async switchProvider(providerName: 'agora' | '100ms'): Promise<IVideoProvider> {
    try {
      // Deactivate current provider
      if (this.activeProvider) {
        this.activeProvider.isActive = false;
        await this.activeProvider.save();
      }

      // Activate new provider
      const newProvider = await VideoProvider.findOne({ name: providerName });
      if (!newProvider) {
        throw new Error(`Provider ${providerName} not found`);
      }

      newProvider.isActive = true;
      await newProvider.save();

      // Update instance
      this.activeProvider = newProvider;
      if (newProvider.fallbackProvider) {
        this.fallbackProvider = await VideoProvider.findOne({ 
          name: newProvider.fallbackProvider 
        });
      }

      console.log(`🔄 Switched to video provider: ${providerName}`);
      return newProvider;
    } catch (error) {
      console.error('❌ Error switching video provider:', error);
      throw error;
    }
  }

  // Generate token for active provider
  public async generateToken(
    channelName: string,
    userId: string,
    userName: string,
    role: 'publisher' | 'subscriber' = 'publisher'
  ): Promise<VideoTokenResponse> {
    try {
      if (!this.activeProvider) {
        throw new Error('No active video provider configured');
      }

      if (this.activeProvider.name === 'agora') {
        return this.generateAgoraToken(channelName, userId, role);
      } else if (this.activeProvider.name === '100ms') {
        return this.generate100msToken(channelName, userId, userName);
      } else {
        throw new Error(`Unsupported provider: ${this.activeProvider.name}`);
      }
    } catch (error) {
      console.error('❌ Error generating token:', error);
      
      // Try fallback provider
      if (this.fallbackProvider && this.fallbackProvider.name !== this.activeProvider?.name) {
        console.log(`🔄 Trying fallback provider: ${this.fallbackProvider.name}`);
        const originalProvider = this.activeProvider;
        this.activeProvider = this.fallbackProvider;
        
        try {
          const fallbackToken = await this.generateToken(channelName, userId, userName, role);
          console.log(`✅ Fallback provider token generated successfully`);
          return fallbackToken;
        } catch (fallbackError) {
          console.error('❌ Fallback provider also failed:', fallbackError);
          this.activeProvider = originalProvider;
          throw error;
        }
      }
      
      throw error;
    }
  }

  // Generate Agora token
  private generateAgoraToken(
    channelName: string,
    userId: string,
    role: 'publisher' | 'subscriber'
  ): VideoTokenResponse {
    const { appId, appCertificate } = this.activeProvider!.config;
    
    if (!appId || !appCertificate) {
      throw new Error('Agora appId and appCertificate are required');
    }

    const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Convert userId string to number for Agora SDK
    const uid = parseInt(userId) || 0;
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs
    );

    return {
      provider: 'agora',
      token,
      appId,
      channelName,
      uid: userId,
      role
    };
  }

  // Generate 100ms token
  private generate100msToken(
    roomId: string,
    userId: string,
    userName: string
  ): VideoTokenResponse {
    const { templateId } = this.activeProvider!.config;
    
    if (!templateId) {
      throw new Error('100ms templateId is required');
    }

    // For 100ms, we'll use their token generation endpoint
    // This is a placeholder - you'll need to implement actual 100ms token generation
    const token = `100ms_token_${roomId}_${userId}_${Date.now()}`;

    return {
      provider: '100ms',
      token,
      roomId,
      userId,
      userName,
      templateId
    };
  }

  // Get all providers
  public async getAllProviders(): Promise<IVideoProvider[]> {
    return await VideoProvider.find().sort({ createdAt: -1 });
  }

  // Update provider configuration
  public async updateProviderConfig(
    providerName: 'agora' | '100ms',
    config: Partial<IVideoProvider['config']>
  ): Promise<IVideoProvider> {
    const provider = await VideoProvider.findOne({ name: providerName });
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    provider.config = { ...provider.config, ...config };
    await provider.save();

    // Reinitialize if this is the active provider
    if (provider.isActive) {
      await this.initialize();
    }

    return provider;
  }

  // Test provider connection
  public async testProvider(providerName: 'agora' | '100ms'): Promise<boolean> {
    try {
      const provider = await VideoProvider.findOne({ name: providerName });
      if (!provider) {
        return false;
      }

      // Basic configuration validation
      if (providerName === 'agora') {
        return !!(provider.config.appId && provider.config.appCertificate);
      } else if (providerName === '100ms') {
        return !!(provider.config.templateId);
      }

      return false;
    } catch (error) {
      console.error(`❌ Error testing provider ${providerName}:`, error);
      return false;
    }
  }

  // Log provider switching events
  public async logProviderSwitch(
    fromProvider: string,
    toProvider: string,
    reason: string,
    userId?: string
  ): Promise<void> {
    console.log(`📊 Provider Switch Log: ${fromProvider} → ${toProvider} | Reason: ${reason} | User: ${userId || 'system'}`);
    
    // You can implement actual logging to database here
    // For now, we'll just console.log
  }
}

export default VideoProviderService.getInstance();
