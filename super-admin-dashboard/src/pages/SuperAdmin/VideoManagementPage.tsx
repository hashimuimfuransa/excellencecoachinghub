import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  CircularProgress,
  Avatar,
  Tooltip,
  Paper,
  Stack,
  Divider,
  FormControlLabel,
  Checkbox,
  Switch
} from '@mui/material';
import {
  VideoLibrary,
  CloudUpload,
  PlayArrow,
  Share,
  Delete,
  Edit,
  Add,
  Search,
  Refresh,
  Visibility,
  Public,
  Lock,
  Download,
  Link
} from '@mui/icons-material';
import axios from 'axios';
import { Widget } from '@uploadcare/react-widget';

interface UploadedVideo {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  youtubeUrl?: string;
  videoType: 'uploadcare' | 'youtube';
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  uploadedBy?: { _id: string; firstName: string; lastName: string; email: string };
  isPublic: boolean;
  views: number;
  shareToken?: string;
  shareUrl?: string;
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const VideoManagementPage: React.FC = () => {
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<UploadedVideo | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [totalVideos, setTotalVideos] = useState(0);
  const [uploadMethod, setUploadMethod] = useState<'uploadcare' | 'youtube'>('uploadcare');

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    isPublic: false,
    videoUrl: '',
    youtubeUrl: '',
    fileSize: 0,
    duration: 0,
    thumbnailUrl: '',
    uploadProgress: 0,
    isUploading: false
  });

  const uploadcarePublicKey = (
    (typeof process !== 'undefined' && (process as any)?.env?.REACT_APP_UPLOADCARE_PUBLIC_KEY)
    || ((typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_UPLOADCARE_PUBLIC_KEY))
    || ((typeof window !== 'undefined' && (window as any)?.UPLOADCARE_PUBLIC_KEY))
    || ''
  );

  // YouTube URL validation and video ID extraction
  const validateYouTubeUrl = (url: string): { isValid: boolean; videoId?: string; error?: string } => {
    if (!url.trim()) {
      return { isValid: false, error: 'YouTube URL is required' };
    }

    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { isValid: true, videoId: match[1] };
      }
    }

    return { isValid: false, error: 'Invalid YouTube URL format' };
  };

  // Extract YouTube video info
  const extractYouTubeInfo = async (videoId: string) => {
    try {
      // YouTube thumbnail URL pattern
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      return {
        thumbnailUrl,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`
      };
    } catch (error) {
      console.error('Error extracting YouTube info:', error);
      return null;
    }
  };

  useEffect(() => {
    loadVideos();
  }, [page, searchTerm]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/uploaded-videos`, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm || undefined
        }
      });

      setVideos(response.data.data || []);
      setTotalVideos(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading videos:', error);
      setAlert({ type: 'error', message: 'Failed to load videos' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadClose = () => {
    setUploadDialogOpen(false);
    setUploadMethod('uploadcare');
    setUploadForm({
      title: '',
      description: '',
      isPublic: false,
      videoUrl: '',
      youtubeUrl: '',
      fileSize: 0,
      duration: 0,
      thumbnailUrl: '',
      uploadProgress: 0,
      isUploading: false
    });
  };



  const handleFileUpload = async () => {
    if (!uploadForm.title.trim()) {
      setAlert({ type: 'error', message: 'Please provide a title' });
      return;
    }

    if (uploadMethod === 'uploadcare' && !uploadForm.videoUrl) {
      setAlert({ type: 'error', message: 'Please upload a video using Uploadcare' });
      return;
    }

    if (uploadMethod === 'youtube') {
      const validation = validateYouTubeUrl(uploadForm.youtubeUrl);
      if (!validation.isValid) {
        setAlert({ type: 'error', message: validation.error || 'Invalid YouTube URL' });
        return;
      }

      // Extract YouTube video info
      const videoInfo = await extractYouTubeInfo(validation.videoId!);
      if (!videoInfo) {
        setAlert({ type: 'error', message: 'Failed to extract YouTube video information' });
        return;
      }

      // Update form with YouTube info
      setUploadForm(prev => ({
        ...prev,
        videoUrl: videoInfo.embedUrl,
        thumbnailUrl: videoInfo.thumbnailUrl
      }));
    }

    try {
      setUploading(true);
      setAlert(null);

      const response = await axios.post(`${API_BASE}/uploaded-videos`, {
        title: uploadForm.title,
        description: uploadForm.description,
        videoUrl: uploadForm.videoUrl,
        youtubeUrl: uploadMethod === 'youtube' ? uploadForm.youtubeUrl : undefined,
        videoType: uploadMethod, // 'uploadcare' or 'youtube'
        fileSize: uploadForm.fileSize || undefined,
        duration: uploadForm.duration || undefined,
        thumbnailUrl: uploadForm.thumbnailUrl || undefined,
        isPublic: uploadForm.isPublic
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setAlert({ type: 'success', message: `${uploadMethod === 'youtube' ? 'YouTube video' : 'Video'} added successfully!` });
      handleUploadClose();
      loadVideos();
    } catch (error: any) {
      console.error('Error uploading video:', error);
      const errorMsg = error.response?.data?.error || `Failed to add ${uploadMethod === 'youtube' ? 'YouTube video' : 'video'}`;
      setAlert({ type: 'error', message: errorMsg });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/uploaded-videos/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setAlert({ type: 'success', message: 'Video deleted successfully!' });
      loadVideos();
    } catch (error: any) {
      console.error('Error deleting video:', error);
      setAlert({ type: 'error', message: 'Failed to delete video' });
    }
  };

  const handleTogglePublic = async (video: UploadedVideo) => {
    try {
      const response = await axios.patch(`${API_BASE}/uploaded-videos/${video._id}/toggle-public`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setAlert({
        type: 'success',
        message: response.data.message
      });
      loadVideos();
    } catch (error: any) {
      console.error('Error updating video:', error);
      setAlert({ type: 'error', message: 'Failed to update video visibility' });
    }
  };

  const handleShareVideo = async (video: UploadedVideo) => {
    try {
      if (video.isPublic && video.shareUrl) {
        navigator.clipboard.writeText(video.shareUrl);
        setAlert({ type: 'success', message: 'Share link copied to clipboard!' });
      } else {
        setAlert({ type: 'error', message: 'Video must be public to share' });
      }
      setSelectedVideo(video);
      setShareDialogOpen(true);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to copy link' });
    }
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{
        mb: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 2,
        p: 3,
        color: 'white'
      }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <VideoLibrary sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Video Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Upload and manage recorded video sessions for eLearning using Uploadcare (required for large files)
        </Typography>
      </Box>

      {/* Alert */}
      {alert && (
        <Alert
          severity={alert.type}
          sx={{ mb: 3 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search videos by title or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => loadVideos()}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={handleUploadClick}
                >
                  Upload Video
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Videos Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Loading videos...</Typography>
            </Box>
          ) : filteredVideos.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <VideoLibrary sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">No videos found</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Title</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell align="right">Views</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Uploaded By</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredVideos.map((video) => (
                      <TableRow key={video._id} hover>
                        <TableCell>
                          <Tooltip title={video.description}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 'bold',
                                maxWidth: 250,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {video.title}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{formatDuration(video.duration)}</TableCell>
                        <TableCell>
                          {video.videoType === 'youtube' ? (
                            <Chip
                              label="YouTube"
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          ) : (
                            formatFileSize(video.fileSize)
                          )}
                        </TableCell>
                        <TableCell align="right">{video.views.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            icon={video.isPublic ? <Public /> : <Lock />}
                            label={video.isPublic ? 'Public' : 'Private'}
                            color={video.isPublic ? 'success' : 'default'}
                            size="small"
                            onClick={() => handleTogglePublic(video)}
                            clickable
                          />
                        </TableCell>
                        <TableCell>
                          {video.uploadedBy?.firstName && video.uploadedBy?.lastName
                            ? `${video.uploadedBy.firstName} ${video.uploadedBy.lastName}`
                            : 'Unknown'}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Play Video">
                              <IconButton
                                size="small"
                                onClick={() => window.open(video.videoUrl, '_blank')}
                              >
                                <PlayArrow fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {video.isPublic && (
                              <Tooltip title="Share Video">
                                <IconButton
                                  size="small"
                                  onClick={() => handleShareVideo(video)}
                                >
                                  <Link fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete Video">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteVideo(video._id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalVideos}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleUploadClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>Upload New Video</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Video Title"
              placeholder="Enter video title"
              value={uploadForm.title}
              onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
              disabled={uploading}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              placeholder="Enter video description"
              value={uploadForm.description}
              onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              disabled={uploading}
            />

            {/* Upload Method Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Choose Upload Method
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant={uploadMethod === 'uploadcare' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setUploadMethod('uploadcare');
                    setUploadForm(prev => ({ ...prev, youtubeUrl: '', videoUrl: '' }));
                  }}
                  disabled={uploading}
                  startIcon={<CloudUpload />}
                >
                  Uploadcare Upload
                </Button>
                <Button
                  variant={uploadMethod === 'youtube' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setUploadMethod('youtube');
                    setUploadForm(prev => ({ ...prev, videoUrl: '' }));
                  }}
                  disabled={uploading}
                  startIcon={<Link />}
                >
                  YouTube Link
                </Button>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {uploadMethod === 'uploadcare'
                  ? 'Upload Video via Uploadcare (Recommended for large files)'
                  : 'Add YouTube Video Link'
                }
              </Typography>

              {uploadMethod === 'youtube' ? (
                <TextField
                  fullWidth
                  label="YouTube URL"
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                  value={uploadForm.youtubeUrl}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  disabled={uploading}
                  helperText="Enter a valid YouTube URL (watch, embed, or short link)"
                />
              ) : (

              <Widget
                publicKey={uploadcarePublicKey}
                multiple={false}
                tabs="file url"
                onFileSelect={(file: any) => {
                  if (!file) return;
                  setUploading(true);
                  setUploadForm(prev => ({ ...prev, isUploading: true }));
                  // Track widget progress
                  file.progress((info: any) => {
                    const pct = Math.round((info.progress || 0) * 100);
                    setUploadForm(prev => ({ ...prev, uploadProgress: pct, isUploading: true }));
                  });
                  file.done((fileInfo: any) => {
                    const cdnUrl = fileInfo?.cdnUrl || (fileInfo?.cdnUrl && fileInfo?.cdnUrlModifiers ? `${fileInfo.cdnUrl}${fileInfo.cdnUrlModifiers}` : '') || fileInfo?.originalUrl;
                    setUploadForm(prev => ({
                      ...prev,
                      videoUrl: cdnUrl || '',
                      fileSize: fileInfo?.size || 0,
                      duration: fileInfo?.video?.duration || 0,
                      isUploading: false,
                      uploadProgress: 100
                    }));
                    setUploading(false);
                  });
                  file.fail((error: any) => {
                    console.error('Uploadcare upload failed:', error);
                    setUploading(false);
                    setUploadForm(prev => ({ ...prev, isUploading: false }));
                    setAlert({ type: 'error', message: `Upload failed: ${error?.message || 'Please try again with a smaller file or check your connection.'}` });
                  });
                }}
              />
              )}

              {(uploading || uploadForm.isUploading) && uploadMethod === 'uploadcare' && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress variant="determinate" value={uploadForm.uploadProgress || 0} />
                  <Typography variant="caption" color="text.secondary">
                    Uploading to Uploadcare... {uploadForm.uploadProgress || 0}%
                  </Typography>
                </Box>
              )}

              {((uploadForm.videoUrl && !uploading && !uploadForm.isUploading) || (uploadMethod === 'youtube' && uploadForm.youtubeUrl)) && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  ✓ {uploadMethod === 'youtube' ? 'YouTube video link added successfully' : 'Video uploaded successfully via Uploadcare'}
                </Typography>
              )}
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={uploadForm.isPublic}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  disabled={uploading}
                />
              }
              label="Make this video public (visible in eLearning)"
            />
            {uploading && (
              <Box>
                <LinearProgress />
                <Typography variant="caption" sx={{ mt: 1 }}>Uploading...</Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleUploadClose} disabled={uploading}>Cancel</Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={uploading || uploadForm.isUploading || !uploadForm.title || (uploadMethod === 'uploadcare' && !uploadForm.videoUrl) || (uploadMethod === 'youtube' && !uploadForm.youtubeUrl)}
          >
            {uploading || uploadForm.isUploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Video</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: 2 }}>
          {selectedVideo && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Share Link</Typography>
                <TextField
                  fullWidth
                  value={selectedVideo.shareUrl || ''}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Tooltip title="Copy to clipboard">
                        <IconButton
                          onClick={() => {
                            if (selectedVideo.shareUrl) {
                              navigator.clipboard.writeText(selectedVideo.shareUrl);
                              setAlert({ type: 'success', message: 'Link copied!' });
                            }
                          }}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                    )
                  }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Direct Video URL</Typography>
                <TextField
                  fullWidth
                  value={selectedVideo.videoUrl}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VideoManagementPage;
