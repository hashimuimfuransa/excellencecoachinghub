import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Badge
} from '@mui/material';
import {
  ExpandMore,
  BookOpen,
  Schedule,
  TrendingUp,
  CheckCircle,
  RadioButtonUnchecked,
  Visibility,
  Download,
  Info,
  PlayArrow,
  Pause,
  Stop,
  Refresh
} from '@mui/icons-material';
import { largeDocumentService, IProcessedCourseMaterial, ISubUnit } from '../../services/largeDocumentService';

interface StudentMaterialsViewerProps {
  courseId: string;
}

interface SubUnitProgress {
  subUnitId: string;
  isCompleted: boolean;
  timeSpent: number;
  lastAccessed: Date;
}

const StudentMaterialsViewer: React.FC<StudentMaterialsViewerProps> = ({ courseId }) => {
  const [materials, setMaterials] = useState<IProcessedCourseMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<IProcessedCourseMaterial | null>(null);
  const [subUnits, setSubUnits] = useState<ISubUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubUnit, setExpandedSubUnit] = useState<string | null>(null);
  const [progress, setProgress] = useState<SubUnitProgress[]>([]);
  const [currentSubUnit, setCurrentSubUnit] = useState<ISubUnit | null>(null);
  const [readingTime, setReadingTime] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load materials
  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await largeDocumentService.getProcessedCourseMaterials(courseId);
      setMaterials(data.processedMaterials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  // Load sub-units for a material
  const loadSubUnits = async (material: IProcessedCourseMaterial) => {
    try {
      setLoading(true);
      const data = await largeDocumentService.getSubUnits(courseId, material._id);
      setSubUnits(data.subUnits);
      setSelectedMaterial(material);
      setDialogOpen(true);
      
      // Initialize progress for sub-units
      const initialProgress: SubUnitProgress[] = data.subUnits.map(subUnit => ({
        subUnitId: subUnit._id || '',
        isCompleted: false,
        timeSpent: 0,
        lastAccessed: new Date()
      }));
      setProgress(initialProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sub-units');
    } finally {
      setLoading(false);
    }
  };

  // Start reading a sub-unit
  const startReading = (subUnit: ISubUnit) => {
    setCurrentSubUnit(subUnit);
    setIsReading(true);
    setReadingTime(0);
    setExpandedSubUnit(subUnit._id || null);
  };

  // Stop reading
  const stopReading = () => {
    if (currentSubUnit) {
      // Update progress
      setProgress(prev => prev.map(p => 
        p.subUnitId === currentSubUnit._id 
          ? { ...p, timeSpent: p.timeSpent + readingTime, lastAccessed: new Date() }
          : p
      ));
    }
    setIsReading(false);
    setCurrentSubUnit(null);
    setReadingTime(0);
  };

  // Mark sub-unit as completed
  const markCompleted = (subUnitId: string) => {
    setProgress(prev => prev.map(p => 
      p.subUnitId === subUnitId 
        ? { ...p, isCompleted: true, lastAccessed: new Date() }
        : p
    ));
  };

  // Calculate overall progress
  const calculateProgress = () => {
    if (progress.length === 0) return 0;
    const completed = progress.filter(p => p.isCompleted).length;
    return Math.round((completed / progress.length) * 100);
  };

  // Get sub-unit progress
  const getSubUnitProgress = (subUnitId: string) => {
    return progress.find(p => p.subUnitId === subUnitId);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate reading time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isReading) {
      interval = setInterval(() => {
        setReadingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isReading]);

  // Load materials on mount
  useEffect(() => {
    loadMaterials();
  }, [courseId]);

  if (loading && materials.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          📚 Course Materials
        </Typography>
        <Typography variant="body2" color="text.secondary">
          AI-organized learning materials with interactive sub-units
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Materials Grid */}
      <Grid container spacing={3}>
        {materials.map((material) => (
          <Grid item xs={12} md={6} lg={4} key={material._id}>
            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6" noWrap sx={{ flex: 1, mr: 1 }}>
                    {material.originalFileName}
                  </Typography>
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => loadSubUnits(material)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  <Chip
                    label={`${material.totalSubUnits} sub-units`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={largeDocumentService.formatReadingTime(material.estimatedTotalReadingTime)}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                  <Chip
                    label={material.difficultyLevel}
                    size="small"
                    sx={{
                      backgroundColor: largeDocumentService.getDifficultyColor(material.difficultyLevel),
                      color: 'white'
                    }}
                  />
                </Box>

                {material.topics.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Topics:
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {material.topics.slice(0, 3).map((topic, index) => (
                        <Chip key={index} label={topic} size="small" variant="outlined" />
                      ))}
                      {material.topics.length > 3 && (
                        <Chip label={`+${material.topics.length - 3}`} size="small" />
                      )}
                    </Box>
                  </Box>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                  <Typography variant="caption" color="text.secondary">
                    {material.views} views
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<BookOpen />}
                    onClick={() => loadSubUnits(material)}
                  >
                    Start Reading
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* No Materials */}
      {materials.length === 0 && !loading && (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No materials available yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your instructor hasn't uploaded any processed materials yet.
          </Typography>
        </Paper>
      )}

      {/* Sub-units Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedMaterial?.originalFileName}
            </Typography>
            <Box display="flex" gap={1}>
              <Chip
                label={`${calculateProgress()}% Complete`}
                color="success"
                variant="outlined"
              />
              <IconButton onClick={() => setDialogOpen(false)}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* Progress Overview */}
              <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  📊 Learning Progress
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={calculateProgress()}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {progress.filter(p => p.isCompleted).length} of {progress.length} sub-units completed
                </Typography>
              </Paper>

              {/* Sub-units List */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  📖 Sub-units
                </Typography>
                {subUnits.map((subUnit, index) => {
                  const subUnitProgress = getSubUnitProgress(subUnit._id || '');
                  const isCurrentSubUnit = currentSubUnit?._id === subUnit._id;
                  
                  return (
                    <Accordion
                      key={subUnit._id}
                      expanded={expandedSubUnit === subUnit._id}
                      onChange={() => setExpandedSubUnit(expandedSubUnit === subUnit._id ? null : subUnit._id || null)}
                    >
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box display="flex" alignItems="center" width="100%">
                          <Box display="flex" alignItems="center" mr={2}>
                            {subUnitProgress?.isCompleted ? (
                              <CheckCircle color="success" />
                            ) : (
                              <RadioButtonUnchecked />
                            )}
                          </Box>
                          <Box flex={1}>
                            <Typography variant="subtitle2">
                              {subUnit.title}
                            </Typography>
                            <Box display="flex" gap={1} mt={0.5}>
                              <Chip
                                label={largeDocumentService.formatReadingTime(subUnit.estimatedReadingTime)}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={largeDocumentService.getDifficultyLabel(subUnit.difficulty)}
                                size="small"
                                sx={{
                                  backgroundColor: largeDocumentService.getDifficultyColor(subUnit.difficulty),
                                  color: 'white'
                                }}
                              />
                              {isCurrentSubUnit && (
                                <Chip
                                  label={`Reading: ${formatTime(readingTime)}`}
                                  size="small"
                                  color="primary"
                                />
                              )}
                            </Box>
                          </Box>
                          <Box>
                            {isCurrentSubUnit ? (
                              <IconButton onClick={stopReading} color="error">
                                <Stop />
                              </IconButton>
                            ) : (
                              <IconButton onClick={() => startReading(subUnit)} color="primary">
                                <PlayArrow />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {/* Summary */}
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {subUnit.summary}
                          </Typography>

                          {/* Key Points */}
                          {subUnit.keyPoints.length > 0 && (
                            <Box mb={2}>
                              <Typography variant="subtitle2" gutterBottom>
                                Key Points:
                              </Typography>
                              <List dense>
                                {subUnit.keyPoints.map((point, idx) => (
                                  <ListItem key={idx} sx={{ py: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                      <Typography variant="caption" color="primary">
                                        •
                                      </Typography>
                                    </ListItemIcon>
                                    <ListItemText primary={point} />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}

                          {/* Learning Objectives */}
                          {subUnit.learningObjectives.length > 0 && (
                            <Box mb={2}>
                              <Typography variant="subtitle2" gutterBottom>
                                Learning Objectives:
                              </Typography>
                              <List dense>
                                {subUnit.learningObjectives.map((objective, idx) => (
                                  <ListItem key={idx} sx={{ py: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                      <Typography variant="caption" color="secondary">
                                        {idx + 1}.
                                      </Typography>
                                    </ListItemIcon>
                                    <ListItemText primary={objective} />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}

                          {/* Content */}
                          <Box mb={2}>
                            <Typography variant="subtitle2" gutterBottom>
                              Content:
                            </Typography>
                            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {subUnit.content}
                              </Typography>
                            </Paper>
                          </Box>

                          {/* Actions */}
                          <Box display="flex" gap={1}>
                            {!subUnitProgress?.isCompleted && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CheckCircle />}
                                onClick={() => markCompleted(subUnit._id || '')}
                              >
                                Mark Complete
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Download />}
                              onClick={() => {
                                // Download functionality would go here
                                console.log('Download sub-unit:', subUnit.title);
                              }}
                            >
                              Download
                            </Button>
                          </Box>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentMaterialsViewer;
