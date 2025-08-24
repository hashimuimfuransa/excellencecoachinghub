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
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Memory,
  Storage,
  NetworkCheck,
  Timer,
  Refresh,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from '../../components/Charts/RechartsWrapper';

const PerformanceReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);

  // Mock performance data
  const performanceMetrics = {
    responseTime: { current: 245, target: 200, status: 'warning' },
    throughput: { current: 1250, target: 1000, status: 'good' },
    errorRate: { current: 0.5, target: 1, status: 'good' },
    uptime: { current: 99.8, target: 99.9, status: 'warning' }
  };

  const systemResourceData = [
    { time: '00:00', cpu: 45, memory: 62, disk: 78, network: 34 },
    { time: '04:00', cpu: 42, memory: 58, disk: 78, network: 28 },
    { time: '08:00', cpu: 68, memory: 72, disk: 79, network: 55 },
    { time: '12:00', cpu: 85, memory: 81, disk: 80, network: 72 },
    { time: '16:00', cpu: 92, memory: 88, disk: 81, network: 85 },
    { time: '20:00', cpu: 76, memory: 79, disk: 81, network: 68 },
    { time: '24:00', cpu: 52, memory: 65, disk: 82, network: 42 }
  ];

  const responseTimeData = [
    { time: '00:00', api: 180, database: 45, total: 225 },
    { time: '04:00', api: 165, database: 42, total: 207 },
    { time: '08:00', api: 220, database: 58, total: 278 },
    { time: '12:00', api: 285, database: 72, total: 357 },
    { time: '16:00', api: 315, database: 88, total: 403 },
    { time: '20:00', api: 245, database: 65, total: 310 },
    { time: '24:00', api: 190, database: 48, total: 238 }
  ];

  const slowestEndpoints = [
    { endpoint: '/api/jobs/search', avgTime: 485, calls: 15420 },
    { endpoint: '/api/applications/submit', avgTime: 342, calls: 8932 },
    { endpoint: '/api/users/profile', avgTime: 298, calls: 25641 },
    { endpoint: '/api/courses/content', avgTime: 245, calls: 5678 },
    { endpoint: '/api/interviews/start', avgTime: 189, calls: 3421 }
  ];

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // Mock loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle color="success" />;
      case 'warning': return <Warning color="warning" />;
      case 'critical': return <Error color="error" />;
      default: return <CheckCircle />;
    }
  };

  const MetricCard = ({ title, current, target, unit, status, icon, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {getStatusIcon(status)}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" component="div">
              {current}{unit}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Target: {target}{unit}
            </Typography>
            <Chip
              label={status}
              size="small"
              color={getStatusColor(status) as any}
              sx={{ mt: 1 }}
            />
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
          Loading Performance Reports...
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
            <TrendingUp sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
            Performance Reports
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Monitor system performance and identify bottlenecks
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadPerformanceData}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Performance Alerts */}
      <Alert severity="warning" sx={{ mb: 4 }}>
        <Typography variant="subtitle2">
          Performance Alert: Response time is above target during peak hours (12:00-18:00)
        </Typography>
      </Alert>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Response Time"
            current={performanceMetrics.responseTime.current}
            target={performanceMetrics.responseTime.target}
            unit="ms"
            status={performanceMetrics.responseTime.status}
            icon={<Timer />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Throughput"
            current={performanceMetrics.throughput.current}
            target={performanceMetrics.throughput.target}
            unit="/min"
            status={performanceMetrics.throughput.status}
            icon={<Speed />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Error Rate"
            current={performanceMetrics.errorRate.current}
            target={performanceMetrics.errorRate.target}
            unit="%"
            status={performanceMetrics.errorRate.status}
            icon={<Error />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Uptime"
            current={performanceMetrics.uptime.current}
            target={performanceMetrics.uptime.target}
            unit="%"
            status={performanceMetrics.uptime.status}
            icon={<CheckCircle />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* System Resources */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Resources (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={systemResourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="cpu" stroke="#ff7300" name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#8884d8" name="Memory %" />
                  <Line type="monotone" dataKey="disk" stroke="#82ca9d" name="Disk %" />
                  <Line type="monotone" dataKey="network" stroke="#ffc658" name="Network %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Response Time Breakdown */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time Breakdown (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="database" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="api" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Slowest Endpoints */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Slowest API Endpoints
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Endpoint</TableCell>
                  <TableCell>Average Response Time</TableCell>
                  <TableCell>Total Calls</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slowestEndpoints.map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {endpoint.endpoint}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {endpoint.avgTime}ms
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {endpoint.calls.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={endpoint.avgTime > 300 ? 'slow' : 'normal'}
                        size="small"
                        color={endpoint.avgTime > 300 ? 'warning' : 'success'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PerformanceReportsPage;