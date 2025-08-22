import React, { useState, useEffect } from 'react';
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
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  alpha,
  Fade,
  Pagination
} from '@mui/material';
import {
  BookmarkRemove,
  Person,
  Email,
  Phone,
  LocationOn,
  Work,
  Star,
  MoreVert,
  Visibility,
  Download,
  Send,
  Delete,
  CheckCircle,
  Schedule,
  Business,
  Edit
} from '@mui/icons-material';

interface SavedCandidate {
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
  savedAt: string;
  notes?: string;
  lastContacted?: string;
  profileCompletion?: number;
  isAvailable?: boolean;
  matchScore?: number;
}

const EmployerSavedCandidatesPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<SavedCandidate | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [anchorEls, setAnchorEls] = useState<Record<string, HTMLElement | null>>({});
  const [candidateNotes, setCandidateNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const candidatesPerPage = 9;

  // Mock data for demonstration
  const mockSavedCandidates: SavedCandidate[] = [
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
      savedAt: '2023-11-15T10:30:00Z',
      notes: 'Excellent React skills, would be perfect for our frontend team.',
      lastContacted: '2023-11-10T14:20:00Z',
      profileCompletion: 95,
      isAvailable: true,
      matchScore: 92
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
      savedAt: '2023-11-12T16:45:00Z',
      notes: 'Strong full-stack developer with good Django experience.',
      profileCompletion: 88,
      isAvailable: true,
      matchScore: 87
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
      savedAt: '2023-11-08T09:15:00Z',
      notes: 'Great analytical skills, considering for data team.',
      profileCompletion: 92,
      isAvailable: false,
      matchScore: 78
    },
    {
      _id: '4',
      firstName: 'David',
      lastName: 'Rodriguez',
      email: 'david.rodriguez@email.com',
      location: 'Austin, TX',
      currentPosition: 'DevOps Engineer',
      currentCompany: 'CloudTech',
      experience: '5+ years',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Python'],
      rating: 4.7,
      testScores: { overall: 90, technical: 93, soft: 87 },
      savedAt: '2023-11-05T11:30:00Z',
      notes: 'Experienced DevOps engineer, perfect for our infrastructure needs.',
      lastContacted: '2023-11-07T15:45:00Z',
      profileCompletion: 90,
      isAvailable: true,
      matchScore: 95
    }
  ];

  useEffect(() => {
    fetchSavedCandidates();
  }, [currentPage]);

  const fetchSavedCandidates = async () => {
    try {
      setLoading(true);
      // Using mock data for now
      setSavedCandidates(mockSavedCandidates);
      setTotalPages(Math.ceil(mockSavedCandidates.length / candidatesPerPage));
    } catch (error) {
      console.error('Error fetching saved candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCandidate = async (candidateId: string) => {
    try {
      setSavedCandidates(prev => prev.filter(candidate => candidate._id !== candidateId));
    } catch (error) {
      console.error('Error removing candidate:', error);
    }
  };

  const handleViewProfile = (candidate: SavedCandidate) => {
    setSelectedCandidate(candidate);
    setProfileDialogOpen(true);
  };

  const handleContactCandidate = (candidate: SavedCandidate) => {
    setSelectedCandidate(candidate);
    setContactDialogOpen(true);
  };

  const handleEditNotes = (candidate: SavedCandidate) => {
    setSelectedCandidate(candidate);
    setCandidateNotes(candidate.notes || '');
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (selectedCandidate) {
      setSavedCandidates(prev => prev.map(candidate =>
        candidate._id === selectedCandidate._id
          ? { ...candidate, notes: candidateNotes }
          : candidate
      ));
      setNotesDialogOpen(false);
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

  const CandidateCard = ({ candidate }: { candidate: SavedCandidate }) => (
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
                <MenuItem onClick={() => handleEditNotes(candidate)}>
                  <Edit sx={{ mr: 1 }} />
                  Edit Notes
                </MenuItem>
                <MenuItem>
                  <Download sx={{ mr: 1 }} />
                  Download CV
                </MenuItem>
                <Divider />
                <MenuItem 
                  onClick={() => handleRemoveCandidate(candidate._id)}
                  sx={{ color: 'error.main' }}
                >
                  <BookmarkRemove sx={{ mr: 1 }} />
                  Remove from Saved
                </MenuItem>
              </Menu>
            </>
          }
          title={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight="bold">
                {candidate.firstName} {candidate.lastName}
              </Typography>
              {candidate.matchScore && (
                <Chip
                  label={`${candidate.matchScore}% match`}
                  size="small"
                  color={candidate.matchScore > 90 ? 'success' : candidate.matchScore > 80 ? 'warning' : 'default'}
                />
              )}
            </Box>
          }
          subheader={
            <Box>
              <Typography variant="body2" color="text.secondary">
                {candidate.currentPosition} at {candidate.currentCompany}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                {candidate.isAvailable && (
                  <Chip
                    size="small"
                    label="Available"
                    color="success"
                  />
                )}
                <Typography variant="caption" color="text.secondary">
                  Saved {formatDate(candidate.savedAt)}
                </Typography>
              </Box>
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

            <Box display="flex" alignItems="center" justifyContent="space-between">
              {candidate.rating && (
                <Box display="flex" alignItems="center">
                  <Star sx={{ color: theme.palette.warning.main, fontSize: 16 }} />
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {candidate.rating}/5
                  </Typography>
                </Box>
              )}
              {candidate.lastContacted && (
                <Typography variant="caption" color="text.secondary">
                  Last contacted {formatDate(candidate.lastContacted)}
                </Typography>
              )}
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
          Saved Candidates
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your saved candidates and track your interactions
        </Typography>
        
        {savedCandidates.length > 0 && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              {savedCandidates.length} candidates saved
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : savedCandidates.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {savedCandidates.map((candidate) => (
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
          <BookmarkRemove sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No saved candidates yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Start saving candidates from the talent pool to keep track of potential hires.
          </Typography>
          <Button variant="contained" href="/app/employer/talent-pool">
            Browse Talent Pool
          </Button>
        </Paper>
      )}

      {/* Profile Dialog - Same as TalentPool */}
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
                {selectedCandidate.notes && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{selectedCandidate.notes}</Typography>
                    </Paper>
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
                onClick={() => handleEditNotes(selectedCandidate)}
              >
                Edit Notes
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

      {/* Notes Dialog */}
      <Dialog
        open={notesDialogOpen}
        onClose={() => setNotesDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Notes for {selectedCandidate?.firstName} {selectedCandidate?.lastName}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={4}
            value={candidateNotes}
            onChange={(e) => setCandidateNotes(e.target.value)}
            placeholder="Add your notes about this candidate..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveNotes}>
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployerSavedCandidatesPage;