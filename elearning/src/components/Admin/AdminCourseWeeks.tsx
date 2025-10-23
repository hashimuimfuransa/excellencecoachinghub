import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  MenuBook
} from '@mui/icons-material';
import { weekService, Week, WeekMaterial } from '../../services/weekService';

interface AdminCourseWeeksProps {
  courseId: string;
}

const AdminCourseWeeks: React.FC<AdminCourseWeeksProps> = ({ courseId }) => {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeeks();
  }, [courseId]);

  const loadWeeks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const weeksData = await weekService.getCourseWeeks(courseId);
      setWeeks(weeksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weeks');
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
