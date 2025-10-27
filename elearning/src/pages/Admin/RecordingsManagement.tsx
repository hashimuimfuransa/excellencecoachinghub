import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  Stack,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  PlayArrow,
  VideoLibrary,
  Schedule,
  Person,
  School,
  Download,
  Visibility,
  FilterList,
  Search,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  AccessTime,
  Storage,
  Group
} from '@mui/icons-material';
import { format } from 'date-fns';
import { apiService } from '../../services/apiService';

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
  recordingStatus: 'not_started' | 'recording' | 'completed' | 'failed';
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
  attendees: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    joinTime?: string;
    leaveTime?: string;
    duration?: number;
    participated: boolean;
  }>;
  createdAt: string;
}

interface Session {
  _id: string;
  title: string;
  description?: string;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  duration: number;
  isRecorded: boolean;
  recordingStatus: 'not_started' | 'recording' | 'completed' | 'failed';
  recordingUrl?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  course: {
    _id: string;
    title: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  participantCount: number;
  attendanceCount: number;
}

const RecordingsManagement: React.FC = () => {
  const theme = useTheme();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teacherRecordings, setTeacherRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'recorded' | 'not-recorded' | 'teacher-uploaded'>('recorded');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecordings, setTotalRecordings] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    courseId: '',
    instructorId: '',
    dateFrom: '',
    dateTo: '',
    recordingStatus: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    totalSessions: 0,
    recordedSessions: 0,
    failedRecordings: 0,
    totalStorageUsed: 0
  });

  useEffect(() => {
    fetchData();
  }, [page, currentTab, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (currentTab === 'recorded') {
        await fetchRecordings();
      } else if (currentTab === 'teacher-uploaded') {
        await fetchTeacherRecordings();
      } else {
        await fetchNonRecordedSessions();
      }
      
      await fetchStats();
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordings = async () => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
    });

    const response = await apiService.get(`/live-sessions/recordings?${queryParams}`);
    
    if (response.success && response.data) {
      setRecordings(response.data.recordings || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalRecordings(response.data.pagination?.total || 0);
    }
  };

  const fetchNonRecordedSessions = async () => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      status: 'ended',
      recorded: 'false',
      ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
    });

    const response = await apiService.get(`/live-sessions?${queryParams}`);
    
    if (response.success && response.data) {
      setSessions(response.data.sessions || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalRecordings(response.data.pagination?.total || 0);
    }
  };

  const fetchTeacherRecordings = async () => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
    });

    const response = await apiService.get(`/recorded-sessions/admin?${queryParams}`);
    
    if (response.success && response.data) {
      setTeacherRecordings(response.data.sessions || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalRecordings(response.data.pagination?.total || 0);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.get('/live-sessions/stats');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleViewRecording = (recording: Recording) => {
    setSelectedRecording(recording);
    setViewDialogOpen(true);
  };

  const handleDownloadRecording = (recordingUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = recordingUrl;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recording.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'completed': return 'success';
      case 'recording': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string): React.ReactElement => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'recording': return <AccessTime />;
      case 'failed': return <Error />;
      default: return <Warning />;
    }
  };

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: 'primary' | 'success' | 'error' | 'info' }> = 
    ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: alpha(theme.palette[color].main, 0.1) }}>
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { color: theme.palette[color].main } 
            })}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Recordings Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={<VideoLibrary />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recorded Sessions"
            value={stats.recordedSessions}
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Failed Recordings"
            value={stats.failedRecordings}
            icon={<Error />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Storage Used"
            value={formatFileSize(stats.totalStorageUsed)}
            icon={<Storage />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Tab Navigation */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2}>
          <Button
            variant={currentTab === 'recorded' ? 'contained' : 'outlined'}
            onClick={() => {
              setCurrentTab('recorded');
              setPage(1);
            }}
            startIcon={<VideoLibrary />}
          >
            Recorded Sessions ({stats.recordedSessions})
          </Button>
          <Button
            variant={currentTab === 'teacher-uploaded' ? 'contained' : 'outlined'}
            onClick={() => {
              setCurrentTab('teacher-uploaded');
              setPage(1);
            }}
            startIcon={<School />}
          >
            Teacher Uploads ({teacherRecordings.length})
          </Button>
          <Button
            variant={currentTab === 'not-recorded' ? 'contained' : 'outlined'}
            onClick={() => {
              setCurrentTab('not-recorded');
              setPage(1);
            }}
            startIcon={<Warning />}
          >
            Not Recorded Sessions ({stats.totalSessions - stats.recordedSessions})
          </Button>
        </Stack>
      </Box>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {currentTab === 'recorded' ? (
            <RecordedSessionsTable 
              recordings={recordings}
              onViewRecording={handleViewRecording}
              onDownloadRecording={handleDownloadRecording}
              formatFileSize={formatFileSize}
              formatDuration={formatDuration}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          ) : currentTab === 'teacher-uploaded' ? (
            <TeacherRecordingsTable 
              recordings={teacherRecordings}
              formatFileSize={formatFileSize}
              formatDuration={formatDuration}
            />
          ) : (
            <NotRecordedSessionsTable 
              sessions={sessions}
              formatDuration={formatDuration}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
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

      {/* View Recording Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <VideoLibrary />
            Recording Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRecording && (
            <RecordingDetailsView recording={selectedRecording} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
          {selectedRecording?.recordingUrl && (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => window.open(selectedRecording.recordingUrl, '_blank')}
            >
              Watch Recording
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <FilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </Box>
  );
};

// Recorded Sessions Table Component
const RecordedSessionsTable: React.FC<{
  recordings: Recording[];
  onViewRecording: (recording: Recording) => void;
  onDownloadRecording: (url: string, title: string) => void;
  formatFileSize: (bytes?: number) => string;
  formatDuration: (minutes: number) => string;
  getStatusColor: (status: string) => 'success' | 'warning' | 'error' | 'default';
  getStatusIcon: (status: string) => React.ReactElement;
}> = ({ recordings, onViewRecording, onDownloadRecording, formatFileSize, formatDuration, getStatusColor, getStatusIcon }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Session Details</TableCell>
          <TableCell>Course</TableCell>
          <TableCell>Instructor</TableCell>
          <TableCell>Date & Duration</TableCell>
          <TableCell>Recording Status</TableCell>
          <TableCell>File Size</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {recordings.map((recording) => (
          <TableRow key={recording._id} hover>
            <TableCell>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {recording.title}
                </Typography>
                {recording.description && (
                  <Typography variant="body2" color="textSecondary" noWrap>
                    {recording.description}
                  </Typography>
                )}
              </Box>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {recording.course.title}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {recording.instructor.firstName} {recording.instructor.lastName}
              </Typography>
            </TableCell>
            <TableCell>
              <Box>
                <Typography variant="body2">
                  {format(new Date(recording.scheduledTime), 'MMM dd, yyyy')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatDuration(recording.duration)}
                </Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Chip
                icon={getStatusIcon(recording.recordingStatus)}
                label={recording.recordingStatus.replace('_', ' ').toUpperCase()}
                color={getStatusColor(recording.recordingStatus)}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {formatFileSize(recording.recordingSize)}
              </Typography>
            </TableCell>
            <TableCell>
              <Stack direction="row" spacing={1}>
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => onViewRecording(recording)}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
                {recording.recordingUrl && (
                  <>
                    <Tooltip title="Watch Recording">
                      <IconButton
                        size="small"
                        onClick={() => window.open(recording.recordingUrl, '_blank')}
                      >
                        <PlayArrow />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download Recording">
                      <IconButton
                        size="small"
                        onClick={() => onDownloadRecording(recording.recordingUrl!, recording.title)}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            </TableCell>
          </TableRow>
        ))}
        {recordings.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
              <Typography color="textSecondary">
                No recorded sessions found
              </Typography>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

// Not Recorded Sessions Table Component
const NotRecordedSessionsTable: React.FC<{
  sessions: Session[];
  formatDuration: (minutes: number) => string;
}> = ({ sessions, formatDuration }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Session Details</TableCell>
          <TableCell>Course</TableCell>
          <TableCell>Instructor</TableCell>
          <TableCell>Date & Duration</TableCell>
          <TableCell>Participants</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Reason</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session._id} hover>
            <TableCell>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {session.title}
                </Typography>
                {session.description && (
                  <Typography variant="body2" color="textSecondary" noWrap>
                    {session.description}
                  </Typography>
                )}
              </Box>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {session.course.title}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {session.instructor.firstName} {session.instructor.lastName}
              </Typography>
            </TableCell>
            <TableCell>
              <Box>
                <Typography variant="body2">
                  {format(new Date(session.scheduledTime), 'MMM dd, yyyy')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatDuration(session.duration)}
                </Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Box display="flex" alignItems="center" gap={1}>
                <Group fontSize="small" />
                <Typography variant="body2">
                  {session.attendanceCount}/{session.participantCount}
                </Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Chip
                label={session.status.toUpperCase()}
                color={session.status === 'ended' ? 'default' : 'warning'}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Typography variant="body2" color="textSecondary">
                {!session.isRecorded ? 'Recording not enabled' : 
                 session.recordingStatus === 'failed' ? 'Recording failed' : 
                 'Recording not started'}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
        {sessions.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
              <Typography color="textSecondary">
                No non-recorded sessions found
              </Typography>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

// Teacher Recordings Table Component
const TeacherRecordingsTable: React.FC<{
  recordings: any[];
  formatFileSize: (bytes?: number) => string;
  formatDuration: (duration?: string) => string;
}> = ({ recordings, formatFileSize, formatDuration }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Title</TableCell>
          <TableCell>Course</TableCell>
          <TableCell>Teacher</TableCell>
          <TableCell>Upload Date</TableCell>
          <TableCell>Duration</TableCell>
          <TableCell>File Size</TableCell>
          <TableCell>Views</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {recordings.map((recording) => (
          <TableRow key={recording._id} hover>
            <TableCell>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  variant="rounded"
                  sx={{ width: 40, height: 30, bgcolor: 'primary.main' }}
                >
                  <VideoLibrary fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {recording.title}
                  </Typography>
                  {recording.description && (
                    <Typography variant="caption" color="textSecondary">
                      {recording.description.substring(0, 50)}...
                    </Typography>
                  )}
                </Box>
              </Box>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {recording.course?.title || 'Unknown Course'}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {recording.teacher?.firstName} {recording.teacher?.lastName}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {format(new Date(recording.uploadDate || recording.createdAt), 'MMM dd, yyyy')}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {formatDuration(recording.duration)}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {formatFileSize(recording.videoSize)}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {recording.views || 0} views
              </Typography>
            </TableCell>
            <TableCell>
              <Chip
                label={recording.isPublished ? 'Published' : 'Draft'}
                color={recording.isPublished ? 'success' : 'default'}
                size="small"
              />
            </TableCell>
            <TableCell align="center">
              <Stack direction="row" spacing={1}>
                <Tooltip title="View Recording">
                  <IconButton
                    size="small"
                    onClick={() => window.open(recording.videoUrl, '_blank')}
                  >
                    <PlayArrow />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton
                    size="small"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = recording.videoUrl;
                      link.download = `${recording.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download />
                  </IconButton>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
        {recordings.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
              <Typography color="textSecondary">
                No teacher-uploaded recordings found
              </Typography>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

// Recording Details View Component
const RecordingDetailsView: React.FC<{ recording: Recording }> = ({ recording }) => (
  <Box>
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant="h6" gutterBottom>
          Session Information
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              Title
            </Typography>
            <Typography variant="body1">
              {recording.title}
            </Typography>
          </Box>
          {recording.description && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Description
              </Typography>
              <Typography variant="body1">
                {recording.description}
              </Typography>
            </Box>
          )}
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              Course
            </Typography>
            <Typography variant="body1">
              {recording.course.title}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              Instructor
            </Typography>
            <Typography variant="body1">
              {recording.instructor.firstName} {recording.instructor.lastName}
            </Typography>
          </Box>
        </Stack>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="h6" gutterBottom>
          Recording Details
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              Scheduled Time
            </Typography>
            <Typography variant="body1">
              {format(new Date(recording.scheduledTime), 'PPpp')}
            </Typography>
          </Box>
          {recording.actualStartTime && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Actual Duration
              </Typography>
              <Typography variant="body1">
                {recording.actualStartTime && recording.actualEndTime
                  ? `${Math.round((new Date(recording.actualEndTime).getTime() - new Date(recording.actualStartTime).getTime()) / (1000 * 60))} minutes`
                  : 'N/A'}
              </Typography>
            </Box>
          )}
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              File Size
            </Typography>
            <Typography variant="body1">
              {recording.recordingSize ? `${Math.round(recording.recordingSize / (1024 * 1024))} MB` : 'Unknown'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              Attendees
            </Typography>
            <Typography variant="body1">
              {recording.attendees.filter(a => a.participated).length} participants
            </Typography>
          </Box>
        </Stack>
      </Grid>
    </Grid>

    {recording.recordingUrl && (
      <Box mt={3}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Recording Preview
        </Typography>
        <Box
          sx={{
            width: '100%',
            height: 300,
            bgcolor: 'grey.100',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <video
            controls
            style={{ width: '100%', height: '100%', borderRadius: 4 }}
            src={recording.recordingUrl}
          >
            Your browser does not support the video tag.
          </video>
        </Box>
      </Box>
    )}
  </Box>
);

// Filter Dialog Component
const FilterDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
}> = ({ open, onClose, filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      courseId: '',
      instructorId: '',
      dateFrom: '',
      dateTo: '',
      recordingStatus: ''
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Filter Recordings</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Search"
            placeholder="Search by title or description"
            value={localFilters.search}
            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <TextField
            fullWidth
            label="Date From"
            type="date"
            value={localFilters.dateFrom}
            onChange={(e) => setLocalFilters({ ...localFilters, dateFrom: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            fullWidth
            label="Date To"
            type="date"
            value={localFilters.dateTo}
            onChange={(e) => setLocalFilters({ ...localFilters, dateTo: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Recording Status</InputLabel>
            <Select
              value={localFilters.recordingStatus}
              onChange={(e) => setLocalFilters({ ...localFilters, recordingStatus: e.target.value })}
              label="Recording Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="recording">Recording</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="not_started">Not Started</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleResetFilters}>
          Reset
        </Button>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordingsManagement;