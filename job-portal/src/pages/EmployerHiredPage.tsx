import React, { useState, useEffect } from 'react';
import { hiredCandidatesService, HiredCandidate } from '../services/hiredCandidatesService';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  alpha,
  Fade,
  Pagination,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  Person,
  Email,
  Phone,
  LocationOn,
  Work,
  Star,
  MoreVert,
  Visibility,
  Download,
  CalendarToday,
  Business,
  Assessment,
  Timeline,
  TrendingUp,
  Group,
  Schedule,
  Message,
  Badge as BadgeIcon
} from '@mui/icons-material';

// HiredCandidate interface is now imported from service

const EmployerHiredPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [hiredCandidates, setHiredCandidates] = useState<HiredCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<HiredCandidate | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [anchorEls, setAnchorEls] = useState<Record<string, HTMLElement | null>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const candidatesPerPage = 9;

  // Mock data for demonstration
  const mockHiredCandidates: HiredCandidate[] = [
    {
      _id: '1',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@email.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY',
      position: 'Frontend Developer',
      department: 'Engineering',
      startDate: '2023-12-01T00:00:00Z',
      hiredDate: '2023-11-15T10:30:00Z',
      salary: '$85,000',
      jobTitle: 'Senior Frontend Developer',
      skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Node.js'],
      rating: 4.8,
      testScores: { overall: 85, technical: 88, soft: 82 },
      interviewScore: 92,
      hiringManager: 'John Smith',
      employeeId: 'EMP001',
      status: 'started',
      notes: 'Excellent performance during onboarding. Quick to adapt.',
      originalJobId: 'job001',
      originalJobTitle: 'Frontend Developer'
    },
    {
      _id: '2',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@email.com',
      location: 'San Francisco, CA',
      position: 'Full Stack Developer',
      department: 'Engineering',
      startDate: '2023-11-20T00:00:00Z',
      hiredDate: '2023-11-01T16:45:00Z',
      salary: '$95,000',
      jobTitle: 'Senior Full Stack Developer',
      skills: ['Python', 'Django', 'React', 'PostgreSQL', 'AWS'],
      rating: 4.6,
      testScores: { overall: 78, technical: 82, soft: 74 },
      interviewScore: 88,
      hiringManager: 'Sarah Williams',
      employeeId: 'EMP002',
      status: 'confirmed',
      notes: 'Successfully completed probation. Great team player.',
      originalJobId: 'job002',
      originalJobTitle: 'Full Stack Developer'
    },
    {
      _id: '3',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@email.com',
      location: 'Chicago, IL',
      position: 'UX Designer',
      department: 'Design',
      startDate: '2023-12-15T00:00:00Z',
      hiredDate: '2023-11-25T09:15:00Z',
      salary: '$78,000',
      jobTitle: 'Senior UX Designer',
      skills: ['Figma', 'Adobe XD', 'Sketch', 'User Research', 'Prototyping'],
      rating: 4.7,
      testScores: { overall: 82, technical: 79, soft: 85 },
      interviewScore: 90,
      hiringManager: 'Mike Johnson',
      employeeId: 'EMP003',
      status: 'hired',
      notes: 'Starting soon. Excited about joining the design team.',
      originalJobId: 'job003',
      originalJobTitle: 'UX/UI Designer'
    },
    {
      _id: '4',
      firstName: 'David',
      lastName: 'Rodriguez',
      email: 'david.rodriguez@email.com',
      location: 'Austin, TX',
      position: 'DevOps Engineer',
      department: 'Infrastructure',
      startDate: '2023-10-15T00:00:00Z',
      hiredDate: '2023-10-01T11:30:00Z',
      salary: '$105,000',
      jobTitle: 'Senior DevOps Engineer',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Python'],
      rating: 4.9,
      testScores: { overall: 90, technical: 93, soft: 87 },
      interviewScore: 95,
      hiringManager: 'Jennifer Lee',
      employeeId: 'EMP004',
      status: 'probation',
      notes: 'Currently in probation period. Showing great potential.',
      originalJobId: 'job004',
      originalJobTitle: 'DevOps Engineer'
    }
  ];

  useEffect(() => {
    fetchHiredCandidates();
  }, [currentPage, filterStatus]);

  const fetchHiredCandidates = async () => {
    try {
      setLoading(true);
      const response = await hiredCandidatesService.getHiredCandidates(currentPage, candidatesPerPage, filterStatus);
      setHiredCandidates(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching hired candidates:', error);
      // Fallback to mock data if API fails
      let filtered = mockHiredCandidates;
      if (filterStatus !== 'all') {
        filtered = mockHiredCandidates.filter(candidate => candidate.status === filterStatus);
      }
      setHiredCandidates(filtered);
      setTotalPages(Math.ceil(filtered.length / candidatesPerPage));
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (candidate: HiredCandidate) => {
    setSelectedCandidate(candidate);
    setProfileDialogOpen(true);
  };

  const handleDownloadCV = async (candidate: HiredCandidate) => {
    try {
      const response = await fetch(`/api/employer/candidates/${candidate._id}/cv`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${candidate.firstName}_${candidate.lastName}_CV.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download CV');
      }
    } catch (error) {
      console.error('Error downloading CV:', error);
    }
  };

  const handleMenuOpen = (candidateId: string, event: React.MouseEvent<HTMLElement>) => {
    setAnchorEls(prev => ({ ...prev, [candidateId]: event.currentTarget }));
  };

  const handleMenuClose = (candidateId: string) => {
    setAnchorEls(prev => ({ ...prev, [candidateId]: null }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired': return 'info';
      case 'started': return 'success';
      case 'probation': return 'warning';
      case 'confirmed': return 'primary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'hired': return 'Hired';
      case 'started': return 'Started';
      case 'probation': return 'On Probation';
      case 'confirmed': return 'Confirmed';
      default: return status;
    }
  };

  const HiredCandidateCard = ({ candidate }: { candidate: HiredCandidate }) => (
    <Fade in={true}>
      <Card 
        sx={{ 
          height: '100%',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)'
          },
          border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`
        }}
      >
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: theme.palette.success.main }}>
              {candidate.firstName[0]}{candidate.lastName[0]}
            </Avatar>
          }
          action={
            <>
              <IconButton
                onClick={(e) => handleMenuOpen(candidate._id, e)}
                size="small"
              >
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={anchorEls[candidate._id]}
                open={Boolean(anchorEls[candidate._id])}
                onClose={() => handleMenuClose(candidate._id)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={() => handleViewProfile(candidate)}>
                  <Visibility sx={{ mr: 1 }} />
                  View Details
                </MenuItem>
                <MenuItem>
                  <Message sx={{ mr: 1 }} />
                  Send Message
                </MenuItem>
                <MenuItem onClick={() => handleDownloadCV(candidate)}>
                  <Download sx={{ mr: 1 }} />
                  Download CV
                </MenuItem>
                <MenuItem>
                  <Download sx={{ mr: 1 }} />
                  Download Records
                </MenuItem>
                <MenuItem>
                  <Assessment sx={{ mr: 1 }} />
                  Performance Review
                </MenuItem>
              </Menu>
            </>
          }
          title={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight="bold">
                {candidate.firstName} {candidate.lastName}
              </Typography>
              <Chip
                label={getStatusLabel(candidate.status)}
                size="small"
                color={getStatusColor(candidate.status) as any}
              />
            </Box>
          }
          subheader={
            <Box>
              <Typography variant="body2" color="text.secondary">
                {candidate.position} • {candidate.department}
              </Typography>
              {candidate.employeeId && (
                <Typography variant="caption" color="text.secondary">
                  ID: {candidate.employeeId}
                </Typography>
              )}
            </Box>
          }
        />
        
        <CardContent sx={{ pt: 0 }}>
          <Stack spacing={2}>
            <Box>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Box display="flex" alignItems="center">
                    <CalendarToday fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Start Date
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(candidate.startDate)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box display="flex" alignItems="center">
                    <CheckCircle fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Hired Date
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(candidate.hiredDate)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" mb={1}>
                <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {candidate.location}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Person fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Manager: {candidate.hiringManager}
                </Typography>
              </Box>
            </Box>

            {candidate.salary && (
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  Salary: {candidate.salary}
                </Typography>
              </Box>
            )}

            {(candidate.testScores || candidate.interviewScore) && (
              <Box>
                <Typography variant="body2" fontWeight="medium" mb={1}>
                  Performance Scores
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  {candidate.testScores && (
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary">Overall Test</Typography>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {candidate.testScores.overall}%
                      </Typography>
                    </Box>
                  )}
                  {candidate.interviewScore && (
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary">Interview</Typography>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        {candidate.interviewScore}%
                      </Typography>
                    </Box>
                  )}
                  {candidate.rating && (
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary">Rating</Typography>
                      <Typography variant="body2" color="warning.main" fontWeight="bold">
                        {candidate.rating}/5
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            <Box>
              <Typography variant="body2" fontWeight="medium" mb={1}>
                Key Skills
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {candidate.skills.slice(0, 3).map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
                {candidate.skills.length > 3 && (
                  <Chip
                    label={`+${candidate.skills.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem', opacity: 0.7 }}
                  />
                )}
              </Box>
            </Box>

            {candidate.notes && (
              <Box>
                <Typography variant="body2" fontWeight="medium" mb={1}>
                  Notes
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {candidate.notes}
                </Typography>
              </Box>
            )}

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleViewProfile(candidate)}
                startIcon={<Visibility />}
                fullWidth
              >
                View Details
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<Message />}
                fullWidth
              >
                Contact
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Fade>
  );

  // Stats calculation
  const stats = {
    total: hiredCandidates.length,
    hired: hiredCandidates.filter(c => c.status === 'hired').length,
    started: hiredCandidates.filter(c => c.status === 'started').length,
    probation: hiredCandidates.filter(c => c.status === 'probation').length,
    confirmed: hiredCandidates.filter(c => c.status === 'confirmed').length
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Hired Candidates
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage your hired employees
        </Typography>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Hired
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper 
            sx={{ 
              p: 2, 
              textAlign: 'center', 
              borderRadius: 2, 
              cursor: 'pointer',
              bgcolor: filterStatus === 'hired' ? 'info.light' : 'background.paper',
              '&:hover': { bgcolor: 'info.light' }
            }}
            onClick={() => setFilterStatus(filterStatus === 'hired' ? 'all' : 'hired')}
          >
            <Typography variant="h4" color="info.main" fontWeight="bold">
              {stats.hired}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recently Hired
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper 
            sx={{ 
              p: 2, 
              textAlign: 'center', 
              borderRadius: 2,
              cursor: 'pointer',
              bgcolor: filterStatus === 'started' ? 'success.light' : 'background.paper',
              '&:hover': { bgcolor: 'success.light' }
            }}
            onClick={() => setFilterStatus(filterStatus === 'started' ? 'all' : 'started')}
          >
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {stats.started}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Started
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper 
            sx={{ 
              p: 2, 
              textAlign: 'center', 
              borderRadius: 2,
              cursor: 'pointer',
              bgcolor: filterStatus === 'probation' ? 'warning.light' : 'background.paper',
              '&:hover': { bgcolor: 'warning.light' }
            }}
            onClick={() => setFilterStatus(filterStatus === 'probation' ? 'all' : 'probation')}
          >
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {stats.probation}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              On Probation
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper 
            sx={{ 
              p: 2, 
              textAlign: 'center', 
              borderRadius: 2,
              cursor: 'pointer',
              bgcolor: filterStatus === 'confirmed' ? 'secondary.light' : 'background.paper',
              '&:hover': { bgcolor: 'secondary.light' }
            }}
            onClick={() => setFilterStatus(filterStatus === 'confirmed' ? 'all' : 'confirmed')}
          >
            <Typography variant="h4" color="secondary.main" fontWeight="bold">
              {stats.confirmed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confirmed
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Info */}
      {filterStatus !== 'all' && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body1">
              Showing {getStatusLabel(filterStatus)} candidates ({hiredCandidates.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setFilterStatus('all')}
              sx={{ color: 'inherit', borderColor: 'currentColor' }}
            >
              Show All
            </Button>
          </Box>
        </Paper>
      )}

      {/* Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : hiredCandidates.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {hiredCandidates.map((candidate) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={candidate._id}>
                <HiredCandidateCard candidate={candidate} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <CheckCircle sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No hired candidates found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {filterStatus === 'all' 
              ? "You haven't hired any candidates yet. Start by reviewing applications."
              : `No candidates with status "${getStatusLabel(filterStatus)}" found.`
            }
          </Typography>
          <Button variant="contained" href="/app/employer/candidates">
            View Applications
          </Button>
        </Paper>
      )}

      {/* Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedCandidate && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  {selectedCandidate.firstName} {selectedCandidate.lastName}
                </Typography>
                <Chip
                  label={getStatusLabel(selectedCandidate.status)}
                  color={getStatusColor(selectedCandidate.status) as any}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Employee Information</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Employee ID:</strong> {selectedCandidate.employeeId || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Position:</strong> {selectedCandidate.position}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Department:</strong> {selectedCandidate.department}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Hiring Manager:</strong> {selectedCandidate.hiringManager}
                    </Typography>
                    {selectedCandidate.salary && (
                      <Typography variant="body2">
                        <strong>Salary:</strong> {selectedCandidate.salary}
                      </Typography>
                    )}
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Key Dates</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Hired:</strong> {formatDate(selectedCandidate.hiredDate)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Start Date:</strong> {formatDate(selectedCandidate.startDate)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {getStatusLabel(selectedCandidate.status)}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Contact Information</Typography>
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center">
                      <Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{selectedCandidate.email}</Typography>
                    </Box>
                    {selectedCandidate.phone && (
                      <Box display="flex" alignItems="center">
                        <Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{selectedCandidate.phone}</Typography>
                      </Box>
                    )}
                    <Box display="flex" alignItems="center">
                      <LocationOn fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{selectedCandidate.location}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Original Application</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Job:</strong> {selectedCandidate.originalJobTitle}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Job ID:</strong> {selectedCandidate.originalJobId}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>Skills</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedCandidate.skills.map((skill, index) => (
                      <Chip key={index} label={skill} size="small" />
                    ))}
                  </Box>
                </Grid>
                {selectedCandidate.notes && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{selectedCandidate.notes}</Typography>
                    </Paper>
                  </Grid>
                )}
                {(selectedCandidate.testScores || selectedCandidate.interviewScore) && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>Performance Scores</Typography>
                    <Grid container spacing={2}>
                      {selectedCandidate.testScores && (
                        <>
                          <Grid size={{ xs: 4 }}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h4" color="primary.main" fontWeight="bold">
                                {selectedCandidate.testScores.overall}%
                              </Typography>
                              <Typography variant="body2">Overall Test</Typography>
                            </Paper>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h4" color="success.main" fontWeight="bold">
                                {selectedCandidate.testScores.technical}%
                              </Typography>
                              <Typography variant="body2">Technical</Typography>
                            </Paper>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="h4" color="warning.main" fontWeight="bold">
                                {selectedCandidate.testScores.soft}%
                              </Typography>
                              <Typography variant="body2">Soft Skills</Typography>
                            </Paper>
                          </Grid>
                        </>
                      )}
                      {selectedCandidate.interviewScore && (
                        <Grid size={{ xs: 12 }}>
                          <Paper sx={{ p: 2, textAlign: 'center', mt: 1 }}>
                            <Typography variant="h4" color="secondary.main" fontWeight="bold">
                              {selectedCandidate.interviewScore}%
                            </Typography>
                            <Typography variant="body2">Interview Score</Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setProfileDialogOpen(false)}>
                Close
              </Button>
              <Button
                variant="outlined"
                startIcon={<Assessment />}
              >
                Performance Review
              </Button>
              <Button
                variant="contained"
                startIcon={<Message />}
              >
                Send Message
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default EmployerHiredPage;