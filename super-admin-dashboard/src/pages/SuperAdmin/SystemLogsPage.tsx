import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Timeline,
  Search,
  FilterList,
  Download,
  Refresh,
  Error,
  Warning,
  Info,
  CheckCircle,
  ExpandMore,
  Delete,
  Clear
} from '@mui/icons-material';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  category: string;
  message: string;
  details?: string;
  userId?: string;
  ip?: string;
}

const SystemLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [searchTerm, levelFilter, categoryFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Mock data - replace with real API call
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: '2024-01-20T15:30:00Z',
          level: 'error',
          category: 'Authentication',
          message: 'Failed login attempt',
          details: 'Invalid credentials provided for user john.doe@example.com',
          userId: 'user123',
          ip: '192.168.1.100'
        },
        {
          id: '2',
          timestamp: '2024-01-20T15:25:00Z',
          level: 'warning',
          category: 'Database',
          message: 'Slow query detected',
          details: 'Query took 5.2 seconds to execute: SELECT * FROM jobs WHERE...',
          ip: '10.0.0.1'
        },
        {
          id: '3',
          timestamp: '2024-01-20T15:20:00Z',
          level: 'info',
          category: 'User Management',
          message: 'New user registered',
          details: 'User jane.smith@company.com successfully registered as Job Seeker',
          userId: 'user124'
        },
        {
          id: '4',
          timestamp: '2024-01-20T15:15:00Z',
          level: 'info',
          category: 'Jobs',
          message: 'Job posted',
          details: 'New job "Senior Developer" posted by TechCorp Inc.',
          userId: 'employer1'
        },
        {
          id: '5',
          timestamp: '2024-01-20T15:10:00Z',
          level: 'debug',
          category: 'API',
          message: 'API endpoint accessed',
          details: 'GET /api/jobs - Response time: 120ms',
          ip: '203.0.113.0'
        }
      ];
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'info': return <Info color="info" />;
      case 'debug': return <CheckCircle color="action" />;
      default: return <Info />;
    }
  };

  const clearLogs = async () => {
    try {
      // Implement log clearing
      setLogs([]);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const exportLogs = () => {
    const logData = logs.map(log => ({
      timestamp: log.timestamp,
      level: log.level,
      category: log.category,
      message: log.message,
      details: log.details,
      userId: log.userId,
      ip: log.ip
    }));
    
    const dataStr = JSON.stringify(logData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !levelFilter || log.level === levelFilter;
    const matchesCategory = !categoryFilter || log.category === categoryFilter;
    
    return matchesSearch && matchesLevel && matchesCategory;
  });

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading System Logs...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <Timeline sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          System Logs
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Monitor system activity and troubleshoot issues
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {logs.filter(l => l.level === 'error').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Errors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {logs.filter(l => l.level === 'warning').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Warnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {logs.filter(l => l.level === 'info').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Info
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4">
                {logs.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Entries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  label="Level"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="debug">Debug</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Authentication">Authentication</MenuItem>
                  <MenuItem value="Database">Database</MenuItem>
                  <MenuItem value="API">API</MenuItem>
                  <MenuItem value="User Management">User Management</MenuItem>
                  <MenuItem value="Jobs">Jobs</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={exportLogs}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadLogs}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Clear />}
                  onClick={clearLogs}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Logs ({filteredLogs.length})
          </Typography>
          
          {filteredLogs.length === 0 ? (
            <Alert severity="info">
              No logs found matching the current filters.
            </Alert>
          ) : (
            <List>
              {filteredLogs.map((log, index) => (
                <Accordion 
                  key={log.id}
                  expanded={expandedLog === log.id}
                  onChange={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                      <Box sx={{ mr: 2 }}>
                        {getLevelIcon(log.level)}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ mr: 2 }}>
                            {log.message}
                          </Typography>
                          <Chip
                            label={log.level}
                            size="small"
                            color={getLevelColor(log.level) as any}
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={log.category}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {new Date(log.timestamp).toLocaleString()}
                          {log.ip && ` • ${log.ip}`}
                          {log.userId && ` • User: ${log.userId}`}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {log.details && (
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                          {log.details}
                        </Typography>
                      </Paper>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default SystemLogsPage;