import React, { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { PlayArrow, VolumeUp, Download, OpenInNew } from '@mui/icons-material';
import ReactPlayer from 'react-player';

interface MediaViewerProps {
  url: string;
  title: string;
  height: string;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ url, title, height }) => {
  const [error, setError] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');

  React.useEffect(() => {
    const urlLower = url.toLowerCase();
    if (urlLower.match(/\.(mp3|wav|ogg|flac|aac)$/)) {
      setMediaType('audio');
    } else {
      setMediaType('video');
    }
  }, [url]);

  const handleError = (error: any) => {
    setError('Failed to load media file');
    console.error('Media load error:', error);
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
            Download Media
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
      <Box flex={1} display="flex" alignItems="center" justifyContent="center">
        <ReactPlayer
          url={url}
          controls
          width="100%"
          height={mediaType === 'video' ? '100%' : '60px'}
          onError={handleError}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
                disablePictureInPicture: true,
              }
            }
          }}
        />
      </Box>
      
      {mediaType === 'audio' && (
        <Box p={2} textAlign="center">
          <VolumeUp sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Audio File
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MediaViewer;

