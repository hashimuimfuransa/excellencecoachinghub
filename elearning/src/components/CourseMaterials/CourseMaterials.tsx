import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Paper,
  Divider
} from '@mui/material';
import {
  Description,
  VideoFile,
  Image,
  AudioFile,
  Download,
  Visibility,
  PlayArrow,
  VolumeUp,
  Fullscreen,
  Close,
  PictureAsPdf,
  InsertDriveFile,
  Quiz,
  EmojiEvents
} from '@mui/icons-material';

interface CourseMaterial {
  _id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'audio' | 'link';
  url: string;
  filePath?: string;
  order: number;
  estimatedDuration: number;
  isRequired: boolean;
  isPublished: boolean;
  fileSize?: number;
  originalFileName?: string;
}

interface CourseMaterialsProps {
  materials: CourseMaterial[];
  onMaterialComplete?: (materialId: string) => void;
  isCompleted?: (materialId: string) => boolean;
  showCompletionActions?: boolean;
  onQuizClick?: (quizId: string) => void;
  onCertificateClick?: (certificateId: string) => void;
}

const CourseMaterials: React.FC<CourseMaterialsProps> = ({
  materials,
  onMaterialComplete,
  isCompleted,
  showCompletionActions = false,
  onQuizClick,
  onCertificateClick
}) => {
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const getFileIcon = (type: string, fileName?: string) => {
    if (fileName?.toLowerCase().endsWith('.pdf')) return <PictureAsPdf />;
    if (type === 'video') return <VideoFile />;
    if (type === 'audio') return <VolumeUp />;
    if (type === 'document') return <Description />;
    return <InsertDriveFile />;
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'primary';
      case 'video': return 'secondary';
      case 'audio': return 'info';
      case 'link': return 'warning';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewMaterial = (material: CourseMaterial) => {
    setSelectedMaterial(material);
    setPdfError(false);
    setViewerOpen(true);
  };

  const handleDownload = (material: CourseMaterial) => {
    const link = document.createElement('a');
    link.href = material.url;
    link.download = material.originalFileName || material.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMaterialViewer = () => {
    if (!selectedMaterial) return null;

    const { type, url, title } = selectedMaterial;

    switch (type) {
      case 'video':
        return (
          <Box sx={{ width: '100%', height: '70vh', display: 'flex', flexDirection: 'column' }}>
            {/* Video Header with Description */}
            {(selectedMaterial.description || selectedMaterial.estimatedDuration) && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                {selectedMaterial.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedMaterial.description}
                  </Typography>
                )}
                {selectedMaterial.estimatedDuration && (
                  <Chip 
                    label={`${selectedMaterial.estimatedDuration} minutes`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                )}
              </Box>
            )}
            {/* Video Player */}
            <Box sx={{ flex: 1 }}>
              <video
                controls
                style={{ width: '100%', height: '100%' }}
                src={url}
              >
                Your browser does not support the video tag.
              </video>
            </Box>
          </Box>
        );

      case 'audio':
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <VolumeUp sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {selectedMaterial.title}
            </Typography>
            {selectedMaterial.description && (
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedMaterial.description}
              </Typography>
            )}
            {selectedMaterial.estimatedDuration && (
              <Chip 
                label={`${selectedMaterial.estimatedDuration} minutes`} 
                size="small" 
                color="primary" 
                variant="outlined" 
                sx={{ mb: 2 }}
              />
            )}
            <audio controls style={{ width: '100%', maxWidth: 400 }}>
              <source src={url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </Box>
        );

      case 'document':
        // Check if it's a PDF
        if (url.toLowerCase().includes('.pdf') || selectedMaterial.originalFileName?.toLowerCase().endsWith('.pdf')) {
          return (
            <Box sx={{ width: '100%', height: '70vh' }}>
              {pdfError ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  p: 4 
                }}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    PDF viewer failed to load. Opening in new tab...
                  </Alert>
                  <Button 
                    variant="contained" 
                    onClick={() => window.open(url, '_blank')}
                    startIcon={<PictureAsPdf />}
                  >
                    Open PDF in New Tab
                  </Button>
                </Box>
              ) : (
                <iframe
                  src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  onError={() => setPdfError(true)}
                  title={title}
                />
              )}
            </Box>
          );
        } else {
          // For other document types, use iframe
          return (
            <Box sx={{ width: '100%', height: '70vh' }}>
              <iframe
                src={url}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title={title}
              />
            </Box>
          );
        }

      case 'link':
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              External Link
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This material is an external link. Click the button below to open it.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => window.open(url, '_blank')}
              startIcon={<PlayArrow />}
            >
              Open Link
            </Button>
          </Box>
        );

      default:
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <InsertDriveFile sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              File Content
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Click the button below to open this file.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => window.open(url, '_blank')}
              startIcon={<PlayArrow />}
            >
              Open File
            </Button>
          </Box>
        );
    }
  };

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Materials Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Course materials will appear here once uploaded by the instructor.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{
          // Mobile typography optimizations
          '@media (max-width: 480px)': {
            fontSize: '1.1rem'
          }
        }}
      >
        Course Materials ({materials.length})
      </Typography>

      <Stack spacing={2} sx={{
        // Mobile spacing optimizations
        '@media (max-width: 480px)': {
          spacing: 1.5
        }
      }}>
        {materials.map((material, index) => {
          const completed = isCompleted ? isCompleted(material._id) : false;
          
          return (
            <Card 
              key={material._id} 
              sx={{ 
                border: completed ? '2px solid #4caf50' : '1px solid #e0e0e0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                },
                // Mobile card optimizations
                '@media (max-width: 480px)': {
                  '&:hover': {
                    transform: 'none' // Disable hover transform on mobile
                  }
                }
              }}
            >
              <CardContent sx={{
                // Mobile padding optimizations
                '@media (max-width: 480px)': {
                  padding: 2
                }
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  // Mobile layout optimizations
                  '@media (max-width: 768px)': {
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 1.5
                  }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    flex: 1,
                    // Mobile layout optimizations
                    '@media (max-width: 768px)': {
                      width: '100%'
                    }
                  }}>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 1, 
                      bgcolor: completed ? 'success.light' : 'grey.100',
                      color: completed ? 'success.main' : 'text.secondary',
                      // Mobile icon optimizations
                      '@media (max-width: 480px)': {
                        p: 0.5
                      }
                    }}>
                      {getFileIcon(material.type, material.originalFileName)}
                    </Box>
                    
                    <Box sx={{ 
                      ml: 2, 
                      flex: 1,
                      // Mobile layout optimizations
                      '@media (max-width: 768px)': {
                        ml: 1
                      }
                    }}>
                      <Typography 
                        variant="subtitle1" 
                        gutterBottom
                        sx={{
                          // Mobile typography optimizations
                          '@media (max-width: 480px)': {
                            fontSize: '1rem'
                          }
                        }}
                      >
                        {material.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        paragraph
                        sx={{
                          // Mobile typography optimizations
                          '@media (max-width: 480px)': {
                            fontSize: '0.85rem',
                            mb: 1
                          }
                        }}
                      >
                        {material.description}
                      </Typography>
                      
                      <Stack 
                        direction="row" 
                        spacing={1} 
                        sx={{ 
                          flexWrap: 'wrap', 
                          gap: 0.5,
                          // Mobile chip optimizations
                          '@media (max-width: 480px)': {
                            gap: 0.25,
                            '& .MuiChip-root': {
                              fontSize: '0.7rem',
                              height: '24px'
                            }
                          }
                        }}
                      >
                        <Chip 
                          label={material.type} 
                          color={getFileTypeColor(material.type) as any}
                          size="small" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={`${material.estimatedDuration} min`} 
                          size="small" 
                          variant="outlined" 
                        />
                        {material.fileSize && (
                          <Chip 
                            label={formatFileSize(material.fileSize)} 
                            size="small" 
                            variant="outlined" 
                          />
                        )}
                        {material.isRequired && (
                          <Chip 
                            label="Required" 
                            size="small" 
                            color="error" 
                            variant="outlined" 
                          />
                        )}
                        {completed && (
                          <Chip 
                            label="Completed" 
                            size="small" 
                            color="success" 
                            variant="outlined" 
                          />
                        )}
                      </Stack>
                    </Box>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    // Mobile action buttons optimizations
                    '@media (max-width: 768px)': {
                      justifyContent: 'center',
                      width: '100%'
                    },
                    '@media (max-width: 480px)': {
                      '& .MuiIconButton-root': {
                        padding: '8px',
                        minWidth: '40px',
                        minHeight: '40px'
                      }
                    }
                  }}>
                    <Tooltip title="View Material">
                      <IconButton 
                        onClick={() => handleViewMaterial(material)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Download">
                      <IconButton 
                        onClick={() => handleDownload(material)}
                        color="secondary"
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>

                    {showCompletionActions && !completed && onMaterialComplete && (
                      <Tooltip title="Mark as Complete">
                        <IconButton 
                          onClick={() => onMaterialComplete(material._id)}
                          color="success"
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Quiz Button - Show for quiz materials or when all materials are completed */}
                    {(material.type === 'quiz' || (completed && onQuizClick)) && (
                      <Tooltip title="Take Quiz">
                        <IconButton 
                          onClick={() => onQuizClick?.(material._id)}
                          color="warning"
                        >
                          <Quiz />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Certificate Button - Show when course is completed */}
                    {completed && onCertificateClick && (
                      <Tooltip title="View Certificate">
                        <IconButton 
                          onClick={() => onCertificateClick?.(material._id)}
                          color="primary"
                        >
                          <EmojiEvents />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Material Viewer Dialog */}
      <Dialog 
        open={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        maxWidth="lg" 
        fullWidth
        fullScreen
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedMaterial?.title}
          </Typography>
          <IconButton onClick={() => setViewerOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {renderMaterialViewer()}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setViewerOpen(false)}>
            Close
          </Button>
          {selectedMaterial && (
            <Button 
              variant="contained" 
              startIcon={<Download />}
              onClick={() => handleDownload(selectedMaterial)}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseMaterials;
