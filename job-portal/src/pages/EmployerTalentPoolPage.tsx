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

interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  currentPosition?: string;
  currentCompany?: string;
  experience?: string;
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
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
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

  const candidatesPerPage = 12;

  // Mock data for demonstration
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

  useEffect(() => {
    fetchCandidates();
  }, [currentPage, filters]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, candidates]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // Using mock data for now
      setCandidates(mockCandidates);
      setTotalPages(Math.ceil(mockCandidates.length / candidatesPerPage));
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = candidates;

    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        candidate.currentPosition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.currentCompany?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.skills) {
      filtered = filtered.filter(candidate =>
        candidate.skills.some(skill => skill.toLowerCase().includes(filters.skills.toLowerCase()))
      );
    }

    if (filters.location) {
      filtered = filtered.filter(candidate =>
        candidate.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.experience !== '') {
      filtered = filtered.filter(candidate =>
        candidate.experience === filters.experience
      );
    }

    if (filters.availability !== 'all') {
      filtered = filtered.filter(candidate =>
        filters.availability === 'available' ? candidate.isAvailable : !candidate.isAvailable
      );
    }

    setFilteredCandidates(filtered);
  };

  const handleSaveCandidate = async (candidateId: string) => {
    try {
      // Toggle saved status
      setCandidates(prev => prev.map(candidate =>
        candidate._id === candidateId
          ? { ...candidate, savedBy: !candidate.savedBy }
          : candidate
      ));
    } catch (error) {
      console.error('Error saving candidate:', error);
    }
  };

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setProfileDialogOpen(true);
  };

  const handleContactCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setContactDialogOpen(true);
  };

  const handleMenuOpen = (candidateId: string, event: React.MouseEvent<HTMLElement>) => {
    setAnchorEls(prev => ({ ...prev, [candidateId]: event.currentTarget }));
  };

  const handleMenuClose = (candidateId: string) => {
    setAnchorEls(prev => ({ ...prev, [candidateId]: null }));
  };

  const resetFilters = () => {
    setFilters({
      skills: '',
      location: '',
      experience: '',
      availability: 'all'
    });
    setSearchTerm('');
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
                <MenuItem>
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
                  {candidate.experience} experience
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
              onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
              placeholder="e.g. React, Python"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              label="Location"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. New York"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Experience</InputLabel>
              <Select
                value={filters.experience}
                onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value }))}
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
                onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
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
                {filteredCandidates.length} candidates found
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : filteredCandidates.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {filteredCandidates.map((candidate) => (
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
                      <strong>Experience:</strong> {selectedCandidate.experience}
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