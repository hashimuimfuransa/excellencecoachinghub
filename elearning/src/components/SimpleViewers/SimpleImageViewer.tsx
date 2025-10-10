import React, { useState } from 'react';
import { Box, Button, IconButton, Tooltip, Typography, Alert } from '@mui/material';
import { Download, OpenInNew, Fullscreen, FullscreenExit, ZoomIn, ZoomOut, RotateLeft } from '@mui/icons-material';

interface SimpleImageViewerProps {
  url: string;
  title: string;
  height?: string;
}

const SimpleImageViewer: React.FC<SimpleImageViewerProps> = ({
  url,
  title,
  height = '70vh'
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

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

  return (
    <Box 
      height={isFullscreen ? '100vh' : height} 
      width="100%" 
      display="flex" 
      flexDirection="column"
      position={isFullscreen ? 'fixed' : 'relative'}
      top={isFullscreen ? 0 : 'auto'}
      left={isFullscreen ? 0 : 'auto'}
      zIndex={isFullscreen ? 9999 : 'auto'}
      bgcolor="black"
    >
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        p={2} 
        borderBottom="1px solid #333"
        bgcolor="rgba(0,0,0,0.8)"
        color="white"
      >
        <Typography variant="h6">
          {title}
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Zoom In">
            <IconButton onClick={zoomIn} sx={{ color: 'white' }}>
              <ZoomIn />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={zoomOut} sx={{ color: 'white' }}>
              <ZoomOut />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rotate">
            <IconButton onClick={rotate} sx={{ color: 'white' }}>
              <RotateLeft />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton onClick={handleDownload} sx={{ color: 'white' }}>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open in New Tab">
            <IconButton onClick={handleOpenInNewTab} sx={{ color: 'white' }}>
              <OpenInNew />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Image Content */}
      <Box 
        flex={1} 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        position="relative"
        overflow="hidden"
      >
        {error ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            justifyContent="center" 
            alignItems="center" 
            p={3}
          >
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button variant="contained" onClick={handleOpenInNewTab}>
              Open in New Tab
            </Button>
          </Box>
        ) : (
          <img
            src={url}
            alt={title}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease',
              cursor: scale > 1 ? 'grab' : 'default'
            }}
            onError={() => setError('Failed to load image. Please try opening in a new tab.')}
            onLoad={() => setError(null)}
          />
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
        >
          <Typography variant="body2">
            {Math.round(scale * 100)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SimpleImageViewer;
