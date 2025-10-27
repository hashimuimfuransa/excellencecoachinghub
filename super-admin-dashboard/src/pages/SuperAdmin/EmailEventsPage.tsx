import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  TextField,
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Badge,
  Tooltip,
  Alert
} from '@mui/material';
import { 
  Refresh as RefreshCw, 
  Mail, 
  Warning as AlertTriangle, 
  Check, 
  Mouse as MousePointer,
  Visibility as Eye,
  Close as X,
  Download,
  FilterList as Filter
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

interface EmailEvent {
  _id: string;
  email: string;
  event: string;
  timestamp: number;
  reason?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
}

interface EmailEventStats {
  delivered?: number;
  bounce?: number;
  open?: number;
  click?: number;
  spam_report?: number;
  unsubscribe?: number;
  dropped?: number;
  deferred?: number;
  processed?: number;
}

interface EmailEventsResponse {
  events: EmailEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: EmailEventStats;
}

const EmailEventsPage: React.FC = () => {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState<EmailEventStats>({});
  const [filters, setFilters] = useState({
    eventType: '',
    email: '',
    startDate: '',
    endDate: ''
  });
  const [socket, setSocket] = useState<Socket | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Event type configurations
  const eventConfig = {
    delivered: { color: 'bg-green-500', icon: Check, label: 'Delivered' },
    bounce: { color: 'bg-red-500', icon: X, label: 'Bounced' },
    open: { color: 'bg-blue-500', icon: Eye, label: 'Opened' },
    click: { color: 'bg-purple-500', icon: MousePointer, label: 'Clicked' },
    spam_report: { color: 'bg-orange-500', icon: AlertTriangle, label: 'Spam Report' },
    unsubscribe: { color: 'bg-gray-500', icon: X, label: 'Unsubscribed' },
    dropped: { color: 'bg-red-600', icon: X, label: 'Dropped' },
    deferred: { color: 'bg-yellow-500', icon: RefreshCw, label: 'Deferred' },
    processed: { color: 'bg-cyan-500', icon: Mail, label: 'Processed' }
  };

  // Setup Socket.IO for real-time updates
  useEffect(() => {
    const newSocket = io(API_BASE.replace('/api', ''));
    setSocket(newSocket);

    newSocket.on('emailEvent', (event: EmailEvent) => {
      console.log('Real-time email event received:', event);
      setEvents(prev => [event, ...prev.slice(0, 49)]); // Keep only 50 most recent
      toast.success(`New ${event.event} event for ${event.email}`);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        [event.event]: (prev[event.event as keyof EmailEventStats] || 0) + 1
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [API_BASE]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.eventType && { event: filters.eventType }),
        ...(filters.email && { email: filters.email }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`${API_BASE}/sendgrid/events?${queryParams}`);
      const data: { data: EmailEventsResponse } = await response.json();
      
      if (response.ok) {
        setEvents(data.data.events);
        setPagination(data.data.pagination);
        setStats(data.data.stats);
      } else {
        toast.error('Failed to fetch email events');
      }
    } catch (error) {
      console.error('Error fetching email events:', error);
      toast.error('Error fetching email events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [pagination.page, pagination.limit]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchEvents();
  };

  const clearFilters = () => {
    setFilters({
      eventType: '',
      email: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchEvents();
  };

  const exportEvents = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(filters.eventType && { event: filters.eventType }),
        ...(filters.email && { email: filters.email }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        limit: '10000' // Large limit for export
      });

      const response = await fetch(`${API_BASE}/sendgrid/events?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        // Convert to CSV
        const csvContent = [
          'Email,Event,Timestamp,Date,Reason,URL,User Agent,IP',
          ...data.data.events.map((event: EmailEvent) => 
            `"${event.email}","${event.event}",${event.timestamp},"${new Date(event.timestamp * 1000).toISOString()}","${event.reason || ''}","${event.url || ''}","${event.userAgent || ''}","${event.ip || ''}"`
          )
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `email-events-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Events exported successfully');
      }
    } catch (error) {
      console.error('Error exporting events:', error);
      toast.error('Error exporting events');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getEventBadge = (eventType: string) => {
    const config = eventConfig[eventType as keyof typeof eventConfig] || {
      color: 'default',
      icon: Mail,
      label: eventType
    };
    
    const IconComponent = config.icon;
    
    return (
      <Chip
        size="small"
        color={config.color as any}
        label={config.label}
        icon={<IconComponent style={{ fontSize: 14 }} />}
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Email Events Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time SendGrid email event tracking
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={exportEvents}
            variant="outlined"
            startIcon={<Download />}
          >
            Export CSV
          </Button>
          <Button
            onClick={() => fetchEvents()}
            disabled={loading}
            variant="contained"
            startIcon={<RefreshCw />}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(stats).map(([eventType, count]) => {
          const config = eventConfig[eventType as keyof typeof eventConfig];
          const IconComponent = config?.icon || Mail;
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={eventType}>
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {config?.label || eventType}
                      </Typography>
                      <Typography variant="h5" component="div">
                        {count}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: '50%',
                      bgcolor: config?.color === 'success' ? 'success.main' :
                               config?.color === 'error' ? 'error.main' :
                               config?.color === 'warning' ? 'warning.main' :
                               config?.color === 'info' ? 'info.main' : 'grey.500',
                      color: 'white'
                    }}>
                      <IconComponent />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Filter />
            <Typography variant="h6">Filters</Typography>
          </Box>
        </CardHeader>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={filters.eventType}
                  label="Event Type"
                  onChange={(e) => handleFilterChange('eventType', e.target.value)}
                >
                  <MenuItem value="">All Events</MenuItem>
                  {Object.entries(eventConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6} lg={2.4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Email address"
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={2.4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={2.4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={2.4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={applyFilters} variant="contained" size="small">
                  Apply
                </Button>
                <Button onClick={clearFilters} variant="outlined" size="small">
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <Typography variant="h6">Recent Email Events</Typography>
          <Typography variant="body2" color="text.secondary">
            Total: {pagination.total} events | Page {pagination.page} of {pagination.pages}
          </Typography>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <RefreshCw sx={{ mr: 2, animation: 'spin 1s linear infinite' }} />
              <Typography>Loading events...</Typography>
            </Box>
          ) : events.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No email events found</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event._id} hover>
                      <TableCell>
                        {getEventBadge(event.event)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {event.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatTimestamp(event.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {event.reason && (
                            <Typography variant="caption" color="error" display="block">
                              <strong>Reason:</strong> {event.reason}
                            </Typography>
                          )}
                          {event.url && (
                            <Typography variant="caption" color="primary" display="block">
                              <strong>URL:</strong> {event.url}
                            </Typography>
                          )}
                          {event.ip && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              <strong>IP:</strong> {event.ip}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} events
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  variant="outlined"
                  size="small"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  variant="outlined"
                  size="small"
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmailEventsPage;