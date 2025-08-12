import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { VideoProvider, IVideoProvider } from '../models/VideoProvider';
import videoProviderService from '../services/videoProviderService';

// Get all video providers
export const getAllProviders = asyncHandler(async (req: Request, res: Response) => {
  const providers = await videoProviderService.getAllProviders();
  
  res.status(200).json({
    success: true,
    data: {
      providers: providers.map(provider => ({
        id: provider._id,
        name: provider.name,
        isActive: provider.isActive,
        config: {
          appId: provider.config.appId ? '***configured***' : undefined,
          appCertificate: provider.config.appCertificate ? '***configured***' : undefined,
          templateId: provider.config.templateId,
          channelName: provider.config.channelName,
          uid: provider.config.uid,
          role: provider.config.role
        },
        fallbackProvider: provider.fallbackProvider,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      })),
      activeProvider: videoProviderService.getActiveProvider()?.name || null,
      fallbackProvider: videoProviderService.getFallbackProvider()?.name || null
    }
  });
});

// Get active provider
export const getActiveProvider = asyncHandler(async (req: Request, res: Response) => {
  const activeProvider = videoProviderService.getActiveProvider();
  
  if (!activeProvider) {
    return res.status(404).json({
      success: false,
      message: 'No active video provider configured'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      provider: {
        id: activeProvider._id,
        name: activeProvider.name,
        isActive: activeProvider.isActive,
        config: {
          appId: activeProvider.config.appId ? '***configured***' : undefined,
          appCertificate: activeProvider.config.appCertificate ? '***configured***' : undefined,
          templateId: activeProvider.config.templateId,
          channelName: activeProvider.config.channelName,
          uid: activeProvider.config.uid,
          role: activeProvider.config.role
        },
        fallbackProvider: activeProvider.fallbackProvider
      }
    }
  });
});

// Switch active provider
export const switchProvider = asyncHandler(async (req: Request, res: Response) => {
  const { providerName } = req.body;
  const userId = req.user?._id;

  if (!providerName || !['agora', '100ms'].includes(providerName)) {
    return res.status(400).json({
      success: false,
      message: 'Valid provider name (agora or 100ms) is required'
    });
  }

  const currentProvider = videoProviderService.getActiveProvider();
  const newProvider = await videoProviderService.switchProvider(providerName as 'agora' | '100ms');

  // Log the switch
  await videoProviderService.logProviderSwitch(
    currentProvider?.name || 'none',
    providerName,
    'Admin switch',
    userId?.toString()
  );

  res.status(200).json({
    success: true,
    message: `Successfully switched to ${providerName}`,
    data: {
      previousProvider: currentProvider?.name || 'none',
      newProvider: newProvider.name,
      config: {
        appId: newProvider.config.appId ? '***configured***' : undefined,
        appCertificate: newProvider.config.appCertificate ? '***configured***' : undefined,
        templateId: newProvider.config.templateId,
        channelName: newProvider.config.channelName,
        uid: newProvider.config.uid,
        role: newProvider.config.role
      }
    }
  });
});

// Update provider configuration
export const updateProviderConfig = asyncHandler(async (req: Request, res: Response) => {
  const { providerName, config } = req.body;

  if (!providerName || !['agora', '100ms'].includes(providerName)) {
    return res.status(400).json({
      success: false,
      message: 'Valid provider name (agora or 100ms) is required'
    });
  }

  const updatedProvider = await videoProviderService.updateProviderConfig(
    providerName as 'agora' | '100ms',
    config
  );

  res.status(200).json({
    success: true,
    message: `${providerName} configuration updated successfully`,
    data: {
      provider: {
        id: updatedProvider._id,
        name: updatedProvider.name,
        isActive: updatedProvider.isActive,
        config: {
          appId: updatedProvider.config.appId ? '***configured***' : undefined,
          appCertificate: updatedProvider.config.appCertificate ? '***configured***' : undefined,
          templateId: updatedProvider.config.templateId,
          channelName: updatedProvider.config.channelName,
          uid: updatedProvider.config.uid,
          role: updatedProvider.config.role
        },
        fallbackProvider: updatedProvider.fallbackProvider
      }
    }
  });
});

// Generate video token
export const generateToken = asyncHandler(async (req: Request, res: Response) => {
  const { channelName, userId, userName, role = 'publisher' } = req.body;

  if (!channelName || !userId || !userName) {
    return res.status(400).json({
      success: false,
      message: 'channelName, userId, and userName are required'
    });
  }

  if (!['publisher', 'subscriber'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'role must be either publisher or subscriber'
    });
  }

  const tokenResponse = await videoProviderService.generateToken(
    channelName,
    userId,
    userName,
    role as 'publisher' | 'subscriber'
  );

  res.status(200).json({
    success: true,
    data: tokenResponse
  });
});

// Test provider connection
export const testProvider = asyncHandler(async (req: Request, res: Response) => {
  const { providerName } = req.params;

  if (!providerName || !['agora', '100ms'].includes(providerName)) {
    return res.status(400).json({
      success: false,
      message: 'Valid provider name (agora or 100ms) is required'
    });
  }

  const isWorking = await videoProviderService.testProvider(providerName as 'agora' | '100ms');

  res.status(200).json({
    success: true,
    data: {
      provider: providerName,
      isWorking,
      message: isWorking 
        ? `${providerName} is properly configured and working`
        : `${providerName} is not properly configured or not working`
    }
  });
});

// Initialize default providers (for setup)
export const initializeProviders = asyncHandler(async (req: Request, res: Response) => {
  // Check if providers already exist
  const existingProviders = await VideoProvider.find();
  
  if (existingProviders.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Providers already initialized'
    });
  }

  // Create default providers
  const agoraProvider = new VideoProvider({
    name: 'agora',
    isActive: false,
    config: {},
    fallbackProvider: '100ms'
  });

  const hmsProvider = new VideoProvider({
    name: '100ms',
    isActive: false,
    config: {},
    fallbackProvider: 'agora'
  });

  await Promise.all([agoraProvider.save(), hmsProvider.save()]);

  // Set Agora as default active provider
  await videoProviderService.switchProvider('agora');

  res.status(201).json({
    success: true,
    message: 'Video providers initialized successfully',
    data: {
      providers: ['agora', '100ms'],
      activeProvider: 'agora'
    }
  });
});

// Get provider status and health
export const getProviderStatus = asyncHandler(async (req: Request, res: Response) => {
  const activeProvider = videoProviderService.getActiveProvider();
  const fallbackProvider = videoProviderService.getFallbackProvider();

  const status = {
    activeProvider: activeProvider ? {
      name: activeProvider.name,
      isActive: activeProvider.isActive,
      isConfigured: activeProvider.name === 'agora' 
        ? !!(activeProvider.config.appId && activeProvider.config.appCertificate)
        : !!activeProvider.config.templateId
    } : null,
    fallbackProvider: fallbackProvider ? {
      name: fallbackProvider.name,
      isConfigured: fallbackProvider.name === 'agora' 
        ? !!(fallbackProvider.config.appId && fallbackProvider.config.appCertificate)
        : !!fallbackProvider.config.templateId
    } : null,
    lastUpdated: new Date()
  };

  res.status(200).json({
    success: true,
    data: status
  });
});
