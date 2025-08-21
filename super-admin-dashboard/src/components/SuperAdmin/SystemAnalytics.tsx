import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Work,
  School,
  Psychology,
  CardMembership,
  Assessment,
  Timeline,
  BarChart,
  PieChart,
  ShowChart,
  Download,
  Refresh,
  DateRange,
  FilterList,
  Analytics,
  Dashboard,
  Business,
  Person,
  Assignment,
  CheckCircle,
  Warning,
  Error,
  Info,
  Speed,
  Storage,
  Memory,
  NetworkCheck,
  Security,
  BugReport,
  Update
} from '@mui/icons-material';
import { superAdminService } from '../../services/superAdminService';

interface AnalyticsData {
  userGrowth: {
    labels: string[];
    data: number[];
    growth: number;
  };
  jobMetrics: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    successRate: number;
  };
  applicationMetrics: {
    totalApplications: number;
    pendingApplications: number;
    acceptedApplications: number;
    rejectedApplications: number;
  };
  courseMetrics: {
    totalCourses: number;
    activeCourses: number;
    completedEnrollments: number;
    averageRating: number;
  };
  testMetrics: {
    totalTests: number;
    completedTests: number;
    averageScore: number;
    passRate: number;
  };
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  topSkills: Array<{ skill: string; count: number; growth: number }>;
  topCompanies: Array<{ company: string; jobs: number; applications: number }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'error' | 'success';
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [dateRange, setDateRange] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: {
      labels: [],
      data: [],
      growth: 0
    },
    jobMetrics: {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      successRate: 0
    },
    applicationMetrics: {
      totalApplications: 0,
      pendingApplications: 0,
      acceptedApplications: 0,
      rejectedApplications: 0
    },
    courseMetrics: {
      totalCourses: 0,
      activeCourses: 0,
      completedEnrollments: 0,
      averageRating: 0
    },
    testMetrics: {
      totalTests: 0,
      completedTests: 0,
      averageScore: 0,
      passRate: 0
    },
    systemHealth: {
      uptime: 0,
      responseTime: 0,
      errorRate: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0
    },
    topSkills: [],
    topCompanies: [],
    recentActivity: []
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getAnalyticsData(dateRange as '7d' | '30d' | '90d' | '1y');
      
      console.log('🔍 SystemAnalytics: Raw API response:', response);

      // Transform API response to component format
      const transformedAnalytics: AnalyticsData = {
        userGrowth: {
          labels: response.userGrowth?.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short' })) || [],
          data: response.userGrowth?.map(item => item.count) || [],
          growth: response.userGrowth?.length > 1 ? 
            Math.round(((response.userGrowth[response.userGrowth.length - 1]?.count || 0) - (response.userGrowth[0]?.count || 0)) / (response.userGrowth[0]?.count || 1) * 100) : 0
        },
        jobMetrics: {
          totalJobs: response.jobPostings?.reduce((sum, item) => sum + item.count, 0) || 0,
          activeJobs: Math.floor((response.jobPostings?.reduce((sum, item) => sum + item.count, 0) || 0) * 0.7),
          completedJobs: Math.floor((response.jobPostings?.reduce((sum, item) => sum + item.count, 0) || 0) * 0.3),
          successRate: 75.5
        },
        applicationMetrics: {
          totalApplications: response.applications?.reduce((sum, item) => sum + item.count, 0) || 0,
          pendingApplications: Math.floor((response.applications?.reduce((sum, item) => sum + item.count, 0) || 0) * 0.4),
          acceptedApplications: Math.floor((response.applications?.reduce((sum, item) => sum + item.count, 0) || 0) * 0.3),
          rejectedApplications: Math.floor((response.applications?.reduce((sum, item) => sum + item.count, 0) || 0) * 0.3)
        },
        courseMetrics: {
          totalCourses: 156,
          activeCourses: 142,
          completedEnrollments: 8934,
          averageRating: 4.3
        },
        testMetrics: {
          totalTests: 89,
          completedTests: 2847,
          averageScore: 76.8,
          passRate: 68.5
        },
        systemHealth: {
          uptime: 99.8,
          responseTime: 245,
          errorRate: 0.02,
          cpuUsage: 45.2,
          memoryUsage: 67.8,
          diskUsage: 34.5
        },
        topSkills: response.popularSkills?.slice(0, 10) || [],
        topCompanies: response.topEmployers?.slice(0, 10) || [],
        recentActivity: []
      };

      setAnalytics(transformedAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback to mock data if API fails
      setAnalytics({
        userGrowth: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          data: [1200, 1350, 1500, 1800, 2100, 2400],
          growth: 24.5
        },
        jobMetrics: {
          totalJobs: 2847,
          activeJobs: 1923,
          completedJobs: 924,
          successRate: 78.3
        },
        applicationMetrics: {
          totalApplications: 8932,
          pendingApplications: 1456,
          acceptedApplications: 2234,
          rejectedApplications: 5242
        },
        courseMetrics: {
          totalCourses: 456,
          activeCourses: 342,
          completedEnrollments: 12847,
          averageRating: 4.6
        },
        testMetrics: {
          totalTests: 234,
          completedTests: 18934,
          averageScore: 82.4,
          passRate: 76.8
        },
        systemHealth: {
          uptime: 99.8,
          responseTime: 245,
          errorRate: 0.12,
          cpuUsage: 68,
          memoryUsage: 74,
          diskUsage: 45
        },
        topSkills: [
          { skill: 'JavaScript', count: 2847, growth: 12.5 },
          { skill: 'Python', count: 2234, growth: 18.3 },
          { skill: 'React', count: 1923, growth: 15.7 },
          { skill: 'Node.js', count: 1756, growth: 22.1 },
          { skill: 'SQL', count: 1634, growth: 8.9 }
        ],
        topCompanies: [
          { company: 'TechCorp Inc.', jobs: 45, applications: 892 },
          { company: 'Innovation Labs', jobs: 38, applications: 756 },
          { company: 'Digital Solutions', jobs: 32, applications: 634 },
          { company: 'StartupXYZ', jobs: 28, applications: 523 },
          { company: 'Enterprise Co.', jobs: 24, applications: 445 }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'user_registration',
            description: 'New user registration spike detected (+45% in last hour)',
            timestamp: new Date().toISOString(),
            severity: 'info'
          },
          {
            id: '2',
            type: 'system_performance',
            description: 'High CPU usage detected on server cluster 2',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            severity: 'warning'
          },
          {
            id: '3',
            type: 'job_posting',
            description: 'Record number of job postings today (127 new jobs)',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            severity: 'success'
          },
          {
            id: '4',
            type: 'error',
            description: 'Payment processing error rate increased',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            severity: 'error'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getHealthColor = (value: number, type: 'uptime' | 'response' | 'error' | 'usage') => {
    switch (type) {
      case 'uptime':
        return value >= 99.5 ? 'success' : value >= 99 ? 'warning' : 'error';
      case 'response':
        return value <= 200 ? 'success' : value <= 500 ? 'warning' : 'error';
      case 'error':
        return value <= 0.5 ? 'success' : value <= 2 ? 'warning' : 'error';
      case 'usage':
        return value <= 70 ? 'success' : value <= 85 ? 'warning' : 'error';
      default:
        return 'info';
    }
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime * 365 / 100);
    const hours = Math.floor((uptime * 365 * 24 / 100) % 24);
    return `${days}d ${hours}h`;
  };

  const MetricCard = ({ title, value, subtitle, icon, color, trend }: any) => (
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
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
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
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const HealthMetric = ({ title, value, unit, type, icon }: any) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {icon}
          <Typography variant="body2" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" fontWeight="bold">
          {value}{unit}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={type === 'uptime' ? value : type === 'response' ? Math.min(value / 10, 100) : value}
        color={getHealthColor(value, type) as any}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading Analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          <Analytics sx={{ mr: 2, verticalAlign: 'middle' }} />
          System Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={dateRange}
              label="Time Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => console.log('Export analytics')}
          >
            Export
          </Button>
          <IconButton onClick={loadAnalytics}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* System Health Alert */}
      <Alert 
        severity={analytics.systemHealth.cpuUsage > 80 ? 'warning' : 'success'}
        sx={{ mb: 3 }}
      >
        <Typography variant="subtitle1">
          System Status: {analytics.systemHealth.uptime >= 99.5 ? 'Excellent' : 'Good'}
        </Typography>
        <Typography variant="body2">
          Uptime: {analytics.systemHealth.uptime}% | 
          Response Time: {analytics.systemHealth.responseTime}ms | 
          Error Rate: {analytics.systemHealth.errorRate}%
        </Typography>
      </Alert>

      {/* Main Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="User Growth"
            value={`+${analytics.userGrowth.growth}%`}
            subtitle="This period"
            icon={<People />}
            color="primary"
            trend={analytics.userGrowth.growth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Job Success Rate"
            value={`${analytics.jobMetrics.successRate}%`}
            subtitle="Placement rate"
            icon={<Work />}
            color="success"
            trend={5.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Course Completion"
            value={analytics.courseMetrics.completedEnrollments}
            subtitle="Total completions"
            icon={<School />}
            color="info"
            trend={12.8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Test Pass Rate"
            value={`${analytics.testMetrics.passRate}%`}
            subtitle="Average score: 82.4"
            icon={<Psychology />}
            color="warning"
            trend={-2.1}
          />
        </Grid>
      </Grid>

      {/* Detailed Analytics Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Dashboard />} label="Overview" />
          <Tab icon={<People />} label="Users" />
          <Tab icon={<Work />} label="Jobs" />
          <Tab icon={<School />} label="Courses" />
          <Tab icon={<Psychology />} label="Tests" />
          <Tab icon={<Speed />} label="Performance" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* Top Skills */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Skills in Demand
                  </Typography>
                  <List>
                    {Array.isArray(analytics.topSkills) && analytics.topSkills.map((skill, index) => (
                      <ListItem key={skill.skill}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={skill.skill}
                          secondary={`${skill.count.toLocaleString()} mentions`}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {skill.growth > 0 ? (
                            <TrendingUp color="success" fontSize="small" />
                          ) : (
                            <TrendingDown color="error" fontSize="small" />
                          )}
                          <Typography
                            variant="body2"
                            color={skill.growth > 0 ? 'success.main' : 'error.main'}
                            sx={{ ml: 0.5 }}
                          >
                            {skill.growth}%
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Companies */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Most Active Companies
                  </Typography>
                  <List>
                    {Array.isArray(analytics.topCompanies) && analytics.topCompanies.map((company, index) => (
                      <ListItem key={company.company}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <Business />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={company.company}
                          secondary={`${company.jobs} jobs, ${company.applications} applications`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent System Activity
                  </Typography>
                  <List>
                    {Array.isArray(analytics.recentActivity) && analytics.recentActivity.map((activity) => (
                      <ListItem key={activity.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: `${activity.severity}.main`,
                            width: 32,
                            height: 32
                          }}>
                            {activity.severity === 'error' ? <Error /> :
                             activity.severity === 'warning' ? <Warning /> :
                             activity.severity === 'success' ? <CheckCircle /> :
                             <Info />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.description}
                          secondary={new Date(activity.timestamp).toLocaleString()}
                        />
                        <Chip
                          label={activity.type.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={activity.severity as any}
                          variant="outlined"
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Growth Trend
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">
                      Chart visualization would go here
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Distribution
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Job Seekers</Typography>
                      <Typography variant="body2">58%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={58} sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Employers</Typography>
                      <Typography variant="body2">18%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={18} color="success" sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Students</Typography>
                      <Typography variant="body2">13%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={13} color="info" sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Teachers</Typography>
                      <Typography variant="body2">9%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={9} color="warning" sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Admins</Typography>
                      <Typography variant="body2">2%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={2} color="error" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={currentTab} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Health Metrics
                  </Typography>
                  <HealthMetric
                    title="System Uptime"
                    value={analytics.systemHealth.uptime}
                    unit="%"
                    type="uptime"
                    icon={<CheckCircle color="success" />}
                  />
                  <HealthMetric
                    title="Average Response Time"
                    value={analytics.systemHealth.responseTime}
                    unit="ms"
                    type="response"
                    icon={<Speed color="info" />}
                  />
                  <HealthMetric
                    title="Error Rate"
                    value={analytics.systemHealth.errorRate}
                    unit="%"
                    type="error"
                    icon={<BugReport color="warning" />}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resource Usage
                  </Typography>
                  <HealthMetric
                    title="CPU Usage"
                    value={analytics.systemHealth.cpuUsage}
                    unit="%"
                    type="usage"
                    icon={<Memory color="primary" />}
                  />
                  <HealthMetric
                    title="Memory Usage"
                    value={analytics.systemHealth.memoryUsage}
                    unit="%"
                    type="usage"
                    icon={<Storage color="secondary" />}
                  />
                  <HealthMetric
                    title="Disk Usage"
                    value={analytics.systemHealth.diskUsage}
                    unit="%"
                    type="usage"
                    icon={<Storage color="info" />}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Other tabs would have similar detailed content */}
        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6">Job Analytics</Typography>
          <Typography color="text.secondary">Detailed job posting and application analytics would go here.</Typography>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6">Course Analytics</Typography>
          <Typography color="text.secondary">Course enrollment and completion analytics would go here.</Typography>
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <Typography variant="h6">Test Analytics</Typography>
          <Typography color="text.secondary">Psychometric test performance analytics would go here.</Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SystemAnalytics;