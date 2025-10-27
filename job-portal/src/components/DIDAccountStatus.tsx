/**
 * D-ID Account Status Debug Component
 * Helps check D-ID account status and credits
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  AccountBalance
} from '@mui/icons-material';
import { didRealTimeService } from '../services/didRealTimeService';

interface AccountStatus {
  success: boolean;
  credits?: number;
  error?: string;
}

const DIDAccountStatus: React.FC = () => {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const result = await didRealTimeService.checkAccountStatus();
      setStatus(result);
      setLastChecked(new Date());
    } catch (error) {
      setStatus({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusIcon = () => {
    if (loading) return <CircularProgress size={20} />;
    if (!status) return <Error color="error" />;
    if (status.success) return <CheckCircle color="success" />;
    return <Error color="error" />;
  };

  const getStatusColor = () => {
    if (loading) return 'default';
    if (!status) return 'error';
    if (status.success) return 'success';
    return 'error';
  };

  const getCreditsColor = () => {
    if (!status?.credits) return 'default';
    if (status.credits > 100) return 'success';
    if (status.credits > 10) return 'warning';
    return 'error';
  };

  return (
    <Card sx={{ maxWidth: 500, margin: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <AccountBalance />
            <Typography variant="h6">D-ID Account Status</Typography>
            {getStatusIcon()}
          </Box>

          {status && (
            <>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Status: 
                  <Chip 
                    label={status.success ? 'Connected' : 'Error'} 
                    color={getStatusColor() as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Box>

              {status.success && status.credits !== undefined && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Credits: 
                    <Chip 
                      label={`${status.credits} remaining`} 
                      color={getCreditsColor() as any}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              )}

              {status.error && (
                <Alert severity="error">
                  <Typography variant="body2">
                    {status.error}
                  </Typography>
                </Alert>
              )}

              {status.success && status.credits !== undefined && (
                <>
                  {status.credits <= 0 && (
                    <Alert severity="error">
                      <Typography variant="body2">
                        No credits remaining! The system will automatically use TalkAvatar.
                      </Typography>
                    </Alert>
                  )}
                  {status.credits > 0 && status.credits <= 10 && (
                    <Alert severity="warning">
                      <Typography variant="body2">
                        Low credits remaining. Consider adding more credits to your D-ID account.
                      </Typography>
                    </Alert>
                  )}
                  {status.credits > 10 && (
                    <Alert severity="success">
                      <Typography variant="body2">
                        Credits available. D-ID will be used as the primary avatar service.
                      </Typography>
                    </Alert>
                  )}
                </>
              )}
            </>
          )}

          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={checkStatus}
              disabled={loading}
              size="small"
            >
              Refresh Status
            </Button>
          </Box>

          {lastChecked && (
            <Typography variant="caption" color="text.secondary">
              Last checked: {lastChecked.toLocaleTimeString()}
            </Typography>
          )}

          <Box>
            <Typography variant="body2" color="text.secondary">
              💡 <strong>How it works:</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              • D-ID is checked first for avatar generation<br/>
              • If credits are insufficient, TalkAvatar is used automatically<br/>
              • No user intervention required - seamless fallback
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DIDAccountStatus;
