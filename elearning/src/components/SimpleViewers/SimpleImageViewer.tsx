import React, { useState } from 'react';
import { Box, Button, IconButton, Tooltip, Typography, Alert, Chip } from '@mui/material';
import { Download, OpenInNew, Fullscreen, FullscreenExit, ZoomIn, ZoomOut, RotateLeft, Schedule, Info } from '@mui/icons-material';

interface SimpleImageViewerProps {
  url: string;
  title: string;
  height?: string;
  description?: string;
  estimatedDuration?: number;
  isRequired?: boolean;
  materialType?: string;
}

const SimpleImageViewer: React.FC<SimpleImageViewerProps> = ({
  url,
  title,
  height = '70vh',
  description,
  estimatedDuration,
  isRequired,
  materialType
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

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

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      setImagePosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Double tap to zoom
  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setImagePosition({ x: 0, y: 0 });
    }
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
            alignItems: { xs: 'stretch', sm: 'center' }
          }}
        >
          <Typography 
            variant={isFullscreen ? "h5" : "h6"}
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: { xs: '1rem', sm: isFullscreen ? '1.5rem' : '1.25rem' },
              minWidth: 0,
              flex: 1
            }}
          >
            {title}
          </Typography>
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
            <Tooltip title="Zoom In">
              <IconButton 
                onClick={zoomIn} 
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ZoomIn />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton 
                onClick={zoomOut} 
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rotate">
              <IconButton 
                onClick={rotate} 
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <RotateLeft />
              </IconButton>
            </Tooltip>
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
          <Box display="flex" flexDirection="column" gap={1}>
            {description && (
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.4 }}>
                {description}
              </Typography>
            )}
            <Box display="flex" gap={1} flexWrap="wrap">
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

      {/* Image Content */}
      <Box 
        flex={1} 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        position="relative"
        overflow="hidden"
        bgcolor="black"
        p={2}
        sx={{
          // Mobile content optimizations
          '@media (max-width: 768px)': {
            minHeight: '200px',
            padding: 1
          },
          '@media (max-width: 480px)': {
            minHeight: '150px',
            padding: 0.5
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
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
            height="100%"
            position="relative"
          >
            <img
              src={url}
              alt={title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                transform: `scale(${scale}) rotate(${rotation}deg) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease',
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                backgroundColor: 'transparent',
                borderRadius: '4px',
                boxShadow: scale > 1 ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
                userSelect: 'none',
                touchAction: 'none'
              }}
              onError={() => setError('Failed to load image. Please try opening in a new tab.')}
              onLoad={() => setError(null)}
              draggable={false}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
            />
          </Box>
        )}
      </Box>

      {/* Scale indicator */}
      {scale !== 1 && (
        <Box
          position="absolute"
          bottom={16}
          left={16}
          bgcolor="rgba(0,0,0,0.7)"
          color="white"
          px={2}
          py={1}
          borderRadius={1}
          sx={{
            '@media (max-width: 480px)': {
              bottom: 8,
              left: 8,
              px: 1,
              py: 0.5,
              '& .MuiTypography-root': {
                fontSize: '0.75rem'
              }
            }
          }}
        >
          <Typography variant="body2">
            {Math.round(scale * 100)}%
          </Typography>
        </Box>
      )}

      {/* Mobile gesture hints */}
      {scale === 1 && (
        <Box
          position="absolute"
          bottom={16}
          right={16}
          bgcolor="rgba(0,0,0,0.5)"
          color="white"
          px={2}
          py={1}
          borderRadius={1}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '@media (max-width: 480px)': {
              bottom: 8,
              right: 8,
              px: 1,
              py: 0.5,
              '& .MuiTypography-root': {
                fontSize: '0.7rem'
              }
            }
          }}
        >
          <Typography variant="caption">
            Double tap to zoom
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SimpleImageViewer;
