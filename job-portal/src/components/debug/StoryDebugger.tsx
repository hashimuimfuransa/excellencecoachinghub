import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  TextField,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { enhancedStoryService } from '../../services/enhancedStoryService';

const StoryDebugger: React.FC = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [createStoryTitle, setCreateStoryTitle] = useState('Test Story');
  const [createStoryContent, setCreateStoryContent] = useState('This is a test story to verify functionality');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log('StoryDebugger:', message);
  };

  const checkStorageConsistency = () => {
    addLog('Checking storage consistency...');
    enhancedStoryService.repairStorageConsistency();
  };

  const loadStories = async () => {
    addLog('Loading user stories...');
    try {
      const response = await enhancedStoryService.getUserStories();
      if (response.success && response.data) {
        const storiesData = Array.isArray(response.data) ? response.data : [response.data];
        setStories(storiesData);
        addLog(`Loaded ${storiesData.length} stories`);
      } else {
        setStories([]);
        addLog(`Failed to load stories: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      addLog(`Error loading stories: ${error}`);
      setStories([]);
    }
  };

  const getDebugInfo = () => {
    addLog('Getting debug info...');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    // Get all story-related keys from localStorage
    const allKeys = Object.keys(localStorage);
    const storyKeys = allKeys.filter(key => 
      key.includes('stories') || key.includes('Stories')
    );
    
    const storyData: any = {};
    storyKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          storyData[key] = Array.isArray(parsed) ? parsed.length : 'Not array';
        } catch {
          storyData[key] = 'Invalid JSON';
        }
      }
    });

    const info = {
      currentUser: {
        _id: currentUser._id,
        id: currentUser.id,
        email: currentUser.email,
        googleId: currentUser.googleId,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName
      },
      token: token?.substring(0, 20) + '...',
      storyKeys: storyKeys,
      storyData: storyData,
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(info);
    addLog('Debug info updated');
  };

  const createTestStory = async () => {
    addLog('Creating test story...');
    try {
      const storyData = {
        type: 'achievement' as const,
        title: createStoryTitle,
        content: createStoryContent,
        tags: ['test', 'debugging'],
        visibility: 'public' as const
      };

      const response = await enhancedStoryService.createStory(storyData);
      if (response.success) {
        addLog('Story created successfully!');
        await loadStories(); // Reload stories
      } else {
        addLog(`Failed to create story: ${response.error}`);
      }
    } catch (error) {
      addLog(`Error creating story: ${error}`);
    }
  };

  const checkEligibility = async () => {
    addLog('Checking story creation eligibility...');
    try {
      const eligibility = await enhancedStoryService.canUserCreateStory();
      addLog(`Can create story: ${eligibility.canCreate}`);
      if (!eligibility.canCreate) {
        addLog(`Reason: ${eligibility.error || 'Unknown'}`);
        if (eligibility.remainingTime) {
          addLog(`Remaining time: ${eligibility.remainingTime}`);
        }
      }
    } catch (error) {
      addLog(`Error checking eligibility: ${error}`);
    }
  };

  const clearAllStories = () => {
    addLog('Clearing all stories from localStorage...');
    const allKeys = Object.keys(localStorage);
    const storyKeys = allKeys.filter(key => 
      key.includes('stories') || key.includes('Stories')
    );
    
    storyKeys.forEach(key => {
      localStorage.removeItem(key);
      addLog(`Removed key: ${key}`);
    });
    
    setStories([]);
    addLog('All stories cleared');
  };

  const initializeMockUser = () => {
    // Check if we already have a user
    const existingUser = localStorage.getItem('user');
    if (!existingUser || existingUser === '{}') {
      // Create a mock user for testing
      const mockUser = {
        _id: 'debug_user_123',
        id: 'debug_user_123',
        email: 'debug@test.com',
        firstName: 'Debug',
        lastName: 'User',
        authProvider: 'google',
        googleId: 'debug_google_123'
      };
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'google_debug_token_123');
      addLog('Mock user created for testing');
    } else {
      addLog('Existing user found');
    }
  };

  useEffect(() => {
    initializeMockUser();
    getDebugInfo();
    loadStories();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Story System Debugger
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" onClick={checkStorageConsistency}>
                Repair Storage Consistency
              </Button>
              <Button variant="outlined" onClick={getDebugInfo}>
                Get Debug Info
              </Button>
              <Button variant="outlined" onClick={loadStories}>
                Load Stories
              </Button>
              <Button variant="outlined" onClick={checkEligibility}>
                Check Eligibility
              </Button>
              <Divider sx={{ my: 1 }} />
              <TextField
                size="small"
                label="Story Title"
                value={createStoryTitle}
                onChange={(e) => setCreateStoryTitle(e.target.value)}
              />
              <TextField
                size="small"
                label="Story Content"
                multiline
                rows={2}
                value={createStoryContent}
                onChange={(e) => setCreateStoryContent(e.target.value)}
              />
              <Button variant="contained" onClick={createTestStory}>
                Create Test Story
              </Button>
              <Divider sx={{ my: 1 }} />
              <Button variant="outlined" color="error" onClick={clearAllStories}>
                Clear All Stories
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Current Stories ({stories.length})</Typography>
            {stories.length === 0 ? (
              <Alert severity="info">No stories found</Alert>
            ) : (
              <List dense>
                {stories.map((story, index) => (
                  <ListItem key={story._id || index} divider>
                    <ListItemText
                      primary={story.title || 'No title'}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            ID: {story._id}
                          </Typography>
                          <Typography variant="body2">
                            Created: {new Date(story.createdAt).toLocaleString()}
                          </Typography>
                          <Typography variant="body2">
                            Expires: {new Date(story.expiresAt).toLocaleString()}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              size="small" 
                              label={story.type} 
                              sx={{ mr: 1 }} 
                            />
                            <Chip 
                              size="small" 
                              label={story.visibility} 
                              variant="outlined" 
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Debug Info</Typography>
          <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '400px' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Activity Log</Typography>
          <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
            {logs.map((log, index) => (
              <Typography 
                key={index} 
                variant="body2" 
                sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: '11px',
                  mb: 0.5,
                  color: log.includes('Error') || log.includes('Failed') ? 'error.main' : 'text.secondary'
                }}
              >
                {log}
              </Typography>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default StoryDebugger;