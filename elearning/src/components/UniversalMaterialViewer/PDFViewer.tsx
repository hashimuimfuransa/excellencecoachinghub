import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import WebViewer from '@pdftron/webviewer';
import { getDocumentViewingUrl, needsCloudinarySpecialHandling } from '../../utils/cloudinaryUrlProcessor';

interface PDFViewerProps {
  url: string;
  title: string;
  height: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, title, height }) => {
  const viewer = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (viewer.current) {
      // Process URL for Cloudinary documents
      const processedUrl = getDocumentViewingUrl(url);
      const needsSpecialHandling = needsCloudinarySpecialHandling(url);
      
      console.log('PDFViewer initializing with URL:', {
        original: url,
        processed: processedUrl,
        needsSpecialHandling
      });
      
      WebViewer(
        {
          path: '/webviewer/lib',
          initialDoc: processedUrl,
          licenseKey: process.env.REACT_APP_PDFTRON_LICENSE_KEY || '',
          // Performance optimizations
          enableAnnotations: false,
          enableRedaction: false,
          enableMeasurement: false,
          enableFilePicker: false,
          enablePrint: true,
          enableDownload: true,
          enableFullAPI: false,
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
        },
        viewer.current
      ).then((instance) => {
        const { documentViewer, annotationManager } = instance.Core;
        
        documentViewer.addEventListener('documentLoaded', () => {
          setLoading(false);
          setError(null);
          console.log('PDF loaded successfully');
        });

        documentViewer.addEventListener('documentLoadError', (error: any) => {
          setError('Failed to load PDF document. Please try downloading the file instead.');
          setLoading(false);
          console.error('PDF load error:', error);
        });

        // Add timeout for loading
        setTimeout(() => {
          if (loading) {
            setError('PDF is taking too long to load. Please try downloading the file instead.');
            setLoading(false);
          }
        }, 30000); // 30 second timeout

      }).catch((err) => {
        setError('Failed to initialize PDF viewer. Please try downloading the file instead.');
        setLoading(false);
        console.error('WebViewer initialization error:', err);
      });
    }
  }, [url]);

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error" action={
          <Button onClick={() => window.open(url, '_blank')}>
            Download PDF
          </Button>
        }>
          {error}
        </Alert>
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
        >
          <CircularProgress />
        </Box>
      )}
      <div ref={viewer} style={{ height: '100%', width: '100%' }} />
    </Box>
  );
};

export default PDFViewer;
