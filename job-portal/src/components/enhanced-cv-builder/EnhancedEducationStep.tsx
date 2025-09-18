import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  Add,
  Delete,
  ExpandMore,
  School,
  EmojiEvents,
  CheckCircle,
  Warning,
  Lightbulb,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

interface Education {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  honors: string;
  relevantCoursework: string[];
  activities: string[];
  thesis: string;
  isCurrentlyStudying: boolean;
}

interface EnhancedEducationStepProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

const defaultEducation: Education = {
  id: '',
  degree: '',
  fieldOfStudy: '',
  institution: '',
  location: '',
  startDate: '',
  endDate: '',
  gpa: '',
  honors: '',
  relevantCoursework: [''],
  activities: [''],
  thesis: '',
  isCurrentlyStudying: false,
};

const degreeTypes = [
  'High School Diploma',
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'Doctoral Degree (PhD)',
  'Professional Degree (JD, MD, etc.)',
  'Certificate',
  'Diploma',
  'Other',
];

const EnhancedEducationStep: React.FC<EnhancedEducationStepProps> = ({
  data,
  onChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [expandedAccordion, setExpandedAccordion] = useState<number>(0);

  const addEducation = () => {
    const newEducation: Education = {
      ...defaultEducation,
      id: Date.now().toString(),
    };
    onChange([...data, newEducation]);
    setExpandedAccordion(data.length);
  };

  const deleteEducation = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    
    // If currently studying, clear end date
    if (field === 'isCurrentlyStudying' && value) {
      newData[index].endDate = '';
    }
    
    onChange(newData);
  };

  const addCoursework = (educationIndex: number) => {
    const newData = [...data];
    newData[educationIndex].relevantCoursework.push('');
    onChange(newData);
  };

  const updateCoursework = (educationIndex: number, courseworkIndex: number, value: string) => {
    const newData = [...data];
    newData[educationIndex].relevantCoursework[courseworkIndex] = value;
    onChange(newData);
  };

  const deleteCoursework = (educationIndex: number, courseworkIndex: number) => {
    const newData = [...data];
    newData[educationIndex].relevantCoursework = newData[educationIndex].relevantCoursework.filter(
      (_, i) => i !== courseworkIndex
    );
    onChange(newData);
  };

  const addActivity = (educationIndex: number) => {
    const newData = [...data];
    newData[educationIndex].activities.push('');
    onChange(newData);
  };

  const updateActivity = (educationIndex: number, activityIndex: number, value: string) => {
    const newData = [...data];
    newData[educationIndex].activities[activityIndex] = value;
    onChange(newData);
  };

  const deleteActivity = (educationIndex: number, activityIndex: number) => {
    const newData = [...data];
    newData[educationIndex].activities = newData[educationIndex].activities.filter(
      (_, i) => i !== activityIndex
    );
    onChange(newData);
  };

  const getEducationCompletionScore = (education: Education): number => {
    let score = 0;
    if (education.degree) score += 25;
    if (education.fieldOfStudy) score += 25;
    if (education.institution) score += 25;
    if (education.startDate) score += 10;
    if (education.endDate || education.isCurrentlyStudying) score += 10;
    if (education.gpa && parseFloat(education.gpa) > 0) score += 5;
    return score;
  };

  const getOverallCompletionScore = (): number => {
    if (data.length === 0) return 0;
    const totalScore = data.reduce((sum, edu) => sum + getEducationCompletionScore(edu), 0);
    return Math.round(totalScore / data.length);
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    return dayjs(dateString).format('MMM YYYY');
  };

  const validateGPA = (gpa: string): boolean => {
    if (!gpa) return true; // Optional field
    const gpaNumber = parseFloat(gpa);
    return !isNaN(gpaNumber) && gpaNumber >= 0 && gpaNumber <= 4.0;
  };

  const getTipsForEducation = (education: Education): string[] => {
    const tips: string[] = [];
    
    if (!education.degree) tips.push('Select your degree type');
    if (!education.fieldOfStudy) tips.push('Add your field of study/major');
    if (!education.institution) tips.push('Add institution name');
    if (!education.startDate) tips.push('Add start date');
    if (!education.endDate && !education.isCurrentlyStudying) tips.push('Add graduation date or mark as currently studying');
    if (education.gpa && !validateGPA(education.gpa)) tips.push('GPA should be between 0.0 and 4.0');
    if (!education.relevantCoursework.some(c => c.trim())) {
      tips.push('Add relevant coursework to strengthen your profile');
    }
    
    return tips;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header with completion status */}
        <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Education
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {getOverallCompletionScore()}% Complete
                </Typography>
                <Button
                  startIcon={<Add />}
                  onClick={addEducation}
                  variant="contained"
                  size="small"
                >
                  Add Education
                </Button>
              </Box>
            </Box>

            {data.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                💡 <strong>Pro Tip:</strong> List education in reverse chronological order (most recent first). Include relevant coursework and activities that align with your career goals.
              </Alert>
            )}
          </CardContent>
        </Card>

        {data.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <CardContent>
              <School sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No education added yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add your educational background to showcase your academic achievements.
                Include degrees, certifications, and relevant training programs.
              </Typography>
              <Button
                startIcon={<Add />}
                onClick={addEducation}
                variant="contained"
                size="large"
              >
                Add Your First Education
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ space: 2 }}>
            {data.map((education, index) => (
              <Fade in={true} key={education.id} timeout={300 * (index + 1)}>
                <Accordion
                  expanded={expandedAccordion === index}
                  onChange={() => setExpandedAccordion(expandedAccordion === index ? -1 : index)}
                  sx={{ mb: 2, border: 1, borderColor: 'divider' }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mr: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {education.degree || 'Degree'} {education.fieldOfStudy && `in ${education.fieldOfStudy}`}
                          </Typography>
                          {education.isCurrentlyStudying && (
                            <Chip label="Current" size="small" color="success" />
                          )}
                          <Chip
                            label={`${getEducationCompletionScore(education)}%`}
                            size="small"
                            color={getEducationCompletionScore(education) >= 80 ? 'success' : 
                                   getEducationCompletionScore(education) >= 50 ? 'warning' : 'error'}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {education.institution || 'Institution'} • {education.location || 'Location'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateForDisplay(education.startDate)} - {
                            education.isCurrentlyStudying ? 'Present' : formatDateForDisplay(education.endDate)
                          }
                          {education.gpa && ` • GPA: ${education.gpa}`}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEducation(index);
                        }}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Grid container spacing={3}>
                      {/* Basic Information */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Basic Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                              <InputLabel>Degree Type</InputLabel>
                              <Select
                                value={education.degree}
                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                label="Degree Type"
                              >
                                {degreeTypes.map((degree) => (
                                  <MenuItem key={degree} value={degree}>
                                    {degree}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Field of Study / Major"
                              value={education.fieldOfStudy}
                              onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                              required
                              placeholder="e.g., Computer Science, Business Administration"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Institution"
                              value={education.institution}
                              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                              required
                              placeholder="e.g., Harvard University, MIT"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Location"
                              value={education.location}
                              onChange={(e) => updateEducation(index, 'location', e.target.value)}
                              placeholder="e.g., Boston, MA"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <DatePicker
                              label="Start Date"
                              value={education.startDate ? dayjs(education.startDate) : null}
                              onChange={(date) => updateEducation(index, 'startDate', date?.format('YYYY-MM-DD'))}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  required: true,
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            {!education.isCurrentlyStudying && (
                              <DatePicker
                                label="Graduation Date"
                                value={education.endDate ? dayjs(education.endDate) : null}
                                onChange={(date) => updateEducation(index, 'endDate', date?.format('YYYY-MM-DD'))}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    required: !education.isCurrentlyStudying,
                                  }
                                }}
                              />
                            )}
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="GPA"
                              value={education.gpa}
                              onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                              placeholder="e.g., 3.8"
                              helperText="Scale: 4.0 (optional)"
                              type="number"
                              inputProps={{ step: 0.1, min: 0, max: 4 }}
                              error={education.gpa !== '' && !validateGPA(education.gpa)}
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      {/* Additional Details */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Additional Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Honors & Awards"
                              value={education.honors}
                              onChange={(e) => updateEducation(index, 'honors', e.target.value)}
                              placeholder="e.g., Magna Cum Laude, Dean's List"
                              multiline
                              rows={2}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Thesis/Capstone Project"
                              value={education.thesis}
                              onChange={(e) => updateEducation(index, 'thesis', e.target.value)}
                              placeholder="Title of your thesis or major project"
                              multiline
                              rows={2}
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      {/* Relevant Coursework */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="primary">
                            Relevant Coursework
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={() => addCoursework(index)}
                          >
                            Add Course
                          </Button>
                        </Box>
                        {education.relevantCoursework.map((course, courseIndex) => (
                          <Box key={courseIndex} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                              fullWidth
                              placeholder="e.g., Data Structures & Algorithms, Machine Learning"
                              value={course}
                              onChange={(e) => updateCoursework(index, courseIndex, e.target.value)}
                            />
                            <IconButton
                              onClick={() => deleteCoursework(index, courseIndex)}
                              disabled={education.relevantCoursework.length === 1}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        ))}
                      </Grid>

                      {/* Activities & Organizations */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="primary">
                            Activities & Organizations
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={() => addActivity(index)}
                          >
                            Add Activity
                          </Button>
                        </Box>
                        {education.activities.map((activity, activityIndex) => (
                          <Box key={activityIndex} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                              fullWidth
                              placeholder="e.g., Student Government, Programming Club, Volunteer Work"
                              value={activity}
                              onChange={(e) => updateActivity(index, activityIndex, e.target.value)}
                            />
                            <IconButton
                              onClick={() => deleteActivity(index, activityIndex)}
                              disabled={education.activities.length === 1}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        ))}
                      </Grid>

                      {/* Tips and Suggestions */}
                      {getTipsForEducation(education).length > 0 && (
                        <Grid item xs={12}>
                          <Alert severity="warning">
                            <Typography variant="subtitle2" gutterBottom>
                              💡 Suggestions to improve this education entry:
                            </Typography>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                              {getTipsForEducation(education).map((tip, tipIndex) => (
                                <li key={tipIndex}>{tip}</li>
                              ))}
                            </ul>
                          </Alert>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Fade>
            ))}
          </Box>
        )}

        {/* Overall Tips */}
        {data.length > 0 && (
          <Card sx={{ mt: 3, bgcolor: 'info.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Lightbulb sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="subtitle1" fontWeight="bold" color="info.main">
                  Education Section Best Practices
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" paragraph>
                    <strong>Order:</strong> List education in reverse chronological order (most recent first).
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>GPA:</strong> Include GPA if it's 3.5 or higher, or if you're a recent graduate.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" paragraph>
                    <strong>Relevance:</strong> Include coursework that's relevant to your target position.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Activities:</strong> Highlight leadership roles and achievements in extracurricular activities.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default EnhancedEducationStep;