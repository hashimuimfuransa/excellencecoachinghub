import React, { useState, useEffect } from 'react';
import { savedCandidatesService, SavedCandidate } from '../services/savedCandidatesService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
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

// SavedCandidate interface is now imported from service

const EmployerSavedCandidatesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<SavedCandidate | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [anchorEls, setAnchorEls] = useState<Record<string, HTMLElement | null>>({});
  const [candidateNotes, setCandidateNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const candidatesPerPage = 9;



  useEffect(() => {
    fetchSavedCandidates();
  }, [currentPage]);

  const fetchSavedCandidates = async () => {
    try {
      setLoading(true);
      const response = await savedCandidatesService.getSavedCandidates(currentPage, candidatesPerPage);
      setSavedCandidates(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching saved candidates:', error);
      toast.error('Failed to load saved candidates');
      setSavedCandidates([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCandidate = async (candidateId: string) => {
    try {
      await savedCandidatesService.removeSavedCandidate(candidateId);
      setSavedCandidates(prev => prev.filter(candidate => candidate._id !== candidateId));
      toast.success('Candidate removed from saved list successfully!');
    } catch (error) {
      console.error('Error removing candidate:', error);
      toast.error('Failed to remove candidate from saved list. Please try again.');
    }
  };

  const handleViewProfile = (candidate: SavedCandidate) => {
    setSelectedCandidate(candidate);
    setProfileDialogOpen(true);
  };

  const handleContactCandidate = async (candidate: SavedCandidate) => {
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
        toast.success(`Successfully started conversation with ${candidate.firstName}!`);
      } else {
        throw new Error('Failed to create conversation - no conversation ID returned');
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      const errorMessage = error.message || 'Please try again.';
      toast.error(`Failed to start conversation: ${errorMessage}`);
    }
  };

  const handleEditNotes = (candidate: SavedCandidate) => {
    setSelectedCandidate(candidate);
    setCandidateNotes(candidate.notes || '');
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (selectedCandidate) {
      try {
        await savedCandidatesService.updateSavedCandidateNotes(selectedCandidate._id, candidateNotes);
        setSavedCandidates(prev => prev.map(candidate =>
          candidate._id === selectedCandidate._id
            ? { ...candidate, notes: candidateNotes }
            : candidate
        ));
        setNotesDialogOpen(false);
      } catch (error) {
        console.error('Error updating notes:', error);
      }
    }
  };

  const handleDownloadCV = async (candidate: SavedCandidate) => {
    try {
      await savedCandidatesService.downloadCandidateCV(
        candidate._id, 
        candidate.firstName, 
        candidate.lastName
      );
      toast.success('CV downloaded successfully!');
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Error downloading CV. Please check your connection and try again.');
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
                <MenuItem onClick={() => handleDownloadCV(candidate)}>
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
                  {candidate.experience && candidate.experience.length > 0 
                    ? `${candidate.experience.length} ${candidate.experience.length === 1 ? 'role' : 'roles'}` 
                    : candidate.yearsOfExperience 
                      ? `${candidate.yearsOfExperience} ${candidate.yearsOfExperience === 1 ? 'year' : 'years'} experience`
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
                      <strong>Experience:</strong> {selectedCandidate.experience && selectedCandidate.experience.length > 0 
                        ? `${selectedCandidate.experience.length} ${selectedCandidate.experience.length === 1 ? 'role' : 'roles'}` 
                        : selectedCandidate.yearsOfExperience 
                          ? `${selectedCandidate.yearsOfExperience} ${selectedCandidate.yearsOfExperience === 1 ? 'year' : 'years'}`
                          : 'No experience listed'
                      }
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
                
                {/* Experience Section */}
                {selectedCandidate.experience && Array.isArray(selectedCandidate.experience) && selectedCandidate.experience.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>Work Experience</Typography>
                    <Stack spacing={2}>
                      {selectedCandidate.experience.map((exp, index) => (
                        <Paper key={exp._id || index} sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {exp.position} at {exp.company}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {exp.startDate} - {exp.current ? 'Present' : (exp.endDate || 'Not specified')}
                            {exp.location && ` • ${exp.location}`}
                          </Typography>
                          {exp.description && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {exp.description}
                            </Typography>
                          )}
                          {exp.technologies && exp.technologies.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Technologies: {exp.technologies.join(', ')}
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </Grid>
                )}
                
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