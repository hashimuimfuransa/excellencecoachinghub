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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Timeline,
  People,
  Work,
  School,
  Assessment,
  Refresh,
  TrendingUp,
  TrendingDown,
  DeviceHub,
  Language,
  Schedule
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
  Cell
} from '../../components/Charts/RechartsWrapper';

const UsageStatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  // Mock usage data
  const dailyActiveUsers = [
    { date: '2024-01-14', users: 1245 },
    { date: '2024-01-15', users: 1356 },
    { date: '2024-01-16', users: 1289 },
    { date: '2024-01-17', users: 1678 },
    { date: '2024-01-18', users: 1534 },
    { date: '2024-01-19', users: 1789 },
    { date: '2024-01-20', users: 1923 }
  ];

  const featureUsage = [
    { feature: 'Job Search', usage: 8934, growth: 15 },
    { feature: 'Applications', usage: 5467, growth: 23 },
    { feature: 'AI Interviews', usage: 3421, growth: 45 },
    { feature: 'Courses', usage: 2156, growth: 12 },
    { feature: 'Tests', usage: 1987, growth: 8 },
    { feature: 'Certificates', usage: 1234, growth: 34 }
  ];

  const deviceBreakdown = [
    { name: 'Desktop', value: 6543, color: '#8884d8' },
    { name: 'Mobile', value: 4321, color: '#82ca9d' },
    { name: 'Tablet', value: 1876, color: '#ffc658' }
  ];

  const geographicData = [
    { country: 'United States', users: 4567, sessions: 12345 },
    { country: 'United Kingdom', users: 2134, sessions: 6789 },
    { country: 'Canada', users: 1876, sessions: 5432 },
    { country: 'Australia', users: 1543, sessions: 4321 },
    { country: 'Germany', users: 1234, sessions: 3456 },
    { country: 'France', users: 987, sessions: 2765 },
    { country: 'India', users: 876, sessions: 2543 },
    { country: 'Brazil', users: 654, sessions: 1987 }
  ];

  const peakUsageHours = [
    { hour: '6:00', users: 234 },
    { hour: '7:00', users: 456 },
    { hour: '8:00', users: 789 },
    { hour: '9:00', users: 1234 },
    { hour: '10:00', users: 1567 },
    { hour: '11:00', users: 1789 },
    { hour: '12:00', users: 1923 },
    { hour: '13:00', users: 1876 },
    { hour: '14:00', users: 1654 },
    { hour: '15:00', users: 1432 },
    { hour: '16:00', users: 1234 },
    { hour: '17:00', users: 1098 },
    { hour: '18:00', users: 876 },
    { hour: '19:00', users: 654 },
    { hour: '20:00', users: 432 },
    { hour: '21:00', users: 321 },
    { hour: '22:00', users: 234 },
    { hour: '23:00', users: 167 }
  ];

  useEffect(() => {
    loadUsageData();
  }, [timeRange]);

  const loadUsageData = async () => {
    setLoading(true);
    try {
      // Mock loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error loading usage data:', error);
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading Usage Statistics...
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
            <Timeline sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
            Usage Statistics
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Detailed platform usage analytics and user behavior insights
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
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
              <MenuItem value="90d">90 Days</MenuItem>
              <MenuItem value="1y">1 Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadUsageData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Key Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Daily Active Users"
            value={1923}
            subtitle="Today"
            trend={12}
            icon={<People />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Page Views"
            value={45672}
            subtitle="Last 24h"
            trend={8}
            icon={<Language />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Session Duration"
            value="12m 34s"
            subtitle="Average"
            trend={5}
            icon={<Schedule />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bounce Rate"
            value="23.4%"
            subtitle="Overall"
            trend={-3}
            icon={<TrendingDown />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Daily Active Users */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Active Users (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActiveUsers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Device Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Usage
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceBreakdown.map((entry, index) => (
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

      {/* Peak Usage Hours */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Peak Usage Hours (24h Average)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakUsageHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tables */}
      <Grid container spacing={3}>
        {/* Feature Usage */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feature Usage Statistics
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Feature</TableCell>
                      <TableCell>Usage Count</TableCell>
                      <TableCell>Growth</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {featureUsage.map((feature, index) => (
                      <TableRow key={index}>
                        <TableCell>{feature.feature}</TableCell>
                        <TableCell>{feature.usage.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={`+${feature.growth}%`}
                            size="small"
                            color="success"
                            icon={<TrendingUp />}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Geographic Distribution */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Geographic Distribution
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Country</TableCell>
                      <TableCell>Users</TableCell>
                      <TableCell>Sessions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {geographicData.map((country, index) => (
                      <TableRow key={index}>
                        <TableCell>{country.country}</TableCell>
                        <TableCell>{country.users.toLocaleString()}</TableCell>
                        <TableCell>{country.sessions.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UsageStatisticsPage;