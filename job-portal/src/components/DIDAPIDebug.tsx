/**
 * D-ID API Debug Component
 * Helps debug D-ID API configuration and connection
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
  Stack,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Videocam,
  Psychology
} from '@mui/icons-material';
import { didRealTimeService } from '../services/didRealTimeService';
import { avatarResponseHandler } from '../services/avatarResponseHandler';

const DIDAPIDebug: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = () => {
    console.log('🔧 Checking D-ID API Configuration...');
    
    const config = {
      apiKey: import.meta.env.VITE_DID_API_KEY,
      apiUrl: import.meta.env.VITE_DID_API_URL,
      isConfigured: didRealTimeService.isConfigured()
    };
    
    console.log('📋 Configuration Status:', config);
    setConfigStatus(config);
  };

  const testDIDConnection = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      console.log('🧪 Testing D-ID API Connection...');
      
      // Test 1: Check if service is configured
      const isConfigured = didRealTimeService.isConfigured();
      console.log('✅ Service configured:', isConfigured);
      
      if (!isConfigured) {
        throw new Error('D-ID service is not properly configured. Check your API key.');
      }
      
      // Test 2: Test API connection
      const connectionTest = await didRealTimeService.testConnection();
      console.log('🔗 Connection test result:', connectionTest);
      
      // Test 3: Test avatar response generation
      const avatarResponse = await avatarResponseHandler.processQuestion('Hello, this is a test question for D-ID API.');
      console.log('🤖 Avatar response:', avatarResponse);
      
      setTestResult({
        isConfigured,
        connectionTest,
        avatarResponse,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ D-ID API Test Failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle color="success" /> : <Error color="error" />;
  };

  const getStatusChip = (status: boolean, label: string) => {
    return (
      <Chip
        icon={getStatusIcon(status)}
        label={label}
        color={status ? 'success' : 'error'}
        variant={status ? 'filled' : 'outlined'}
      />
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Videocam color="primary" />
        D-ID API Debug Console
      </Typography>
      
      {/* Configuration Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology color="primary" />
            Configuration Status
          </Typography>
          
          {configStatus && (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getStatusChip(configStatus.isConfigured, 'Service Configured')}
                {getStatusChip(!!configStatus.apiKey, 'API Key Present')}
                {getStatusChip(!!configStatus.apiUrl, 'API URL Present')}
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  <strong>API URL:</strong> {configStatus.apiUrl || 'Not set'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>API Key:</strong> {configStatus.apiKey ? `${configStatus.apiKey.substring(0, 8)}...` : 'Not set'}
                </Typography>
              </Box>
            </Stack>
          )}
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={checkConfiguration}
            sx={{ mt: 2 }}
          >
            Refresh Configuration
          </Button>
        </CardContent>
      </Card>
      
      {/* Test Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            API Connection Test
          </Typography>
          
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircle />}
            onClick={testDIDConnection}
            disabled={isLoading}
            sx={{ mb: 2 }}
          >
            {isLoading ? 'Testing...' : 'Test D-ID API Connection'}
          </Button>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Error:</strong> {error}
              </Typography>
            </Alert>
          )}
          
          {testResult && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Test completed at:</strong> {new Date(testResult.timestamp).toLocaleString()}
                </Typography>
              </Alert>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2">Service Configuration:</Typography>
                  {getStatusChip(testResult.isConfigured, testResult.isConfigured ? 'Configured' : 'Not Configured')}
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Connection Test:</Typography>
                  {getStatusChip(testResult.connectionTest.success, testResult.connectionTest.success ? 'Connected' : 'Failed')}
                  {testResult.connectionTest.error && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      Error: {testResult.connectionTest.error}
                    </Typography>
                  )}
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Avatar Response:</Typography>
                  <Chip
                    icon={getStatusIcon(testResult.avatarResponse.avatar === 'did')}
                    label={`Avatar: ${testResult.avatarResponse.avatar}`}
                    color={testResult.avatarResponse.avatar === 'did' ? 'success' : 'warning'}
                    variant="outlined"
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Response Text:</strong> {testResult.avatarResponse.text}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Instructions */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Setup Instructions
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            To use D-ID Real-Time API, you need to:
          </Typography>
          
          <Box component="ol" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Get your API key from <a href="https://www.d-id.com/" target="_blank" rel="noopener noreferrer">D-ID</a>
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Create a <code>.env</code> file in the <code>job-portal</code> directory
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Add: <code>VITE_DID_API_KEY=sk-your_actual_api_key_here</code>
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Restart your development server
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> The .env file is ignored by git for security. 
              Make sure to add your actual API key to the .env file.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DIDAPIDebug;
