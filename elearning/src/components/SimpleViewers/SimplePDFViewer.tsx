import React, { useState } from 'react';
import { Box, Button, IconButton, Tooltip, Typography, Alert } from '@mui/material';
import { Download, OpenInNew, Fullscreen, FullscreenExit } from '@mui/icons-material';

interface SimplePDFViewerProps {
  url: string;
  title: string;
  height?: string;
}

const SimplePDFViewer: React.FC<SimplePDFViewerProps> = ({
  url,
  title,
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
      bgcolor="white"
    >
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        p={2} 
        borderBottom="1px solid #e0e0e0"
        bgcolor="grey.50"
      >
        <Typography variant="h6">
          {title}
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Download PDF">
            <IconButton onClick={handleDownload} color="primary">
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open in New Tab">
            <IconButton onClick={handleOpenInNewTab} color="primary">
              <OpenInNew />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton onClick={toggleFullscreen} color="primary">
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* PDF Content */}
      <Box flex={1} position="relative">
        {error ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            justifyContent="center" 
            alignItems="center" 
            height="100%" 
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
          <iframe
            src={url}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            onError={() => setError('Failed to load PDF. Please try opening in a new tab.')}
            title={title}
          />
        )}
      </Box>
    </Box>
  );
};

export default SimplePDFViewer;
