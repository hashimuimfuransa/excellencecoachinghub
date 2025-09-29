/**
 * Enhanced Interview History Component
 * Shows both regular interview results and recorded interviews with playback
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Divider,
  Paper,
  useTheme
} from '@mui/material';
import {
  Assessment,
  Mic,
  History,
  PlayArrow,
  TrendingUp,
  EmojiEvents,
  VolumeUp,
  Headphones,
  SmartDisplay,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { modernInterviewService, InterviewSession } from '../services/modernInterviewService';
import { modernInterviewRecordingService, InterviewRecording } from '../services/modernInterviewRecordingService';
import { quickInterviewService } from '../services/quickInterviewService';
import { interviewStorageService } from '../services/interviewStorageService';
import ModernInterviewRecordingPlayer from './ModernInterviewRecordingPlayer';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`interview-tabpanel-${index}`}
      aria-labelledby={`interview-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EnhancedInterviewHistory: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Interview data
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const [interviewRecordings, setInterviewRecordings] = useState<InterviewRecording[]>([]);
  
  // Debug info
  const [debugInfo, setDebugInfo] = useState<{
    modernCount: number;
    quickCount: number;
    traditionalCount: number;
    recordingsCount: number;
    localStorageKeys: string[];
    userInfo: any;
  }>({
    modernCount: 0,
    quickCount: 0,
    traditionalCount: 0,
    recordingsCount: 0,
    localStorageKeys: [],
    userInfo: null
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data from multiple sources in parallel with retry logic
      const [sessions, recordings] = await Promise.all([
        loadInterviewSessions(),
        loadRecordings()
      ]);

      console.log(`📊 Loaded ${sessions.length} interview sessions and ${recordings.length} recordings`);
      setInterviewSessions(sessions);
      setInterviewRecordings(recordings);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading interview data:', err);
      setError('Failed to load interview history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadInterviewSessions = async (): Promise<InterviewSession[]> => {
    try {
      // Get localStorage keys for debugging
      const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.includes('interview') || key.includes('result') || key.includes('session')
      );

      // Try multiple endpoints to fetch comprehensive interview data
      const results = await Promise.allSettled([
        // Modern interview service (AI interviews)
        modernInterviewService.getInterviewHistory(),
        // Quick interview results
        fetchQuickInterviewResults(),
        // Traditional interview results
        fetchTraditionalInterviewResults()
      ]);

      let allSessions: InterviewSession[] = [];
      let modernCount = 0, quickCount = 0, traditionalCount = 0;

      // Process modern interviews
      if (results[0].status === 'fulfilled') {
        modernCount = results[0].value.length;
        allSessions = [...allSessions, ...results[0].value];
        console.log(`✅ Modern interviews loaded: ${modernCount}`);
      } else {
        console.warn('⚠️ Modern interviews failed:', results[0].reason);
      }

      // Process quick interviews (convert to session format)
      if (results[1].status === 'fulfilled') {
        quickCount = results[1].value.length;
        const quickSessions = results[1].value.map(convertQuickResultToSession);
        allSessions = [...allSessions, ...quickSessions];
        console.log(`✅ Quick interviews loaded: ${quickCount}`);
      } else {
        console.warn('⚠️ Quick interviews failed:', results[1].reason);
      }

      // Process traditional interviews
      if (results[2].status === 'fulfilled') {
        traditionalCount = results[2].value.length;
        const traditionalSessions = results[2].value.map(convertTraditionalResultToSession);
        allSessions = [...allSessions, ...traditionalSessions];
        console.log(`✅ Traditional interviews loaded: ${traditionalCount}`);
      } else {
        console.warn('⚠️ Traditional interviews failed:', results[2].reason);
      }

      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        modernCount,
        quickCount,
        traditionalCount,
        localStorageKeys,
        userInfo: user ? { id: user._id || user.id, email: user.email } : null
      }));

      // Sort by completion date (most recent first)
      allSessions.sort((a, b) => {
        const dateA = a.completedAt || a.createdAt;
        const dateB = b.completedAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      return allSessions;
    } catch (error) {
      console.error('Error loading interview sessions:', error);
      return [];
    }
  };

  const fetchQuickInterviewResults = async () => {
    try {
      if (!user?._id && !user?.id) {
        console.warn('No user ID available for fetching quick interview results');
        return [];
      }

      const userId = user._id || user.id;
      console.log('🔍 Fetching quick interview results for user:', userId);

      // Use the quickInterviewService which handles both backend and localStorage
      const results = await quickInterviewService.getUserResults(userId);
      console.log('📊 Quick interview service returned:', results.length, 'results');
      
      // Also check the standard localStorage key used by AIInterviewsPage
      const alternativeResults = JSON.parse(localStorage.getItem('interview_results') || '[]');
      console.log('📊 Alternative localStorage key has:', alternativeResults.length, 'results');

      // Merge both sources and ensure no duplicates
      const allResults = [...results];
      alternativeResults.forEach((altResult: any) => {
        if (!allResults.find(r => r.sessionId === altResult.sessionId)) {
          // Only add if it looks like a quick interview result
          if (altResult.sessionId && altResult.sessionId.startsWith('test_')) {
            allResults.push(altResult);
            console.log('✅ Added alternative result:', altResult.sessionId);
          }
        }
      });

      // Additional fallback: Check all localStorage keys for quick interview results
      const additionalResults: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('quick_result_')) {
          try {
            const resultData = localStorage.getItem(key);
            if (resultData) {
              const result = JSON.parse(resultData);
              if (!allResults.find(r => r.sessionId === result.sessionId)) {
                // Try to verify this belongs to the user by checking session
                const sessionData = localStorage.getItem(`quick_interview_${result.sessionId}`);
                if (sessionData) {
                  const session = JSON.parse(sessionData);
                  if (session.userId === userId) {
                    additionalResults.push(result);
                    console.log('✅ Found additional result:', result.sessionId);
                  }
                }
              }
            }
          } catch (error) {
            console.warn('Error parsing additional result:', error);
          }
        }
      }

      // Add additional results
      allResults.push(...additionalResults);

      console.log('📊 Total combined quick results:', allResults.length);
      return allResults;
    } catch (error) {
      console.error('Error fetching quick interview results:', error);
      // Final fallback to localStorage
      try {
        const fallbackResults = JSON.parse(localStorage.getItem('interview_results') || '[]');
        console.log('📊 Fallback results:', fallbackResults.length);
        return fallbackResults.filter((r: any) => r.sessionId && r.sessionId.startsWith('test_'));
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
  };

  const fetchTraditionalInterviewResults = async () => {
    try {
      console.log('🔍 Fetching traditional interview results...');
      
      // Use the interviewStorageService which is used by other components
      const historyEntries = interviewStorageService.getInterviewHistory();
      console.log('📊 Interview storage service returned:', historyEntries.length, 'history entries');
      
      // Also check for other localStorage keys that might have interview results
      const additionalKeys = [
        'traditional_interview_results',
        'interview_sessions', 
        'completed_interviews',
        'avatar_interview_results'
      ];
      
      let additionalResults: any[] = [];
      additionalKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(data) && data.length > 0) {
            console.log(`📊 Found ${data.length} results in ${key}`);
            additionalResults = [...additionalResults, ...data];
          }
        } catch (e) {
          // Ignore parsing errors for individual keys
        }
      });
      
      // Combine history entries and additional results
      const allResults = [...historyEntries, ...additionalResults];
      console.log('📊 Total traditional interview results:', allResults.length);
      return allResults;
    } catch (error) {
      console.error('Error fetching traditional interview results:', error);
      return [];
    }
  };

  const convertQuickResultToSession = (result: any): InterviewSession => {
    return {
      id: result.sessionId || `quick-${Date.now()}-${Math.random()}`,
      userId: user?._id || 'unknown',
      jobId: result.jobId || 'general',
      jobTitle: result.jobTitle || result.positionTitle || 'General Interview',
      questions: result.questions?.map((q: any) => ({
        id: q.id || `q-${Date.now()}`,
        question: q.question || q.text || 'Interview Question',
        type: q.type || 'behavioral',
        expectedDuration: 60,
        difficulty: q.difficulty || 'medium',
        keywords: q.keywords || []
      })) || [],
      totalDuration: result.duration || 180,
      status: 'completed',
      createdAt: new Date(result.completedAt || result.timestamp || Date.now()),
      startedAt: new Date(result.completedAt || result.timestamp || Date.now()),
      completedAt: new Date(result.completedAt || result.timestamp || Date.now()),
      welcomeMessage: `Quick interview for ${result.jobTitle || 'this position'}`,
      maxRetries: 3,
      result: {
        sessionId: result.sessionId,
        score: result.overallScore || result.score || 0,
        overallFeedback: result.feedback || result.overallFeedback || 'Interview completed successfully',
        strengths: result.strengths || [],
        improvements: result.improvements || result.areasForImprovement || [],
        responses: result.responses || [],
        completionTime: result.duration || 0,
        skillAssessment: result.skillAssessment || {
          communication: result.communicationScore || 0,
          technical: result.technicalScore || 0,
          problemSolving: result.problemSolvingScore || 0,
          cultural: result.culturalFitScore || 0
        },
        recommendation: result.recommendation || 'consider'
      }
    };
  };

  const convertTraditionalResultToSession = (result: any): InterviewSession => {
    // Handle different result formats (history entry vs direct result)
    const isHistoryEntry = result.responses && Array.isArray(result.responses);
    const actualResult = isHistoryEntry ? result : result;
    
    return {
      id: actualResult.id || result.interviewId || `traditional-${Date.now()}-${Math.random()}`,
      userId: user?._id || user?.id || 'unknown',
      jobId: actualResult.jobId || 'general',
      jobTitle: actualResult.jobTitle || actualResult.title || result.jobTitle || 'Traditional Interview',
      questions: actualResult.questions || result.questions || [],
      totalDuration: actualResult.totalDuration || actualResult.duration || 0,
      status: 'completed',
      createdAt: new Date(actualResult.createdAt || actualResult.completedAt || result.timestamp || Date.now()),
      startedAt: new Date(actualResult.startedAt || actualResult.createdAt || result.timestamp || Date.now()),
      completedAt: new Date(actualResult.completedAt || actualResult.createdAt || result.timestamp || Date.now()),
      welcomeMessage: `Traditional interview for ${actualResult.jobTitle || actualResult.title || 'this position'}`,
      maxRetries: 3,
      result: {
        sessionId: actualResult.id || result.interviewId || result.sessionId,
        score: actualResult.score || actualResult.overallScore || 0,
        overallFeedback: actualResult.feedback || actualResult.overallFeedback || 'Interview completed',
        strengths: actualResult.strengths || [],
        improvements: actualResult.improvements || actualResult.areasForImprovement || [],
        responses: actualResult.responses || [],
        completionTime: actualResult.totalDuration || actualResult.duration || 0,
        skillAssessment: actualResult.skillAssessment || {
          communication: 0,
          technical: 0,
          problemSolving: 0,
          cultural: 0
        },
        recommendation: actualResult.recommendation || 'consider'
      }
    };
  };

  const loadRecordings = async (): Promise<InterviewRecording[]> => {
    try {
      // Retry logic for loading recordings
      let recordings: InterviewRecording[] = [];
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          recordings = await modernInterviewRecordingService.getRecordings();
          console.log(`✅ Successfully loaded ${recordings.length} recordings on attempt ${retryCount + 1}`);
          break;
        } catch (error) {
          retryCount++;
          console.warn(`⚠️ Failed to load recordings on attempt ${retryCount}:`, error);
          
          if (retryCount < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          } else {
            console.error('❌ All retry attempts failed for loading recordings');
            // Try to load from localStorage as final fallback
            try {
              const localRecordings = JSON.parse(localStorage.getItem('interview_recordings') || '[]');
              console.log('📊 Using localStorage recordings as fallback:', localRecordings.length);
              return localRecordings;
            } catch (localError) {
              console.error('Error loading local recordings:', localError);
              return [];
            }
          }
        }
      }

      // Filter by current user if needed
      if (user && recordings.length > 0) {
        const userRecordings = recordings.filter(recording => 
          recording.userId === user._id || recording.userId === user.id
        );
        console.log(`🔍 Filtered ${userRecordings.length} recordings for current user from ${recordings.length} total`);
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          recordingsCount: userRecordings.length
        }));
        
        return userRecordings;
      }

      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        recordingsCount: recordings.length
      }));

      return recordings;
    } catch (error) {
      console.error('Error loading recordings:', error);
      return [];
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    const success = await modernInterviewRecordingService.deleteRecording(recordingId);
    if (success) {
      setInterviewRecordings(prev => prev.filter(r => r.id !== recordingId));
    }
  };

  const handleRefreshData = async () => {
    console.log('🔄 Refreshing interview data...');
    await loadData();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getTotalInterviews = (): number => {
    return interviewSessions.length + interviewRecordings.length;
  };

  const getAverageScore = (): number => {
    const scoresFromSessions = interviewSessions
      .filter(s => s.result?.score)
      .map(s => s.result!.score);
    
    const scoresFromRecordings = interviewRecordings
      .filter(r => r.overallScore)
      .map(r => r.overallScore!);
    
    const allScores = [...scoresFromSessions, ...scoresFromRecordings];
    
    if (allScores.length === 0) return 0;
    
    return Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length);
  };

  const getBestScore = (): number => {
    const scoresFromSessions = interviewSessions
      .filter(s => s.result?.score)
      .map(s => s.result!.score);
    
    const scoresFromRecordings = interviewRecordings
      .filter(r => r.overallScore)
      .map(r => r.overallScore!);
    
    const allScores = [...scoresFromSessions, ...scoresFromRecordings];
    
    return allScores.length > 0 ? Math.max(...allScores) : 0;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your interview history...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRefreshData}
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Retry'}
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>
            Failed to Load Interview History
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button 
            variant="contained" 
            startIcon={<Refresh />}
            onClick={handleRefreshData}
            disabled={loading}
          >
            {loading ? 'Retrying...' : 'Retry Loading'}
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => {
              // Try loading only localStorage data
              const localResults = JSON.parse(localStorage.getItem('interview_results') || '[]');
              if (localResults.length > 0) {
                const sessions = localResults.map(convertQuickResultToSession);
                setInterviewSessions(sessions);
                setError(null);
              }
            }}
          >
            Load Local Data
          </Button>
          
          <Button 
            variant="text" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Stack>
      </Container>
    );
  }

  const totalInterviews = getTotalInterviews();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Interview History
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Review your interview sessions and recorded practice interviews
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {formatDate(lastUpdated)}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefreshData}
              disabled={loading}
              sx={{ 
                minWidth: 120,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  borderColor: theme.palette.primary.main
                }
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              sx={{ minWidth: 80 }}
            >
              {showDebugInfo ? 'Hide Debug' : 'Debug'}
            </Button>
          </Stack>
          {getTotalInterviews() > 0 && (
            <Chip 
              label={`${getTotalInterviews()} Total Interviews`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Debug Panel */}
      {showDebugInfo && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Debug Information
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Modern Interviews:</Typography>
              <Typography variant="h6">{debugInfo.modernCount}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Quick Interviews:</Typography>
              <Typography variant="h6">{debugInfo.quickCount}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Traditional Interviews:</Typography>
              <Typography variant="h6">{debugInfo.traditionalCount}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Recordings:</Typography>
              <Typography variant="h6">{debugInfo.recordingsCount}</Typography>
            </Box>
          </Stack>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            User Info: {debugInfo.userInfo ? JSON.stringify(debugInfo.userInfo) : 'Not available'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            LocalStorage Keys ({debugInfo.localStorageKeys.length}):
          </Typography>
          <Box sx={{ maxHeight: 100, overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.05)', p: 1, borderRadius: 1 }}>
            {debugInfo.localStorageKeys.map((key, index) => (
              <Typography key={index} variant="caption" display="block">
                {key}: {localStorage.getItem(key)?.slice(0, 100)}...
              </Typography>
            ))}
          </Box>
        </Alert>
      )}

      {/* Stats Cards */}
      {totalInterviews > 0 && (
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={3} 
          sx={{ 
            mb: 4,
            '& > *': { flex: 1 }
          }}
        >
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {totalInterviews}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Interviews
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {getAverageScore()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Score
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {getBestScore()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Best Score
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Mic sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {interviewRecordings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recorded Sessions
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      )}

      {totalInterviews === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Assessment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No Interview History
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You haven't completed any interviews yet. Start practicing to see your history here.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Assessment />}
              href="/app/interviews"
            >
              Start Interview Practice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="interview history tabs">
              <Tab 
                icon={<Assessment />} 
                label={`All Interviews (${totalInterviews})`} 
                id="interview-tab-0"
                aria-controls="interview-tabpanel-0"
              />
              <Tab 
                icon={<Mic />} 
                label={`Recorded Interviews (${interviewRecordings.length})`} 
                id="interview-tab-1"
                aria-controls="interview-tabpanel-1"
              />
              <Tab 
                icon={<History />} 
                label={`Session Results (${interviewSessions.length})`} 
                id="interview-tab-2"
                aria-controls="interview-tabpanel-2"
              />
            </Tabs>
          </Box>



          {/* All Interviews Tab */}
          <TabPanel value={activeTab} index={0}>
            <Stack spacing={3}>
              {/* Recorded Interviews */}
              {interviewRecordings.length > 0 && (
                <Box>
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 4, 
                      mb: 3, 
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}12, ${theme.palette.secondary.main}12)`,
                      border: `2px solid ${theme.palette.primary.main}20`,
                      borderRadius: 3,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: '16px', 
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: theme.shadows[4]
                      }}>
                        <Headphones sx={{ fontSize: 32 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 800,
                            color: theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            mb: 0.5
                          }}
                        >
                          Voice Interview Recordings
                          <Chip 
                            label={`${interviewRecordings.length} Recording${interviewRecordings.length !== 1 ? 's' : ''}`}
                            size="medium" 
                            color="primary" 
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: '0.875rem',
                              px: 1
                            }}
                          />
                        </Typography>
                        <Typography 
                          variant="body1" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '1.1rem',
                            lineHeight: 1.6
                          }}
                        >
                          Review your recorded interview sessions and hear your responses to improve your communication skills
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  <Grid container spacing={3}>
                    {interviewRecordings.map((recording) => (
                      <Grid item xs={12} key={recording.id}>
                        <Paper
                          elevation={3}
                          sx={{
                            borderRadius: 4,
                            overflow: 'hidden',
                            border: `1px solid ${theme.palette.divider}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              elevation: 8,
                              transform: 'translateY(-4px)',
                              boxShadow: `0 12px 24px -8px ${theme.palette.primary.main}20`,
                              border: `1px solid ${theme.palette.primary.main}30`
                            }
                          }}
                        >
                          <ModernInterviewRecordingPlayer
                            recording={recording}
                            onDelete={handleDeleteRecording}
                            onUpdate={loadData}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Empty State */}
              {interviewRecordings.length === 0 && interviewSessions.length === 0 && (
                <Card sx={{ textAlign: 'center', py: 8 }}>
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: 3 
                    }}>
                      <Box sx={{ 
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
                          zIndex: 0
                        }
                      }}>
                        <History sx={{ 
                          fontSize: 80, 
                          color: theme.palette.primary.main,
                          position: 'relative',
                          zIndex: 1
                        }} />
                      </Box>
                      <Box>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                          Start Your Interview Journey
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
                          Welcome to your interview hub! Complete practice sessions and record interviews to track your progress and improve your skills.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Button 
                            variant="contained" 
                            size="large"
                            startIcon={<PlayArrow />}
                            href="/app/interviews"
                            sx={{ borderRadius: 2 }}
                          >
                            Start Practice Interview
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="large"
                            startIcon={<Mic />}
                            href="/app/interviews/record"
                            sx={{ borderRadius: 2 }}
                          >
                            Record Interview
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Session Results */}
              {interviewSessions.length > 0 && (
                <Box>
                  {interviewRecordings.length > 0 && <Divider sx={{ my: 3 }} />}
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment /> Interview Sessions ({interviewSessions.length})
                  </Typography>
                  <Grid container spacing={3}>
                    {interviewSessions.map((session) => (
                      <Grid item xs={12} md={6} lg={4} key={session.id}>
                        <Card sx={{ 
                          height: '100%',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[8]
                          }
                        }}>
                          <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              {session.jobTitle}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {formatDate(session.completedAt || session.createdAt)}
                            </Typography>
                            {session.result && (
                              <Box sx={{ mt: 2 }}>
                                <Chip
                                  label={`Score: ${session.result.score}/100`}
                                  color={session.result.score >= 80 ? 'success' : session.result.score >= 60 ? 'warning' : 'error'}
                                />
                              </Box>
                            )}
                            <Button
                              size="small"
                              startIcon={<Assessment />}
                              href={`/app/interviews/results/${session.id}`}
                              sx={{ mt: 2 }}
                            >
                              View Results
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Stack>
          </TabPanel>

          {/* Recorded Interviews Tab */}
          <TabPanel value={activeTab} index={1}>
            {interviewRecordings.length === 0 ? (
              <Card 
                sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  background: `linear-gradient(135deg, ${theme.palette.grey[50]}, ${theme.palette.grey[100]})`,
                  border: `2px dashed ${theme.palette.grey[300]}`
                }}
              >
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 3 
                  }}>
                    <Box sx={{ 
                      p: 4, 
                      borderRadius: '50%', 
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
                      border: `3px solid ${theme.palette.primary.main}25`
                    }}>
                      <SmartDisplay sx={{ fontSize: 80, color: theme.palette.primary.main }} />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
                        No Voice Recordings Yet
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ 
                          maxWidth: 500, 
                          mx: 'auto', 
                          fontSize: '1.1rem',
                          lineHeight: 1.7
                        }}
                      >
                        Your recorded interview practice sessions will appear here. You can review your responses, 
                        hear your voice, and track your improvement over time.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={3}>
                {interviewRecordings.map((recording) => (
                  <ModernInterviewRecordingPlayer
                    key={recording.id}
                    recording={recording}
                    onDelete={handleDeleteRecording}
                    onUpdate={loadData}
                  />
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Session Results Tab */}
          <TabPanel value={activeTab} index={2}>
            {interviewSessions.length === 0 ? (
              <Card sx={{ textAlign: 'center', py: 6 }}>
                <CardContent>
                  <Assessment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Interview Sessions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete some interview practice sessions to see your results here.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {interviewSessions.map((session) => (
                  <Grid item xs={12} md={6} lg={4} key={session.id}>
                    <Card sx={{ 
                      height: '100%',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {session.jobTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {formatDate(session.completedAt || session.createdAt)}
                        </Typography>
                        {session.result && (
                          <Box sx={{ mt: 2 }}>
                            <Chip
                              label={`Score: ${session.result.overallScore || session.result.score || 0}/100`}
                              color={(session.result.overallScore || session.result.score || 0) >= 80 ? 'success' : (session.result.overallScore || session.result.score || 0) >= 60 ? 'warning' : 'error'}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {(session.result.feedback || session.result.overallFeedback || '').substring(0, 150) + '...'}
                            </Typography>
                          </Box>
                        )}
                        <Button
                          size="small"
                          startIcon={<Assessment />}
                          href={`/app/interviews/results/${session.id}`}
                          sx={{ mt: 2 }}
                        >
                          View Full Results
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </>
      )}
    </Container>
  );
};

export default EnhancedInterviewHistory;