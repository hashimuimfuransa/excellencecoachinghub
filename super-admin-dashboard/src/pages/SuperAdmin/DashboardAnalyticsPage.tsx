import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Chip
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  People,
  Work,
  School,
  Assessment,
  Refresh
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from '../../components/Charts/RechartsWrapper';
import { superAdminService, DashboardStats } from '../../services/superAdminService';

const DashboardAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate chart data from real stats
  const getUserRoleData = () => {
    if (!dashboardStats?.usersByRole) return [];
    
    const roleColors = {
      'job_seeker': '#8884d8',
      'employer': '#82ca9d', 
      'student': '#ffc658',
      'teacher': '#ff7300',
      'admin': '#8dd1e1',
      'super_admin': '#ff0000'
    };

    return Object.entries(dashboardStats.usersByRole).map(([role, count]) => ({
      name: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: roleColors[role as keyof typeof roleColors] || '#cccccc'
    }));
  };

  const getPlatformActivityData = () => {
    if (!dashboardStats) return [];
    
    return [
      { name: 'Total Users', value: dashboardStats.totalUsers, change: dashboardStats.monthlyGrowth.users },
      { name: 'Jobs Posted', value: dashboardStats.totalJobs, change: dashboardStats.monthlyGrowth.jobs },
      { name: 'Applications', value: dashboardStats.totalApplications, change: dashboardStats.monthlyGrowth.applications },
      { name: 'Interviews', value: dashboardStats.totalInterviews, change: 0 },
      { name: 'Certificates', value: dashboardStats.totalCertificates, change: 0 }
    ];
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await superAdminService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load dashboard analytics. Please try again.');
    } finally {
      setLoading(false);
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
                <TrendingUp color={trend > 0 ? 'success' : 'error'} fontSize="small" />
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading Dashboard Analytics...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            <Analytics sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
            Dashboard Analytics
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Comprehensive platform analytics and insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="1d">1 Day</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
              <MenuItem value="90d">90 Days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadAnalytics}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {getPlatformActivityData().map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={stat.name}
              value={stat.value}
              trend={stat.change}
              icon={<Analytics />}
              color="primary"
            />
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* System Health Status */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" sx={{ minWidth: 120 }}>
                    Overall Health:
                  </Typography>
                  <Chip 
                    label={dashboardStats?.systemHealth?.toUpperCase() || 'UNKNOWN'}
                    color={
                      dashboardStats?.systemHealth === 'excellent' ? 'success' :
                      dashboardStats?.systemHealth === 'good' ? 'primary' :
                      dashboardStats?.systemHealth === 'warning' ? 'warning' : 'error'
                    }
                    variant="filled"
                  />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {dashboardStats?.totalUsers.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Users
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {dashboardStats?.activeUsers.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Active Users
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {dashboardStats?.totalJobs.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Jobs
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {dashboardStats?.pendingApplications.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Pending Apps
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* User Roles Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Roles Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getUserRoleData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getUserRoleData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Application Trends */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Application Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jobApplicationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardAnalyticsPage;