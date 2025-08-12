import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Avatar,
  Rating,
  Divider
} from '@mui/material';
import {
  Search,
  MoreVert,
  Reply,
  CheckCircle,
  Schedule,
  PriorityHigh,
  Support,
  Feedback,
  Star,
  Person,
  Email,
  Phone,
  Refresh,
  FilterList
} from '@mui/icons-material';

import { supportService, ISupportTicket, IFeedback, SupportStats } from '../../services/supportService';

const SupportFeedback: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [tickets, setTickets] = useState<ISupportTicket[]>([]);
  const [feedback, setFeedback] = useState<IFeedback[]>([]);
  const [supportStats, setSupportStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Menu and dialog states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');

  // Load support data
  const loadSupportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [ticketsResponse, feedbackResponse, statsResponse] = await Promise.all([
        supportService.getAllTickets({
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined
        }),
        supportService.getAllFeedback({
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm
        }),
        supportService.getSupportStats()
      ]);

      setTickets(ticketsResponse.tickets);
      setFeedback(feedbackResponse.feedback);
      setSupportStats(statsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load support data');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, priorityFilter, currentTab]);

  useEffect(() => {
    loadSupportData();
  }, [loadSupportData]);

  // Filter tickets
  const getFilteredTickets = () => {
    let filtered = tickets || [];

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    return filtered;
  };

  // Filter feedback
  const getFilteredFeedback = () => {
    let filtered = feedback || [];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.comment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredData = currentTab === 0 ? (getFilteredTickets() || []) : (getFilteredFeedback() || []);
  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle menu
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  // Handle actions
  const handleViewItem = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleRespondToTicket = () => {
    setResponseDialogOpen(true);
    handleMenuClose();
  };

  const handleUpdateTicketStatus = async (status: string) => {
    if (selectedItem) {
      try {
        await supportService.updateTicketStatus(selectedItem.id, { status: status as any });
        setSuccess(`Ticket ${status === 'resolved' ? 'resolved' : 'updated'} successfully`);
        loadSupportData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update ticket');
      }
    }
    handleMenuClose();
  };

  const handleSendResponse = async () => {
    if (selectedItem && responseText.trim()) {
      try {
        await supportService.updateTicketStatus(selectedItem.id, {
          status: 'in-progress',
          response: responseText
        });
        setSuccess('Response sent successfully');
        setResponseText('');
        setResponseDialogOpen(false);
        loadSupportData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send response');
      }
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'in-progress':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Use statistics from API or calculate from current data
  const openTickets = supportStats?.tickets.open || (tickets || []).filter(t => t.status === 'open').length;
  const inProgressTickets = supportStats?.tickets.inProgress || (tickets || []).filter(t => t.status === 'in-progress').length;
  const resolvedTickets = supportStats?.tickets.resolved || (tickets || []).filter(t => t.status === 'resolved').length;
  const averageRating = supportStats?.feedback.averageRating || ((feedback || []).length > 0 ? (feedback || []).reduce((sum, f) => sum + f.rating, 0) / (feedback || []).length : 0);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const SupportTicketsTab = () => (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Schedule color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{openTickets}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open Tickets
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Support color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{inProgressTickets}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{resolvedTickets}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resolved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PriorityHigh color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{tickets.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tickets
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search tickets..."
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                label="Priority"
              >
                <MenuItem value="all">All Priority</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setPage(0);
              }}
            >
              Clear
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredData.length} tickets
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Tickets Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {ticket.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{ticket.user}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ticket.userEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={ticket.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.priority}
                        color={getPriorityColor(ticket.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, ticket)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );

  const FeedbackTab = () => (
    <Box>
      {/* Feedback Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Feedback color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{supportStats?.feedback.total || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Feedback
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Star color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{averageRating.toFixed(1)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{supportStats?.feedback.positive || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Positive Reviews
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PriorityHigh color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{supportStats?.feedback.flagged || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Flagged Reviews
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search feedback..."
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
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setSearchTerm('');
                setPage(0);
              }}
            >
              Clear
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredData.length} reviews
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Feedback Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Course/Category</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No feedback found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {item.user.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{item.user}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.userEmail}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{item.course}</Typography>
                        <Chip label={item.category} size="small" />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Rating value={item.rating} readOnly size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {item.comment.length > 100
                          ? `${item.comment.substring(0, 100)}...`
                          : item.comment
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>
                      {item.flagged ? (
                        <Chip label="Flagged" color="error" size="small" />
                      ) : (
                        <Chip label="Normal" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, item)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Support & Feedback
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage user support tickets and platform feedback.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => {
            setCurrentTab(newValue);
            setPage(0);
            setSearchTerm('');
          }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`Support Tickets (${supportStats?.tickets.total || 0})`} />
          <Tab label={`User Feedback (${supportStats?.feedback.total || 0})`} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {currentTab === 0 && <SupportTicketsTab />}
        {currentTab === 1 && <FeedbackTab />}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewItem}>
          <Person sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {currentTab === 0 && selectedItem && (
          <>
            <MenuItem onClick={handleRespondToTicket}>
              <Reply sx={{ mr: 1 }} />
              Respond
            </MenuItem>
            {selectedItem.status !== 'resolved' && (
              <MenuItem onClick={() => handleUpdateTicketStatus('resolved')}>
                <CheckCircle sx={{ mr: 1 }} />
                Mark Resolved
              </MenuItem>
            )}
            {selectedItem.status === 'open' && (
              <MenuItem onClick={() => handleUpdateTicketStatus('in-progress')}>
                <Schedule sx={{ mr: 1 }} />
                Mark In Progress
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentTab === 0 ? 'Ticket Details' : 'Feedback Details'}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ pt: 2 }}>
              {currentTab === 0 ? (
                // Ticket details
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6">{selectedItem.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Ticket ID: {selectedItem.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>User:</strong> {selectedItem.user}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {selectedItem.userEmail}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Category:</strong> {selectedItem.category}</Typography>
                    <Typography variant="body2"><strong>Priority:</strong>
                      <Chip
                        label={selectedItem.priority}
                        color={getPriorityColor(selectedItem.priority)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Status:</strong>
                      <Chip
                        label={selectedItem.status}
                        color={getStatusColor(selectedItem.status)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Assigned to:</strong> {selectedItem.assignedTo}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2"><strong>Description:</strong></Typography>
                    <Typography variant="body2" sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      {selectedItem.description}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Created:</strong> {formatDate(selectedItem.createdAt)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Last Updated:</strong> {formatDate(selectedItem.updatedAt)}</Typography>
                  </Grid>
                </Grid>
              ) : (
                // Feedback details
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ mr: 2 }}>
                        {selectedItem.user.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{selectedItem.user}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedItem.userEmail}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Course:</strong> {selectedItem.course}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Category:</strong> {selectedItem.category}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Rating:</strong></Typography>
                    <Rating value={selectedItem.rating} readOnly />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Helpful votes:</strong> {selectedItem.helpful}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2"><strong>Comment:</strong></Typography>
                    <Typography variant="body2" sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      {selectedItem.comment}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2"><strong>Submitted:</strong> {formatDate(selectedItem.createdAt)}</Typography>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onClose={() => setResponseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Respond to Ticket</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Responding to: <strong>{selectedItem?.title}</strong>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Response"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Type your response here..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendResponse}
            disabled={!responseText.trim()}
          >
            Send Response
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupportFeedback;
