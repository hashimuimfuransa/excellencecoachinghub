import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import WebViewer from '@pdftron/webviewer';
import PDFViewer from './PDFViewer';
import OfficeViewer from './OfficeViewer';
import MediaViewer from './MediaViewer';
import ImageViewer from './ImageViewer';
import StructuredNotesViewer from './StructuredNotesViewer';

interface UniversalMaterialViewerProps {
  url: string;
  title: string;
  type: string;
  height?: string;
  content?: any; // For structured notes content
  onTimeSpent?: (timeSpent: number) => void;
  onComplete?: () => void;
  showProgress?: boolean;
  userId?: string;
}

const UniversalMaterialViewer: React.FC<UniversalMaterialViewerProps> = ({
  url,
  title,
  type,
  height = '70vh',
  content,
  onTimeSpent,
  onComplete,
  showProgress,
  userId
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<'pdf' | 'office' | 'media' | 'image' | 'structured_notes' | 'other'>('other');

  useEffect(() => {
    determineViewerType();
  }, [url, type]);

  const determineViewerType = () => {
    // Check if it's structured notes first
    if (type === 'structured_notes' && content?.structuredNotes) {
      setViewerType('structured_notes');
      setLoading(false);
      return;
    }
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.pdf')) {
      setViewerType('pdf');
    } else if (urlLower.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/)) {
      setViewerType('office');
    } else if (urlLower.match(/\.(mp4|avi|mov|wmv|flv|webm|mp3|wav|ogg)$/)) {
      setViewerType('media');
    } else if (urlLower.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/)) {
      setViewerType('image');
    } else {
      setViewerType('other');
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error" action={
          <Button onClick={() => window.open(url, '_blank')}>
            Open in New Tab
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  const renderViewer = () => {
    switch (viewerType) {
      case 'structured_notes':
        return (
          <StructuredNotesViewer
            notes={content.structuredNotes}
            title={title}
            height={height}
            onTimeSpent={onTimeSpent}
            onComplete={onComplete}
            showProgress={showProgress}
            userId={userId}
          />
        );
      case 'pdf':
        return <PDFViewer url={url} title={title} height={height} />;
      case 'office':
        return <OfficeViewer url={url} title={title} height={height} />;
      case 'media':
        return <MediaViewer url={url} title={title} height={height} />;
      case 'image':
        return <ImageViewer url={url} title={title} height={height} />;
      default:
        return (
          <Box display="flex" justifyContent="center" alignItems="center" height={height}>
            <Button variant="contained" onClick={() => window.open(url, '_blank')}>
              Open {title}
            </Button>
          </Box>
        );
    }
  };

  return (
    <Box height={height} width="100%">
      {renderViewer()}
    </Box>
  );
};

export default UniversalMaterialViewer;

