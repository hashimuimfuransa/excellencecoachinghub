import React from 'react';
import { Box } from '@mui/material';

interface VideoSessionWrapperProps {
  children: React.ReactNode;
}

const VideoSessionWrapper: React.FC<VideoSessionWrapperProps> = ({ children }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      {children}
    </Box>
  );
};

export default VideoSessionWrapper;