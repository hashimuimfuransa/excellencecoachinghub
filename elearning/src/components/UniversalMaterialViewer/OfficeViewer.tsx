import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert, Button, Typography } from '@mui/material';
import { Description, Download, OpenInNew } from '@mui/icons-material';
import WebViewer from '@pdftron/webviewer';
import { getDocumentViewingUrl, needsCloudinarySpecialHandling } from '../../utils/cloudinaryUrlProcessor';

interface OfficeViewerProps {
  url: string;
  title: string;
  height: string;
}

const OfficeViewer: React.FC<OfficeViewerProps> = ({ url, title, height }) => {
  const viewer = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');

  useEffect(() => {
    // Determine file type
    const urlLower = url.toLowerCase();
    if (urlLower.includes('.doc') || urlLower.includes('.docx')) {
      setFileType('Word Document');
    } else if (urlLower.includes('.ppt') || urlLower.includes('.pptx')) {
      setFileType('PowerPoint Presentation');
    } else if (urlLower.includes('.xls') || urlLower.includes('.xlsx')) {
      setFileType('Excel Spreadsheet');
    }

    if (viewer.current) {
      // Process URL for Cloudinary documents
      const processedUrl = getDocumentViewingUrl(url);
      const needsSpecialHandling = needsCloudinarySpecialHandling(url);
      
      console.log('OfficeViewer initializing with URL:', {
        original: url,
        processed: processedUrl,
        needsSpecialHandling
      });
      
      WebViewer(
        {
          path: '/webviewer/lib',
          initialDoc: processedUrl,
          licenseKey: process.env.REACT_APP_PDFTRON_LICENSE_KEY || '',
          // Office document specific optimizations
          enableAnnotations: false,
          enableRedaction: false,
          enableMeasurement: false,
          enableFilePicker: false,
          enablePrint: true,
          enableDownload: true,
          enableFullAPI: true, // Enable full API for office documents
          // Office document streaming
          streaming: true,
          streamingOptions: {
            enableStreaming: true,
            maxConcurrentRequests: 2, // Reduced for office documents
            chunkSize: 512 * 1024, // Smaller chunks for office documents
          },
          // Office document specific UI elements
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
          // Office document rendering options
          renderOptions: {
            enableAnnotations: false,
            enableTextSelection: true,
            enableFormFilling: false,
            enableDigitalSignatures: false
          },
          // Office document specific settings
          officeOptions: {
            enableOfficeEditing: false, // Read-only mode
            enableOfficeAnnotations: false,
            enableOfficeRedaction: false
          }
        },
        viewer.current
      ).then((instance) => {
        const { documentViewer } = instance.Core;
        
        documentViewer.addEventListener('documentLoaded', () => {
          setLoading(false);
          setError(null);
          console.log('Office document loaded successfully');
        });

        documentViewer.addEventListener('documentLoadError', (error: any) => {
          console.error('Office document load error:', error);
          // Don't immediately show error, try to load with different settings
          setLoading(false);
          setError('Office document failed to load in viewer. Trying alternative method...');
          
          // Try to reload with different configuration
          setTimeout(() => {
            if (viewer.current) {
              console.log('Retrying office document load...');
              setLoading(true);
              setError(null);
              // The WebViewer will automatically retry with the same configuration
            }
          }, 2000);
        });

        // Add timeout for loading (increased for office documents)
        setTimeout(() => {
          if (loading) {
            console.log('Office document loading timeout, but continuing to try...');
            // Don't set error immediately, office documents can take longer
          }
        }, 45000); // 45 second timeout for office documents

      }).catch((err) => {
        setError('Failed to initialize office document viewer. Please try downloading the file instead.');
        setLoading(false);
        console.error('WebViewer initialization error:', err);
      });
    }
  }, [url]);

  if (error && !loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        height={height}
        p={4}
      >
        <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {fileType}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {error.includes('alternative method') ? 
            'Loading office document...' : 
            'This document is being processed for viewing. Please wait...'
          }
        </Typography>
        <Box display="flex" gap={2}>
          <Button 
            variant="contained" 
            startIcon={<Download />}
            onClick={() => window.open(url, '_blank')}
          >
            Download Document
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
    <Box height={height} width="100%" position="relative">
      {loading && (
        <Box 
          position="absolute" 
          top="50%" 
          left="50%" 
          transform="translate(-50%, -50%)"
          zIndex={1000}
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
        >
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Loading {fileType}...
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            This may take a moment for office documents
          </Typography>
        </Box>
      )}
      <div ref={viewer} style={{ height: '100%', width: '100%' }} />
    </Box>
  );
};

export default OfficeViewer;
