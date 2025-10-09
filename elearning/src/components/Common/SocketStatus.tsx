import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import { 
  Wifi, 
  WifiOff, 
  Refresh, 
  Error as ErrorIcon,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { useSocket } from '../store/SocketContext';
import { socketConnectionManager } from '../utils/socketConnectionManager';

interface SocketStatusProps {
  showIcon?: boolean;
  showText?: boolean;
  compact?: boolean;
}

const SocketStatus: React.FC<SocketStatusProps> = ({ 
  showIcon = true, 
  showText = true, 
  compact = false 
}) => {
  const { socket, isConnected } = useSocket();
  const [lastError, setLastError] = React.useState<any>(null);

  // Listen for connection errors
  React.useEffect(() => {
    if (socket) {
      const handleConnectError = (error: any) => {
        setLastError(error);
      };

      socket.on('connect_error', handleConnectError);
      
      return () => {
        socket.off('connect_error', handleConnectError);
      };
    }
  }, [socket]);

  const handleReconnect = () => {
    if (socket && !isConnected) {
      socket.connect();
    }
  };

  const getStatusIcon = () => {
    if (isConnected) {
      return <CheckCircle color="success" fontSize="small" />;
    }
    
    if (lastError && !socketConnectionManager.isRecoverableError(lastError)) {
      return <ErrorIcon color="error" fontSize="small" />;
    }
    
    return <Warning color="warning" fontSize="small" />;
  };

  const getStatusText = () => {
    return socketConnectionManager.getConnectionStatusMessage(isConnected, lastError);
  };

  const getStatusColor = () => {
    return socketConnectionManager.getConnectionStatusColor(isConnected, lastError);
  };

  if (compact) {
    return (
      <Tooltip title={getStatusText()}>
        <IconButton size="small" onClick={handleReconnect} disabled={isConnected}>
          {getStatusIcon()}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {showIcon && getStatusIcon()}
      {showText && (
        <Chip
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          variant="outlined"
          onClick={handleReconnect}
          disabled={isConnected}
          icon={isConnected ? <Wifi /> : <WifiOff />}
        />
      )}
    </Box>
  );
};

export default SocketStatus;
