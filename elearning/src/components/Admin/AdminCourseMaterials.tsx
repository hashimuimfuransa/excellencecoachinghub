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
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Description,
  VideoFile,
  AudioFile,
  Image,
  PictureAsPdf,
  InsertDriveFile,
  Download,
  Visibility,
  ExpandMore,
  Folder,
  FolderOpen
} from '@mui/icons-material';
import { courseService } from '../../services/courseService';

interface AdminCourseMaterialsProps {
  courseId: string;
}

interface CourseMaterial {
  _id: string;
  title: string;
  description?: string;
  type: string;
  url: string;
  fileSize?: number;
  uploadedAt: string;
  order: number;
}

const AdminCourseMaterials: React.FC<AdminCourseMaterialsProps> = ({ courseId }) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, [courseId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use admin-specific method to avoid 403 errors
      const course = await courseService.getCourseByIdForAdmin(courseId);
      const courseMaterials = course.content || [];
      
      // Sort materials by order
      const sortedMaterials = courseMaterials.sort((a: CourseMaterial, b: CourseMaterial) => 
        (a.order || 0) - (b.order || 0)
      );
      
      setMaterials(sortedMaterials);
    } catch (err) {
      console.error('Failed to load materials:', err);
      setError(err instanceof Error ? err.message : 'Failed to load materials. This may be due to insufficient permissions.');
    } finally {
      setLoading(false);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'document':
      case 'pdf':
        return <PictureAsPdf color="error" />;
      case 'video':
        return <VideoFile color="primary" />;
      case 'audio':
        return <AudioFile color="secondary" />;
      case 'image':
        return <Image color="success" />;
      default:
        return <InsertDriveFile color="action" />;
    }
  };

  const getMaterialTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'document':
      case 'pdf':
        return 'error';
      case 'video':
        return 'primary';
      case 'audio':
        return 'secondary';
      case 'image':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupMaterialsByType = () => {
    const grouped = materials.reduce((acc, material) => {
      const type = material.type.toLowerCase();
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(material);
      return acc;
    }, {} as Record<string, CourseMaterial[]>);

    return grouped;
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

  const groupedMaterials = groupMaterialsByType();
  const materialTypes = Object.keys(groupedMaterials);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Folder sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">
            Course Materials ({materials.length})
          </Typography>
        </Box>

        {materials.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <FolderOpen sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Materials Uploaded
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This course doesn't have any materials uploaded yet.
            </Typography>
          </Paper>
        ) : (
          <Box>
            {materialTypes.map((type) => (
              <Accordion key={type} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" width="100%">
                    {getMaterialIcon(type)}
                    <Typography variant="subtitle1" sx={{ ml: 2, flexGrow: 1 }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)} Files
                    </Typography>
                    <Chip
                      label={groupedMaterials[type].length}
                      size="small"
                      color={getMaterialTypeColor(type)}
                      sx={{ mr: 2 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {groupedMaterials[type].map((material, index) => (
                      <React.Fragment key={material._id}>
                        <ListItem>
                          <ListItemIcon>
                            {getMaterialIcon(material.type)}
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
                                  <Typography variant="caption" color="text.secondary">
                                    {formatFileSize(material.fileSize)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Uploaded: {formatDate(material.uploadedAt)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box display="flex" gap={1}>
                              <Tooltip title="Preview">
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(material.url, '_blank')}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = material.url;
                                    link.download = material.title;
                                    link.click();
                                  }}
                                >
                                  <Download />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < groupedMaterials[type].length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Materials Summary */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Materials Summary
          </Typography>
          <Grid container spacing={2}>
            {materialTypes.map((type) => (
              <Grid item xs={6} sm={3} key={type}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {groupedMaterials[type].length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdminCourseMaterials;
