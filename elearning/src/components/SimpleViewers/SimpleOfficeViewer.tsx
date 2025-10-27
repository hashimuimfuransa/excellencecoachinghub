import React, { useState } from 'react';
import { Box, Button, IconButton, Tooltip, Typography, Alert, Chip } from '@mui/material';
import { Download, OpenInNew, Fullscreen, FullscreenExit, Description, PictureAsPdf, TableChart, Slideshow } from '@mui/icons-material';

interface SimpleOfficeViewerProps {
  url: string;
  title: string;
  height?: string;
}

const SimpleOfficeViewer: React.FC<SimpleOfficeViewerProps> = ({
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

  const getFileType = () => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension;
  };

  const getFileIcon = () => {
    const fileType = getFileType();
    switch (fileType) {
      case 'doc':
      case 'docx':
        return <Description />;
      case 'ppt':
      case 'pptx':
        return <Slideshow />;
      case 'xls':
      case 'xlsx':
        return <TableChart />;
      default:
        return <Description />;
    }
  };

  const getFileTypeLabel = () => {
    const fileType = getFileType();
    switch (fileType) {
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'ppt':
      case 'pptx':
        return 'PowerPoint Presentation';
      case 'xls':
      case 'xlsx':
        return 'Excel Spreadsheet';
      default:
        return 'Office Document';
    }
  };

  const getOfficeViewerUrl = () => {
    // Use Microsoft Office Online viewer
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
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
        <Box display="flex" alignItems="center" gap={2}>
          {getFileIcon()}
          <Box>
            <Typography variant="h6">
              {title}
            </Typography>
            <Chip 
              label={getFileTypeLabel()} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Download">
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

      {/* Document Content */}
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
            src={getOfficeViewerUrl()}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            onError={() => setError('Failed to load document. Please try opening in a new tab.')}
            title={title}
          />
        )}
      </Box>

      {/* Info Footer */}
      <Box 
        p={2} 
        borderTop="1px solid #e0e0e0" 
        bgcolor="grey.50"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="body2" color="text.secondary">
          Viewing with Microsoft Office Online
        </Typography>
        <Typography variant="body2" color="text.secondary">
          File type: {getFileType()?.toUpperCase()}
        </Typography>
      </Box>
    </Box>
  );
};

export default SimpleOfficeViewer;
