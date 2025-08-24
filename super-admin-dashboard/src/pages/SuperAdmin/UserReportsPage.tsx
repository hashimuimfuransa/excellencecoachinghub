import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  TextField
} from '@mui/material';
import {
  Assessment,
  Download,
  Visibility,
  Print,
  Email,
  FilterList,
  DateRange,
  Person,
  TrendingUp,
  TrendingDown,
  Warning,
  Error,
  CheckCircle,
  Block,
  Refresh,
  Schedule,
  Analytics,
  PieChart,
  BarChart
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from '../../components/Charts/RechartsWrapper';
import { superAdminService } from '../../services/superAdminService';

interface UserReport {
  id: string;
  type: 'activity' | 'performance' | 'engagement' | 'security' | 'compliance';
  title: string;
  description: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
  generatedBy: string;
  dataPoints: number;
  insights: string[];
  downloadUrl?: string;
}

interface ReportMetrics {
  totalReports: number;
  activeReports: number;
  scheduledReports: number;
  reportsByType: Array<{ type: string; count: number }>;
  recentActivity: Array<{ date: string; reports: number }>;
}

const UserReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReports, setTotalReports] = useState(0);
  
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalReports: 0,
    activeReports: 0,
    scheduledReports: 0,
    reportsByType: [],
    recentActivity: []
  });

  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateRange: '30d'
  });

  const [newReport, setNewReport] = useState({
    type: 'activity',
    title: '',
    description: '',
    scheduled: false,
    frequency: 'weekly'
  });

  useEffect(() => {
    loadReports();
    loadMetrics();
  }, [page, rowsPerPage, filters]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockReports: UserReport[] = [
        {
          id: '1',
          type: 'activity',
          title: 'User Activity Report',
          description: 'Weekly user activity summary including logins, job searches, and applications',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          generatedBy: 'System',
          dataPoints: 15420,
          insights: [
            'User activity increased by 15% this week',
            'Peak activity hours: 9-11 AM and 2-4 PM',
            'Mobile usage accounts for 65% of total activity'
          ],
          downloadUrl: '/reports/activity-weekly.pdf'
        },
        {
          id: '2',
          type: 'performance',
          title: 'Platform Performance Report',
          description: 'System performance metrics and user experience analysis',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          generatedBy: 'Admin User',
          dataPoints: 8934,
          insights: [
            'Average response time: 1.2 seconds',
            'System uptime: 99.8%',
            'User satisfaction score: 4.7/5'
          ],
          downloadUrl: '/reports/performance-monthly.pdf'
        },
        {
          id: '3',
          type: 'engagement',
          title: 'User Engagement Analysis',
          description: 'Deep dive into user engagement patterns and retention metrics',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          generatedBy: 'System',
          dataPoints: 0,
          insights: []
        },
        {
          id: '4',
          type: 'security',
          title: 'Security Audit Report',
          description: 'Comprehensive security analysis and threat assessment',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          generatedBy: 'Security Team',
          dataPoints: 2847,
          insights: [
            'No critical security issues detected',
            '3 minor vulnerabilities patched',
            'Authentication success rate: 98.5%'
          ],
          downloadUrl: '/reports/security-audit.pdf'
        },
        {
          id: '5',
          type: 'compliance',
          title: 'GDPR Compliance Report',
          description: 'Data privacy and compliance status report',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          generatedBy: 'Compliance Officer',
          dataPoints: 15420,
          insights: [
            'Full GDPR compliance maintained',
            '12 data deletion requests processed',
            'Privacy policy acceptance rate: 100%'
          ],
          downloadUrl: '/reports/gdpr-compliance.pdf'
        }
      ];

      const filteredReports = mockReports.filter(report => {
        return (!filters.type || report.type === filters.type) &&
               (!filters.status || report.status === filters.status);
      });

      setReports(filteredReports);
      setTotalReports(filteredReports.length);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const mockMetrics: ReportMetrics = {
        totalReports: 127,
        activeReports: 8,
        scheduledReports: 15,
        reportsByType: [
          { type: 'Activity', count: 42 },
          { type: 'Performance', count: 35 },
          { type: 'Engagement', count: 28 },
          { type: 'Security', count: 12 },
          { type: 'Compliance', count: 10 }
        ],
        recentActivity: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reports: Math.floor(Math.random() * 10) + 1
        })).reverse()
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      console.log('Generating report:', newReport);
      // Add API call here
      loadReports();
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'pending': return <Schedule />;
      case 'failed': return <Error />;
      default: return <Block />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'activity': return 'primary';
      case 'performance': return 'info';
      case 'engagement': return 'success';
      case 'security': return 'error';
      case 'compliance': return 'warning';
      default: return 'default';
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend > 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            <Assessment sx={{ mr: 2, verticalAlign: 'middle' }} />
            User Reports
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Analytics />}
              onClick={() => setCurrentTab(1)}
            >
              Generate Report
            </Button>
            <Button variant="outlined" startIcon={<Download />}>
              Export All
            </Button>
            <IconButton onClick={loadReports} disabled={loading}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="h6" color="text.secondary">
          Generate, schedule, and manage comprehensive user reports
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Reports"
            value={metrics.totalReports}
            icon={<Assessment color="primary" />}
            color="primary"
            trend={8.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Reports"
            value={metrics.activeReports}
            icon={<CheckCircle color="success" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Scheduled Reports"
            value={metrics.scheduledReports}
            icon={<Schedule color="warning" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="This Month"
            value={42}
            subtitle="Reports generated"
            icon={<BarChart color="info" />}
            color="info"
            trend={15.2}
          />
        </Grid>
      </Grid>

      {/* Report Activity Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Report Generation Activity (Last 30 Days)
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Line 
                  type="monotone" 
                  dataKey="reports" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
        >
          <Tab label="All Reports" />
          <Tab label="Generate New Report" />
          <Tab label="Scheduled Reports" />
          <Tab label="Report Analytics" />
        </Tabs>

        {/* All Reports Tab */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Filters */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    label="Report Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="activity">Activity</MenuItem>
                    <MenuItem value="performance">Performance</MenuItem>
                    <MenuItem value="engagement">Engagement</MenuItem>
                    <MenuItem value="security">Security</MenuItem>
                    <MenuItem value="compliance">Compliance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    label="Date Range"
                  >
                    <MenuItem value="7d">Last 7 Days</MenuItem>
                    <MenuItem value="30d">Last 30 Days</MenuItem>
                    <MenuItem value="90d">Last 90 Days</MenuItem>
                    <MenuItem value="1y">Last Year</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setFilters({ type: '', status: '', dateRange: '30d' })}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>

            {/* Reports Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Generated</TableCell>
                    <TableCell>Data Points</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {report.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {report.description}
                          </Typography>
                          {report.insights.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="primary.main">
                                Key Insights: {report.insights[0]}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.type.toUpperCase()}
                          size="small"
                          color={getTypeColor(report.type) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(report.status)}
                          label={report.status.toUpperCase()}
                          size="small"
                          color={getStatusColor(report.status) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          by {report.generatedBy}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {report.dataPoints > 0 ? report.dataPoints.toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Report">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {report.downloadUrl && (
                            <Tooltip title="Download">
                              <IconButton size="small">
                                <Download />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Share">
                            <IconButton size="small">
                              <Email />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalReports}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Box>
        )}

        {/* Generate New Report Tab */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Create New Report
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Report Type</InputLabel>
                          <Select
                            value={newReport.type}
                            onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                            label="Report Type"
                          >
                            <MenuItem value="activity">User Activity Report</MenuItem>
                            <MenuItem value="performance">Platform Performance</MenuItem>
                            <MenuItem value="engagement">Engagement Analysis</MenuItem>
                            <MenuItem value="security">Security Audit</MenuItem>
                            <MenuItem value="compliance">Compliance Report</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Report Title"
                          value={newReport.title}
                          onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          value={newReport.description}
                          onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleGenerateReport}
                          startIcon={<Analytics />}
                        >
                          Generate Report
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Report Templates
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[
                        { type: 'activity', name: 'Weekly User Activity', desc: 'User logins, searches, applications' },
                        { type: 'performance', name: 'System Performance', desc: 'Response times, uptime, errors' },
                        { type: 'engagement', name: 'User Engagement', desc: 'Retention, session duration, features' },
                        { type: 'security', name: 'Security Audit', desc: 'Threats, vulnerabilities, compliance' }
                      ].map((template) => (
                        <Paper key={template.type} sx={{ p: 2, cursor: 'pointer' }} 
                               onClick={() => setNewReport({ 
                                 ...newReport, 
                                 type: template.type,
                                 title: template.name,
                                 description: template.desc
                               })}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {template.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {template.desc}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Scheduled Reports Tab */}
        {currentTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Scheduled reports will be automatically generated based on the configured frequency.
            </Alert>
            <Typography variant="h6" gutterBottom>
              Coming Soon: Scheduled Reports
            </Typography>
            <Typography variant="body1" color="textSecondary">
              This feature will allow you to schedule automatic report generation.
            </Typography>
          </Box>
        )}

        {/* Report Analytics Tab */}
        {currentTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Reports by Type
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {metrics.reportsByType.map((item, index) => (
                        <Box key={item.type} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body2">{item.type}</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {item.count}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Report Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.main">
                            {metrics.totalReports}
                          </Typography>
                          <Typography variant="caption">Total Reports</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            98.5%
                          </Typography>
                          <Typography variant="caption">Success Rate</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default UserReportsPage;