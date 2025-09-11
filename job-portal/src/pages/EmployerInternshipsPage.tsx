import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Stack,
  Divider,
  Pagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  useTheme,
  alpha,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { internshipService } from '../services/internshipService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Internship {
  _id: string;
  title: string;
  company: string;
  department: string;
  location: string;
  status: 'active' | 'draft' | 'closed' | 'paused';
  isPaid: boolean;
  stipend?: {
    amount: number;
    currency: string;
    frequency: string;
  };
  numberOfPositions: number;
  applicationsCount?: number;
  createdAt: string;
  expectedStartDate: string;
  expectedEndDate: string;
  workArrangement: string;
  experienceLevel: string;
  viewsCount?: number;
}

const EmployerInternshipsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchInternships();
  }, [page, statusFilter]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (page === 1) {
        fetchInternships();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        limit: itemsPerPage
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await internshipService.getMyInternships(params);
      
      if (response.success) {
        setInternships(response.data || []);
        setTotalPages(response.pagination?.pages || 1);
        setTotal(response.pagination?.total || 0);
      } else {
        setError('Failed to fetch internships');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch internships');
      setInternships([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, internship: Internship) => {
    setAnchorEl(event.currentTarget);
    setSelectedInternship(internship);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInternship(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setAnchorEl(null); // Close the menu but keep selectedInternship
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInternship) return;

    try {
      setDeleteLoading(true);
      setError(null); // Clear previous errors
      console.log('Deleting internship:', selectedInternship._id);
      
      const result = await internshipService.deleteInternship(selectedInternship._id);
      console.log('Delete result:', result);
      
      setSuccess('Internship deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedInternship(null);
      fetchInternships();
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete internship';
      setError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'paused': return 'info';
      case 'closed': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatStipend = (internship: Internship) => {
    if (!internship.isPaid || !internship.stipend) {
      return 'Unpaid';
    }
    return `${internship.stipend.amount} ${internship.stipend.currency}/${internship.stipend.frequency}`;
  };

  if (loading && internships.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box py={4}>
          <Grid container spacing={3}>
            {[1, 2, 3].map((n) => (
              <Grid item xs={12} key={n}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
                    <Box display="flex" gap={1} mt={2}>
                      <Skeleton variant="rectangular" width={60} height={24} />
                      <Skeleton variant="rectangular" width={80} height={24} />
                      <Skeleton variant="rectangular" width={70} height={24} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              My Internships
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your internship opportunities and track applications
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/app/internships/create')}
            size="large"
          >
            Post New Internship
          </Button>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Search and Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search internships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={handleStatusFilterChange}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="paused">Paused</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  {total} internship{total !== 1 ? 's' : ''} found
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Internships List */}
        {internships.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <SchoolIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {searchTerm || statusFilter !== 'all' 
                  ? 'No internships match your filters' 
                  : 'No internships posted yet'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search criteria or filters.' 
                  : 'Create your first internship opportunity to start connecting with talented students.'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/app/internships/create')}
                size="large"
              >
                Post Your First Internship
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {internships.map((internship) => (
              <Grid item xs={12} key={internship._id}>
                <Card
                  sx={{
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <SchoolIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" component="h3">
                              {internship.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {internship.company} • {internship.department}
                            </Typography>
                          </Box>
                        </Box>

                        <Grid container spacing={2} mb={2}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <LocationIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {internship.location}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <MoneyIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {formatStipend(internship)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <PeopleIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {internship.numberOfPositions} position{internship.numberOfPositions > 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <ScheduleIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {formatDate(internship.expectedStartDate)}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip
                            label={internship.status}
                            color={getStatusColor(internship.status)}
                            size="small"
                          />
                          <Chip
                            label={internship.workArrangement}
                            variant="outlined"
                            size="small"
                          />
                          <Chip
                            label={internship.experienceLevel.replace('_', ' ')}
                            variant="outlined"
                            size="small"
                          />
                          {internship.applicationsCount !== undefined && (
                            <Chip
                              label={`${internship.applicationsCount} applications`}
                              variant="outlined"
                              size="small"
                              color="info"
                            />
                          )}
                          {internship.viewsCount !== undefined && (
                            <Chip
                              label={`${internship.viewsCount} views`}
                              variant="outlined"
                              size="small"
                              color="secondary"
                            />
                          )}
                        </Stack>
                      </Box>

                      <IconButton
                        onClick={(e) => handleMenuOpen(e, internship)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
              size="large"
            />
          </Box>
        )}

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {
              if (selectedInternship) {
                navigate(`/app/internships/${selectedInternship._id}`);
              }
              handleMenuClose();
            }}
          >
            <ViewIcon fontSize="small" sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (selectedInternship) {
                navigate(`/app/internships/${selectedInternship._id}/edit`);
              }
              handleMenuClose();
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit Internship
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (selectedInternship) {
                navigate(`/app/internships/${selectedInternship._id}/applications`);
              }
              handleMenuClose();
            }}
          >
            <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
            View Applications
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete Internship
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSelectedInternship(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Internship?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedInternship?.title}"? 
              This action cannot be undone and will remove all associated applications.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedInternship(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default EmployerInternshipsPage;