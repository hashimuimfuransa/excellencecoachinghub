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
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Work,
  Assessment,
  Schedule,
  CheckCircle,
  BarChart,
  Timeline,
  PieChart,
  Download,
  DateRange,
  Visibility,
  Star,
  LocationOn,
  School
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    newApplicationsThisWeek: number;
    interviewsScheduled: number;
    hiredCandidates: number;
    averageTimeToHire: number;
    applicationConversionRate: number;
  };
  trends: {
    applications: Array<{ date: string; applications: number; interviews: number; hired: number }>;
    jobPerformance: Array<{ title: string; applications: number; views: number; conversionRate: number }>;
    candidateFlow: Array<{ stage: string; count: number; percentage: number }>;
  };
  demographics: {
    locations: Array<{ location: string; count: number; percentage: number }>;
    experience: Array<{ level: string; count: number; percentage: number }>;
    skills: Array<{ skill: string; demand: number; supply: number }>;
    sources: Array<{ source: string; count: number; percentage: number }>;
  };
}

const EmployerAnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('applications');

  // Mock data for demonstration
  const mockAnalytics: AnalyticsData = {
    overview: {
      totalJobs: 15,
      activeJobs: 8,
      totalApplications: 247,
      newApplicationsThisWeek: 18,
      interviewsScheduled: 12,
      hiredCandidates: 5,
      averageTimeToHire: 14,
      applicationConversionRate: 2.0
    },
    trends: {
      applications: [
        { date: '2023-11-01', applications: 12, interviews: 3, hired: 1 },
        { date: '2023-11-02', applications: 15, interviews: 4, hired: 0 },
        { date: '2023-11-03', applications: 8, interviews: 2, hired: 1 },
        { date: '2023-11-04', applications: 20, interviews: 5, hired: 0 },
        { date: '2023-11-05', applications: 18, interviews: 6, hired: 2 },
        { date: '2023-11-06', applications: 10, interviews: 3, hired: 0 },
        { date: '2023-11-07', applications: 14, interviews: 4, hired: 1 },
      ],
      jobPerformance: [
        { title: 'Frontend Developer', applications: 45, views: 234, conversionRate: 19.2 },
        { title: 'Backend Developer', applications: 38, views: 189, conversionRate: 20.1 },
        { title: 'UX Designer', applications: 32, views: 156, conversionRate: 20.5 },
        { title: 'DevOps Engineer', applications: 28, views: 98, conversionRate: 28.6 },
        { title: 'Data Analyst', applications: 24, views: 87, conversionRate: 27.6 }
      ],
      candidateFlow: [
        { stage: 'Applications', count: 247, percentage: 100 },
        { stage: 'Screening', count: 98, percentage: 39.7 },
        { stage: 'Interview', count: 42, percentage: 17.0 },
        { stage: 'Final Round', count: 18, percentage: 7.3 },
        { stage: 'Offer', count: 8, percentage: 3.2 },
        { stage: 'Hired', count: 5, percentage: 2.0 }
      ]
    },
    demographics: {
      locations: [
        { location: 'New York, NY', count: 67, percentage: 27.1 },
        { location: 'San Francisco, CA', count: 45, percentage: 18.2 },
        { location: 'Los Angeles, CA', count: 38, percentage: 15.4 },
        { location: 'Chicago, IL', count: 32, percentage: 13.0 },
        { location: 'Austin, TX', count: 28, percentage: 11.3 },
        { location: 'Other', count: 37, percentage: 15.0 }
      ],
      experience: [
        { level: '0-1 years', count: 52, percentage: 21.1 },
        { level: '1-3 years', count: 89, percentage: 36.0 },
        { level: '3-5 years', count: 67, percentage: 27.1 },
        { level: '5-10 years', count: 28, percentage: 11.3 },
        { level: '10+ years', count: 11, percentage: 4.5 }
      ],
      skills: [
        { skill: 'JavaScript', demand: 85, supply: 92 },
        { skill: 'React', demand: 78, supply: 67 },
        { skill: 'Python', demand: 72, supply: 78 },
        { skill: 'Node.js', demand: 65, supply: 54 },
        { skill: 'TypeScript', demand: 58, supply: 43 },
        { skill: 'AWS', demand: 52, supply: 38 }
      ],
      sources: [
        { source: 'Direct Application', count: 89, percentage: 36.0 },
        { source: 'Job Boards', count: 76, percentage: 30.8 },
        { source: 'Referrals', count: 45, percentage: 18.2 },
        { source: 'Social Media', count: 23, percentage: 9.3 },
        { source: 'Recruitment Agencies', count: 14, percentage: 5.7 }
      ]
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Using mock data for now
      setTimeout(() => {
        setAnalytics(mockAnalytics);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (!analytics) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your hiring performance and candidate insights
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 3 months</MenuItem>
                <MenuItem value="1y">Last year</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Download />}
            >
              Export Report
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Overview Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {analytics.overview.totalJobs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Jobs Posted
                  </Typography>
                </Box>
                <Work sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                <Typography variant="body2" color="success.main">
                  {analytics.overview.activeJobs} active
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {analytics.overview.totalApplications}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Applications
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.7 }} />
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +{analytics.overview.newApplicationsThisWeek} this week
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {analytics.overview.interviewsScheduled}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Interviews Scheduled
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                <Typography variant="body2" color="text.secondary">
                  Upcoming this week
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {analytics.overview.hiredCandidates}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Candidates Hired
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                <Typography variant="body2" color="text.secondary">
                  {formatPercentage(analytics.overview.applicationConversionRate)} conversion rate
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h3" color="primary.main" fontWeight="bold">
              {analytics.overview.averageTimeToHire}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Avg. Days to Hire
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(30 - analytics.overview.averageTimeToHire) / 30 * 100} 
              sx={{ mt: 1, height: 6, borderRadius: 3 }}
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h3" color="secondary.main" fontWeight="bold">
              {formatPercentage(analytics.overview.applicationConversionRate)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Conversion Rate
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={analytics.overview.applicationConversionRate * 10} 
              sx={{ mt: 1, height: 6, borderRadius: 3 }}
              color="secondary"
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h3" color="success.main" fontWeight="bold">
              {formatPercentage(analytics.trends.candidateFlow[2].percentage)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Interview Rate
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={analytics.trends.candidateFlow[2].percentage} 
              sx={{ mt: 1, height: 6, borderRadius: 3 }}
              color="success"
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h3" color="warning.main" fontWeight="bold">
              {formatPercentage(analytics.trends.candidateFlow[5].percentage)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Hire Rate
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={analytics.trends.candidateFlow[5].percentage * 10} 
              sx={{ mt: 1, height: 6, borderRadius: 3 }}
              color="warning"
            />
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Application Trends */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                Application Trends
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  label="Metric"
                >
                  <MenuItem value="applications">Applications</MenuItem>
                  <MenuItem value="interviews">Interviews</MenuItem>
                  <MenuItem value="hired">Hired</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trends.applications}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stackId="1"
                    stroke={theme.palette.primary.main}
                    fill={alpha(theme.palette.primary.main, 0.3)}
                    name="Applications"
                  />
                  <Area
                    type="monotone"
                    dataKey="interviews"
                    stackId="2"
                    stroke={theme.palette.secondary.main}
                    fill={alpha(theme.palette.secondary.main, 0.3)}
                    name="Interviews"
                  />
                  <Area
                    type="monotone"
                    dataKey="hired"
                    stackId="3"
                    stroke={theme.palette.success.main}
                    fill={alpha(theme.palette.success.main, 0.3)}
                    name="Hired"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Candidate Flow */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Candidate Flow
            </Typography>
            <Box>
              {analytics.trends.candidateFlow.map((stage, index) => (
                <Box key={stage.stage} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="medium">
                      {stage.stage}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" color="text.secondary">
                        {stage.count}
                      </Typography>
                      <Chip 
                        label={formatPercentage(stage.percentage)} 
                        size="small" 
                        color={index === 0 ? 'primary' : 'default'}
                      />
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stage.percentage}
                    sx={{ height: 8, borderRadius: 4 }}
                    color={index === 0 ? 'primary' : 'inherit'}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Job Performance */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Job Performance
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={analytics.trends.jobPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill={theme.palette.primary.main} name="Applications" />
                  <Bar dataKey="views" fill={theme.palette.secondary.main} name="Views" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Demographics */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Candidate Locations
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={analytics.demographics.locations}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="location"
                  >
                    {analytics.demographics.locations.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Skills Gap Analysis */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Skills Gap Analysis
            </Typography>
            <Grid container spacing={2}>
              {analytics.demographics.skills.map((skill) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={skill.skill}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      {skill.skill}
                    </Typography>
                    <Box mb={1}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          Demand
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {skill.demand}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={skill.demand}
                        sx={{ height: 6, borderRadius: 3 }}
                        color="primary"
                      />
                    </Box>
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          Supply
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {skill.supply}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={skill.supply}
                        sx={{ height: 6, borderRadius: 3 }}
                        color="secondary"
                      />
                    </Box>
                    <Box mt={1}>
                      <Chip
                        label={skill.demand > skill.supply ? 'High Demand' : 'Well Supplied'}
                        size="small"
                        color={skill.demand > skill.supply ? 'warning' : 'success'}
                      />
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EmployerAnalyticsPage;