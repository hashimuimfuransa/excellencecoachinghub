import React, { useState } from 'react';
import { Box, Typography, Button, Alert, Zoom } from '@mui/material';
import { Image, Download, OpenInNew, ZoomIn, ZoomOut } from '@mui/icons-material';

interface ImageViewerProps {
  url: string;
  title: string;
  height: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ url, title, height }) => {
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setError('Failed to load image');
    setLoading(false);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        height={height}
        p={4}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box display="flex" gap={2}>
          <Button 
            variant="contained" 
            startIcon={<Download />}
            onClick={() => window.open(url, '_blank')}
          >
            Download Image
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<OpenInNew />}
            onClick={() => window.open(url, '_blank')}
          >
            Open in New Tab
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box height={height} width="100%" display="flex" flexDirection="column">
      {/* Image Controls */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        p={1} 
        borderBottom="1px solid #e0e0e0"
      >
        <Typography variant="h6" noWrap>
          {title}
        </Typography>
        <Box display="flex" gap={1}>
          <Button 
            size="small" 
            startIcon={<ZoomOut />}
            onClick={zoomOut}
            disabled={zoom <= 0.5}
          >
            Zoom Out
          </Button>
          <Button 
            size="small" 
            startIcon={<ZoomIn />}
            onClick={zoomIn}
            disabled={zoom >= 3}
          >
            Zoom In
          </Button>
          <Button 
            size="small" 
            startIcon={<Download />}
            onClick={() => window.open(url, '_blank')}
          >
            Download
          </Button>
        </Box>
      </Box>

      {/* Image Display */}
      <Box 
        flex={1} 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        overflow="auto"
        p={2}
        backgroundColor="#f5f5f5"
      >
        <Zoom in={true} style={{ transitionDelay: '0ms' }}>
          <img
            src={url}
            alt={title}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              transform: `scale(${zoom})`,
              transition: 'transform 0.3s ease',
              cursor: zoom > 1 ? 'grab' : 'default'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />
        </Zoom>
      </Box>
    </Box>
  );
};

export default ImageViewer;

