import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  Info,
  Security,
  Storage,
  Memory,
  NetworkCheck,
  Speed,
  Timeline,
  Refresh,
  Settings,
  NotificationImportant,
  Computer,
  CloudDone,
  Api,
  Shield,
  TableChart,
  BugReport,
  Update,
  Backup
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from '../../components/Charts/RechartsWrapper';
import { superAdminService } from '../../services/superAdminService';

interface SystemMetrics {
  cpu: { usage: number; cores: number; temperature: number };
  memory: { used: number; total: number; percentage: number };
  disk: { used: number; total: number; percentage: number };
  network: { inbound: number; outbound: number };
  database: { connections: number; queryTime: number; size: number };
  api: { requests: number; responseTime: number; errors: number };
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'resolved' | 'acknowledged';
  component: string;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: string;
  lastCheck: string;
  responseTime: number;
  version: string;
}

const SystemHealthPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0, cores: 8, temperature: 0 },
    memory: { used: 0, total: 16, percentage: 0 },
    disk: { used: 0, total: 500, percentage: 0 },
    network: { inbound: 0, outbound: 0 },
    database: { connections: 0, queryTime: 0, size: 0 },
    api: { requests: 0, responseTime: 0, errors: 0 }
  });

  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    setLoading(true);
    try {
      // Load system metrics (mock data)
      const mockMetrics: SystemMetrics = {
        cpu: { usage: Math.random() * 100, cores: 8, temperature: 45 + Math.random() * 20 },
        memory: { used: 8.5, total: 16, percentage: 53 },
        disk: { used: 245, total: 500, percentage: 49 },
        network: { inbound: Math.random() * 100, outbound: Math.random() * 50 },
        database: { connections: 45, queryTime: 1.2, size: 15.7 },
        api: { requests: 1247, responseTime: 0.85, errors: 3 }
      };

      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'High CPU Usage',
          message: 'CPU usage has been above 85% for the last 10 minutes',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          severity: 'high',
          status: 'active',
          component: 'Server'
        },
        {
          id: '2',
          type: 'info',
          title: 'Database Backup Completed',
          message: 'Scheduled database backup completed successfully',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          severity: 'low',
          status: 'resolved',
          component: 'Database'
        },
        {
          id: '3',
          type: 'error',
          title: 'API Rate Limit Exceeded',
          message: 'API rate limit exceeded for endpoint /api/users',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          severity: 'critical',
          status: 'active',
          component: 'API Gateway'
        }
      ];

      const mockServices: ServiceStatus[] = [
        {
          name: 'Web Server',
          status: 'healthy',
          uptime: '99.98%',
          lastCheck: new Date().toISOString(),
          responseTime: 125,
          version: '2.1.3'
        },
        {
          name: 'Database',
          status: 'healthy',
          uptime: '99.95%',
          lastCheck: new Date().toISOString(),
          responseTime: 45,
          version: '14.2'
        },
        {
          name: 'Redis Cache',
          status: 'healthy',
          uptime: '99.99%',
          lastCheck: new Date().toISOString(),
          responseTime: 8,
          version: '6.2.7'
        },
        {
          name: 'Email Service',
          status: 'degraded',
          uptime: '98.76%',
          lastCheck: new Date().toISOString(),
          responseTime: 2340,
          version: '1.8.5'
        }
      ];

      const mockPerformanceData = Array.from({ length: 24 }, (_, i) => ({
        time: `${23 - i}h ago`,
        cpu: Math.random() * 100,
        memory: 40 + Math.random() * 40,
        responseTime: 100 + Math.random() * 200
      })).reverse();

      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
      setServices(mockServices);
      setPerformanceData(mockPerformanceData);
    } catch (error) {
      console.error('Error loading system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'info': return <Info color="info" />;
      case 'success': return <CheckCircle color="success" />;
      default: return <NotificationImportant />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  const MetricCard = ({ title, value, unit, percentage, icon, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {value} {unit}
        </Typography>
        {percentage !== undefined && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={percentage}
              color={getUsageColor(percentage) as any}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {percentage.toFixed(1)}% used
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            <Security sx={{ mr: 2, verticalAlign: 'middle' }} />
            System Health
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Settings />}>
              Settings
            </Button>
            <IconButton onClick={loadSystemHealth} disabled={loading}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="h6" color="text.secondary">
          Monitor system performance, health metrics, and service status
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* System Status Overview */}
      <Alert 
        severity="success" 
        icon={<CheckCircle />}
        sx={{ mb: 4 }}
        action={
          <Button color="inherit" size="small">
            VIEW DETAILS
          </Button>
        }
      >
        <Typography variant="subtitle1">
          System Status: All Systems Operational
        </Typography>
        <Typography variant="body2">
          Last updated: {new Date().toLocaleString()} • Next check in: 30 seconds
        </Typography>
      </Alert>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="CPU"
            value={metrics.cpu.usage.toFixed(1)}
            unit="%"
            percentage={metrics.cpu.usage}
            icon={<Computer />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Memory"
            value={`${metrics.memory.used}/${metrics.memory.total}`}
            unit="GB"
            percentage={metrics.memory.percentage}
            icon={<Memory />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Disk Space"
            value={`${metrics.disk.used}/${metrics.disk.total}`}
            unit="GB"
            percentage={metrics.disk.percentage}
            icon={<Storage />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="DB Connections"
            value={metrics.database.connections}
            unit=""
            icon={<TableChart />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="API Response"
            value={metrics.api.responseTime}
            unit="ms"
            icon={<Api />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Uptime"
            value="99.98"
            unit="%"
            icon={<CloudDone />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Performance Charts */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Trends (Last 24 Hours)
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="CPU Usage (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Memory Usage (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                  name="Response Time (ms)"
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
          <Tab label="Services" />
          <Tab label="Alerts" />
          <Tab label="Logs" />
          <Tab label="Monitoring" />
        </Tabs>

        {/* Services Tab */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Uptime</TableCell>
                    <TableCell>Response Time</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Last Check</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.name} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {service.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={service.status.toUpperCase()}
                          size="small"
                          color={getStatusColor(service.status) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{service.uptime}</TableCell>
                      <TableCell>{service.responseTime}ms</TableCell>
                      <TableCell>{service.version}</TableCell>
                      <TableCell>
                        {new Date(service.lastCheck).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined">
                          Restart
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Alerts Tab */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <List>
              {alerts.map((alert, index) => (
                <React.Fragment key={alert.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getAlertIcon(alert.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {alert.title}
                          </Typography>
                          <Chip
                            label={alert.severity.toUpperCase()}
                            size="small"
                            color={
                              alert.severity === 'critical' ? 'error' :
                              alert.severity === 'high' ? 'warning' :
                              alert.severity === 'medium' ? 'info' : 'default'
                            }
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {alert.component} • {new Date(alert.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button size="small" variant="outlined">
                        {alert.status === 'active' ? 'Acknowledge' : 'Resolved'}
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < alerts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {/* Logs Tab */}
        {currentTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              System logs are available for the last 30 days. Critical events are highlighted.
            </Alert>
            <Typography variant="h6" gutterBottom>
              Recent System Events
            </Typography>
            <Paper sx={{ p: 2, bgcolor: '#000', color: '#00ff00', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              <pre>
{`[2024-01-20 15:30:15] INFO: System health check completed successfully
[2024-01-20 15:29:45] WARN: CPU usage spike detected: 87%
[2024-01-20 15:29:12] INFO: Database backup started
[2024-01-20 15:28:33] ERROR: API rate limit exceeded for endpoint /api/users
[2024-01-20 15:27:56] INFO: New user registration: user_12847
[2024-01-20 15:27:23] INFO: Job application submitted: app_5843
[2024-01-20 15:26:47] INFO: Email notification sent successfully
[2024-01-20 15:26:15] WARN: Memory usage above 80%
[2024-01-20 15:25:38] INFO: Cache cleared successfully
[2024-01-20 15:25:02] INFO: System maintenance window ended`}
              </pre>
            </Paper>
          </Box>
        )}

        {/* Monitoring Tab */}
        {currentTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Monitoring Configuration
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><Timeline /></ListItemIcon>
                        <ListItemText primary="Performance Monitoring" secondary="Real-time system metrics" />
                        <ListItemSecondaryAction>
                          <Chip label="Active" color="success" size="small" />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Security /></ListItemIcon>
                        <ListItemText primary="Security Monitoring" secondary="Threat detection & alerts" />
                        <ListItemSecondaryAction>
                          <Chip label="Active" color="success" size="small" />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><BugReport /></ListItemIcon>
                        <ListItemText primary="Error Tracking" secondary="Application error monitoring" />
                        <ListItemSecondaryAction>
                          <Chip label="Active" color="success" size="small" />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Backup />}
                          sx={{ justifyContent: 'flex-start' }}
                        >
                          Create System Backup
                        </Button>
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Update />}
                          sx={{ justifyContent: 'flex-start' }}
                        >
                          Check for Updates
                        </Button>
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Shield />}
                          sx={{ justifyContent: 'flex-start' }}
                        >
                          Run Security Scan
                        </Button>
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Speed />}
                          sx={{ justifyContent: 'flex-start' }}
                        >
                          Performance Test
                        </Button>
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

export default SystemHealthPage;