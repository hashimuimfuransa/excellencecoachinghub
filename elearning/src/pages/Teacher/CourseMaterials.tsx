import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
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
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Tooltip,
  LinearProgress,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  VideoFile as VideoIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  DragIndicator as DragIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Reorder as ReorderIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';

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

const CourseMaterials: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'document' as CourseMaterial['type'],
    content: '',
    duration: '',
    isRequired: false,
    order: 1
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch course materials
  const fetchMaterials = useCallback(async () => {
    if (!courseId) return;
    
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

  // Handle form submission
  const handleSubmit = async () => {
    if (!courseId) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('isRequired', formData.isRequired.toString());
      formDataToSend.append('order', formData.order.toString());
      
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      let response;
      if (editingMaterial) {
        response = await apiService.put(
          `/courses/${courseId}/materials/${editingMaterial._id}`,
          formDataToSend,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(progress);
              }
            }
          }
        );
      } else {
        response = await apiService.post(
          `/courses/${courseId}/materials`,
          formDataToSend,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(progress);
              }
            }
          }
        );
      }

      if (response.success) {
        await fetchMaterials();
        handleCloseDialog();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save material');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle delete material
  const handleDelete = async (materialId: string) => {
    if (!courseId || !window.confirm('Are you sure you want to delete this material?')) return;
    
    try {
      const response = await apiService.delete(`/courses/${courseId}/materials/${materialId}`);
      if (response.success) {
        await fetchMaterials();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete material');
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !courseId) return;

    const items = Array.from(materials);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for better UX
    setMaterials(items);

    // Update order values
    const materialOrders = items.map((item, index) => ({
      materialId: item._id!,
      order: index + 1
    }));

    try {
      await apiService.put(`/courses/${courseId}/materials/reorder`, { materialOrders });
    } catch (err) {
      // Revert on error
      await fetchMaterials();
      setError(err instanceof Error ? err.message : 'Failed to reorder materials');
    }
  };

  // Dialog handlers
  const handleOpenDialog = (material?: CourseMaterial) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        title: material.title,
        type: material.type,
        content: material.content || '',
        duration: material.duration?.toString() || '',
        isRequired: material.isRequired,
        order: material.order
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        title: '',
        type: 'document',
        content: '',
        duration: '',
        isRequired: false,
        order: materials.length + 1
      });
    }
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMaterial(null);
    setSelectedFile(null);
    setError(null);
  };

  // Get material icon
  const getMaterialIcon = (type: string, fileUrl?: string) => {
    if (type === 'video' || fileUrl?.includes('video')) {
      return <VideoIcon color="error" />;
    }
    if (type === 'document' || fileUrl?.includes('pdf') || fileUrl?.includes('doc')) {
      return <DocumentIcon color="primary" />;
    }
    if (fileUrl?.includes('image')) {
      return <ImageIcon color="success" />;
    }
    if (fileUrl?.includes('audio')) {
      return <AudioIcon color="warning" />;
    }
    return <DocumentIcon color="primary" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Course Materials
          </Typography>
          <Typography variant="h6" color="textSecondary">
            {courseTitle}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Material
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Materials List */}
      {materials.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No materials added yet
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Start by adding videos, documents, or other learning resources
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add First Material
          </Button>
        </Paper>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="materials">
            {(provided: DroppableProvided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {materials.map((material, index) => (
                  <Draggable
                    key={material._id}
                    draggableId={material._id!}
                    index={index}
                  >
                    {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          mb: 2,
                          opacity: snapshot.isDragging ? 0.8 : 1,
                          transform: snapshot.isDragging ? 'rotate(5deg)' : 'none'
                        }}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={2}>
                            <div {...provided.dragHandleProps}>
                              <DragIcon color="action" />
                            </div>
                            
                            {getMaterialIcon(material.type, material.fileUrl || material.videoUrl)}
                            
                            <Box flex={1}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Typography variant="h6">
                                  {material.title}
                                </Typography>
                                {material.isRequired && (
                                  <Chip label="Required" size="small" color="error" />
                                )}
                                <Chip 
                                  label={material.type.replace('_', ' ').toUpperCase()} 
                                  size="small" 
                                  variant="outlined" 
                                />
                              </Box>
                              
                              {material.content && (
                                <Typography variant="body2" color="textSecondary" mb={1}>
                                  {material.content}
                                </Typography>
                              )}
                              
                              <Box display="flex" gap={2} alignItems="center">
                                {material.duration && (
                                  <Typography variant="caption" color="textSecondary">
                                    Duration: {material.duration} min
                                  </Typography>
                                )}
                                <Typography variant="caption" color="textSecondary">
                                  Order: {material.order}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box display="flex" gap={1}>
                              {(material.fileUrl || material.videoUrl) && (
                                <Tooltip title="View/Download">
                                  <IconButton
                                    size="small"
                                    onClick={() => window.open(material.fileUrl || material.videoUrl, '_blank')}
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(material)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(material._id!)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Add/Edit Material Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMaterial ? 'Edit Material' : 'Add New Material'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CourseMaterial['type'] })}
                    label="Type"
                  >
                    <MenuItem value="video">Video</MenuItem>
                    <MenuItem value="document">Document</MenuItem>
                    <MenuItem value="quiz">Quiz</MenuItem>
                    <MenuItem value="assignment">Assignment</MenuItem>
                    <MenuItem value="live_session">Live Session</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    hidden
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept="video/*,audio/*,image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
                  />
                  <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    {selectedFile ? selectedFile.name : 'Click to upload file'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedFile 
                      ? `Size: ${formatFileSize(selectedFile.size)}`
                      : 'Supports videos, documents, images, and audio files (max 500MB)'
                    }
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isRequired}
                      onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    />
                  }
                  label="Required Material"
                />
              </Grid>
            </Grid>
            
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Uploading... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || uploading}
          >
            {uploading ? 'Uploading...' : editingMaterial ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseMaterials;