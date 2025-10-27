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
      right={isFullscreen ? 0 : 'auto'}
      bottom={isFullscreen ? 0 : 'auto'}
      zIndex={isFullscreen ? 9999 : 'auto'}
      bgcolor="white"
      sx={{
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
        justifyContent="space-between" 
        alignItems="center" 
        p={2} 
        borderBottom="1px solid #e0e0e0"
        bgcolor="grey.50"
        sx={{
          // Mobile header optimizations
          '@media (max-width: 768px)': {
            padding: 1.5,
            '& .MuiTypography-root': {
              fontSize: '0.9rem'
            }
          },
          '@media (max-width: 480px)': {
            padding: 1,
            flexDirection: 'column',
            gap: 1,
            alignItems: 'stretch',
            '& .MuiTypography-root': {
              fontSize: '0.8rem',
              textAlign: 'center'
            }
          }
        }}
      >
        <Typography 
          variant="h6"
          sx={{
            // Mobile typography optimizations
            '@media (max-width: 480px)': {
              fontSize: '0.8rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }
          }}
        >
          {title}
        </Typography>
        <Box 
          display="flex" 
          gap={1}
          sx={{
            // Mobile controls optimizations
            '@media (max-width: 480px)': {
              justifyContent: 'center',
              gap: 0.5
            }
          }}
        >
          <Tooltip title="Download PDF">
            <IconButton 
              onClick={handleDownload} 
              color="primary"
              sx={{
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
              }}
            >
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open in New Tab">
            <IconButton 
              onClick={handleOpenInNewTab} 
              color="primary"
              sx={{
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
              }}
            >
              <OpenInNew />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton 
              onClick={toggleFullscreen} 
              color="primary"
              sx={{
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
              }}
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* PDF Content */}
      <Box 
        flex={1} 
        position="relative"
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
            height="100%" 
            p={3}
            sx={{
              // Mobile error optimizations
              '@media (max-width: 480px)': {
                padding: 2
              }
            }}
          >
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                // Mobile alert optimizations
                '@media (max-width: 480px)': {
                  '& .MuiAlert-message': {
                    fontSize: '0.8rem'
                  }
                }
              }}
            >
              {error}
            </Alert>
            <Button 
              variant="contained" 
              onClick={handleOpenInNewTab}
              sx={{
                // Mobile button optimizations
                '@media (max-width: 480px)': {
                  fontSize: '0.8rem',
                  padding: '8px 16px'
                }
              }}
            >
              Open in New Tab
            </Button>
          </Box>
        ) : (
          <iframe
            src={url}
            width="100%"
            height="100%"
            style={{ 
              border: 'none',
              // Mobile iframe optimizations
              '@media (max-width: 480px)': {
                minHeight: '200px'
              }
            }}
            onError={() => setError('Failed to load PDF. Please try opening in a new tab.')}
            title={title}
          />
        )}
      </Box>
    </Box>
  );
};

export default SimplePDFViewer;
