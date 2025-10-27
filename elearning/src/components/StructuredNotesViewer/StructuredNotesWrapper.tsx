import React, { useState, useEffect } from 'react';
import { Box, Alert, Button, CircularProgress, Typography } from '@mui/material';
import { Refresh, ErrorOutline } from '@mui/icons-material';
import IndependentStructuredNotesViewer from './IndependentStructuredNotesViewer';
import { StructuredNotes } from '../../services/documentProcessorService';

interface StructuredNotesWrapperProps {
  // Material data props
  material?: any;
  content?: any;
  title: string;
  height?: string;
  onTimeSpent?: (timeSpent: number) => void;
  onComplete?: () => void;
  showProgress?: boolean;
  userId?: string;
  
  // Data processing options
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  validateContent?: boolean;
  
  // Navigation
  onBack?: () => void;
}

interface ProcessedStructuredNotes {
  notes: StructuredNotes | null;
  error: string | null;
  loading: boolean;
  retryCount: number;
}

const StructuredNotesWrapper: React.FC<StructuredNotesWrapperProps> = ({
  material,
  content,
  title,
  height = '70vh',
  onTimeSpent,
  onComplete,
  showProgress = false,
  userId,
  autoRetry = true,
  maxRetries = 3,
  retryDelay = 2000,
  validateContent = true,
  onBack
}) => {
  const [processedData, setProcessedData] = useState<ProcessedStructuredNotes>({
    notes: null,
    error: null,
    loading: true,
    retryCount: 0
  });

  // Validate structured notes content
  const validateStructuredNotes = (data: any): { isValid: boolean; error?: string; notes?: StructuredNotes } => {
    if (!data) {
      return { isValid: false, error: 'No content data provided' };
    }

    // Check if it's a valid StructuredNotes object
    if (typeof data === 'object' && data.title && data.sections && Array.isArray(data.sections)) {
      // Validate sections structure
      const invalidSections = data.sections.filter((section: any) => 
        !section.title || !section.content || !Array.isArray(section.keyPoints)
      );
      
      if (invalidSections.length > 0) {
        return { 
          isValid: false, 
          error: `Invalid section structure found. ${invalidSections.length} sections have missing required fields.` 
        };
      }

      return { isValid: true, notes: data as StructuredNotes };
    }

    return { isValid: false, error: 'Invalid structured notes format. Expected object with title and sections array.' };
  };

  // Process and extract structured notes from various sources
  const processStructuredNotes = async (): Promise<ProcessedStructuredNotes> => {
    try {
      console.log('🔄 Processing structured notes data:', {
        hasMaterial: !!material,
        hasContent: !!content,
        materialType: material?.type,
        hasStructuredNotes: !!material?.content?.structuredNotes
      });

      let notesData: any = null;

      // Priority 1: Direct content prop
      if (content) {
        // Check if content itself is structured notes
        if (content.title && content.sections) {
          notesData = content;
        }
        // Check if content has nested structuredNotes
        else if (content.structuredNotes) {
          notesData = content.structuredNotes;
        }
      }

      // Priority 2: Material content
      if (!notesData && material?.content) {
        // Check if material.content itself is structured notes
        if (material.content.title && material.content.sections) {
          notesData = material.content;
        }
        // Check if material.content has nested structuredNotes
        else if (material.content.structuredNotes) {
          notesData = material.content.structuredNotes;
        }
      }

      // Priority 3: Material itself (for backward compatibility)
      if (!notesData && material && material.title && material.sections) {
        notesData = material;
      }

      console.log('📋 Extracted notes data:', {
        hasNotesData: !!notesData,
        notesDataKeys: notesData ? Object.keys(notesData) : [],
        notesDataTitle: notesData?.title,
        sectionsCount: notesData?.sections?.length
      });

      if (!notesData) {
        return {
          notes: null,
          error: 'No structured notes data found in the provided content or material.',
          loading: false,
          retryCount: 0
        };
      }

      // Validate the extracted data
      if (validateContent) {
        const validation = validateStructuredNotes(notesData);
        if (!validation.isValid) {
          return {
            notes: null,
            error: validation.error || 'Invalid structured notes format',
            loading: false,
            retryCount: 0
          };
        }
        notesData = validation.notes;
      }

      return {
        notes: notesData,
        error: null,
        loading: false,
        retryCount: 0
      };

    } catch (error: any) {
      console.error('❌ Error processing structured notes:', error);
      return {
        notes: null,
        error: `Failed to process structured notes: ${error.message}`,
        loading: false,
        retryCount: 0
      };
    }
  };

  // Load and process structured notes
  useEffect(() => {
    const loadStructuredNotes = async () => {
      setProcessedData(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await processStructuredNotes();
      setProcessedData(result);
    };

    loadStructuredNotes();
  }, [material, content, validateContent]);

  // Auto-retry functionality
  useEffect(() => {
    if (processedData.error && autoRetry && processedData.retryCount < maxRetries) {
      const timer = setTimeout(() => {
        console.log(`🔄 Auto-retrying structured notes processing (attempt ${processedData.retryCount + 1}/${maxRetries})`);
        setProcessedData(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
        
        const retry = async () => {
          const result = await processStructuredNotes();
          setProcessedData(prev => ({ ...result, retryCount: prev.retryCount }));
        };
        
        retry();
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [processedData.error, processedData.retryCount, autoRetry, maxRetries, retryDelay]);

  // Manual retry function
  const handleRetry = async () => {
    setProcessedData(prev => ({ ...prev, loading: true, error: null, retryCount: 0 }));
    const result = await processStructuredNotes();
    setProcessedData(result);
  };

  // Loading state
  if (processedData.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Processing structured notes...
          </Typography>
          {processedData.retryCount > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Retry attempt {processedData.retryCount}/{maxRetries}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  // Error state
  if (processedData.error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={height} p={3}>
        <Alert 
          severity="error" 
          sx={{ mb: 2, maxWidth: 600 }}
          icon={<ErrorOutline />}
        >
          <Typography variant="h6" gutterBottom>
            Failed to Load Structured Notes
          </Typography>
          <Typography variant="body2" paragraph>
            {processedData.error}
          </Typography>
          {processedData.retryCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              Retry attempts: {processedData.retryCount}/{maxRetries}
            </Typography>
          )}
        </Alert>
        
        <Box display="flex" gap={2}>
          <Button 
            variant="contained" 
            onClick={handleRetry}
            startIcon={<Refresh />}
            disabled={processedData.retryCount >= maxRetries}
          >
            {processedData.retryCount >= maxRetries ? 'Max Retries Reached' : 'Retry'}
          </Button>
          
          {processedData.retryCount >= maxRetries && (
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  // Success state - render the structured notes viewer
  if (processedData.notes) {
    return (
      <IndependentStructuredNotesViewer
        structuredNotes={processedData.notes}
        title={title}
        height={height}
        onTimeSpent={onTimeSpent}
        onComplete={onComplete}
        showProgress={showProgress}
        userId={userId}
        onBack={onBack}
      />
    );
  }

  // Fallback state (should not reach here)
  return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={height} p={3}>
      <Alert severity="warning" sx={{ mb: 2, maxWidth: 500 }}>
        <Typography variant="h6" gutterBottom>
          No Content Available
        </Typography>
        <Typography variant="body2" paragraph>
          Unable to process the structured notes content.
        </Typography>
      </Alert>
      <Button variant="contained" onClick={handleRetry} startIcon={<Refresh />}>
        Try Again
      </Button>
    </Box>
  );
};

export default StructuredNotesWrapper;
