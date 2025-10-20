import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, IconButton, Tooltip, Typography, Alert, Chip, Paper, Divider, Fab } from '@mui/material';
import { Download, OpenInNew, Fullscreen, FullscreenExit, PlayArrow, VolumeUp, Schedule, Info, ArrowBack } from '@mui/icons-material';

interface SimpleMediaViewerProps {
  url: string;
  title: string;
  type: 'video' | 'audio';
  height?: string;
  description?: string;
  estimatedDuration?: number;
  isRequired?: boolean;
  materialType?: string;
  onProgressUpdate?: (progress: number, timeSpent: number) => void;
  onVideoEnd?: () => void;
  onVideoStart?: () => void;
}

const SimpleMediaViewer: React.FC<SimpleMediaViewerProps> = ({
  url,
  title,
  type,
  height = '70vh',
  description,
  estimatedDuration,
  isRequired,
  materialType,
  onProgressUpdate,
  onVideoEnd,
  onVideoStart
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Video progress tracking functions
  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      const mediaElement = type === 'video' ? videoRef.current : audioRef.current;
      if (mediaElement && isPlaying) {
        const currentTime = mediaElement.currentTime;
        const duration = mediaElement.duration;
        
        if (duration > 0) {
          const progress = (currentTime / duration) * 100;
          const timeSpentMinutes = Math.floor(currentTime / 60);
          
          setVideoProgress(progress);
          setTimeSpent(timeSpentMinutes);
          
          // Call the progress update callback
          if (onProgressUpdate) {
            onProgressUpdate(progress, timeSpentMinutes);
          }
        }
      }
    }, 1000); // Update every second
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Video event handlers
  const handleVideoPlay = () => {
    setIsPlaying(true);
    startProgressTracking();
    if (onVideoStart) {
      onVideoStart();
    }
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
    stopProgressTracking();
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    stopProgressTracking();
    setVideoProgress(100);
    
    // Call the video end callback
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  const handleVideoTimeUpdate = () => {
    const mediaElement = type === 'video' ? videoRef.current : audioRef.current;
    if (mediaElement && mediaElement.duration > 0) {
      const progress = (mediaElement.currentTime / mediaElement.duration) * 100;
      setVideoProgress(progress);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
    };
  }, []);

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getFileIcon = () => {
    return type === 'video' ? <PlayArrow /> : <VolumeUp />;
  };

  return (
    <Box 
      height={isFullscreen ? '100vh' : height} 
      width="100%" 
      display="flex" 
      flexDirection="column"
      position={isFullscreen ? 'fixed' : 'relative'}
      top={isFullscreen ? 0 : 'auto'}
      left={isFullscreen ? 0 : 'auto'}
      right={isFullscreen ? 0 : 'auto'}
      bottom={isFullscreen ? 0 : 'auto'}
      zIndex={isFullscreen ? 9999 : 'auto'}
      bgcolor="black"
      sx={{
        ...(isFullscreen && {
          backdropFilter: 'blur(10px)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: -1
          }
        }),
        // Mobile optimizations
        '@media (max-width: 768px)': {
          height: isFullscreen ? '100vh' : '60vh',
          '& .MuiIconButton-root': {
            padding: '8px',
            minWidth: '44px',
            minHeight: '44px'
          }
        },
        '@media (max-width: 480px)': {
          height: isFullscreen ? '100vh' : '50vh',
          '& .MuiIconButton-root': {
            padding: '6px',
            minWidth: '40px',
            minHeight: '40px'
          }
        }
      }}
    >
      {/* Header */}
      <Box 
        display="flex" 
        flexDirection="column"
        p={isFullscreen ? 3 : 2} 
        borderBottom="1px solid #333"
        bgcolor={isFullscreen ? "rgba(0,0,0,0.95)" : "rgba(0,0,0,0.8)"}
        color="white"
        sx={{
          backdropFilter: 'blur(10px)',
          ...(isFullscreen && {
            boxShadow: '0 2px 20px rgba(0,0,0,0.5)'
          }),
          // Mobile header optimizations
          '@media (max-width: 768px)': {
            padding: isFullscreen ? 2 : 1.5,
            '& .MuiTypography-root': {
              fontSize: '0.9rem'
            }
          },
          '@media (max-width: 480px)': {
            padding: isFullscreen ? 1.5 : 1,
            '& .MuiTypography-root': {
              fontSize: '0.8rem'
            }
          }
        }}
      >
        {/* Title and Controls Row */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={description ? 1 : 0}
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 },
            alignItems: { xs: 'stretch', sm: 'center' },
            // Mobile optimizations
            '@media (max-width: 480px)': {
              gap: 0.5,
              '& .MuiBox-root': {
                gap: 0.5
              }
            }
          }}
        >
          <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, flex: 1 }}>
            {getFileIcon()}
            <Typography 
              variant={isFullscreen ? "h5" : "h6"}
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: { xs: '1rem', sm: isFullscreen ? '1.5rem' : '1.25rem' }
              }}
            >
              {title}
            </Typography>
          </Box>
          <Box 
            display="flex" 
            gap={1}
            sx={{
              justifyContent: { xs: 'center', sm: 'flex-end' },
              flexWrap: 'wrap',
              // Mobile control optimizations
              '@media (max-width: 480px)': {
                gap: 0.5,
                '& .MuiIconButton-root': {
                  padding: '4px',
                  minWidth: '36px',
                  minHeight: '36px'
                }
              }
            }}
          >
            <Tooltip title="Download">
              <IconButton 
                onClick={handleDownload} 
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Open in New Tab">
              <IconButton 
                onClick={handleOpenInNewTab} 
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <OpenInNew />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <IconButton 
                onClick={toggleFullscreen} 
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Description and Metadata Row */}
        {(description || estimatedDuration || isRequired) && (
          <Box 
            display="flex" 
            flexDirection="column" 
            gap={1}
            sx={{
              // Mobile description optimizations
              '@media (max-width: 480px)': {
                gap: 0.5,
                '& .MuiChip-root': {
                  fontSize: '0.7rem',
                  height: '24px'
                }
              }
            }}
          >
            {description && (
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9, 
                  lineHeight: 1.4,
                  // Mobile text optimizations
                  '@media (max-width: 480px)': {
                    fontSize: '0.75rem',
                    lineHeight: 1.3
                  }
                }}
              >
                {description}
              </Typography>
            )}
            <Box 
              display="flex" 
              gap={1} 
              flexWrap="wrap"
              sx={{
                // Mobile chip optimizations
                '@media (max-width: 480px)': {
                  gap: 0.5,
                  '& .MuiChip-root': {
                    fontSize: '0.7rem',
                    height: '24px',
                    '& .MuiChip-icon': {
                      fontSize: '0.8rem'
                    }
                  }
                }
              }}
            >
              {estimatedDuration && (
                <Chip
                  icon={<Schedule />}
                  label={`${estimatedDuration} min`}
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              )}
              {isRequired && (
                <Chip
                  label="Required"
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(244, 67, 54, 0.8)', 
                    color: 'white'
                  }}
                />
              )}
              {materialType && (
                <Chip
                  icon={<Info />}
                  label={materialType}
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Media Content */}
      <Box 
        flex={1} 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        position="relative"
        overflow="hidden"
        bgcolor="black"
        sx={{
          // Mobile content optimizations
          '@media (max-width: 768px)': {
            minHeight: '200px'
          },
          '@media (max-width: 480px)': {
            minHeight: '150px'
          }
        }}
      >
        {error ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            justifyContent="center" 
            alignItems="center" 
            p={3}
            bgcolor="rgba(0,0,0,0.8)"
            borderRadius={2}
          >
            <Alert severity="error" sx={{ mb: 2, bgcolor: 'transparent', color: 'white' }}>
              {error}
            </Alert>
            <Button variant="contained" onClick={handleOpenInNewTab}>
              Open in New Tab
            </Button>
          </Box>
        ) : (
          <>
            {type === 'video' ? (
              <video
                ref={videoRef}
                controls
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  backgroundColor: 'black'
                }}
                onError={() => setError('Failed to load video. Please try opening in a new tab.')}
                onLoadStart={() => setError(null)}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onEnded={handleVideoEnded}
                onTimeUpdate={handleVideoTimeUpdate}
                preload="metadata"
                playsInline
                webkit-playsinline="true"
                x-webkit-airplay="allow"
              >
                <source src={url} type="video/mp4" />
                <source src={url} type="video/webm" />
                <source src={url} type="video/ogg" />
                <source src={url} type="video/avi" />
                <source src={url} type="video/mov" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <Box 
                display="flex" 
                flexDirection="column" 
                justifyContent="center" 
                alignItems="center" 
                width="100%" 
                height="100%"
                bgcolor="grey.900"
                p={4}
                sx={{
                  // Mobile audio optimizations
                  '@media (max-width: 768px)': {
                    padding: 2
                  },
                  '@media (max-width: 480px)': {
                    padding: 1.5,
                    '& .MuiSvgIcon-root': {
                      fontSize: '3rem'
                    }
                  }
                }}
              >
                <VolumeUp 
                  sx={{ 
                    fontSize: 80, 
                    color: 'white', 
                    mb: 3,
                    '@media (max-width: 480px)': {
                      fontSize: '3rem',
                      mb: 2
                    }
                  }} 
                />
                <audio
                  ref={audioRef}
                  controls
                  style={{ 
                    width: '100%', 
                    maxWidth: '500px',
                    marginBottom: '20px'
                  }}
                  onError={() => setError('Failed to load audio. Please try opening in a new tab.')}
                  onLoadStart={() => setError(null)}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleVideoEnded}
                  onTimeUpdate={handleVideoTimeUpdate}
                  preload="metadata"
                >
                  <source src={url} type="audio/mpeg" />
                  <source src={url} type="audio/wav" />
                  <source src={url} type="audio/ogg" />
                  <source src={url} type="audio/mp3" />
                  Your browser does not support the audio tag.
                </audio>
                <Typography 
                  variant="h6" 
                  color="white" 
                  textAlign="center"
                  sx={{
                    '@media (max-width: 480px)': {
                      fontSize: '1rem'
                    }
                  }}
                >
                  {title}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Floating Exit Button for Fullscreen */}
      {isFullscreen && (
        <Fab
          color="primary"
          aria-label="exit fullscreen"
          onClick={toggleFullscreen}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 10000,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.9)',
            },
            '@media (max-width: 480px)': {
              top: 8,
              left: 8,
              width: 48,
              height: 48,
            }
          }}
        >
          <ArrowBack />
        </Fab>
      )}
    </Box>
  );
};

export default SimpleMediaViewer;
