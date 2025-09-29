/**
 * D-ID Real-Time API Test Component
 * Demonstrates the new avatar response functionality
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  VideoCall,
  Psychology
} from '@mui/icons-material';
import { avatarResponseHandler, AvatarResponse } from '../services/avatarResponseHandler';
import { didRealTimeService } from '../services/didRealTimeService';

const DIDRealTimeTest: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AvatarResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servicesStatus, setServicesStatus] = useState<{ did: boolean; talkavatar: boolean } | null>(null);

  const testQuestion = "What are your greatest strengths?";

  const handleTestQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      const avatarResponse = await avatarResponseHandler.processQuestion(question);
      setResponse(avatarResponse);

    } catch (error) {
      console.error('Test failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = async () => {
    setQuestion(testQuestion);
    await handleTestQuestion();
  };

  const checkServices = async () => {
    try {
      const status = await avatarResponseHandler.checkServices();
      setServicesStatus(status);
    } catch (error) {
      console.error('Failed to check services:', error);
    }
  };

  const testDIDConnection = async () => {
    try {
      setLoading(true);
      const result = await didRealTimeService.testConnection();
      
      if (result.success) {
        setError(null);
        alert('D-ID Real-Time API connection successful!');
      } else {
        setError(`D-ID connection failed: ${result.error}`);
      }
    } catch (error) {
      setError(`D-ID test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
        D-ID Real-Time API Test
      </Typography>

      {/* Services Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Services Status
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button 
              variant="outlined" 
              onClick={checkServices}
              startIcon={<Psychology />}
            >
              Check Services
            </Button>
            <Button 
              variant="outlined" 
              onClick={testDIDConnection}
              startIcon={<VideoCall />}
              disabled={loading}
            >
              Test D-ID Connection
            </Button>
          </Stack>
          
          {servicesStatus && (
            <Stack direction="row" spacing={2}>
              <Chip 
                label={`D-ID: ${servicesStatus.did ? 'Available' : 'Unavailable'}`}
                color={servicesStatus.did ? 'success' : 'error'}
              />
              <Chip 
                label={`TalkAvatar: ${servicesStatus.talkavatar ? 'Available' : 'Unavailable'}`}
                color={servicesStatus.talkavatar ? 'success' : 'error'}
              />
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Test Interface */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Test Avatar Response
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Enter a question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are your greatest strengths?"
            sx={{ mb: 2 }}
          />
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleTestQuestion}
              disabled={loading || !question.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
            >
              {loading ? 'Processing...' : 'Test Response'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleQuickTest}
              disabled={loading}
            >
              Quick Test
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Response Display */}
      {response && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Avatar Response
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                "{response.text}"
              </Typography>
            </Paper>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2">Avatar Service:</Typography>
              <Chip 
                label={response.avatar === 'did' ? 'D-ID Real-Time' : 'TalkAvatar'} 
                color={response.avatar === 'did' ? 'success' : 'warning'}
                icon={response.avatar === 'did' ? <VideoCall /> : <Psychology />}
              />
            </Stack>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              JSON Response Format:
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', fontFamily: 'monospace' }}>
              <pre style={{ margin: 0, fontSize: '0.9rem' }}>
                {JSON.stringify(response, null, 2)}
              </pre>
            </Paper>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            How It Works
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            1. <strong>D-ID Real-Time API</strong> is tried first for live video chat experience
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            2. If D-ID fails, <strong>TalkAvatar</strong> is used as fallback
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            3. Response is returned in the required JSON format: <code>{"{text: string, avatar: 'did' | 'talkavatar'}"}</code>
          </Typography>
          <Typography variant="body2">
            4. Text is optimized for text-to-speech with natural, professional responses
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DIDRealTimeTest;
