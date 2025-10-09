import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download,
  Fullscreen,
  FullscreenExit,
  Assignment,
  Search,
  PictureAsPdf,
  Description,
  VideoFile,
  VolumeUp
} from '@mui/icons-material';
import WebViewer from '@pdftron/webviewer';
import { getDocumentViewingUrl, needsCloudinarySpecialHandling } from '../../utils/cloudinaryUrlProcessor';

interface EnhancedMaterialViewerProps {
  materialUrl: string;
  materialTitle: string;
  materialType: string;
  onTimeSpent?: (timeSpent: number) => void;
  onComplete?: () => void;
  userId?: string;
  userName?: string;
}

const EnhancedMaterialViewer: React.FC<EnhancedMaterialViewerProps> = ({
  materialUrl,
  materialTitle,
  materialType,
  onTimeSpent,
  onComplete,
  userId,
  userName
}) => {
  const [webViewerInstance, setWebViewerInstance] = useState<any>(null);
  const [webViewerReady, setWebViewerReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Determine file type and viewer
  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <PictureAsPdf />;
      case 'docx':
      case 'doc': return <Description />;
      case 'pptx':
      case 'ppt': return <Description />;
      case 'xlsx':
      case 'xls': return <Description />;
      case 'mp4':
      case 'avi':
      case 'mov': return <VideoFile />;
      case 'mp3':
      case 'wav': return <VolumeUp />;
      default: return <Description />;
    }
  };

  const isWebViewerSupported = (url: string) => {
    const supportedFormats = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'rtf'];
    const fileType = getFileType(url);
    return supportedFormats.includes(fileType);
  };

  // Initialize WebViewer
  useEffect(() => {
    if (viewerRef.current && isWebViewerSupported(materialUrl)) {
      const initializeWebViewer = async () => {
        try {
          setWebViewerReady(false);
          setError(null);
          
          // Process URL for Cloudinary documents
          const processedUrl = getDocumentViewingUrl(materialUrl);
          const needsSpecialHandling = needsCloudinarySpecialHandling(materialUrl);
          
          console.log('EnhancedMaterialViewer initializing with URL:', {
            original: materialUrl,
            processed: processedUrl,
            needsSpecialHandling
          });
          
          const instance = await WebViewer({
            path: '/webviewer/lib',
            initialDoc: processedUrl,
            licenseKey: process.env.REACT_APP_PDFTRON_LICENSE_KEY || '',
            // Performance optimizations
            enableAnnotations: false, // Disable for faster loading
            enableRedaction: false,
            enableMeasurement: false,
            enableFilePicker: false,
            enablePrint: true,
            enableDownload: true,
            enableFullAPI: false, // Disable full API for faster loading
            css: '/webviewer/lib/ui/index.css',
            // Stream loading for faster initial display
            streaming: true,
            streamingOptions: {
              enableStreaming: true,
              maxConcurrentRequests: 3,
              chunkSize: 1024 * 1024, // 1MB chunks
            },
            // Disable heavy features
            disabledElements: [
              'ribbons',
              'toolsHeader',
              'toolbarGroup-Insert',
              'toolbarGroup-Edit',
              'toolbarGroup-Forms',
              'toolbarGroup-FillAndSign',
              'toolbarGroup-Share',
              'annotationCommentButton',
              'annotationTextButton',
              'searchPanel',
              'thumbnailsPanel'
            ],
            // Optimize rendering
            renderOptions: {
              enableAnnotations: false,
              enableTextSelection: true,
              enableFormFilling: false,
              enableDigitalSignatures: false
            }
          }, viewerRef.current);

          setWebViewerInstance(instance);
          setWebViewerReady(true);

          // Configure for student view
          instance.UI.setToolbarGroup('toolbarGroup-View');
          instance.UI.disableElements(['toolbarGroup-Edit', 'toolbarGroup-Insert']);

          // Enable annotations only after document loads (lazy loading)
          instance.Core.documentViewer.addEventListener('documentLoaded', () => {
            console.log('Document loaded successfully in Enhanced Material Viewer');
            // Enable annotations after document is loaded for better performance
            if (process.env.REACT_APP_PDFTRON_LICENSE_KEY && process.env.REACT_APP_PDFTRON_LICENSE_KEY !== 'demo:1700000000000:your_key_here') {
              instance.UI.enableElements(['annotationCommentButton', 'annotationTextButton']);
            }
          });

          // Load document
          instance.UI.loadDocument(materialUrl);

        } catch (error) {
          console.error('Failed to initialize WebViewer:', error);
          setError('Failed to load document viewer. Please try downloading the file instead.');
        }
      };

      initializeWebViewer();
    }
  }, [materialUrl, userName]);

  // Track time spent
  useEffect(() => {
    if (webViewerReady && !startTimeRef.current) {
      startTimeRef.current = new Date();
      
      const interval = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 1000 / 60);
          setTimeSpent(elapsed);
          onTimeSpent?.(elapsed);
        }
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [webViewerReady, onTimeSpent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webViewerInstance) {
        webViewerInstance.UI.dispose();
      }
    };
  }, [webViewerInstance]);

  const handleDownload = () => {
    window.open(materialUrl, '_blank');
  };

  const handleAddComment = () => {
    if (webViewerInstance) {
      webViewerInstance.UI.enableElements(['annotationCommentButton']);
    }
  };

  const handleSearch = () => {
    if (webViewerInstance) {
      webViewerInstance.UI.openElements(['searchPanel']);
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<Download />}
          onClick={handleDownload}
        >
          Download Document
        </Button>
      </Box>
    );
  }

  if (!isWebViewerSupported(materialUrl)) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Box sx={{ mb: 2 }}>
          {getFileIcon(getFileType(materialUrl))}
        </Box>
        <Typography variant="h6" gutterBottom>
          {materialTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This file type ({getFileType(materialUrl).toUpperCase()}) is not supported for inline viewing.
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Download />}
          onClick={handleDownload}
        >
          Download Document
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        p: 2,
        backgroundColor: 'grey.50',
        borderRadius: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getFileIcon(getFileType(materialUrl))}
          <Typography variant="h6">
            {materialTitle}
          </Typography>
          <Chip 
            label={`${getFileType(materialUrl).toUpperCase()}`}
            size="small"
            color="primary"
            variant="outlined"
          />
          {webViewerReady && (
            <Chip 
              label="Universal Viewer"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {webViewerInstance && (
            <>
              <Tooltip title="Add Comment">
                <IconButton onClick={handleAddComment} color="primary">
                  <Assignment />
                </IconButton>
              </Tooltip>
              <Tooltip title="Search">
                <IconButton onClick={handleSearch} color="primary">
                  <Search />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Tooltip title="Download">
            <IconButton onClick={handleDownload} color="primary">
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton 
              onClick={() => setIsFullscreen(!isFullscreen)}
              color="primary"
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Viewer */}
      <Box sx={{ 
        width: '100%', 
        height: isFullscreen ? '100vh' : '70vh',
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'white',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto'
      }}>
        {!webViewerReady ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            gap: 2,
            p: 4
          }}>
            <CircularProgress size={60} />
            <Typography variant="body1" color="text.secondary">
              Loading universal document viewer...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supporting PDF, DOCX, PPTX, XLSX, and more formats
            </Typography>
          </Box>
        ) : (
          <div 
            ref={viewerRef}
            style={{ 
              width: '100%', 
              height: '100%',
              position: 'relative'
            }}
          />
        )}
      </Box>

      {/* Info */}
      <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Features:</strong> Annotations, Search, Zoom, Print, Download
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Time Spent:</strong> {timeSpent} minutes
        </Typography>
        {onComplete && timeSpent >= 5 && (
          <Button 
            variant="contained" 
            size="small" 
            onClick={onComplete}
            sx={{ mt: 1 }}
          >
            Mark as Complete
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default EnhancedMaterialViewer;
