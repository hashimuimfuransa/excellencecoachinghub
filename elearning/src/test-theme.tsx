import React from 'react';
import { Button, Chip } from '@mui/material';
import { PlayArrow, CheckCircle } from '@mui/icons-material';

// Test component to verify theme fixes
const TestTheme: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Theme Test - All buttons should work without errors</h2>
      
      {/* Test Button with hardcoded colors */}
      <Button
        startIcon={<PlayArrow />}
        sx={{
          backgroundColor: '#1976d2',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '4px',
          textTransform: 'none',
          fontWeight: 500,
          margin: '8px',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        }}
      >
        Start Assessment (Primary)
      </Button>

      <Button
        sx={{
          backgroundColor: '#4caf50',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '4px',
          textTransform: 'none',
          fontWeight: 500,
          margin: '8px',
          '&:hover': {
            backgroundColor: '#388e3c',
          },
        }}
      >
        Success Button
      </Button>

      <Button
        disabled
        sx={{
          backgroundColor: '#cccccc',
          color: '#666666',
          padding: '8px 16px',
          borderRadius: '4px',
          textTransform: 'none',
          fontWeight: 500,
          margin: '8px',
          cursor: 'not-allowed',
        }}
      >
        Disabled Button
      </Button>

      {/* Test Chips with hardcoded colors */}
      <div style={{ marginTop: '20px' }}>
        <Chip
          size="small"
          icon={<CheckCircle />}
          label="Success Chip"
          sx={{
            backgroundColor: '#4caf50',
            color: '#ffffff',
            margin: '4px',
          }}
        />

        <Chip
          size="small"
          label="Error Chip"
          sx={{
            backgroundColor: '#f44336',
            color: '#ffffff',
            margin: '4px',
          }}
        />
      </div>
    </div>
  );
};

export default TestTheme;