import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add,
  School,
  Edit,
  Delete,
  LocationOn,
  CalendarToday,
  Grade,
  MenuBook,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Education } from '../../services/cvBuilderService';

interface CVEducationStepProps {
  data: Education[];
  onChange: (data: Education[]) => void;
  onGenerateAIContent: (prompt: string, section: string) => Promise<string>;
}

const CVEducationStep: React.FC<CVEducationStepProps> = ({
  data,
  onChange,
  onGenerateAIContent,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentEducation, setCurrentEducation] = useState<Education>({
    id: '',
    degree: '',
    institution: '',
    location: '',
    graduationDate: '',
    gpa: '',
    relevantCourses: [''],
  });

  const handleAddEducation = () => {
    setCurrentEducation({
      id: Date.now().toString(),
      degree: '',
      institution: '',
      location: '',
      graduationDate: '',
      gpa: '',
      relevantCourses: [''],
    });
    setEditingIndex(null);
    setDialogOpen(true);
  };

  const handleEditEducation = (index: number) => {
    setCurrentEducation(data[index]);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDeleteEducation = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    onChange(newData);
  };

  const handleSaveEducation = () => {
    const newData = [...data];
    if (editingIndex !== null) {
      newData[editingIndex] = currentEducation;
    } else {
      newData.push(currentEducation);
    }
    onChange(newData);
    setDialogOpen(false);
  };

  const handleInputChange = (field: keyof Education, value: any) => {
    setCurrentEducation(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addCourse = () => {
    setCurrentEducation(prev => ({
      ...prev,
      relevantCourses: [...(prev.relevantCourses || []), ''],
    }));
  };

  const updateCourse = (index: number, value: string) => {
    const newCourses = [...(currentEducation.relevantCourses || [])];
    newCourses[index] = value;
    setCurrentEducation(prev => ({
      ...prev,
      relevantCourses: newCourses,
    }));
  };

  const removeCourse = (index: number) => {
    const newCourses = [...(currentEducation.relevantCourses || [])];
    newCourses.splice(index, 1);
    setCurrentEducation(prev => ({
      ...prev,
      relevantCourses: newCourses,
    }));
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
        <Box display="flex" alignItems="center">
          <School sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Education</Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddEducation}
        >
          Add Education
        </Button>
      </Box>

      {data.length === 0 ? (
        <Card elevation={1} sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <School sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No education added yet
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              Add your educational background to showcase your academic achievements
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddEducation}
            >
              Add Your Education
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {data.map((education, index) => (
            <Grid item xs={12} key={education.id}>
              <Card elevation={1}>
                <CardContent>
                  <Box display="flex" alignItems="start" justifyContent="between">
                    <Box flexGrow={1}>
                      <Typography variant="h6" gutterBottom>
                        {education.degree}
                      </Typography>
                      
                      <Stack direction="row" spacing={2} alignItems="center" mb={1} flexWrap="wrap" useFlexGap>
                        <Box display="flex" alignItems="center">
                          <School sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {education.institution}
                          </Typography>
                        </Box>
                        
                        {education.location && (
                          <Box display="flex" alignItems="center">
                            <LocationOn sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {education.location}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box display="flex" alignItems="center">
                          <CalendarToday sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {dayjs(education.graduationDate).format('MMM YYYY')}
                          </Typography>
                        </Box>
                        
                        {education.gpa && (
                          <Box display="flex" alignItems="center">
                            <Grade sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              GPA: {education.gpa}
                            </Typography>
                          </Box>
                        )}
                      </Stack>

                      {education.relevantCourses && education.relevantCourses.some(c => c.trim()) && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            Relevant Courses:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {education.relevantCourses.filter(c => c.trim()).slice(0, 4).map((course, idx) => (
                              <Chip
                                key={idx}
                                label={course}
                                size="small"
                                variant="outlined"
                                icon={<MenuBook />}
                              />
                            ))}
                            {education.relevantCourses.filter(c => c.trim()).length > 4 && (
                              <Chip
                                label={`+${education.relevantCourses.filter(c => c.trim()).length - 4} more`}
                                size="small"
                                variant="outlined"
                                color="secondary"
                              />
                            )}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                    
                    <Box display="flex" flexDirection="column" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditEducation(index)}
                        color="primary"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteEducation(index)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Education Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingIndex !== null ? 'Edit Education' : 'Add Education'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Degree"
                value={currentEducation.degree}
                onChange={(e) => handleInputChange('degree', e.target.value)}
                required
                placeholder="e.g., Bachelor of Science in Computer Science"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Institution"
                value={currentEducation.institution}
                onChange={(e) => handleInputChange('institution', e.target.value)}
                required
                placeholder="e.g., University of Technology"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={currentEducation.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Country"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Graduation Date"
                  value={currentEducation.graduationDate ? dayjs(currentEducation.graduationDate) : null}
                  onChange={(date) => handleInputChange('graduationDate', date?.format('YYYY-MM-DD') || '')}
                  views={['year', 'month']}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GPA (Optional)"
                value={currentEducation.gpa || ''}
                onChange={(e) => handleInputChange('gpa', e.target.value)}
                placeholder="e.g., 3.8/4.0"
                helperText="Include if it strengthens your application"
              />
            </Grid>
            
            {/* Relevant Courses Section */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Typography variant="subtitle1">Relevant Courses (Optional)</Typography>
                <Button
                  size="small"
                  onClick={addCourse}
                  startIcon={<Add />}
                >
                  Add Course
                </Button>
              </Box>
              
              {(currentEducation.relevantCourses || []).map((course, index) => (
                <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Course name..."
                    value={course}
                    onChange={(e) => updateCourse(index, e.target.value)}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeCourse(index)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              
              <Typography variant="caption" color="text.secondary">
                Add courses that are relevant to your target job
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveEducation}
            variant="contained"
            disabled={!currentEducation.degree || !currentEducation.institution}
          >
            {editingIndex !== null ? 'Update' : 'Add'} Education
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CVEducationStep;