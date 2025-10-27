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
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Paper} from '@mui/material';
import {
  Search,
  Visibility,
  Add,
  MoreVert,
  Download,
  CardMembership,
  School,
  Refresh,
  CheckCircle,
  Warning,
  Info,
  Block,
  Verified,
  Share} from '@mui/icons-material';
import { superAdminService } from '../../services/superAdminService';
import type { JobCertificate } from '../../types/common';

interface CertificateFilters {
  search: string;
  status: string;
  type: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CreateCertificateDialog {
  open: boolean;
  userId: string;
  type: string;
  title: string;
  description: string;
}

const CertificateManagement: React.FC = () => {
  const [certificates, setCertificates] = useState<JobCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<JobCertificate | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState<CreateCertificateDialog>({
    open: false,
    userId: '',
    type: '',
    title: '',
    description: ''
  });

  const [filters, setFilters] = useState<CertificateFilters>({
    search: '',
    status: '',
    type: '',
    dateRange: '',
    sortBy: 'issuedAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadCertificates();
  }, [page, rowsPerPage, filters]);

  const loadCertificates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await superAdminService.getAllCertificates({
        page: page + 1,
        limit: rowsPerPage,
        search: filters.search || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      console.log('🔍 CertificateManagement: Raw API response:', response);

      // Handle different possible response structures
      let certificatesData: JobCertificate[] = [];
      let totalCount = 0;

      if (response) {
        // Check if response has certificates directly
        if (response.certificates && Array.isArray(response.certificates)) {
          certificatesData = response.certificates;
          totalCount = response.total || response.certificates.length;
        }
        // Check if response has data.certificates structure
        else if (response.data && response.data.certificates && Array.isArray(response.data.certificates)) {
          certificatesData = response.data.certificates;
          totalCount = response.data.total || response.data.certificates.length;
        }
        // Check if response is directly an array
        else if (Array.isArray(response)) {
          certificatesData = response;
          totalCount = response.length;
        }
        // Check if response has success and data structure
        else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            certificatesData = response.data;
            totalCount = response.data.length;
          } else if (response.data.certificates) {
            certificatesData = response.data.certificates;
            totalCount = response.data.total || response.data.certificates.length;
          }
        }
      }

      console.log('🔍 CertificateManagement: Extracted certificates data:', certificatesData);
      console.log('🔍 CertificateManagement: Total count:', totalCount);
      
      setCertificates(certificatesData);
      setTotal(totalCount);
    } catch (err) {
      console.error('Error loading certificates:', err);
      setError('Failed to load certificates');
      // Use fallback data
      const fallbackCertificates: JobCertificate[] = [
        {
          id: '1',
          userId: 'user-1',
          userName: 'John Doe',
          userEmail: 'john.doe@example.com',
          type: 'course_completion',
          title: 'React Development Mastery',
          description: 'Complete React development course including hooks, context, and advanced patterns',
          status: 'active',
          issuedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
          expiresAt: new Date('2026-01-15T10:00:00Z').toISOString(),
          verificationCode: 'CERT-REACT-2024-001',
          metadata: {
            courseId: 'course-1',
            courseName: 'React Development Mastery',
            instructorName: 'Dr. Sarah Johnson',
            grade: 'A+',
            completionDate: '2024-01-10'
          }
        },
        {
          id: '2',
          userId: 'user-2',
          userName: 'Sarah Wilson',
          userEmail: 'sarah.wilson@example.com',
          type: 'skill_assessment',
          title: 'JavaScript Expert Certification',
          description: 'Advanced JavaScript skills validation including ES6+, async programming, and frameworks',
          status: 'active',
          issuedAt: new Date('2024-01-12T14:30:00Z').toISOString(),
          expiresAt: new Date('2025-01-12T14:30:00Z').toISOString(),
          verificationCode: 'CERT-JS-2024-002',
          metadata: {
            testId: 'test-1',
            testName: 'JavaScript Expert Assessment',
            score: 94,
            maxScore: 100,
            passingScore: 80
          }
        },
        {
          id: '3',
          userId: 'user-3',
          userName: 'Mike Johnson',
          userEmail: 'mike.johnson@example.com',
          type: 'job_completion',
          title: 'Frontend Developer Internship',
          description: 'Successfully completed 6-month frontend development internship program',
          status: 'revoked',
          issuedAt: new Date('2024-01-08T09:00:00Z').toISOString(),
          expiresAt: new Date('2027-01-08T09:00:00Z').toISOString(),
          revokedAt: new Date('2024-01-20T16:00:00Z').toISOString(),
          revokeReason: 'Violation of terms and conditions',
          verificationCode: 'CERT-INTERN-2024-003',
          metadata: {
            companyName: 'TechCorp Inc.',
            supervisorName: 'Jane Smith',
            startDate: '2023-07-01',
            endDate: '2023-12-31'
          }
        }
      ];
      
      setCertificates(fallbackCertificates);
      setTotal(fallbackCertificates.length);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (key: keyof CertificateFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'warning';
      case 'revoked': return 'error';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Verified />;
      case 'expired': return <Warning />;
      case 'revoked': return <Block />;
      case 'pending': return <Info />;
      default: return <CardMembership />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course_completion': return <School />;
      case 'skill_assessment': return <Verified />;
      case 'job_completion': return <CheckCircle />;
      default: return <CardMembership />;
    }
  };

  const handleViewCertificate = (certificate: JobCertificate) => {
    setSelectedCertificate(certificate);
    setDetailDialog(true);
    setAnchorEl(null);
  };

  const handleCreateCertificate = async () => {
    if (!createDialog.userId || !createDialog.type || !createDialog.title) {
      return;
    }

    try {
      await superAdminService.issueCertificate({
        userId: createDialog.userId,
        type: createDialog.type,
        title: createDialog.title,
        description: createDialog.description
      });
      
      setCreateDialog({ open: false, userId: '', type: '', title: '', description: '' });
      loadCertificates();
    } catch (error) {
      console.error('Error creating certificate:', error);
      setError('Failed to create certificate');
    }
  };

  const handleRevokeCertificate = async (certificateId: string) => {
    try {
      await superAdminService.revokeCertificate(certificateId, 'Administrative action');
      loadCertificates();
    } catch (error) {
      console.error('Error revoking certificate:', error);
      setError('Failed to revoke certificate');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExp = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExp <= 30 && daysUntilExp > 0;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          Certificate Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialog({ ...createDialog, open: true })}
          >
            Issue Certificate
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadCertificates}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Search certificates..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="revoked">Revoked</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="course_completion">Course Completion</MenuItem>
                  <MenuItem value="skill_assessment">Skill Assessment</MenuItem>
                  <MenuItem value="job_completion">Job Completion</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  label="Date Range"
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                >
                  <MenuItem value="">All Time</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading && <LinearProgress />}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Certificate</TableCell>
                  <TableCell>Recipient</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Issued Date</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {certificates.map((certificate) => (
                  <TableRow key={certificate.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getTypeIcon(certificate.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {certificate.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {certificate.verificationCode}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {certificate.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {certificate.userEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={certificate.type.replace('_', ' ').toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={getStatusIcon(certificate.status)}
                          label={certificate.status.toUpperCase()}
                          color={getStatusColor(certificate.status) as any}
                          size="small"
                        />
                        {isExpiringSoon(certificate.expiresAt) && (
                          <Tooltip title="Expires soon">
                            <Warning color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(certificate.issuedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(certificate.expiresAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewCertificate(certificate)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedCertificate(certificate);
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {certificates.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No certificates found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleViewCertificate(selectedCertificate!)}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon><Download /></ListItemIcon>
          <ListItemText>Download PDF</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon><Share /></ListItemIcon>
          <ListItemText>Share Certificate</ListItemText>
        </MenuItem>
        <Divider />
        {selectedCertificate?.status === 'active' && (
          <MenuItem onClick={() => handleRevokeCertificate(selectedCertificate.id)}>
            <ListItemIcon><Block color="error" /></ListItemIcon>
            <ListItemText>Revoke Certificate</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Certificate Details Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Certificate Details</Typography>
            <Box>
              <IconButton onClick={() => setDetailDialog(false)}>
                <MoreVert />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCertificate && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Certificate Preview */}
                <Grid item xs={12}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      position: 'relative'
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      CERTIFICATE OF ACHIEVEMENT
                    </Typography>
                    <Typography variant="h5" sx={{ my: 3 }}>
                      {selectedCertificate.title}
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Awarded to: {selectedCertificate.userName}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      {selectedCertificate.description}
                    </Typography>
                    <Typography variant="body2">
                      Issued: {formatDate(selectedCertificate.issuedAt)}
                    </Typography>
                    <Typography variant="caption" sx={{ position: 'absolute', bottom: 10, right: 20 }}>
                      Verification: {selectedCertificate.verificationCode}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Certificate Details */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Certificate Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip
                          label={selectedCertificate.status.toUpperCase()}
                          color={getStatusColor(selectedCertificate.status) as any}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Type</Typography>
                        <Typography variant="body1">
                          {selectedCertificate.type.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Issued Date</Typography>
                        <Typography variant="body1">{formatDate(selectedCertificate.issuedAt)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Expiry Date</Typography>
                        <Typography variant="body1">{formatDate(selectedCertificate.expiresAt)}</Typography>
                      </Grid>
                      {selectedCertificate.revokedAt && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Revoked Date</Typography>
                            <Typography variant="body1">{formatDate(selectedCertificate.revokedAt)}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Revoke Reason</Typography>
                            <Typography variant="body1">{selectedCertificate.revokeReason}</Typography>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Paper>
                </Grid>

                {/* Additional Metadata */}
                {selectedCertificate.metadata && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Additional Information
                      </Typography>
                      <Grid container spacing={2}>
                        {Object.entries(selectedCertificate.metadata).map(([key, value]) => (
                          <Grid item xs={6} key={key}>
                            <Typography variant="body2" color="text.secondary">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Typography>
                            <Typography variant="body1">{String(value)}</Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />}>
            Download PDF
          </Button>
          <Button variant="outlined" startIcon={<Share />}>
            Share
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Certificate Dialog */}
      <Dialog
        open={createDialog.open}
        onClose={() => setCreateDialog({ ...createDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Issue New Certificate</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="User ID or Email"
                value={createDialog.userId}
                onChange={(e) => setCreateDialog({ ...createDialog, userId: e.target.value })}
                placeholder="Enter user ID or email"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Certificate Type</InputLabel>
                <Select
                  value={createDialog.type}
                  label="Certificate Type"
                  onChange={(e) => setCreateDialog({ ...createDialog, type: e.target.value })}
                >
                  <MenuItem value="course_completion">Course Completion</MenuItem>
                  <MenuItem value="skill_assessment">Skill Assessment</MenuItem>
                  <MenuItem value="job_completion">Job Completion</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Certificate Title"
                value={createDialog.title}
                onChange={(e) => setCreateDialog({ ...createDialog, title: e.target.value })}
                placeholder="e.g., React Development Mastery"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={createDialog.description}
                onChange={(e) => setCreateDialog({ ...createDialog, description: e.target.value })}
                placeholder="Brief description of the achievement"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ ...createDialog, open: false })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateCertificate}
            disabled={!createDialog.userId || !createDialog.type || !createDialog.title}
          >
            Issue Certificate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateManagement;