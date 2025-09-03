import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Search,
  FilterList,
  Business,
  Person,
  CalendarToday,
  Language,
  LocationOn,
  People,
  Category,
  Refresh,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { superAdminService } from '../../services/superAdminService';

interface CompanyProfile {
  _id: string;
  name: string;
  description?: string;
  industry: string;
  website?: string;
  logo?: string;
  location: string;
  size: string;
  founded?: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  submittedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    jobTitle?: string;
  };
  submittedAt?: Date;
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reviewedAt?: Date;
  rejectionReason?: string;
  approvalNotes?: string;
  documents?: Array<{
    type: string;
    url: string;
    name: string;
    uploadedAt: Date;
  }>;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
}

interface CompanyProfileStats {
  totalProfiles: number;
  pendingProfiles: number;
  approvedProfiles: number;
  rejectedProfiles: number;
  approvalRate: number;
}

const CompanyProfileApprovalPage: React.FC = () => {
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [stats, setStats] = useState<CompanyProfileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<CompanyProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      let endpoint = '/company-profiles';
      if (activeTab === 1) endpoint = '/company-profiles/pending';
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all' && activeTab === 0) params.append('status', statusFilter);

      const response = await superAdminService.getCompanyProfiles(`${endpoint}?${params}`);
      
      if (response.success) {
        setProfiles(response.data.profiles);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching company profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await superAdminService.getCompanyProfileStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [page, searchQuery, statusFilter, activeTab]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleViewDetails = async (profile: CompanyProfile) => {
    try {
      const response = await superAdminService.getCompanyProfile(profile._id);
      if (response.success) {
        setSelectedProfile(response.data);
        setDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error fetching profile details:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedProfile) return;

    try {
      const response = await superAdminService.approveCompanyProfile(selectedProfile._id, approvalNotes);
      if (response.success) {
        setApprovalDialogOpen(false);
        setDetailsOpen(false);
        setApprovalNotes('');
        await fetchProfiles();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error approving profile:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedProfile || !rejectionReason.trim()) return;

    try {
      const response = await superAdminService.rejectCompanyProfile(selectedProfile._id, rejectionReason);
      if (response.success) {
        setRejectionDialogOpen(false);
        setDetailsOpen(false);
        setRejectionReason('');
        await fetchProfiles();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error rejecting profile:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1);
    if (newValue === 1) {
      setStatusFilter('pending');
    } else {
      setStatusFilter('all');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Business />
        Company Profile Approval Management
      </Typography>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Profiles
                </Typography>
                <Typography variant="h4">
                  {stats.totalProfiles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Approval
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pendingProfiles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Approved
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.approvedProfiles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Approval Rate
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.approvalRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search companies, industries, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={activeTab === 1}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchProfiles}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Profiles" />
          <Tab label={`Pending Approval (${stats?.pendingProfiles || 0})`} />
        </Tabs>

        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : profiles.length === 0 ? (
            <Alert severity="info">
              No company profiles found matching your criteria.
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Company</TableCell>
                      <TableCell>Submitter</TableCell>
                      <TableCell>Industry</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile._id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar
                              src={profile.logo}
                              sx={{ width: 40, height: 40 }}
                            >
                              <Business />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {profile.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {profile.size} employees
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {profile.submittedBy?.firstName} {profile.submittedBy?.lastName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {profile.submittedBy?.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{profile.industry}</TableCell>
                        <TableCell>{profile.location}</TableCell>
                        <TableCell>
                          <Chip
                            label={profile.approvalStatus}
                            color={getStatusColor(profile.approvalStatus) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {profile.submittedAt ? format(new Date(profile.submittedAt), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(profile)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {profile.approvalStatus === 'pending' && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => {
                                      setSelectedProfile(profile);
                                      setApprovalDialogOpen(true);
                                    }}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setSelectedProfile(profile);
                                      setRejectionDialogOpen(true);
                                    }}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Profile Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Company Profile Details
        </DialogTitle>
        <DialogContent>
          {selectedProfile && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    src={selectedProfile.logo}
                    sx={{ width: 60, height: 60 }}
                  >
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedProfile.name}</Typography>
                    <Chip
                      label={selectedProfile.approvalStatus}
                      color={getStatusColor(selectedProfile.approvalStatus) as any}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Basic Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Category fontSize="small" />
                    <Typography variant="body2">{selectedProfile.industry}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn fontSize="small" />
                    <Typography variant="body2">{selectedProfile.location}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <People fontSize="small" />
                    <Typography variant="body2">{selectedProfile.size} employees</Typography>
                  </Box>
                  {selectedProfile.founded && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarToday fontSize="small" />
                      <Typography variant="body2">Founded in {selectedProfile.founded}</Typography>
                    </Box>
                  )}
                  {selectedProfile.website && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Language fontSize="small" />
                      <Typography variant="body2" component="a" href={selectedProfile.website} target="_blank">
                        {selectedProfile.website}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Submitter Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person fontSize="small" />
                    <Typography variant="body2">
                      {selectedProfile.submittedBy?.firstName} {selectedProfile.submittedBy?.lastName}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {selectedProfile.submittedBy?.email}
                  </Typography>
                  {selectedProfile.submittedBy?.jobTitle && (
                    <Typography variant="body2" color="textSecondary">
                      {selectedProfile.submittedBy.jobTitle}
                    </Typography>
                  )}
                  <Typography variant="caption">
                    Submitted: {selectedProfile.submittedAt ? format(new Date(selectedProfile.submittedAt), 'PPpp') : '-'}
                  </Typography>
                </Box>
              </Grid>

              {selectedProfile.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Company Description
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedProfile.description}
                  </Typography>
                </Grid>
              )}

              {selectedProfile.approvalStatus !== 'pending' && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Review Information
                  </Typography>
                  <Box>
                    <Typography variant="body2">
                      Reviewed by: {selectedProfile.reviewedBy?.firstName} {selectedProfile.reviewedBy?.lastName}
                    </Typography>
                    <Typography variant="body2">
                      Reviewed at: {selectedProfile.reviewedAt ? format(new Date(selectedProfile.reviewedAt), 'PPpp') : '-'}
                    </Typography>
                    {selectedProfile.approvalNotes && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Notes: {selectedProfile.approvalNotes}
                      </Typography>
                    )}
                    {selectedProfile.rejectionReason && (
                      <Typography variant="body2" sx={{ mt: 1 }} color="error">
                        Rejection Reason: {selectedProfile.rejectionReason}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedProfile?.approvalStatus === 'pending' && (
            <>
              <Button
                onClick={() => setRejectionDialogOpen(true)}
                color="error"
                startIcon={<Cancel />}
              >
                Reject
              </Button>
              <Button
                onClick={() => setApprovalDialogOpen(true)}
                color="success"
                startIcon={<CheckCircle />}
              >
                Approve
              </Button>
            </>
          )}
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Approve Company Profile</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to approve "{selectedProfile?.name}"?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Approval Notes (Optional)"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApprove} color="success" variant="contained">
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog
        open={rejectionDialogOpen}
        onClose={() => setRejectionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Company Profile</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Please provide a reason for rejecting "{selectedProfile?.name}":
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason *"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyProfileApprovalPage;