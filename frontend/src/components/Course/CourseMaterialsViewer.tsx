import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  VideoFile as VideoIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  LiveTv as LiveSessionIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as NotCompletedIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { apiService } from '../../services/apiService';

interface CourseMaterial {
  _id?: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'live_session';
  content?: string;
  fileUrl?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  isRequired: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CourseMaterialsData {
  materials: CourseMaterial[];
  totalMaterials: number;
  courseTitle: string;
}

interface CourseMaterialsViewerProps {
  courseId: string;
  onMaterialComplete?: (materialId: string) => void;
  completedMaterials?: string[];
}

const CourseMaterialsViewer: React.FC<CourseMaterialsViewerProps> = ({
  courseId,
  onMaterialComplete,
  completedMaterials = []
}) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});

  // Fetch course materials
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get<CourseMaterialsData>(`/courses/${courseId}/materials`);
      
      if (response.success && response.data) {
        setMaterials(response.data.materials);
        setCourseTitle(response.data.courseTitle);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch course materials');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Get material icon
  const getMaterialIcon = (type: string, fileUrl?: string) => {
    switch (type) {
      case 'video':
        return <VideoIcon color="error" />;
      case 'quiz':
        return <QuizIcon color="primary" />;
      case 'assignment':
        return <AssignmentIcon color="warning" />;
      case 'live_session':
        return <LiveSessionIcon color="success" />;
      case 'document':
      default:
        if (fileUrl?.includes('image')) {
          return <ImageIcon color="success" />;
        }
        if (fileUrl?.includes('audio')) {
          return <AudioIcon color="warning" />;
        }
        return <DocumentIcon color="primary" />;
    }
  };

  // Get material type label
  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video';
      case 'document':
        return 'Document';
      case 'quiz':
        return 'Quiz';
      case 'assignment':
        return 'Assignment';
      case 'live_session':
        return 'Live Session';
      default:
        return type.replace('_', ' ').toUpperCase();
    }
  };

  // Handle material view
  const handleViewMaterial = (material: CourseMaterial) => {
    setSelectedMaterial(material);
    setViewerOpen(true);
    
    // Mark as viewed/in progress
    if (material._id && !completedMaterials.includes(material._id)) {
      setProgress(prev => ({ ...prev, [material._id!]: 0 }));
    }
  };

  // Handle material completion
  const handleMarkComplete = (materialId: string) => {
    if (onMaterialComplete) {
      onMaterialComplete(materialId);
    }
    setProgress(prev => ({ ...prev, [materialId]: 100 }));
  };

  // Check if material is completed
  const isMaterialCompleted = (materialId?: string) => {
    return materialId ? completedMaterials.includes(materialId) : false;
  };

  // Format duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Group materials by type
  const groupedMaterials = materials.reduce((groups, material) => {
    const type = material.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(material);
    return groups;
  }, {} as { [key: string]: CourseMaterial[] });

  // Calculate completion stats
  const totalMaterials = materials.length;
  const completedCount = materials.filter(m => m._id && isMaterialCompleted(m._id)).length;
  const completionPercentage = totalMaterials > 0 ? (completedCount / totalMaterials) * 100 : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Progress Overview */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Course Progress
        </Typography>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box flex={1}>
            <LinearProgress 
              variant="determinate" 
              value={completionPercentage} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="body2" color="textSecondary">
            {completedCount}/{totalMaterials} completed
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary">
          {completionPercentage.toFixed(0)}% complete
        </Typography>
      </Paper>

      {/* Materials by Type */}
      {Object.entries(groupedMaterials).map(([type, typeMaterials]) => (
        <Accordion key={type} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              {getMaterialIcon(type)}
              <Typography variant="h6">
                {getMaterialTypeLabel(type)} ({typeMaterials.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {typeMaterials
                .sort((a, b) => a.order - b.order)
                .map((material, index) => (
                  <React.Fragment key={material._id}>
                    <ListItem>
                      <ListItemIcon>
                        {isMaterialCompleted(material._id) ? (
                          <CompletedIcon color="success" />
                        ) : (
                          <NotCompletedIcon color="action" />
                        )}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {material.title}
                            </Typography>
                            {material.isRequired && (
                              <Chip label="Required" size="small" color="error" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {material.content && (
                              <Typography variant="body2" color="textSecondary">
                                {material.content}
                              </Typography>
                            )}
                            {material.duration && (
                              <Typography variant="caption" color="textSecondary">
                                Duration: {formatDuration(material.duration)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          {(material.fileUrl || material.videoUrl) && (
                            <IconButton
                              size="small"
                              onClick={() => handleViewMaterial(material)}
                              color="primary"
                            >
                              <ViewIcon />
                            </IconButton>
                          )}
                          
                          {material.fileUrl && material.type === 'document' && (
                            <IconButton
                              size="small"
                              onClick={() => window.open(material.fileUrl, '_blank')}
                            >
                              <DownloadIcon />
                            </IconButton>
                          )}
                          
                          {!isMaterialCompleted(material._id) && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleMarkComplete(material._id!)}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    {index < typeMaterials.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      {materials.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No materials available
          </Typography>
          <Typography variant="body2" color="textSecondary">
            The instructor hasn't added any materials to this course yet.
          </Typography>
        </Paper>
      )}

      {/* Material Viewer Dialog */}
      <Dialog 
        open={viewerOpen} 
        onClose={() => setViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        {selectedMaterial && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                {getMaterialIcon(selectedMaterial.type, selectedMaterial.fileUrl || selectedMaterial.videoUrl)}
                <Typography variant="h6">
                  {selectedMaterial.title}
                </Typography>
                {selectedMaterial.isRequired && (
                  <Chip label="Required" size="small" color="error" />
                )}
              </Box>
            </DialogTitle>
            
            <DialogContent>
              {selectedMaterial.content && (
                <Typography variant="body1" paragraph>
                  {selectedMaterial.content}
                </Typography>
              )}
              
              {/* Video Player */}
              {selectedMaterial.videoUrl && (
                <Box sx={{ mb: 2 }}>
                  <video
                    controls
                    width="100%"
                    style={{ maxHeight: '400px' }}
                    onEnded={() => handleMarkComplete(selectedMaterial._id!)}
                  >
                    <source src={selectedMaterial.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </Box>
              )}
              
              {/* Document/Image Viewer */}
              {selectedMaterial.fileUrl && selectedMaterial.type !== 'video' && (
                <Box sx={{ mb: 2 }}>
                  {selectedMaterial.fileUrl.includes('image') ? (
                    <img
                      src={selectedMaterial.fileUrl}
                      alt={selectedMaterial.title}
                      style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                    />
                  ) : (
                    <iframe
                      src={selectedMaterial.fileUrl}
                      width="100%"
                      height="400px"
                      style={{ border: 'none' }}
                      title={selectedMaterial.title}
                    />
                  )}
                </Box>
              )}
              
              {selectedMaterial.duration && (
                <Typography variant="body2" color="textSecondary">
                  Estimated duration: {formatDuration(selectedMaterial.duration)}
                </Typography>
              )}
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setViewerOpen(false)}>
                Close
              </Button>
              
              {selectedMaterial.fileUrl && (
                <Button
                  onClick={() => window.open(selectedMaterial.fileUrl, '_blank')}
                  startIcon={<DownloadIcon />}
                >
                  Download
                </Button>
              )}
              
              {!isMaterialCompleted(selectedMaterial._id) && (
                <Button
                  variant="contained"
                  onClick={() => {
                    handleMarkComplete(selectedMaterial._id!);
                    setViewerOpen(false);
                  }}
                  startIcon={<CompletedIcon />}
                >
                  Mark as Complete
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CourseMaterialsViewer;