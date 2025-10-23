import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import {
  CalendarToday,
  Description,
  VideoFile,
  Quiz,
  Assignment,
  ExpandMore,
  Schedule,
  CheckCircle,
  PlayArrow,
  MenuBook,
  AutoStories,
  Psychology,
  Visibility
} from '@mui/icons-material';
import { weekService, Week, WeekMaterial } from '../../services/weekService';
import { courseService } from '../../services/courseService';

interface AdminCourseWeeksProps {
  courseId: string;
}

const AdminCourseWeeks: React.FC<AdminCourseWeeksProps> = ({ courseId }) => {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [structuredNotes, setStructuredNotes] = useState<Record<string, any[]>>({});
  const [notesLoading, setNotesLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadWeeks();
  }, [courseId]);

  const loadWeeks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use admin-specific method to avoid 403 errors
      const course = await courseService.getCourseByIdForAdmin(courseId);
      
      // Try to get weeks data, but if it fails, we can still show course info
      try {
        const weeksData = await weekService.getCourseWeeks(courseId);
        setWeeks(weeksData);
      } catch (weeksError) {
        console.warn('Failed to load weeks data:', weeksError);
        // If weeks service fails, create a basic week structure from course data
        if (course.content && course.content.length > 0) {
          const basicWeek = {
            _id: 'basic-week',
            weekNumber: 1,
            title: 'Course Materials',
            description: 'All course materials and content',
            startDate: course.createdAt,
            endDate: course.updatedAt,
            materials: course.content.map((material: any, index: number) => ({
              _id: material._id || `material-${index}`,
              title: material.title,
              description: material.description,
              type: material.type,
              url: material.url,
              duration: material.duration,
              isRequired: true,
              order: material.order || index + 1
            })),
            learningObjectives: course.learningOutcomes || []
          };
          setWeeks([basicWeek]);
        } else {
          setWeeks([]);
        }
      }
    } catch (err) {
      console.error('Failed to load weeks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load weeks. This may be due to insufficient permissions.');
    } finally {
      setLoading(false);
    }
  };

  const getMaterialIcon = (material: WeekMaterial) => {
    switch (material.type?.toLowerCase()) {
      case 'document':
      case 'pdf':
        return <Description color="primary" />;
      case 'video':
        return <VideoFile color="secondary" />;
      case 'quiz':
        return <Quiz color="warning" />;
      case 'assignment':
        return <Assignment color="info" />;
      default:
        return <MenuBook color="action" />;
    }
  };

  const getMaterialTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'document':
      case 'pdf':
        return 'primary';
      case 'video':
        return 'secondary';
      case 'quiz':
        return 'warning';
      case 'assignment':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Load structured notes for a specific week
  const loadStructuredNotes = async (weekId: string) => {
    try {
      setNotesLoading(prev => ({ ...prev, [weekId]: true }));
      
      // Try to fetch structured notes for the week
      const response = await fetch(`/api/courses/${courseId}/weeks/${weekId}/notes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }).catch(() => {
        // If endpoint doesn't exist, return empty array
        return { json: () => Promise.resolve({ data: [] }) };
      });
      
      const data = await response.json();
      const notes = data.data || [];
      
      setStructuredNotes(prev => ({ ...prev, [weekId]: notes }));
    } catch (err) {
      console.warn('Failed to load structured notes for week:', weekId, err);
      setStructuredNotes(prev => ({ ...prev, [weekId]: [] }));
    } finally {
      setNotesLoading(prev => ({ ...prev, [weekId]: false }));
    }
  };

  // Handle viewing structured notes
  const handleViewStructuredNotes = (weekId: string) => {
    if (!structuredNotes[weekId]) {
      loadStructuredNotes(weekId);
    }
  };

  const getWeekStatus = (week: Week) => {
    const now = new Date();
    const startDate = new Date(week.startDate);
    const endDate = new Date(week.endDate);

    if (now < startDate) {
      return { status: 'upcoming', color: 'info', label: 'Upcoming' };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'current', color: 'success', label: 'Current' };
    } else {
      return { status: 'completed', color: 'default', label: 'Completed' };
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <CalendarToday sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">
            Course Structure ({weeks.length} weeks)
          </Typography>
        </Box>

        {weeks.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Weeks Defined
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This course doesn't have any weeks structured yet.
            </Typography>
          </Paper>
        ) : (
          <Box>
            {weeks.map((week, weekIndex) => {
              const weekStatus = getWeekStatus(week);
              const materialCount = week.materials?.length || 0;
              
              return (
                <Accordion key={week._id} defaultExpanded={weekIndex === 0}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" width="100%">
                      <Box sx={{ mr: 2 }}>
                        <Badge
                          badgeContent={materialCount}
                          color="primary"
                          sx={{ mr: 2 }}
                        >
                          <Schedule color="primary" />
                        </Badge>
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Week {week.weekNumber}: {week.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(week.startDate)} - {formatDate(week.endDate)}
                        </Typography>
                      </Box>
                      <Chip
                        label={weekStatus.label}
                        size="small"
                        color={weekStatus.color}
                        sx={{ mr: 2 }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* Week Description */}
                    {week.description && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                          {week.description}
                        </Typography>
                      </Box>
                    )}

                    {/* Week Materials */}
                    {materialCount > 0 ? (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Week Materials ({materialCount})
                        </Typography>
                        <List>
                          {week.materials?.map((material, materialIndex) => (
                            <React.Fragment key={material._id || materialIndex}>
                              <ListItem>
                                <ListItemIcon>
                                  {getMaterialIcon(material)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box>
                                      <Typography variant="body1" fontWeight="medium">
                                        {material.title}
                                      </Typography>
                                      {material.description && (
                                        <Typography variant="body2" color="text.secondary">
                                          {material.description}
                                        </Typography>
                                      )}
                                      <Box display="flex" alignItems="center" gap={2} mt={1}>
                                        <Chip
                                          label={material.type}
                                          size="small"
                                          color={getMaterialTypeColor(material.type)}
                                          variant="outlined"
                                        />
                                        {material.duration && (
                                          <Typography variant="caption" color="text.secondary">
                                            Duration: {material.duration} min
                                          </Typography>
                                        )}
                                        {material.isRequired && (
                                          <Chip
                                            label="Required"
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                          />
                                        )}
                                      </Box>
                                    </Box>
                                  }
                                />
                                <Box>
                                  {material.url && (
                                    <Tooltip title="View Material">
                                      <IconButton
                                        size="small"
                                        onClick={() => window.open(material.url, '_blank')}
                                      >
                                        <PlayArrow />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </ListItem>
                              {materialIndex < (week.materials?.length || 0) - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                        </List>
                      </Box>
                    ) : (
                      <Paper sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No materials assigned to this week yet.
                        </Typography>
                      </Paper>
                    )}

                    {/* Week Learning Objectives */}
                    {week.learningObjectives && week.learningObjectives.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Learning Objectives
                        </Typography>
                        <Box component="ul" sx={{ pl: 2 }}>
                          {week.learningObjectives.map((objective: string, index: number) => (
                            <Typography key={index} component="li" variant="body2" sx={{ mb: 1 }}>
                              {objective}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Structured Notes Section */}
                    <Box sx={{ mt: 3 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="subtitle2">
                          AI-Generated Structured Notes
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={notesLoading[week._id] ? <CircularProgress size={16} /> : <Psychology />}
                          onClick={() => handleViewStructuredNotes(week._id)}
                          disabled={notesLoading[week._id]}
                        >
                          {structuredNotes[week._id] ? 'Refresh Notes' : 'Load Notes'}
                        </Button>
                      </Box>
                      
                      {structuredNotes[week._id] && structuredNotes[week._id].length > 0 ? (
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <List>
                            {structuredNotes[week._id].map((note: any, index: number) => (
                              <React.Fragment key={note._id || index}>
                                <ListItem>
                                  <ListItemIcon>
                                    {note.type === 'summary' ? <AutoStories color="primary" /> :
                                     note.type === 'key_points' ? <Psychology color="warning" /> :
                                     <Description color="info" />}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box>
                                        <Typography variant="body1" fontWeight="medium">
                                          {note.title || `${note.type?.replace('_', ' ').toUpperCase()} Notes`}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                          {note.content?.substring(0, 200)}...
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                                          <Chip
                                            label={note.type?.replace('_', ' ') || 'note'}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                          />
                                          {note.confidence && (
                                            <Chip
                                              label={`${Math.round(note.confidence * 100)}% confidence`}
                                              size="small"
                                              color={note.confidence >= 0.8 ? 'success' : 'warning'}
                                              variant="outlined"
                                            />
                                          )}
                                        </Box>
                                      </Box>
                                    }
                                  />
                                  <ListItemSecondaryAction>
                                    <Tooltip title="View Full Notes">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          // Open notes in a dialog or new window
                                          const notesWindow = window.open('', '_blank', 'width=800,height=600');
                                          if (notesWindow) {
                                            notesWindow.document.write(`
                                              <html>
                                                <head><title>Structured Notes - ${note.title}</title></head>
                                                <body style="font-family: Arial, sans-serif; padding: 20px;">
                                                  <h2>${note.title || 'Structured Notes'}</h2>
                                                  <div style="white-space: pre-wrap; line-height: 1.6;">${note.content}</div>
                                                </body>
                                              </html>
                                            `);
                                          }
                                        }}
                                      >
                                        <Visibility />
                                      </IconButton>
                                    </Tooltip>
                                  </ListItemSecondaryAction>
                                </ListItem>
                                {index < structuredNotes[week._id].length - 1 && <Divider />}
                              </React.Fragment>
                            ))}
                          </List>
                        </Paper>
                      ) : structuredNotes[week._id] && structuredNotes[week._id].length === 0 ? (
                        <Paper sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                          <AutoStories sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            No structured notes available for this week yet.
                          </Typography>
                        </Paper>
                      ) : (
                        <Paper sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                          <Psychology sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Click "Load Notes" to fetch AI-generated structured notes for this week.
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}

        {/* Weeks Summary */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Course Structure Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {weeks.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Weeks
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="success">
                  {weeks.reduce((total, week) => total + (week.materials?.length || 0), 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Materials
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="warning">
                  {weeks.filter(week => {
                    const now = new Date();
                    const startDate = new Date(week.startDate);
                    const endDate = new Date(week.endDate);
                    return now >= startDate && now <= endDate;
                  }).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Current Weeks
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="info">
                  {weeks.filter(week => {
                    const now = new Date();
                    const endDate = new Date(week.endDate);
                    return now > endDate;
                  }).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completed Weeks
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdminCourseWeeks;
