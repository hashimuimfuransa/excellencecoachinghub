import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Container,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  VideoCall,
  ArrowBack,
  CloudUpload,
  PlayArrow,
  Delete,
  Edit,
  LiveTv
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';

import LiveClass from '../../components/Video/LiveClass';
import VideoSessionWrapper from '../../components/Video/VideoSessionWrapper';

const normalizeYoutubeUrls = (url: string) => {
  if (!url) {
    return { embed: '', watch: '' };
  }
  const trimmed = url.trim();
  const idMatch = trimmed.match(/(?:embed\/|watch\?v=|youtu\.be\/)([\w-]{11})/i);
  const id = idMatch ? idMatch[1] : '';
  if (id) {
    return {
      embed: `https://www.youtube.com/embed/${id}`,
      watch: `https://www.youtube.com/watch?v=${id}`
    };
  }
  return { embed: trimmed, watch: trimmed };
};



const LiveSessionRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [session, setSession] = useState<ILiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inVideoRoom, setInVideoRoom] = useState(false);
  
  // Video upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');

  console.log('🏫 LiveSessionRoom mounted with:', { sessionId, userId: user?._id, userRole: user?.role });

  const { embed: youtubeEmbedUrl, watch: youtubeWatchUrl } = normalizeYoutubeUrls(session?.youtubeEmbedUrl || '');
  const isYoutubeStream = session?.streamProvider === 'youtube' || (!!youtubeEmbedUrl && youtubeEmbedUrl.includes('youtube.com'));

  // Early return if sessionId is missing
  if (!sessionId) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          ❌ Session ID is missing from URL parameters. 
          <br />
          Expected URL format: <code>/video-session/teacher/[SESSION_ID]</code>
        </Alert>
        <Button onClick={() => navigate('/dashboard/teacher/live-sessions')}>
          Back to Sessions
        </Button>
      </Box>
    );
  }

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId || !user) {
        console.log('❌ Missing sessionId or user:', { sessionId, user: !!user });
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Loading session data for teacher...', sessionId);
        const sessionData = await liveSessionService.getTeacherSessionById(sessionId);
        console.log('✅ Session data loaded:', sessionData);
        setSession(sessionData);

        // Auto-join video room if session is live
        const isYoutube = sessionData.streamProvider === 'youtube' || !!sessionData.youtubeEmbedUrl;
        if (sessionData.status === 'live' && !isYoutube) {
          console.log('🔴 Session is live, auto-joining video room');
          setInVideoRoom(true);
        } else {
          console.log('⏸️ Session status:', sessionData.status, 'YouTube stream:', isYoutube);
          setInVideoRoom(false);
        }

      } catch (err: any) {
        console.error('❌ Error loading session:', err);
        setError(err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, user]);

  // Handle joining video room
  const handleJoinVideoRoom = () => {
    if (isYoutubeStream) {
      const targetUrl = youtubeWatchUrl || youtubeEmbedUrl;
      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    setInVideoRoom(true);
  };

  // Handle leaving video room
  const handleLeaveVideoRoom = () => {
    setInVideoRoom(false);
    navigate('/dashboard/teacher/live-sessions');
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is a video
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }
      
      // Check file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert('Video file size must be less than 500MB');
        return;
      }
      
      setVideoFile(file);
      setVideoTitle(file.name.split('.')[0]); // Set default title from filename
    }
  };

  // Handle video upload
  const handleUploadVideo = async () => {
    if (!videoFile || !sessionId) return;

    try {
      setUploadingVideo(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('sessionId', sessionId);
      formData.append('title', videoTitle || videoFile.name);
      formData.append('description', videoDescription);

      // Upload with progress tracking
      const response = await fetch('/api/live-sessions/upload-recording', {
        method: 'POST',
        body: formData,
        // Add progress tracking if supported
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Video uploaded successfully:', result);
        
        // Update session with recording URL
        if (session) {
          setSession({
            ...session,
            recordingUrl: result.videoUrl,
            recordingTitle: videoTitle || videoFile.name,
            recordingDescription: videoDescription
          });
        }
        
        // Close dialog and reset state
        setUploadDialogOpen(false);
        setVideoFile(null);
        setVideoTitle('');
        setVideoDescription('');
        
        alert('Video uploaded successfully! Students can now view the recorded session.');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('❌ Error uploading video:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
    }
  };

  // Handle deleting uploaded video
  const handleDeleteVideo = async () => {
    if (!session?.recordingUrl || !sessionId) return;
    
    if (!window.confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/live-sessions/${sessionId}/recording`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSession({
          ...session,
          recordingUrl: undefined,
          recordingTitle: undefined,
          recordingDescription: undefined
        });
        alert('Recording deleted successfully.');
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('❌ Error deleting video:', error);
      alert('Failed to delete recording. Please try again.');
    }
  };











  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading session...
        </Typography>
      </Box>
    );
  }

  if (error || !session) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Session not found'}
        </Alert>
        <Button onClick={() => navigate('/dashboard/teacher/live-sessions')}>
          Back to Sessions
        </Button>
      </Box>
    );
  }

  // If in video room, show the 100ms LiveClass component
  if (inVideoRoom) {
    console.log('🎥 Rendering LiveClass with sessionId:', sessionId);
    return (
      <VideoSessionWrapper>
        <LiveClass
          sessionId={sessionId}
          userRole="teacher"
          onLeave={handleLeaveVideoRoom}
        />
      </VideoSessionWrapper>
    );
  }

  // Show session details and join button
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard/teacher/live-sessions')}
        sx={{ mb: 3 }}
      >
        Back to Sessions
      </Button>

      {/* Session details */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <VideoCall sx={{ mr: 2, fontSize: 32 }} color="primary" />
          <Typography variant="h4" component="h1">
            {session.title}
          </Typography>
        </Box>

        {session.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {session.description}
          </Typography>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Session Details
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Scheduled Time:</strong> {new Date(session.scheduledTime).toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Duration:</strong> {session.duration} minutes
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Status:</strong> {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </Typography>
          {session.maxParticipants && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Max Participants:</strong> {session.maxParticipants}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Recording:</strong> {session.isRecorded ? 'Enabled' : 'Disabled'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Stream Type:</strong> {isYoutubeStream ? 'YouTube Livestream' : 'Interactive Video Room'}
          </Typography>
        </Box>

        {/* Session status and actions */}
        {session.status === 'scheduled' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This session is scheduled to start at {new Date(session.scheduledTime).toLocaleString()}.
              You can start the session early if needed.
            </Typography>
          </Alert>
        )}

        {session.status === 'live' && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This session is currently live! Click the button below to join the video room.
            </Typography>
          </Alert>
        )}

        {session.status === 'ended' && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This session has ended.
              {session.recordingUrl && ' You can watch the recording if available.'}
            </Typography>
          </Alert>
        )}

        {/* Action buttons */}
        <Box display="flex" gap={2}>
          {(session.status === 'live' || session.status === 'scheduled') && (
            <Button
              variant="contained"
              size="large"
              startIcon={isYoutubeStream ? <LiveTv /> : <VideoCall />}
              onClick={handleJoinVideoRoom}
              color="primary"
              sx={{ fontWeight: 'bold' }}
            >
              {isYoutubeStream ? 'Open YouTube Stream' : session.status === 'live' ? 'Join Live Session' : 'Start Session'}
            </Button>
          )}

          {session.status === 'ended' && session.recordingUrl && (
            <Button
              variant="contained"
              size="large"
              startIcon={<VideoCall />}
              onClick={() => window.open(session.recordingUrl, '_blank')}
              color="primary"
            >
              Watch Recording
            </Button>
          )}
        </Box>

        {isYoutubeStream && youtubeEmbedUrl && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Livestream Preview
            </Typography>
            <Box
              component="iframe"
              src={`${youtubeEmbedUrl}?rel=0`}
              sx={{
                width: '100%',
                border: 0,
                borderRadius: 2,
                minHeight: { xs: 240, sm: 360 },
                boxShadow: 3
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              sx={{ mt: 2 }}
              onClick={() => window.open(youtubeWatchUrl || youtubeEmbedUrl, '_blank', 'noopener,noreferrer')}
            >
              Open Stream in New Tab
            </Button>
          </Box>
        )}

        {/* Video Recording Section - Only show if session has ended */}
        {session.status === 'ended' && (
          <>
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Session Recording
              </Typography>
              
              {session.recordingUrl ? (
                // Show existing recording
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Recording is available for students to watch.
                    </Typography>
                  </Alert>
                  
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {session.recordingTitle || 'Session Recording'}
                        </Typography>
                        {session.recordingDescription && (
                          <Typography variant="body2" color="text.secondary">
                            {session.recordingDescription}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          startIcon={<PlayArrow />}
                          onClick={() => window.open(session.recordingUrl, '_blank')}
                        >
                          Preview
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Delete />}
                          onClick={handleDeleteVideo}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              ) : (
                // Show upload interface
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Upload a recording of this session so students can watch it later.
                    </Typography>
                  </Alert>
                  
                  <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={() => setUploadDialogOpen(true)}
                    color="primary"
                  >
                    Upload Session Recording
                  </Button>
                </Box>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* Video Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => !uploadingVideo && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Session Recording</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* File selection */}
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="video-file-input"
            />
            <label htmlFor="video-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {videoFile ? `Selected: ${videoFile.name}` : 'Select Video File'}
              </Button>
            </label>

            {videoFile && (
              <>
                <Chip 
                  label={`Size: ${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`}
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Recording Title"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />
                
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {uploadingVideo && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Uploading video... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploadingVideo}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadVideo}
            variant="contained"
            disabled={!videoFile || !videoTitle.trim() || uploadingVideo}
          >
            {uploadingVideo ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LiveSessionRoom;