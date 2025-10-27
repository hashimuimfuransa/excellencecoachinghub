import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Schedule,
  Refresh,
  SmartToy,
  QuestionAnswer
} from '@mui/icons-material';
import { assignmentService } from '../../services/assignmentService';

interface AIProcessingStatusProps {
  assignmentId: string;
  onStatusUpdate?: (status: string, questionsCount: number) => void;
  autoRefresh?: boolean;
}

interface ProcessingStatus {
  aiProcessingStatus: string;
  questionsCount: number;
  extractedQuestionsCount: number;
  hasQuestions: boolean;
  processingError?: string;
  lastUpdated: string;
}

const AIProcessingStatus: React.FC<AIProcessingStatusProps> = ({
  assignmentId,
  onStatusUpdate,
  autoRefresh = true
}) => {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await assignmentService.checkAIProcessingStatus(assignmentId);
      if (response.success) {
        setStatus(response.data);
        setError(null);
        
        // Notify parent component of status update
        if (onStatusUpdate) {
          onStatusUpdate(response.data.aiProcessingStatus, response.data.questionsCount);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check processing status');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const response = await assignmentService.retryQuestionExtraction(assignmentId);
      if (response.success) {
        // Update status to pending immediately
        setStatus(prev => prev ? { 
          ...prev, 
          aiProcessingStatus: 'pending',
          processingError: undefined 
        } : null);
        
        // Start auto-refresh to monitor progress
        setTimeout(() => {
          fetchStatus();
        }, 2000);
        
        // Show success message
        alert('Question extraction has started! The status will update automatically as processing completes.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start question extraction');
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Auto-refresh for pending status
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh && status?.aiProcessingStatus === 'pending') {
      interval = setInterval(fetchStatus, 5000); // Check every 5 seconds for faster updates
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [assignmentId, autoRefresh, status?.aiProcessingStatus]);

  const getStatusInfo = () => {
    if (!status) return null;

    switch (status.aiProcessingStatus) {
      case 'pending':
        return {
          icon: <Schedule color="info" />,
          title: 'Processing Questions',
          message: 'AI is extracting questions from your document...',
          color: 'info' as const,
          showProgress: true
        };
      case 'completed':
        return {
          icon: <CheckCircle color="success" />,
          title: 'Questions Extracted',
          message: `Successfully extracted ${status.extractedQuestionsCount} questions from document`,
          color: 'success' as const,
          showProgress: false
        };
      case 'failed':
        return {
          icon: <Error color="error" />,
          title: 'Processing Failed',
          message: status.processingError || 'AI question extraction failed',
          color: 'error' as const,
          showProgress: false,
          showRetry: true
        };
      case 'no_questions_found':
        return {
          icon: <QuestionAnswer color="warning" />,
          title: 'No Questions Found',
          message: 'AI could not find questions in the document. You can add questions manually.',
          color: 'warning' as const,
          showProgress: false,
          showRetry: true
        };
      default:
        return {
          icon: <SmartToy color="disabled" />,
          title: 'Not Started',
          message: 'AI processing has not started yet',
          color: 'default' as const,
          showProgress: false
        };
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SmartToy color="disabled" />
            <Typography>Checking AI processing status...</Typography>
          </Box>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="h6">Status Check Failed</Typography>
        <Typography>{error}</Typography>
        <Button onClick={fetchStatus} startIcon={<Refresh />} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!status) return null;

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  return (
    <Card sx={{ mb: 2, borderLeft: `4px solid ${
      statusInfo.color === 'info' ? '#2196f3' : 
      statusInfo.color === 'success' ? '#4caf50' : 
      statusInfo.color === 'error' ? '#f44336' : 
      statusInfo.color === 'warning' ? '#ff9800' : '#9e9e9e'
    }` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {statusInfo.icon}
            <Box>
              <Typography variant="h6" gutterBottom>
                {statusInfo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statusInfo.message}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Chip 
                  label={`Status: ${status.aiProcessingStatus.replace('_', ' ').toUpperCase()}`}
                  color={statusInfo.color}
                  size="small"
                  variant="outlined"
                />
                {status.questionsCount > 0 && (
                  <Chip 
                    label={`${status.questionsCount} Questions`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {statusInfo.showRetry && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleRetry}
                disabled={retrying}
                startIcon={<Refresh />}
                color={statusInfo.color}
              >
                {retrying ? 'Retrying...' : 'Retry'}
              </Button>
            )}
            
            <Tooltip title="Refresh Status">
              <IconButton onClick={fetchStatus} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {statusInfo.showProgress && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Processing time: 1-3 minutes • Status updates every 5 seconds • Last checked: {new Date(status.lastUpdated).toLocaleTimeString()}
            </Typography>
          </Box>
        )}
        
        {status.aiProcessingStatus === 'pending' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Processing in progress:</strong> AI is analyzing your document and extracting questions. 
              This typically takes 1-3 minutes. The page will automatically update when complete - no need to refresh manually!
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AIProcessingStatus;