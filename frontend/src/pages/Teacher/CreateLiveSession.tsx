import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  FormControlLabel,
  Switch,
  Chip,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  VideoCall,
  Schedule,
  Add,
  Delete,
  Save,
  Send
} from '@mui/icons-material';
// Removed date picker imports - using regular TextField instead
import { useAuth } from '../../store/AuthContext';
import { liveSessionService, ICreateLiveSessionData } from '../../services/liveSessionService';
import { courseService, ICourse } from '../../services/courseService';

const CreateLiveSession: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');

  // State management
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [courses, setCourses] = useState<ICourse[]>([]);

  // Form data
  const [formData, setFormData] = useState<ICreateLiveSessionData>({
    title: '',
    description: '',
    courseId: preselectedCourseId || '',
    scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    duration: 60,
    maxParticipants: 50,
    isRecorded: false,
    agenda: [],
    chatEnabled: true,
    handRaiseEnabled: true,
    screenShareEnabled: true,
    attendanceRequired: false
  });

  // Temporary states for agenda items
  const [newAgendaItem, setNewAgendaItem] = useState('');

  // Load teacher's courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCoursesLoading(true);
        const response = await courseService.getTeacherCourses();
        setCourses(response.courses.filter((course: ICourse) => course.status === 'approved'));
      } catch (err: any) {
        setError(err.message || 'Failed to load courses');
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof ICreateLiveSessionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle agenda management
  const addAgendaItem = () => {
    if (!newAgendaItem.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      agenda: [...(prev.agenda || []), newAgendaItem.trim()]
    }));
    setNewAgendaItem('');
  };

  const removeAgendaItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda?.filter((_, i) => i !== index) || []
    }));
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Session title is required');
      return false;
    }
    if (!formData.courseId) {
      setError('Please select a course');
      return false;
    }
    if (!formData.scheduledTime) {
      setError('Please select a scheduled time');
      return false;
    }
    if (new Date(formData.scheduledTime) <= new Date()) {
      setError('Scheduled time must be in the future');
      return false;
    }
    if (formData.duration < 15 || formData.duration > 480) {
      setError('Duration must be between 15 minutes and 8 hours');
      return false;
    }
    if (formData.maxParticipants && (formData.maxParticipants < 1 || formData.maxParticipants > 1000)) {
      setError('Maximum participants must be between 1 and 1000');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const sessionData: ICreateLiveSessionData = {
        ...formData,
        scheduledTime: new Date(formData.scheduledTime).toISOString()
      };

      const session = await liveSessionService.createSession(sessionData);
      
      setSuccess('Live session created successfully!');
      
      // Redirect to sessions list after a delay
      setTimeout(() => {
        navigate('/dashboard/teacher/live-sessions');
      }, 2000);

    } catch (err: any) {
      console.error('Session creation error:', err);
      setError(err.message || 'Failed to create live session');
    } finally {
      setLoading(false);
    }
  };

  if (coursesLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard/teacher/live-sessions')}
              sx={{ mb: 2 }}
            >
              Back to Live Sessions
            </Button>

            <Typography variant="h4" gutterBottom>
              Create Live Session
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Schedule a live teaching session for your students
            </Typography>
          </Box>

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Form */}
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <VideoCall sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Session Information
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Session Title *"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Introduction to React Hooks"
                        helperText="Choose a clear, descriptive title for your session"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe what you'll cover in this session..."
                        helperText="Optional: Provide details about the session content"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Course *</InputLabel>
                        <Select
                          value={formData.courseId}
                          label="Course *"
                          onChange={(e) => handleInputChange('courseId', e.target.value)}
                        >
                          {courses.map((course) => (
                            <MenuItem key={course._id} value={course._id}>
                              {course.title}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Schedule & Settings */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Schedule sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Schedule & Settings
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Scheduled Time *"
                        type="datetime-local"
                        value={new Date(formData.scheduledTime).toISOString().slice(0, 16)}
                        onChange={(e) => {
                          const dateValue = new Date(e.target.value);
                          handleInputChange('scheduledTime', dateValue.toISOString());
                        }}
                        helperText="Select when the session will start"
                        InputLabelProps={{
                          shrink: true,
                        }}
                        inputProps={{
                          min: new Date().toISOString().slice(0, 16)
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Duration (minutes) *"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 60)}
                        inputProps={{ min: 15, max: 480 }}
                        helperText="Session duration (15 min - 8 hours)"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Max Participants"
                        type="number"
                        value={formData.maxParticipants}
                        onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 50)}
                        inputProps={{ min: 1, max: 1000 }}
                        helperText="Maximum number of participants (optional)"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Session Features */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Session Features
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.chatEnabled}
                            onChange={(e) => handleInputChange('chatEnabled', e.target.checked)}
                          />
                        }
                        label="Enable Chat"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.handRaiseEnabled}
                            onChange={(e) => handleInputChange('handRaiseEnabled', e.target.checked)}
                          />
                        }
                        label="Hand Raise"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.screenShareEnabled}
                            onChange={(e) => handleInputChange('screenShareEnabled', e.target.checked)}
                          />
                        }
                        label="Screen Share"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isRecorded}
                            onChange={(e) => handleInputChange('isRecorded', e.target.checked)}
                          />
                        }
                        label="Record Session"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.attendanceRequired}
                            onChange={(e) => handleInputChange('attendanceRequired', e.target.checked)}
                          />
                        }
                        label="Attendance Required"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Agenda */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Session Agenda (Optional)
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={2}>
                    <TextField
                      fullWidth
                      label="Add Agenda Item"
                      value={newAgendaItem}
                      onChange={(e) => setNewAgendaItem(e.target.value)}
                      placeholder="e.g., Introduction and overview"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addAgendaItem();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={addAgendaItem}
                      disabled={!newAgendaItem.trim()}
                      startIcon={<Add />}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {formData.agenda?.map((item, index) => (
                      <Chip
                        key={index}
                        label={item}
                        onDelete={() => removeAgendaItem(index)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  
                  {formData.agenda?.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      No agenda items added yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard/teacher/live-sessions')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                >
                  {loading ? 'Creating...' : 'Create Session'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
  );
};

export default CreateLiveSession;