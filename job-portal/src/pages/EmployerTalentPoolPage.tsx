import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
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
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Pagination,
  CircularProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  Fade
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  Work,
  Star,
  StarBorder,
  Person,
  Email,
  Phone,
  School,
  Business,
  MoreVert,
  BookmarkAdd,
  Bookmark,
  Visibility,
  Download,
  Send,
  CheckCircle,
  TrendingUp,
  Psychology
} from '@mui/icons-material';
import { employerService } from '../services/employerService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';

interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  currentPosition?: string;
  currentCompany?: string;
  experience?: Array<{
    _id?: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
    location?: string;
    achievements?: string[];
    employmentType?: string;
    industry?: string;
    responsibilities?: string[];
    technologies?: string[];
  }>;
  skills: string[];
  education?: {
    degree: string;
    school: string;
    year: string;
  }[];
  avatar?: string;
  rating?: number;
  testScores?: {
    overall: number;
    technical: number;
    soft: number;
  };
  lastActive?: string;
  profileCompletion?: number;
  isAvailable?: boolean;
  savedBy?: boolean;
}

const EmployerTalentPoolPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    skills: '',
    location: '',
    experience: '',
    availability: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [anchorEls, setAnchorEls] = useState<Record<string, HTMLElement | null>>({});
  const [error, setError] = useState<string>('');

  const candidatesPerPage = 12;

  // Load candidates from API
  useEffect(() => {
    loadCandidates();
  }, [currentPage, searchTerm, filters]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params: any = {
        page: currentPage,
        limit: candidatesPerPage,
      };

      let response;

      // Add search term if provided
      if (searchTerm.trim()) {
        console.log('Searching candidates with term:', searchTerm.trim());
        response = await employerService.searchCandidates({
          q: searchTerm.trim(),
          skills: filters.skills || undefined,
          location: filters.location || undefined,
          experience: filters.experience || undefined,
        });
      } else {
        // Add filters if provided
        if (filters.skills) params.skills = filters.skills;
        if (filters.location) params.location = filters.location;
        if (filters.experience) params.experience = filters.experience;
        
        console.log('Fetching candidates with params:', params);
        response = await employerService.getCandidates(params);
      }

      console.log('API Response:', response);

      if (response && response.data && response.data.length > 0) {
        setCandidates(response.data);
        setTotalPages(Math.ceil((response.total || 0) / candidatesPerPage));
        console.log(`Loaded ${response.data.length} candidates from API`);
      } else {
        console.log('No candidates returned from API, using mock data');
        // Fallback to mock data if no candidates found
        setCandidates(mockCandidates);
        setTotalPages(1);
        setError('Using demo data - No candidates found in database. Make sure job seekers have completed their profiles.');
      }
    } catch (error: any) {
      console.error('Error loading candidates:', error);
      console.log('API call failed, using mock data as fallback');
      
      // Use mock data as fallback when API fails
      setCandidates(mockCandidates);
      setTotalPages(1);
      setError(`API Error: ${error.message || 'Failed to load candidates'}. Showing demo data instead.`);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration (fallback)
  const mockCandidates: Candidate[] = [
    {
      _id: '1',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@email.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY',
      currentPosition: 'Frontend Developer',
      currentCompany: 'Tech Innovations',
      experience: '3-5 years',
      skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Node.js'],
      education: [
        { degree: 'BS Computer Science', school: 'NYU', year: '2020' }
      ],
      rating: 4.8,
      testScores: { overall: 85, technical: 88, soft: 82 },
      lastActive: '2 hours ago',
      profileCompletion: 95,
      isAvailable: true,
      savedBy: false
    },
    {
      _id: '2',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@email.com',
      location: 'San Francisco, CA',
      currentPosition: 'Full Stack Developer',
      currentCompany: 'StartupX',
      experience: '2-3 years',
      skills: ['Python', 'Django', 'React', 'PostgreSQL', 'AWS'],
      education: [
        { degree: 'MS Software Engineering', school: 'Stanford', year: '2021' }
      ],
      rating: 4.6,
      testScores: { overall: 78, technical: 82, soft: 74 },
      lastActive: '1 day ago',
      profileCompletion: 88,
      isAvailable: true,
      savedBy: true
    },
    {
      _id: '3',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.williams@email.com',
      location: 'Chicago, IL',
      currentPosition: 'Data Analyst',
      currentCompany: 'Analytics Pro',
      experience: '1-2 years',
      skills: ['Python', 'SQL', 'Tableau', 'Excel', 'Statistics'],
      education: [
        { degree: 'BS Data Science', school: 'University of Chicago', year: '2022' }
      ],
      rating: 4.4,
      testScores: { overall: 72, technical: 75, soft: 69 },
      lastActive: '3 hours ago',
      profileCompletion: 92,
      isAvailable: false,
      savedBy: false
    }
  ];



  // Debounced search function
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      skills: '',
      location: '',
      experience: '',
      availability: 'all'
    });
    setCurrentPage(1);
  };

  const handleContactCandidate = async (candidate: Candidate) => {
    try {
      console.log('Attempting to contact candidate:', {
        candidateId: candidate._id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`
      });
      
      // Create or get existing conversation with this candidate
      const conversation = await chatService.createConversation(
        [candidate._id], 
        `Hello ${candidate.firstName}, I'm interested in discussing potential opportunities with you.`
      );
      
      console.log('Conversation created/retrieved:', conversation);
      
      if (conversation && conversation._id) {
        console.log('Navigating to messages with conversation ID:', conversation._id);
        // Navigate to messages page with the conversation
        navigate(`/app/messages?conversation=${conversation._id}`);
        
        // Show success message
        setError(`Successfully started conversation with ${candidate.firstName}!`);
        
        // Close the contact dialog if it's open
        setContactDialogOpen(false);
      } else {
        throw new Error('Failed to create conversation - no conversation ID returned');
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      const errorMessage = error.message || 'Please try again.';
      setError(`Failed to start conversation: ${errorMessage}`);
      // Also show an alert for immediate user feedback
      alert(`Failed to start conversation: ${errorMessage}`);
    }
  };

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setProfileDialogOpen(true);
    handleMenuClose(candidate._id);
  };

  const handleMenuOpen = (candidateId: string, event: React.MouseEvent<HTMLElement>) => {
    setAnchorEls(prev => ({
      ...prev,
      [candidateId]: event.currentTarget
    }));
  };

  const handleMenuClose = (candidateId: string) => {
    setAnchorEls(prev => ({
      ...prev,
      [candidateId]: null
    }));
  };

  const handleSaveCandidate = async (candidateId: string) => {
    try {
      const candidate = candidates.find(c => c._id === candidateId);
      if (!candidate) return;

      if (candidate.savedBy) {
        // Unsave candidate
        await employerService.unsaveCandidate(candidateId);
        setCandidates(prev => prev.map(c =>
          c._id === candidateId
            ? { ...c, savedBy: false }
            : c
        ));
        setError('');
        toast.success('Candidate removed from saved list successfully!');
      } else {
        // Save candidate
        await employerService.saveCandidate(candidateId);
        setCandidates(prev => prev.map(c =>
          c._id === candidateId
            ? { ...c, savedBy: true }
            : c
        ));
        setError('');
        toast.success('Candidate saved successfully!');
      }
      
      // Reload candidates to get updated data
      loadCandidates();
      
      // Close menu after action
      handleMenuClose(candidateId);
    } catch (error: any) {
      console.error('Error saving/unsaving candidate:', error);
      const currentCandidate = candidates.find(c => c._id === candidateId);
      const action = currentCandidate?.savedBy ? 'unsave' : 'save';
      const errorMessage = `Failed to ${action} candidate: ${error.message || 'Please try again'}`;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDownloadCV = async (candidate: Candidate) => {
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
        
        // Get the content type to determine the file extension
        const contentType = response.headers.get('content-type') || '';
        let fileExtension = 'pdf'; // default
        
        if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
          fileExtension = 'docx';
        } else if (contentType.includes('application/msword')) {
          fileExtension = 'doc';
        } else if (contentType.includes('application/pdf')) {
          fileExtension = 'pdf';
        } else if (contentType.includes('text/plain')) {
          fileExtension = 'txt';
        } else if (contentType.includes('application/rtf')) {
          fileExtension = 'rtf';
        }
        
        // Try to get filename from Content-Disposition header
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `${candidate.firstName}_${candidate.lastName}_CV.${fileExtension}`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Close menu after successful download
        handleMenuClose(candidate._id);
        toast.success('CV downloaded successfully!');
      } else {
        console.error('Failed to download CV');
        toast.error('Failed to download CV. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Error downloading CV. Please check your connection and try again.');
    }
  };

  const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
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
          border: candidate.isAvailable ? `2px solid ${alpha(theme.palette.success.main, 0.3)}` : 'none'
        }}
      >
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
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
                  View Profile
                </MenuItem>
                <MenuItem onClick={() => handleContactCandidate(candidate)}>
                  <Send sx={{ mr: 1 }} />
                  Contact
                </MenuItem>
                <MenuItem onClick={() => handleDownloadCV(candidate)}>
                  <Download sx={{ mr: 1 }} />
                  Download CV
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleSaveCandidate(candidate._id)}>
                  {candidate.savedBy ? <Bookmark sx={{ mr: 1 }} /> : <BookmarkAdd sx={{ mr: 1 }} />}
                  {candidate.savedBy ? 'Saved' : 'Save Candidate'}
                </MenuItem>
              </Menu>
            </>
          }
          title={
            <Typography variant="h6" fontWeight="bold">
              {candidate.firstName} {candidate.lastName}
            </Typography>
          }
          subheader={
            <Box>
              <Typography variant="body2" color="text.secondary">
                {candidate.currentPosition} at {candidate.currentCompany}
              </Typography>
              {candidate.isAvailable && (
                <Chip
                  size="small"
                  label="Available"
                  color="success"
                  sx={{ mt: 0.5 }}
                />
              )}
            </Box>
          }
        />
        
        <CardContent sx={{ pt: 0 }}>
          <Stack spacing={2}>
            <Box>
              <Box display="flex" alignItems="center" mb={1}>
                <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {candidate.location}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Work fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {candidate.experience && candidate.experience.length > 0 
                    ? `${candidate.experience.length} ${candidate.experience.length === 1 ? 'role' : 'roles'}`
                    : 'No experience listed'
                  }
                </Typography>
              </Box>
            </Box>

            {candidate.testScores && (
              <Box>
                <Typography variant="body2" fontWeight="medium" mb={1}>
                  Test Scores
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">Overall</Typography>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {candidate.testScores.overall}%
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">Technical</Typography>
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {candidate.testScores.technical}%
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">Soft Skills</Typography>
                    <Typography variant="h6" color="warning.main" fontWeight="bold">
                      {candidate.testScores.soft}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <Box>
              <Typography variant="body2" fontWeight="medium" mb={1}>
                Skills
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {candidate.skills.slice(0, 4).map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
                {candidate.skills.length > 4 && (
                  <Chip
                    label={`+${candidate.skills.length - 4} more`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem', opacity: 0.7 }}
                  />
                )}
              </Box>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center">
                {candidate.rating && (
                  <>
                    <Star sx={{ color: theme.palette.warning.main, fontSize: 16 }} />
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {candidate.rating}/5
                    </Typography>
                  </>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Active {candidate.lastActive}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleViewProfile(candidate)}
                startIcon={<Visibility />}
                fullWidth
              >
                View Profile
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleContactCandidate(candidate)}
                startIcon={<Send />}
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

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Talent Pool
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and connect with talented candidates from our platform
        </Typography>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Search candidates"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, skills, position, or company"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              label="Skills"
              value={filters.skills}
              onChange={(e) => handleFilterChange('skills', e.target.value)}
              placeholder="e.g. React, Python"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              label="Location"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              placeholder="e.g. New York"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Experience</InputLabel>
              <Select
                value={filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value as string)}
                label="Experience"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="0-1 years">0-1 years</MenuItem>
                <MenuItem value="1-2 years">1-2 years</MenuItem>
                <MenuItem value="2-3 years">2-3 years</MenuItem>
                <MenuItem value="3-5 years">3-5 years</MenuItem>
                <MenuItem value="5+ years">5+ years</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Availability</InputLabel>
              <Select
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value as string)}
                label="Availability"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="unavailable">Unavailable</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 12 }}>
            <Box display="flex" gap={1} mt={1}>
              <Button
                variant="outlined"
                onClick={resetFilters}
                startIcon={<FilterList />}
              >
                Clear Filters
              </Button>
              <Typography variant="body2" sx={{ alignSelf: 'center', ml: 2 }}>
                {candidates.length} candidates found
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error Loading Candidates</AlertTitle>
          {error}
          <Box mt={1}>
            <Button variant="outlined" size="small" onClick={loadCandidates}>
              Try Again
            </Button>
          </Box>
        </Alert>
      ) : loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : candidates.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {candidates.map((candidate) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={candidate._id}>
                <CandidateCard candidate={candidate} />
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
          <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No candidates found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Try adjusting your search criteria or filters to find more candidates.
          </Typography>
          <Button variant="outlined" onClick={resetFilters}>
            Clear Filters
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
                  label={selectedCandidate.isAvailable ? 'Available' : 'Not Available'}
                  color={selectedCandidate.isAvailable ? 'success' : 'default'}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
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
                  <Typography variant="subtitle2" gutterBottom>Professional Info</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Position:</strong> {selectedCandidate.currentPosition}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Company:</strong> {selectedCandidate.currentCompany}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Experience:</strong> {selectedCandidate.experience && selectedCandidate.experience.length > 0 
                        ? `${selectedCandidate.experience.length} ${selectedCandidate.experience.length === 1 ? 'role' : 'roles'}`
                        : 'No experience listed'
                      }
                    </Typography>
                    
                    {/* Experience Details */}
                    {selectedCandidate.experience && selectedCandidate.experience.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          <strong>Work Experience:</strong>
                        </Typography>
                        {selectedCandidate.experience.map((exp, index) => (
                          <Box key={exp._id || index} mb={2} p={1} border={1} borderColor="divider" borderRadius={1}>
                            <Typography variant="body2">
                              <strong>{exp.position}</strong> at <strong>{exp.company}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {exp.startDate} - {exp.current ? 'Present' : (exp.endDate || 'Not specified')}
                              {exp.location && ` • ${exp.location}`}
                            </Typography>
                            {exp.description && (
                              <Typography variant="body2" mt={0.5}>
                                {exp.description}
                              </Typography>
                            )}
                            {exp.technologies && exp.technologies.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Technologies: {exp.technologies.join(', ')}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
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
                {selectedCandidate.education && selectedCandidate.education.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>Education</Typography>
                    {selectedCandidate.education.map((edu, index) => (
                      <Box key={index} mb={1}>
                        <Typography variant="body2">
                          <strong>{edu.degree}</strong> - {edu.school} ({edu.year})
                        </Typography>
                      </Box>
                    ))}
                  </Grid>
                )}
                {selectedCandidate.testScores && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>Test Performance</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 4 }}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.main" fontWeight="bold">
                            {selectedCandidate.testScores.overall}%
                          </Typography>
                          <Typography variant="body2">Overall</Typography>
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
                onClick={() => handleSaveCandidate(selectedCandidate._id)}
                startIcon={selectedCandidate.savedBy ? <Bookmark /> : <BookmarkAdd />}
              >
                {selectedCandidate.savedBy ? 'Saved' : 'Save Candidate'}
              </Button>
              <Button
                variant="contained"
                onClick={() => handleContactCandidate(selectedCandidate)}
                startIcon={<Send />}
              >
                Contact
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Contact Dialog */}
      <Dialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Contact {selectedCandidate?.firstName} {selectedCandidate?.lastName}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Subject"
              defaultValue="Job Opportunity at Your Company"
            />
            <TextField
              fullWidth
              label="Message"
              multiline
              rows={4}
              defaultValue={`Hi ${selectedCandidate?.firstName},

I came across your profile on Excellence Coaching Hub and I'm impressed with your background in ${selectedCandidate?.currentPosition}.

We have an exciting opportunity that might interest you. Would you be open to discussing this further?

Best regards`}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<Send />}>
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployerTalentPoolPage;