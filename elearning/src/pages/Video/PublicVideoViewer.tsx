import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  Button,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Chip,
  Grid
} from '@mui/material';
import {
  Share,
  Download,
  ArrowBack,
  OpenInNew,
  Facebook,
  Twitter,
  WhatsApp,
  Email,
  Link as LinkIcon,
  Code,
  Close
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
  isPublic: boolean;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PublicVideoViewer: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTab, setShareTab] = useState(0);

  useEffect(() => {
    loadVideo();
  }, [shareToken]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/uploaded-videos/share/${shareToken}`);
      setVideo(response.data.data);
    } catch (error: any) {
      console.error('Error loading video:', error);
      const errorMsg = error.response?.data?.error || 'Video not found or is not public';
      setAlert({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    console.log('Share button clicked');
    setShareDialogOpen(true);
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setShareTab(0);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAlert({ type: 'success', message: 'Copied to clipboard!' });
    } catch (error) {
      console.error('Failed to copy:', error);
      setAlert({ type: 'error', message: 'Failed to copy to clipboard' });
    }
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this video: ${video?.title}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
  };

  const shareToTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this video: ${video?.title}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const shareToWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this video: ${video?.title} ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this video: ${video?.title}`);
    const body = encodeURIComponent(`Hi,\n\nI thought you might be interested in this video:\n\n${video?.title}\n\n${window.location.href}\n\n${video?.description || ''}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const getEmbedCode = () => {
    const embedUrl = getYouTubeEmbedUrl(video?.youtubeUrl || video?.videoUrl || '');
    return `<iframe width="560" height="315" src="${embedUrl}" title="${video?.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getYouTubeEmbedUrl = (url: string) => {
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }

    // If no pattern matches, return the original URL (might already be embed format)
    return url;
  };

  const getYouTubeWatchUrl = (url: string) => {
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/watch?v=${match[1]}`;
      }
    }

    // If no pattern matches, return the original URL
    return url;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!video) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        {alert && (
          <Alert severity={alert.type} sx={{ mb: 3 }}>
            {alert.message}
          </Alert>
        )}
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Video Not Found
          </Typography>
          <Typography color="text.secondary" paragraph>
            The video you're looking for is not available or has been removed.
          </Typography>
          <Button variant="contained" href="/video-library">
            Back to Video Library
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header Navigation */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            href="/video-library"
          >
            Back to Library
          </Button>
        </Stack>

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

        {/* Video Player */}
        <Card sx={{ mb: 4, overflow: 'hidden' }}>
          {video.videoType === 'youtube' ? (
            <Box
              sx={{
                position: 'relative',
                paddingBottom: '56.25%', // 16:9 aspect ratio
                height: 0,
                overflow: 'hidden',
                maxHeight: '600px'
              }}
            >
              <iframe
                src={getYouTubeEmbedUrl(video.youtubeUrl || video.videoUrl)}
                title={video.title}
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
              src={video.videoUrl}
              sx={{
                bgcolor: '#000',
                maxHeight: '600px',
                objectFit: 'contain'
              }}
            />
          )}
        </Card>

        {/* Video Info */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                {/* Title */}
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                  {video.title}
                </Typography>

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<Share />}
                    onClick={handleShare}
                  >
                    Share
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNew />}
                    onClick={() => window.open(video.videoType === 'youtube' ? getYouTubeWatchUrl(video.youtubeUrl || video.videoUrl) : video.videoUrl, '_blank')}
                  >
                    Open in New Tab
                  </Button>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Description */}
                {video.description && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Description
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                      {video.description}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar Info */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Video Information
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Duration
                </Typography>
                <Typography variant="body2">
                  {formatDuration(video.duration)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  File Size
                </Typography>
                <Typography variant="body2">
                  {formatFileSize(video.fileSize)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Views
                </Typography>
                <Typography variant="body2">
                  {video.views.toLocaleString()}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {video.uploadedBy && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Uploaded by
                  </Typography>
                  <Typography variant="body2">
                    {video.uploadedBy.firstName} {video.uploadedBy.lastName}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Uploaded on
                </Typography>
                <Typography variant="body2">
                  {formatDate(video.uploadDate)}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                href="/video-library"
              >
                More Videos
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Share Dialog */}
        <Dialog
          open={shareDialogOpen}
          onClose={handleCloseShareDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Share Video</Typography>
              <IconButton onClick={handleCloseShareDialog} size="small">
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Share "{video?.title}" with others
            </Typography>

            <Tabs value={shareTab} onChange={(_, newValue) => setShareTab(newValue)} sx={{ mb: 2 }}>
              <Tab label="Social Media" />
              <Tab label="Link & Embed" />
            </Tabs>

            {shareTab === 0 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2">Share on social media:</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    icon={<Facebook />}
                    label="Facebook"
                    onClick={shareToFacebook}
                    clickable
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Twitter />}
                    label="Twitter"
                    onClick={shareToTwitter}
                    clickable
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<WhatsApp />}
                    label="WhatsApp"
                    onClick={shareToWhatsApp}
                    clickable
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Email />}
                    label="Email"
                    onClick={shareViaEmail}
                    clickable
                    color="secondary"
                    variant="outlined"
                  />
                </Stack>
              </Stack>
            )}

            {shareTab === 1 && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Share Link:</Typography>
                  <TextField
                    fullWidth
                    value={window.location.href}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <Button
                          onClick={() => copyToClipboard(window.location.href)}
                          startIcon={<LinkIcon />}
                          size="small"
                        >
                          Copy
                        </Button>
                      ),
                    }}
                  />
                </Box>

                {video?.videoType === 'youtube' && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Embed Code:</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={getEmbedCode()}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Button
                            onClick={() => copyToClipboard(getEmbedCode())}
                            startIcon={<Code />}
                            size="small"
                            sx={{ alignSelf: 'flex-start', mt: 1 }}
                          >
                            Copy
                          </Button>
                        ),
                      }}
                    />
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseShareDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default PublicVideoViewer;
