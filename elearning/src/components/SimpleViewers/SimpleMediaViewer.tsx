import React, { useState } from 'react';
import { Box, Button, IconButton, Tooltip, Typography, Alert } from '@mui/material';
import { Download, OpenInNew, Fullscreen, FullscreenExit, PlayArrow, VolumeUp } from '@mui/icons-material';

interface SimpleMediaViewerProps {
  url: string;
  title: string;
  type: 'video' | 'audio';
  height?: string;
}

const SimpleMediaViewer: React.FC<SimpleMediaViewerProps> = ({
  url,
  title,
  type,
  height = '70vh'
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <Box display="flex" alignItems="center" gap={1}>
          {getFileIcon()}
          <Typography variant="h6">
            {title}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
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

      {/* Media Content */}
      <Box flex={1} display="flex" justifyContent="center" alignItems="center" position="relative">
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
          <>
            {type === 'video' ? (
              <video
                controls
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }}
                onError={() => setError('Failed to load video. Please try opening in a new tab.')}
              >
                <source src={url} type="video/mp4" />
                <source src={url} type="video/webm" />
                <source src={url} type="video/ogg" />
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
              >
                <VolumeUp sx={{ fontSize: 80, color: 'white', mb: 2 }} />
                <audio
                  controls
                  style={{ width: '80%', maxWidth: '400px' }}
                  onError={() => setError('Failed to load audio. Please try opening in a new tab.')}
                >
                  <source src={url} type="audio/mpeg" />
                  <source src={url} type="audio/wav" />
                  <source src={url} type="audio/ogg" />
                  Your browser does not support the audio tag.
                </audio>
                <Typography variant="h6" color="white" mt={2}>
                  {title}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default SimpleMediaViewer;
