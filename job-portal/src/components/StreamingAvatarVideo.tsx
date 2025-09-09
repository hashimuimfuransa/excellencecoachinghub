import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Box, CircularProgress, Typography, Alert, Avatar } from '@mui/material';
import { avatarTalkService } from '../services/avatarTalkService';
import { modernInterviewRecordingService } from '../services/modernInterviewRecordingService';

interface StreamingAvatarVideoProps {
  text: string;
  avatar?: string;
  emotion?: string;
  language?: string;
  autoPlay?: boolean;
  onVideoStart?: () => void;
  onVideoEnd?: () => void;
  onError?: (error: string) => void;
  enableMixedRecording?: boolean; // New prop to enable mixed recording
}

const StreamingAvatarVideo: React.FC<StreamingAvatarVideoProps> = ({
  text,
  avatar = 'black_man',
  emotion = 'neutral',
  language = 'en',
  autoPlay = true,
  onVideoStart,
  onVideoEnd,
  onError,
  enableMixedRecording = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [lastProcessedText, setLastProcessedText] = useState<string>('');
  const isGeneratingRef = useRef(false);

  // Memoized avatar placeholder mapping to prevent recreation
  const avatarPlaceholders = useMemo(() => ({
    'japanese_man': '👨🏻‍💼',
    'old_european_woman': '👩🏻‍💼',
    'european_woman': '👩🏻‍💼', 
    'black_man': '👨🏿‍💼',
    'japanese_woman': '👩🏻‍💼',
    'iranian_man': '👨🏽‍💼',
    'mexican_man': '👨🏽‍💼',
    'mexican_woman': '👩🏽‍💼'
  }), []);

  // Create stable request identifier to avoid regenerating same content
  const requestKey = useMemo(() => {
    return `${text.trim()}_${avatar}_${emotion}_${language}`;
  }, [text, avatar, emotion, language]);

  const generateVideo = useCallback(async () => {
    if (!text?.trim()) {
      setError('No text provided for avatar video');
      return;
    }

    // Prevent duplicate generation for same content
    if (isGeneratingRef.current) {
      console.log('🛑 Video generation already in progress, skipping...');
      return;
    }

    // Skip if we already processed this exact same request
    if (lastProcessedText === requestKey && currentVideoUrl && videoReady) {
      console.log('✅ Using existing video for same content');
      return;
    }

    console.log('🚀 Generating new avatar video...', { requestKey });
    isGeneratingRef.current = true;
    setLoading(true);
    setError(null);
    setVideoReady(false);
    setShowPlaceholder(true);

    try {
      // Start video generation immediately
      const response = await avatarTalkService.generateVideo({
        text,
        avatar,
        emotion,
        language,
        stream: false // Always use direct generation for speed
      });

      if (response.success && response.mp4_url && videoRef.current) {
        console.log('✅ Video generated successfully:', response.mp4_url);
        
        // Update tracking state
        setCurrentVideoUrl(response.mp4_url);
        setLastProcessedText(requestKey);
        
        // Only update video source if it's different
        if (videoRef.current.src !== response.mp4_url) {
          videoRef.current.src = response.mp4_url;
          videoRef.current.load();
        }
        
        // Hide placeholder and show video
        setShowPlaceholder(false);
        
        // Set up event handlers
        const handleCanPlay = () => {
          console.log('📹 Video ready to play');
          setVideoReady(true);
          setLoading(false);
          isGeneratingRef.current = false;
          
          if (autoPlay) {
            // Ensure video element is properly configured for clear audio playback
            if (videoRef.current) {
              videoRef.current.volume = 1.0;
              videoRef.current.muted = false;
              videoRef.current.preload = 'auto';
              
              // Set audio properties for better compatibility
              if ('audioTracks' in videoRef.current && videoRef.current.audioTracks) {
                for (let i = 0; i < videoRef.current.audioTracks.length; i++) {
                  videoRef.current.audioTracks[i].enabled = true;
                }
              }
            }
            
            videoRef.current?.play().then(() => {
              onVideoStart?.();
              
              // DISABLED: Skip audio mixing to prevent interference with avatar playback
              // The avatar audio will play independently and won't be included in recording
              // This ensures clear avatar audio without interference
              console.log('🔊 Avatar audio playing independently (not mixed with recording)');
            }).catch(e => {
              console.warn('Autoplay failed, user interaction required:', e);
            });
          }
        };

        const handleLoadedData = () => {
          console.log('📹 Video data loaded');
          setVideoReady(true);
          
          // Ensure clean audio setup for each new question
          if (videoRef.current) {
            videoRef.current.volume = 1.0;
            videoRef.current.muted = false;
            
            // Reset any audio constraints that might interfere
            try {
              if ('setSinkId' in videoRef.current) {
                // Use default audio output to avoid conflicts
                (videoRef.current as any).setSinkId('').catch(() => {
                  // Silently fail if not supported
                });
              }
            } catch (e) {
              // Ignore setSinkId errors
            }
          }
        };

        const handleVideoError = () => {
          console.error('📹 Video loading error');
          setError('Failed to load video');
          setLoading(false);
          setShowPlaceholder(true);
          isGeneratingRef.current = false;
        };

        // Remove existing listeners to prevent duplicate bindings
        videoRef.current.removeEventListener('canplay', handleCanPlay);
        videoRef.current.removeEventListener('loadeddata', handleLoadedData);
        videoRef.current.removeEventListener('error', handleVideoError);
        
        // Add fresh listeners
        videoRef.current.addEventListener('canplay', handleCanPlay);
        videoRef.current.addEventListener('loadeddata', handleLoadedData);
        videoRef.current.addEventListener('error', handleVideoError);
      } else {
        throw new Error(response.error || 'Failed to generate video');
      }
    } catch (error) {
      console.error('❌ Video generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      setShowPlaceholder(true);
      isGeneratingRef.current = false;
      onError?.(errorMessage);
    }
  }, [text, avatar, emotion, language, autoPlay, onVideoStart, onError, requestKey, lastProcessedText, currentVideoUrl, videoReady]);

  // Only trigger when the request key actually changes (not on every render)
  useEffect(() => {
    if (text?.trim() && requestKey !== lastProcessedText) {
      generateVideo();
    }
  }, [requestKey, lastProcessedText, generateVideo]);

  const handleVideoEnded = useCallback(() => {
    console.log('🎬 Video playback ended');
    onVideoEnd?.();
  }, [onVideoEnd]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
      isGeneratingRef.current = false;
    };
  }, []);

  if (error) {
    return (
      <Box className="avatar-video-container" sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '500px',
        maxWidth: '600px',
        mx: 'auto'
      }}>
        <Alert severity="error" sx={{ m: 2, width: '100%' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      className="avatar-video-container"
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '500px',
        position: 'relative',
        mx: 'auto',
        maxWidth: '600px',
        borderRadius: 3,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {/* Immediate Placeholder Avatar */}
      {showPlaceholder && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            bgcolor: 'rgba(0,0,0,0.8)',
            color: 'white'
          }}
        >
          <Box sx={{ mb: 3, position: 'relative' }}>
            {/* Large Avatar Icon */}
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '60px',
                animation: loading ? 'pulse 2s ease-in-out infinite' : 'none',
                boxShadow: '0 8px 32px rgba(79, 195, 247, 0.3)',
                border: '3px solid rgba(255,255,255,0.2)'
              }}
            >
              {avatarPlaceholders[avatar as keyof typeof avatarPlaceholders] || '👤'}
            </Box>
            
            {loading && (
              <CircularProgress 
                size={140} 
                thickness={2}
                sx={{ 
                  position: 'absolute',
                  top: -10,
                  left: -10,
                  color: '#4fc3f7',
                  opacity: 0.8
                }} 
              />
            )}
          </Box>
          
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
            {loading ? '🎭 Preparing Your Avatar...' : '🎬 Avatar Ready'}
          </Typography>
          
          {loading && (
            <Typography variant="body1" sx={{ 
              opacity: 0.9, 
              textAlign: 'center', 
              px: 3,
              mb: 2,
              maxWidth: '80%'
            }}>
              Your personalized avatar is being created. This will only take a moment...
            </Typography>
          )}
          
          <Box sx={{ mt: 2, px: 3, maxWidth: '90%' }}>
            <Typography variant="body2" sx={{ 
              opacity: 0.7, 
              fontStyle: 'italic',
              display: 'block',
              textAlign: 'center',
              lineHeight: 1.5,
              bgcolor: 'rgba(255,255,255,0.1)',
              padding: 2,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              💬 "{text.substring(0, 120)}{text.length > 120 ? '...' : ''}"
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Video Element */}
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        controls={videoReady && !loading}
        autoPlay={false} // Let our handler control autoplay to prevent conflicts
        muted={false}
        playsInline
        preload="auto"
        onEnded={handleVideoEnded}
        style={{
          display: showPlaceholder ? 'none' : 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '12px',
          transition: 'opacity 0.3s ease-in-out',
          filter: 'contrast(1.1) brightness(1.05) saturate(1.1)', // Enhanced visual quality
          imageRendering: 'crisp-edges' // Better edge quality
        }}
      />
    </Box>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(StreamingAvatarVideo, (prevProps, nextProps) => {
  // Only re-render if the content actually changes
  return (
    prevProps.text === nextProps.text &&
    prevProps.avatar === nextProps.avatar &&
    prevProps.emotion === nextProps.emotion &&
    prevProps.language === nextProps.language &&
    prevProps.autoPlay === nextProps.autoPlay
  );
});