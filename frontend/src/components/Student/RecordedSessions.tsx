import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Pagination,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  Divider,
  useTheme,
  alpha,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  PlayArrow,
  VideoLibrary,
  Schedule,
  Person,
  School,
  Search,
  Refresh,
  AccessTime,
  Group,
  CalendarToday,
  PlayCircleOutline,
  Bookmark,
  BookmarkBorder,
  Share,
  Download,
  Fullscreen
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../store/AuthContext';

interface Recording {
  _id: string;
  title: string;
  description?: string;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  duration: number;
  recordingUrl?: string;
  recordingSize?: number;
  course: {
    _id: string;
    title: string;
    description?: string;
    thumbnail?: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  attendees?: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    participated: boolean;
  }>;
}

interface RecordedSessionsProps {
  courseId?: string;
  showHeader?: boolean;
  maxItems?: number;
}

const RecordedSessions: React.FC<RecordedSessionsProps> = ({ 
  courseId, 
  showHeader = true, 
  maxItems 
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookmarkedRecordings, setBookmarkedRecordings] = useState<Set<string>>(new Set());
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecordings, setTotalRecordings] = useState(0);

  useEffect(() => {
    fetchRecordings();
  }, [page, courseId, searchTerm]);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: maxItems ? maxItems.toString() : '12',
        ...(courseId && { courseId }),
        ...(searchTerm && { search: searchTerm })
      });

      const apiUrl = `/recorded-sessions/student?${queryParams}`;
      const response = await apiService.get(apiUrl);
      
      if (response.success && response.data) {
        setRecordings(response.data.recordings || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalRecordings(response.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError('Failed to fetch recorded sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = () => {
    const saved = localStorage.getItem(`bookmarked_recordings_${user?._id}`);
    if (saved) {
      setBookmarkedRecordings(new Set(JSON.parse(saved)));
    }
  };

  const saveBookmarks = (bookmarks: Set<string>) => {
    localStorage.setItem(`bookmarked_recordings_${user?._id}`, JSON.stringify(Array.from(bookmarks)));
  };

  const handlePlayRecording = (recording: Recording) => {
    setSelectedRecording(recording);
    setPlayerDialogOpen(true);
  };

  const handleBookmarkToggle = (recordingId: string) => {
    const newBookmarks = new Set(bookmarkedRecordings);
    if (newBookmarks.has(recordingId)) {
      newBookmarks.delete(recordingId);
    } else {
      newBookmarks.add(recordingId);
    }
    setBookmarkedRecordings(newBookmarks);
    saveBookmarks(newBookmarks);
  };

  const handleShareRecording = (recording: Recording) => {
    if (navigator.share) {
      navigator.share({
        title: recording.title,
        text: `Check out this recorded session: ${recording.title}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You might want to show a toast notification here
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getRecordingThumbnail = (recording: Recording) => {
    return recording.course.thumbnail || '/default-video-thumbnail.jpg';
  };

  const filteredRecordings = recordings.filter(recording =>
    recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recording.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recording.instructor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recording.instructor.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {showHeader && (
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              Recorded Sessions
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchRecordings}
              size="small"
            >
              Refresh
            </Button>
          </Box>
          
          <TextField
            fullWidth
            placeholder="Search recorded sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {filteredRecordings.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Recorded Sessions Found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Recorded sessions from your instructors will appear here once available.'
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredRecordings.map((recording) => (
              <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={recording._id}>
                <RecordingCard
                  recording={recording}
                  isBookmarked={bookmarkedRecordings.has(recording._id)}
                  onPlay={() => handlePlayRecording(recording)}
                  onBookmarkToggle={() => handleBookmarkToggle(recording._id)}
                  onShare={() => handleShareRecording(recording)}
                  formatDuration={formatDuration}
                  formatFileSize={formatFileSize}
                  getThumbnail={getRecordingThumbnail}
                />
              </Grid>
            ))}
          </Grid>

          {!maxItems && totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Video Player Dialog */}
      <VideoPlayerDialog
        open={playerDialogOpen}
        onClose={() => setPlayerDialogOpen(false)}
        recording={selectedRecording}
      />
    </Box>
  );
};

// Recording Card Component
const RecordingCard: React.FC<{
  recording: Recording;
  isBookmarked: boolean;
  onPlay: () => void;
  onBookmarkToggle: () => void;
  onShare: () => void;
  formatDuration: (minutes: number) => string;
  formatFileSize: (bytes?: number) => string;
  getThumbnail: (recording: Recording) => string;
}> = ({ 
  recording, 
  isBookmarked, 
  onPlay, 
  onBookmarkToggle, 
  onShare, 
  formatDuration, 
  formatFileSize,
  getThumbnail 
}) => {
  const theme = useTheme();

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8]
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="div"
          sx={{
            height: { xs: 180, sm: 200, md: 220, lg: 240 },
            backgroundImage: `url(${getThumbnail(recording)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:hover .play-button': {
              transform: 'scale(1.1)'
            }
          }}
          onClick={onPlay}
        >
          <Box
            className="play-button"
            sx={{
              width: { xs: 56, sm: 60, md: 64, lg: 68 },
              height: { xs: 56, sm: 60, md: 64, lg: 68 },
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.9),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
              '&:hover': {
                bgcolor: theme.palette.primary.main
              }
            }}
          >
            <PlayArrow sx={{ color: 'white', fontSize: { xs: 28, sm: 32, md: 36, lg: 40 } }} />
          </Box>
        </CardMedia>
        
        {/* Duration Badge */}
        <Chip
          label={formatDuration(recording.duration)}
          size="small"
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: alpha(theme.palette.common.black, 0.7),
            color: 'white',
            '& .MuiChip-label': { px: 1 }
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" component="h3" gutterBottom noWrap>
          {recording.title}
        </Typography>
        
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {recording.course.title}
        </Typography>

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Person fontSize="small" color="action" />
          <Typography variant="body2" color="textSecondary">
            {recording.instructor.firstName} {recording.instructor.lastName}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CalendarToday fontSize="small" color="action" />
          <Typography variant="body2" color="textSecondary">
            {format(new Date(recording.scheduledTime), 'MMM dd, yyyy')}
          </Typography>
        </Box>

        {recording.description && (
          <Typography 
            variant="body2" 
            color="textSecondary" 
            sx={{ 
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {recording.description}
          </Typography>
        )}

        <Box sx={{ mt: 'auto' }}>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="textSecondary">
              {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
                <IconButton size="small" onClick={onBookmarkToggle}>
                  {isBookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton size="small" onClick={onShare}>
                  <Share />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Video Player Dialog Component
const VideoPlayerDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  recording: Recording | null;
}> = ({ open, onClose, recording }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    const videoElement = document.querySelector('#recording-video') as HTMLVideoElement;
    if (videoElement) {
      if (!isFullscreen) {
        videoElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (!recording) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" component="div">
              {recording.title}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {recording.course.title} • {recording.instructor.firstName} {recording.instructor.lastName}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Fullscreen">
              <IconButton onClick={handleFullscreen}>
                <Fullscreen />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {recording.recordingUrl ? (
          <Box sx={{ flexGrow: 1, bgcolor: 'black', display: 'flex', alignItems: 'center' }}>
            <video
              id="recording-video"
              controls
              style={{ 
                width: '100%', 
                height: '100%',
                maxHeight: '60vh'
              }}
              src={recording.recordingUrl}
              poster={recording.course.thumbnail}
            >
              Your browser does not support the video tag.
            </video>
          </Box>
        ) : (
          <Box 
            sx={{ 
              height: 400, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'grey.100'
            }}
          >
            <Typography color="textSecondary">
              Recording not available
            </Typography>
          </Box>
        )}

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Session Details
              </Typography>
              {recording.description && (
                <Typography variant="body1" paragraph>
                  {recording.description}
                </Typography>
              )}
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Schedule color="action" />
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Scheduled Time
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(recording.scheduledTime), 'PPpp')}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <AccessTime color="action" />
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Duration
                    </Typography>
                    <Typography variant="body1">
                      {Math.floor(recording.duration / 60)}h {recording.duration % 60}m
                    </Typography>
                  </Box>
                </Box>
                {recording.attendees && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Group color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Participants
                      </Typography>
                      <Typography variant="body1">
                        {recording.attendees.filter(a => a.participated).length} attended
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Course Information
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {recording.course.title}
                  </Typography>
                  {recording.course.description && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {recording.course.description}
                    </Typography>
                  )}
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person fontSize="small" />
                    <Typography variant="body2">
                      {recording.instructor.firstName} {recording.instructor.lastName}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        {recording.recordingUrl && (
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => {
              const link = document.createElement('a');
              link.href = recording.recordingUrl!;
              link.download = `${recording.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recording.mp4`;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RecordedSessions;