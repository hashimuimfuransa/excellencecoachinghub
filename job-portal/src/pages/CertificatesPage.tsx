import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  Skeleton,
  useTheme,
  alpha,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Badge,
  CardMedia
} from '@mui/material';
import {
  EmojiEvents,
  School,
  Download,
  Share,
  Visibility,
  Star,
  CheckCircle,
  Schedule,
  Person,
  Business,
  TrendingUp,
  Assessment,
  PlayArrow,
  Lock,
  LockOpen,
  Verified,
  CalendarToday,
  Language,
  Timer,
  Group,
  BookmarkBorder,
  Bookmark,
  FilterList,
  Search,
  Clear,
  Sort,
  Add,
  CloudDownload,
  Close
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { certificateService } from '../services/certificateService';
import type { JobCertificate } from '../types';
import { CertificateType } from '../types';

const categories = [
  'All Categories',
  'Course Completion',
  'Skill Assessment', 
  'Job Preparation',
  'Interview Excellence',
  'Psychometric Achievement',
  'Skill Verification'
];

const CertificatesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [certificates, setCertificates] = useState<JobCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('newest');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<JobCertificate | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await certificateService.getUserCertificates();
      setCertificates(data);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Failed to load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (certificate: JobCertificate) => {
    setSelectedCertificate(certificate);
    setDetailsDialogOpen(true);
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      const blob = await certificateService.downloadCertificate(certificateId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      setError('Failed to download certificate. Please try again.');
    }
  };

  const getCertificateTypeColor = (type: CertificateType) => {
    switch (type) {
      case CertificateType.COURSE_COMPLETION:
        return 'success';
      case CertificateType.SKILL_ASSESSMENT:
        return 'primary';
      case CertificateType.JOB_PREPARATION:
        return 'warning';
      case CertificateType.INTERVIEW_EXCELLENCE:
        return 'secondary';
      case CertificateType.PSYCHOMETRIC_ACHIEVEMENT:
        return 'info';
      default:
        return 'default';
    }
  };

  const getCertificateTypeLabel = (type: CertificateType) => {
    switch (type) {
      case CertificateType.COURSE_COMPLETION:
        return 'Course Completion';
      case CertificateType.SKILL_ASSESSMENT:
        return 'Skill Assessment';
      case CertificateType.JOB_PREPARATION:
        return 'Job Preparation';
      case CertificateType.INTERVIEW_EXCELLENCE:
        return 'Interview Excellence';
      case CertificateType.PSYCHOMETRIC_ACHIEVEMENT:
        return 'Psychometric Achievement';
      case CertificateType.SKILL_VERIFICATION:
        return 'Skill Verification';
      default:
        return type;
    }
  };

  const getTabContent = () => {
    switch (tabValue) {
      case 0: // All Certificates
        return renderAllCertificates();
      case 1: // Valid Certificates
        return renderValidCertificates();
      case 2: // Expired Certificates
        return renderExpiredCertificates();
      default:
        return renderAllCertificates();
    }
  };

  const filteredCertificates = certificates
    .filter(cert => {
      const matchesSearch = cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cert.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All Categories' || getCertificateTypeLabel(cert.type) === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
        case 'oldest':
          return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'type':
          return getCertificateTypeLabel(a.type).localeCompare(getCertificateTypeLabel(b.type));
        default:
          return 0;
      }
    });

  const CertificateCard: React.FC<{ certificate: JobCertificate }> = ({ certificate }) => {
    const isValid = certificateService.isCertificateValid(certificate);
    const isExpired = certificate.expiresAt && new Date(certificate.expiresAt) < new Date();

    return (
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          border: isExpired ? '2px solid' : 'none',
          borderColor: isExpired ? 'error.main' : 'transparent',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8]
          }
        }}
      >
        <Box sx={{ position: 'relative', bgcolor: alpha(getCertificateTypeColor(certificate.type) + '.main', 0.1), p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ bgcolor: getCertificateTypeColor(certificate.type) + '.main', mr: 2 }}>
              <EmojiEvents />
            </Avatar>
            <Box>
              <Typography variant="h6" component="h3" fontWeight="bold">
                {certificate.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {certificate.issuedBy}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <Stack direction="row" spacing={1}>
              <Chip 
                label={getCertificateTypeLabel(certificate.type)}
                color={getCertificateTypeColor(certificate.type)}
                size="small"
              />
              {isValid && (
                <Chip 
                  icon={<Verified />}
                  label="VALID" 
                  color="success" 
                  size="small"
                />
              )}
              {isExpired && (
                <Chip 
                  label="EXPIRED" 
                  color="error" 
                  size="small"
                />
              )}
            </Stack>
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {certificate.description}
          </Typography>

          {certificate.skills.length > 0 && (
            <Box mb={2}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Skills Covered:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {certificate.skills.slice(0, 3).map((skill, index) => (
                  <Chip key={index} label={skill} size="small" variant="outlined" />
                ))}
                {certificate.skills.length > 3 && (
                  <Chip label={`+${certificate.skills.length - 3} more`} size="small" variant="outlined" />
                )}
              </Stack>
            </Box>
          )}

          <Stack direction="row" spacing={2} mb={2}>
            <Box display="flex" alignItems="center">
              <CalendarToday fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
              </Typography>
            </Box>
            {certificate.expiresAt && (
              <Box display="flex" alignItems="center">
                <Schedule fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  Expires: {new Date(certificate.expiresAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Stack>

          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="body2" color="text.secondary">
              Verification Code: <strong>{certificate.verificationCode}</strong>
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 3, pt: 0 }}>
          <Stack direction="row" spacing={1} width="100%">
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleDownloadCertificate(certificate._id)}
              sx={{ flex: 1 }}
            >
              Download
            </Button>
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={() => {
                const shareUrl = certificateService.generateShareableLink(certificate);
                navigator.clipboard.writeText(shareUrl);
              }}
              sx={{ flex: 1 }}
            >
              Share
            </Button>
            <Button
              variant="contained"
              startIcon={<Visibility />}
              onClick={() => handleViewDetails(certificate)}
              sx={{ flex: 1 }}
            >
              View Details
            </Button>
          </Stack>
        </CardActions>
      </Card>
    );
  };

  const renderAllCertificates = () => {
    return (
      <Box>
        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="title">Title A-Z</MenuItem>
                  <MenuItem value="type">Type</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Clear />}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All Categories');
                  setSortBy('newest');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Certificates Grid */}
        <Grid container spacing={3}>
          {loading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%' }}>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton variant="text" height={32} />
                    <Skeleton variant="text" height={60} />
                    <Skeleton variant="text" height={24} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            filteredCertificates.map((certificate) => (
              <Grid item xs={12} sm={6} md={3} key={certificate._id}>
                <CertificateCard certificate={certificate} />
              </Grid>
            ))
          )}
        </Grid>

        {filteredCertificates.length === 0 && !loading && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No certificates found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria or browse different categories.
            </Typography>
          </Paper>
        )}
      </Box>
    );
  };

  const renderValidCertificates = () => {
    const validCertificates = filteredCertificates.filter(cert => certificateService.isCertificateValid(cert));
    
    return (
      <Box>
        {validCertificates.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No valid certificates
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Complete assessments and interviews to earn certificates.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {validCertificates.map((certificate) => (
              <Grid item xs={12} sm={6} md={4} key={certificate._id}>
                <CertificateCard certificate={certificate} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
  };

  const renderExpiredCertificates = () => {
    const expiredCertificates = filteredCertificates.filter(cert => 
      cert.expiresAt && new Date(cert.expiresAt) < new Date()
    );
    
    return (
      <Box>
        {expiredCertificates.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No expired certificates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All your certificates are still valid!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {expiredCertificates.map((certificate) => (
              <Grid item xs={12} sm={6} md={4} key={certificate._id}>
                <CertificateCard certificate={certificate} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          My Certificates
        </Typography>
        <Typography variant="h6" color="text.secondary">
          View and manage your earned certificates and achievements
        </Typography>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main" fontWeight="bold">
              {certificates.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Certificates
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold">
              {certificates.filter(cert => certificateService.isCertificateValid(cert)).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Valid Certificates
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main" fontWeight="bold">
              {certificates.filter(cert => cert.expiresAt && new Date(cert.expiresAt) < new Date()).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Expired Certificates
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <EmojiEvents sx={{ mr: 1 }} />
                All Certificates
                <Badge badgeContent={certificates.length} color="primary" sx={{ ml: 1 }} />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <CheckCircle sx={{ mr: 1 }} />
                Valid Certificates
                <Badge 
                  badgeContent={certificates.filter(cert => certificateService.isCertificateValid(cert)).length} 
                  color="success" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <Schedule sx={{ mr: 1 }} />
                Expired Certificates
                <Badge 
                  badgeContent={certificates.filter(cert => cert.expiresAt && new Date(cert.expiresAt) < new Date()).length} 
                  color="error" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {getTabContent()}

      {/* Certificate Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight="bold">
              Certificate Details
            </Typography>
            <IconButton onClick={() => setDetailsDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCertificate && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: getCertificateTypeColor(selectedCertificate.type) + '.main', mr: 2, width: 56, height: 56 }}>
                        <EmojiEvents />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {selectedCertificate.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Issued by {selectedCertificate.issuedBy}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body1" paragraph>
                      {selectedCertificate.description}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Certificate Type
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {getCertificateTypeLabel(selectedCertificate.type)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Issued Date
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {new Date(selectedCertificate.issuedAt).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      {selectedCertificate.expiresAt && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Expiry Date
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {new Date(selectedCertificate.expiresAt).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Verification Code
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedCertificate.verificationCode}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {selectedCertificate.skills.length > 0 && (
                      <Box mt={3}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Skills Covered
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {selectedCertificate.skills.map((skill, index) => (
                            <Chip key={index} label={skill} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
          {selectedCertificate && (
            <>
              <Button 
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleDownloadCertificate(selectedCertificate._id)}
              >
                Download
              </Button>
              <Button 
                variant="contained"
                startIcon={<Share />}
                onClick={() => {
                  const shareUrl = certificateService.generateShareableLink(selectedCertificate);
                  navigator.clipboard.writeText(shareUrl);
                }}
              >
                Share
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CertificatesPage;