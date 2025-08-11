import React, { useState } from 'react';
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
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider
} from '@mui/material';
import {
  Save,
  Send,
  Add,
  Delete,
  School,
  Description,
  AttachMoney,
  Category
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';

const steps = ['Basic Information', 'Course Details', 'Review & Submit'];

const categories = [
  'Programming',
  'Web Development',
  'Data Science',
  'Mobile Development',
  'DevOps',
  'Cybersecurity',
  'AI/Machine Learning',
  'Database',
  'Cloud Computing',
  'UI/UX Design'
];

const CreateCourse: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    price: 0,
    duration: 0,
    prerequisites: [] as string[],
    learningObjectives: [] as string[],
    tags: [] as string[]
  });

  // Temporary input states
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newTag, setNewTag] = useState('');

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Array management functions
  const addToArray = (field: keyof typeof formData, value: string, setter: (value: string) => void) => {
    if (!value.trim()) return;
    
    const currentArray = formData[field] as string[];
    if (!currentArray.includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }));
      setter('');
    }
  };

  const removeFromArray = (field: keyof typeof formData, index: number) => {
    const currentArray = formData[field] as string[];
    setFormData(prev => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index)
    }));
  };

  // Form validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Information
        return !!(formData.title && formData.description && formData.category);
      case 1: // Course Details
        return !!(formData.level && formData.price >= 0 && formData.duration > 0);
      default:
        return true;
    }
  };

  // Navigation
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      setError(null);
    } else {
      setError('Please fill in all required fields before proceeding.');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError(null);
  };

  // Submit course
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const courseData = {
        ...formData,
        instructor: user?._id
      };

      const response = await courseService.createCourse(courseData);

      setSuccess('Course created successfully and submitted for approval!');

      // Redirect to courses page after a delay
      setTimeout(() => {
        navigate('/dashboard/teacher/courses');
      }, 2000);

    } catch (err: any) {
      console.error('Course creation error:', err);

      // Handle specific teacher profile errors
      if (err.response?.data?.code) {
        const { code, profileStatus, error: errorMessage } = err.response.data;

        switch (code) {
          case 'PROFILE_NOT_FOUND':
            setError('Please create your teacher profile before creating courses.');
            setTimeout(() => {
              navigate('/dashboard/teacher/profile');
            }, 3000);
            break;
          case 'PROFILE_INCOMPLETE':
            setError('Please complete your teacher profile before creating courses.');
            setTimeout(() => {
              navigate('/dashboard/teacher/profile');
            }, 3000);
            break;
          case 'PROFILE_PENDING':
            setError('Your teacher profile is pending approval. You cannot create courses until your profile is approved.');
            break;
          case 'PROFILE_REJECTED':
            setError('Your teacher profile has been rejected. Please update your profile and resubmit for approval.');
            setTimeout(() => {
              navigate('/dashboard/teacher/profile');
            }, 3000);
            break;
          default:
            setError(errorMessage || 'Your teacher profile is not approved. Please contact support.');
        }
      } else {
        setError(err.message || 'Failed to create course');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Create New Course
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create a comprehensive course to share your knowledge with students
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

        {/* Progress Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Form Content */}
        <Box>
          {/* Step 0: Basic Information */}
          {activeStep === 0 && (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <School sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Basic Information
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Course Title *"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Complete Web Development Bootcamp"
                      helperText="Choose a clear, descriptive title for your course"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Course Description *"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe what students will learn in this course..."
                      helperText={`${formData.description.length}/2000 characters`}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category *</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category *"
                        onChange={(e) => handleInputChange('category', e.target.value)}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Difficulty Level *</InputLabel>
                      <Select
                        value={formData.level}
                        label="Difficulty Level *"
                        onChange={(e) => handleInputChange('level', e.target.value)}
                      >
                        <MenuItem value="Beginner">Beginner</MenuItem>
                        <MenuItem value="Intermediate">Intermediate</MenuItem>
                        <MenuItem value="Advanced">Advanced</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Course Details */}
          {activeStep === 1 && (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Description sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Course Details
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Price (USD) *"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{ startAdornment: '$' }}
                      helperText="Set to 0 for free courses"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Duration (hours) *"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 1, max: 1000 }}
                      helperText="Estimated course duration"
                    />
                  </Grid>
                  
                  {/* Prerequisites */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Prerequisites
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        fullWidth
                        label="Add Prerequisite"
                        value={newPrerequisite}
                        onChange={(e) => setNewPrerequisite(e.target.value)}
                        placeholder="e.g., Basic HTML knowledge"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('prerequisites', newPrerequisite, setNewPrerequisite);
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => addToArray('prerequisites', newPrerequisite, setNewPrerequisite)}
                        disabled={!newPrerequisite.trim()}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {formData.prerequisites.map((prereq, index) => (
                        <Chip
                          key={index}
                          label={prereq}
                          onDelete={() => removeFromArray('prerequisites', index)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Learning Objectives */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Learning Objectives
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        fullWidth
                        label="Add Learning Objective"
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        placeholder="e.g., Build responsive websites"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('learningObjectives', newObjective, setNewObjective);
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => addToArray('learningObjectives', newObjective, setNewObjective)}
                        disabled={!newObjective.trim()}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {formData.learningObjectives.map((objective, index) => (
                        <Chip
                          key={index}
                          label={objective}
                          onDelete={() => removeFromArray('learningObjectives', index)}
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Tags */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Tags
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        fullWidth
                        label="Add Tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="e.g., javascript, react"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('tags', newTag, setNewTag);
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => addToArray('tags', newTag, setNewTag)}
                        disabled={!newTag.trim()}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {formData.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          onDelete={() => removeFromArray('tags', index)}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Review & Submit */}
          {activeStep === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Review & Submit
                </Typography>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  Please review your course information. Once submitted, your course will be reviewed by our admin team before being published.
                </Alert>

                {/* Course Summary */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Basic Information
                        </Typography>
                        <Typography variant="body2"><strong>Title:</strong> {formData.title}</Typography>
                        <Typography variant="body2"><strong>Category:</strong> {formData.category}</Typography>
                        <Typography variant="body2"><strong>Level:</strong> {formData.level}</Typography>
                        <Typography variant="body2"><strong>Price:</strong> ${formData.price}</Typography>
                        <Typography variant="body2"><strong>Duration:</strong> {formData.duration} hours</Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Course Content
                        </Typography>
                        <Typography variant="body2"><strong>Prerequisites:</strong> {formData.prerequisites.length}</Typography>
                        <Typography variant="body2"><strong>Learning Objectives:</strong> {formData.learningObjectives.length}</Typography>
                        <Typography variant="body2"><strong>Tags:</strong> {formData.tags.length}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Description
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {formData.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
          >
            Back
          </Button>

          <Box display="flex" gap={2}>
            {activeStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={!validateStep(activeStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                variant="contained"
                color="success"
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
              >
                {loading ? 'Creating...' : 'Create Course'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateCourse;
