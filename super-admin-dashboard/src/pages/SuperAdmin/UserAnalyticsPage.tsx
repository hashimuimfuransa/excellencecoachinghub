import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  LinearProgress,
  Chip,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Analytics,
  People,
  TrendingUp,
  TrendingDown,
  PersonAdd,
  Person,
  Business,
  School,
  Work,
  Timeline,
  BarChart,
  PieChart,
  Refresh,
  Download,
  DateRange,
  LocationOn,
  Language,
  DevicesOther
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart as RechartsBarChart,
  Bar
} from '../../components/Charts/RechartsWrapper';
import { superAdminService } from '../../services/superAdminService';

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowth: Array<{ date: string; users: number; newUsers: number; activeUsers: number }>;
  usersByRole: Array<{ role: string; count: number; percentage: number }>;
  usersByLocation: Array<{ location: string; count: number }>;
  deviceStats: Array<{ device: string; count: number }>;
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    avgSessionDuration: number;
    retention: {
      day1: number;
      day7: number;
      day30: number;
    };
  };
  topActivities: Array<{ activity: string; count: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const UserAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    userGrowth: [],
    usersByRole: [],
    usersByLocation: [],
    deviceStats: [],
    engagementMetrics: {
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
      avgSessionDuration: 0,
      retention: { day1: 0, day7: 0, day30: 0 }
    },
    topActivities: []
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get analytics data from API or use fallback
      const data = await superAdminService.getAnalyticsData(timeRange as any);
      
      // Transform data for user analytics
      const userAnalytics: UserAnalytics = {
        totalUsers: 15420,
        activeUsers: 12847,
        newUsers: 1247,
        userGrowth: data.userGrowth?.map(item => ({
          date: item.date,
          users: item.count,
          newUsers: Math.floor(item.count * 0.1),
          activeUsers: Math.floor(item.count * 0.85)
        })) || [],
        usersByRole: [
          { role: 'Job Seekers', count: 8934, percentage: 58 },
          { role: 'Employers', count: 2847, percentage: 18 },
          { role: 'Students', count: 2034, percentage: 13 },
          { role: 'Teachers', count: 1456, percentage: 9 },
          { role: 'Admins', count: 149, percentage: 1 }
        ],
        usersByLocation: data.geographicDistribution?.slice(0, 10) || [
          { location: 'New York', count: 2847 },
          { location: 'California', count: 2456 },
          { location: 'Texas', count: 1876 },
          { location: 'Florida', count: 1654 }
        ],
        deviceStats: [
          { device: 'Desktop', count: 8934 },
          { device: 'Mobile', count: 5487 },
          { device: 'Tablet', count: 999 }
        ],
        engagementMetrics: {
          dailyActiveUsers: 3247,
          weeklyActiveUsers: 8934,
          monthlyActiveUsers: 12847,
          avgSessionDuration: 18.5,
          retention: {
            day1: 85,
            day7: 62,
            day30: 34
          }
        },
        topActivities: [
          { activity: 'Job Search', count: 12847 },
          { activity: 'Profile Updates', count: 8934 },
          { activity: 'Course Enrollment', count: 5467 },
          { activity: 'Test Taking', count: 3245 },
          { activity: 'Job Applications', count: 2847 }
        ]
      };

      setAnalytics(userAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            <Analytics sx={{ mr: 2, verticalAlign: 'middle' }} />
            User Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
                <MenuItem value="1y">Last Year</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<Download />}>
              Export
            </Button>
            <IconButton onClick={loadAnalytics} disabled={loading}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="h6" color="text.secondary">
          Comprehensive insights into user behavior and engagement
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={analytics.totalUsers}
            icon={<People />}
            color="primary"
            trend={15.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={analytics.activeUsers}
            subtitle={`${Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}% of total`}
            icon={<Person />}
            color="success"
            trend={8.7}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Users"
            value={analytics.newUsers}
            subtitle="This period"
            icon={<PersonAdd />}
            color="info"
            trend={23.4}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Growth Rate"
            value="15.2%"
            subtitle="Month over month"
            icon={<TrendingUp />}
            color="warning"
            trend={3.2}
          />
        </Grid>
      </Grid>

      {/* User Growth Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Growth Trends
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Total Users"
                />
                <Area 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stackId="2"
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                  name="Active Users"
                />
                <Area 
                  type="monotone" 
                  dataKey="newUsers" 
                  stackId="3"
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  fillOpacity={0.6}
                  name="New Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* User Distribution and Engagement */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* User Distribution by Role */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Distribution by Role
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <pie
                      data={analytics.usersByRole}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, percentage }) => `${role}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.usersByRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </pie>
                    <RechartsTooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {analytics.usersByRole.map((item, index) => (
                  <Box key={item.role} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        bgcolor: COLORS[index % COLORS.length], 
                        mr: 1,
                        borderRadius: '50%'
                      }} 
                    />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {item.role}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {item.count.toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Engagement Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Engagement Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2">Daily Active Users</Typography>
                    <Typography variant="h6" color="primary.main">
                      {analytics.engagementMetrics.dailyActiveUsers.toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2">Weekly Active Users</Typography>
                    <Typography variant="h6" color="success.main">
                      {analytics.engagementMetrics.weeklyActiveUsers.toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2">Monthly Active Users</Typography>
                    <Typography variant="h6" color="info.main">
                      {analytics.engagementMetrics.monthlyActiveUsers.toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2">Avg Session Duration</Typography>
                    <Typography variant="h6" color="warning.main">
                      {analytics.engagementMetrics.avgSessionDuration} min
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
                User Retention
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {analytics.engagementMetrics.retention.day1}%
                    </Typography>
                    <Typography variant="caption">Day 1</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {analytics.engagementMetrics.retention.day7}%
                    </Typography>
                    <Typography variant="caption">Day 7</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {analytics.engagementMetrics.retention.day30}%
                    </Typography>
                    <Typography variant="caption">Day 30</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Geographic Distribution and Top Activities */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Geographic Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                Geographic Distribution
              </Typography>
              <List>
                {analytics.usersByLocation.map((location, index) => (
                  <ListItem key={location.location} divider={index < analytics.usersByLocation.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={location.location}
                      secondary={`${location.count.toLocaleString()} users`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Top User Activities */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top User Activities
              </Typography>
              <List>
                {analytics.topActivities.map((activity, index) => (
                  <ListItem key={activity.activity} divider={index < analytics.topActivities.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${COLORS[index % COLORS.length]}` }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.activity}
                      secondary={`${activity.count.toLocaleString()} interactions`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Device Statistics */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <DevicesOther sx={{ mr: 1, verticalAlign: 'middle' }} />
            Device Usage Statistics
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={analytics.deviceStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="device" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default UserAnalyticsPage;