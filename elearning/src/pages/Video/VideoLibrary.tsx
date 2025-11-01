import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  PlayArrow,
  Search,
  Share,
  OpenInNew,
  Visibility,
  Timer,
  Storage
} from '@mui/icons-material';
import axios from 'axios';

interface Video {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  youtubeUrl?: string;
  videoType: 'uploadcare' | 'youtube';
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  views: number;
  uploadDate: string;
  uploadedBy?: { firstName: string; lastName: string };
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const VideoLibrary: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadPublicVideos();
  }, []);

  const loadPublicVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/uploaded-videos`, {
        params: {
          isPublic: 'true',
          limit: 100
        }
      });

      setVideos(response.data.data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      setAlert({ type: 'error', message: 'Failed to load videos' });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setVideoDialogOpen(true);
  };

  const handleShareVideo = (video: Video) => {
    const shareUrl = `${window.location.origin}/video-library/${video._id}`;
    navigator.clipboard.writeText(shareUrl);
    setAlert({ type: 'success', message: 'Video link copied to clipboard!' });
  };

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

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            Video Library
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Access recorded video sessions from coaching trainers. Learn at your own pace with our collection of educational videos.
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

        {/* Search */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search videos by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
        </Paper>

        {/* Videos Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredVideos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary" variant="h6">
              No videos found
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredVideos.map((video) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={video._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6
                    }
                  }}
                >
                  {/* Video Thumbnail */}
                  <Box
                    sx={{
                      position: 'relative',
                      paddingTop: '56.25%',
                      bgcolor: '#000',
                      overflow: 'hidden'
                    }}
                  >
                    {video.thumbnailUrl ? (
                      <CardMedia
                        component="img"
                        image={video.thumbnailUrl}
                        alt={video.title}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                      >
                        <Typography sx={{ color: 'white', fontSize: '3rem' }}>▶</Typography>
                      </Box>
                    )}

                    {/* Play Button Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(0, 0, 0, 0.3)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                      onClick={() => handleVideoClick(video)}
                    >
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <PlayArrow sx={{ fontSize: 40, color: '#667eea' }} />
                      </Box>
                    </Box>

                    {/* Duration Badge */}
                    {video.duration && (
                      <Chip
                        label={formatDuration(video.duration)}
                        size="small"
                        icon={<Timer sx={{ fontSize: 14 }} />}
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white'
                        }}
                      />
                    )}
                  </Box>

                  {/* Card Content */}
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      gutterBottom
                      variant="h6"
                      component="div"
                      sx={{
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {video.title}
                    </Typography>

                    {video.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          mb: 1
                        }}
                      >
                        {video.description}
                      </Typography>
                    )}

                    <Box sx={{ mt: 'auto' }}>
                      {video.uploadedBy && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          by {video.uploadedBy.firstName} {video.uploadedBy.lastName}
                        </Typography>
                      )}

                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip
                          icon={<Visibility sx={{ fontSize: 14 }} />}
                          label={`${video.views} views`}
                          size="small"
                          variant="outlined"
                        />
                        {video.videoType === 'youtube' ? (
                          <Chip
                            label="YouTube"
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            icon={<Storage sx={{ fontSize: 14 }} />}
                            label={formatFileSize(video.fileSize)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrow />}
                          fullWidth
                          onClick={() => handleVideoClick(video)}
                        >
                          Watch
                        </Button>
                        <Tooltip title="Share">
                          <IconButton
                            size="small"
                            onClick={() => handleShareVideo(video)}
                          >
                            <Share fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Video Player Dialog */}
      <Dialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{selectedVideo?.title}</Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Open in new tab">
              <IconButton
                onClick={() => {
                  if (selectedVideo?.videoUrl) {
                    window.open(selectedVideo.videoUrl, '_blank');
                  }
                }}
              >
                <OpenInNew />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton
                onClick={() => {
                  if (selectedVideo) {
                    handleShareVideo(selectedVideo);
                  }
                }}
              >
                <Share />
              </IconButton>
            </Tooltip>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedVideo && (
            <Box sx={{ mt: 2 }}>
              {selectedVideo.videoType === 'youtube' ? (
                <Box
                  sx={{
                    position: 'relative',
                    paddingBottom: '56.25%', // 16:9 aspect ratio
                    height: 0,
                    overflow: 'hidden'
                  }}
                >
                  <iframe
                    src={selectedVideo.videoUrl}
                    title={selectedVideo.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 0
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </Box>
              ) : (
                <Box
                  component="video"
                  controls
                  width="100%"
                  src={selectedVideo.videoUrl}
                  sx={{ borderRadius: 1, bgcolor: '#000' }}
                />
              )}

              <Box sx={{ mt: 3 }}>
                {selectedVideo.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Description
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedVideo.description}
                    </Typography>
                  </Box>
                )}

                <Stack direction="row" spacing={2}>
                  {selectedVideo.uploadedBy && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Uploaded by</Typography>
                      <Typography variant="body2">
                        {selectedVideo.uploadedBy.firstName} {selectedVideo.uploadedBy.lastName}
                      </Typography>
                    </Box>
                  )}
                  {selectedVideo.duration && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Duration</Typography>
                      <Typography variant="body2">
                        {formatDuration(selectedVideo.duration)}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary">Views</Typography>
                    <Typography variant="body2">
                      {selectedVideo.views.toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default VideoLibrary;
