import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Badge,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  Paper
} from '@mui/material';
import {
  Search,
  FilterList,
  Psychology,
  Add,
  Visibility,
  Edit,
  Delete,
  Create,
  Block,
  CheckCircle,
  MoreVert,
  Download,
  Upload,
  Person,
  Schedule,
  People,
  Assignment,
  TrendingUp,
  TrendingDown,
  Warning,
  Error,
  Info,
  Refresh,
  Star,
  StarBorder,
  Flag,
  Share,
  Archive,
  Unarchive,
  Publish,
  Pause,
  PlayArrow,
  Quiz,
  Assessment,
  Timer,
  Category,
  BarChart
} from '@mui/icons-material';
import type { PsychometricTest } from '../../types/test';
import { PsychometricTestType } from '../../types/test';
import type { User } from '../../types/user';
import { superAdminService } from '../../services/superAdminService';

interface TestManagementProps {
  onTestSelect?: (test: PsychometricTest) => void;
}

interface TestStats {
  totalTests: number;
  activeTests: number;
  draftTests: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  topTestTypes: Array<{ type: string; count: number; averageScore: number }>;
}

interface TestFilter {
  search: string;
  type: string;
  status: string;
  industry: string;
  difficulty: string;
}

interface ExtendedTest extends PsychometricTest {
  status: 'active' | 'draft' | 'archived';
  attempts: number;
  averageScore: number;
  passRate: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const TestManagement: React.FC<TestManagementProps> = ({ onTestSelect }) => {
  const [tests, setTests] = useState<ExtendedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTests, setTotalTests] = useState(0);
  const [stats, setStats] = useState<TestStats>({
    totalTests: 0,
    activeTests: 0,
    draftTests: 0,
    totalAttempts: 0,
    averageScore: 0,
    passRate: 0,
    topTestTypes: []
  });

  const [filters, setFilters] = useState<TestFilter>({
    search: '',
    type: '',
    status: '',
    industry: '',
    difficulty: ''
  });

  const [selectedTest, setSelectedTest] = useState<ExtendedTest | null>(null);
  const [testDialog, setTestDialog] = useState({
    open: false,
    mode: 'view' as 'view' | 'edit' | 'create',
    test: null as ExtendedTest | null
  });

  const [actionMenu, setActionMenu] = useState<{
    anchorEl: HTMLElement | null;
    test: ExtendedTest | null;
  }>({ anchorEl: null, test: null });

  const [bulkActions, setBulkActions] = useState({
    selectedTests: [] as string[],
    selectAll: false
  });

  useEffect(() => {
    loadTests();
    loadStats();
  }, [page, rowsPerPage, filters]);

  const loadTests = async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getAllTests({
        page: page + 1,
        limit: rowsPerPage,
        search: filters.search || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      console.log('🔍 TestManagement: Raw API response:', response);

      // Handle different possible response structures
      let testsData: PsychometricTest[] = [];
      let totalCount = 0;

      if (response) {
        // Check if response has tests directly
        if (response.tests && Array.isArray(response.tests)) {
          testsData = response.tests;
          totalCount = response.total || response.tests.length;
        }
        // Check if response has data.tests structure
        else if (response.data && response.data.tests && Array.isArray(response.data.tests)) {
          testsData = response.data.tests;
          totalCount = response.data.total || response.data.tests.length;
        }
        // Check if response is directly an array
        else if (Array.isArray(response)) {
          testsData = response;
          totalCount = response.length;
        }
        // Check if response has success and data structure
        else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            testsData = response.data;
            totalCount = response.data.length;
          } else if (response.data.tests) {
            testsData = response.data.tests;
            totalCount = response.data.total || response.data.tests.length;
          }
        }
      }

      console.log('🔍 TestManagement: Extracted tests data:', testsData);
      console.log('🔍 TestManagement: Total count:', totalCount);

      // Transform API data to ExtendedTest format
      const transformedTests: ExtendedTest[] = testsData.map(test => ({
        ...test,
        status: test.isActive ? 'active' : 'draft',
        attempts: Math.floor(Math.random() * 1000) + 100, // Mock data for now
        averageScore: Math.floor(Math.random() * 30) + 70, // Mock data for now
        passRate: Math.floor(Math.random() * 40) + 60, // Mock data for now
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard'
      }));

      setTests(transformedTests);
      setTotalTests(totalCount);
    } catch (error) {
      console.error('Error loading tests:', error);
      // Fallback to mock data if API fails
      const mockTests: ExtendedTest[] = [
        {
          _id: '1',
          title: 'Software Developer Aptitude Test',
          description: 'Comprehensive test for evaluating programming aptitude and logical thinking.',
          type: PsychometricTestType.APTITUDE,
          questions: [],
          timeLimit: 60,
          industry: 'Technology',
          jobRole: 'Software Developer',
          isActive: true,
          createdBy: {
            _id: 'admin1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@platform.com',
            role: 'admin' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          status: 'active',
          attempts: 1247,
          averageScore: 78.5,
          passRate: 68.2,
          difficulty: 'medium',
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          _id: '2',
          title: 'Leadership Personality Assessment',
          description: 'Evaluate leadership qualities and personality traits for management roles.',
          type: PsychometricTestType.PERSONALITY,
          questions: [],
          timeLimit: 45,
          industry: 'General',
          jobRole: 'Manager',
          isActive: true,
          createdBy: {
            _id: 'admin1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@platform.com',
            role: 'admin' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          status: 'active',
          attempts: 892,
          averageScore: 82.1,
          passRate: 74.5,
          difficulty: 'easy',
          createdAt: '2024-01-05T09:00:00Z',
          updatedAt: '2024-01-18T14:30:00Z'
        },
        {
          _id: '3',
          title: 'Sales Skills Behavioral Test',
          description: 'Assess behavioral patterns and skills relevant to sales positions.',
          type: PsychometricTestType.BEHAVIORAL,
          questions: [],
          timeLimit: 30,
          industry: 'Sales',
          jobRole: 'Sales Representative',
          isActive: false,
          createdBy: {
            _id: 'admin1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@platform.com',
            role: 'admin' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          status: 'draft',
          attempts: 0,
          averageScore: 0,
          passRate: 0,
          difficulty: 'medium',
          createdAt: '2024-01-20T11:15:00Z',
          updatedAt: '2024-01-20T11:15:00Z'
        }
      ];

      setTests(mockTests);
      setTotalTests(mockTests.length);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('🔍 TestManagement: Loading real test stats...');
      const statsData = await superAdminService.getTestStats();
      console.log('📊 TestManagement: Loaded stats:', statsData);

      setStats({
        totalTests: statsData.totalTests || 0,
        activeTests: statsData.activeTests || 0,
        draftTests: statsData.draftTests || 0,
        totalAttempts: statsData.totalAttempts || 0,
        averageScore: statsData.averageScore || 0,
        passRate: statsData.passRate || 0,
        topTestTypes: (statsData.topPerformingTests || []).map(test => ({
          type: test.testTitle,
          count: test.attempts,
          averageScore: test.averageScore
        })).slice(0, 4)
      });
    } catch (error) {
      console.error('Error loading test stats:', error);
      // Fallback to mock stats if API fails
      setStats({
        totalTests: 234,
        activeTests: 189,
        draftTests: 45,
        totalAttempts: 18934,
        averageScore: 76.8,
        passRate: 68.5,
        topTestTypes: [
          { type: 'Aptitude', count: 89, averageScore: 78.5 },
          { type: 'Personality', count: 67, averageScore: 82.1 },
          { type: 'Behavioral', count: 45, averageScore: 74.3 },
          { type: 'Skills', count: 33, averageScore: 79.8 }
        ]
      });
    }
  };

  const handleFilterChange = (field: keyof TestFilter, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleTestAction = (action: string, test: ExtendedTest) => {
    setActionMenu({ anchorEl: null, test: null });
    
    switch (action) {
      case 'view':
        setTestDialog({ open: true, mode: 'view', test });
        break;
      case 'edit':
        setTestDialog({ open: true, mode: 'edit', test });
        break;
      case 'activate':
        handleActivateTest(test);
        break;
      case 'archive':
        handleArchiveTest(test);
        break;
      case 'delete':
        handleDeleteTest(test);
        break;
      case 'duplicate':
        handleDuplicateTest(test);
        break;
      case 'analytics':
        handleViewAnalytics(test);
        break;
    }
  };

  const handleActivateTest = async (test: ExtendedTest) => {
    try {
      console.log('Activating test:', test.title);
      loadTests();
    } catch (error) {
      console.error('Error activating test:', error);
    }
  };

  const handleArchiveTest = async (test: ExtendedTest) => {
    try {
      console.log('Archiving test:', test.title);
      loadTests();
    } catch (error) {
      console.error('Error archiving test:', error);
    }
  };

  const handleDeleteTest = async (test: ExtendedTest) => {
    if (window.confirm(`Are you sure you want to delete "${test.title}"?`)) {
      try {
        console.log('Deleting test:', test.title);
        loadTests();
      } catch (error) {
        console.error('Error deleting test:', error);
      }
    }
  };

  const handleDuplicateTest = async (test: ExtendedTest) => {
    try {
      console.log('Duplicating test:', test.title);
      loadTests();
    } catch (error) {
      console.error('Error duplicating test:', error);
    }
  };

  const handleViewAnalytics = (test: ExtendedTest) => {
    console.log('Viewing analytics for test:', test.title);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'default';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle color="success" />;
      case 'draft':
        return <Create />;
      case 'archived':
        return <Archive color="error" />;
      default:
        return <Info />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tests"
            value={stats.totalTests}
            icon={<Psychology />}
            color="primary"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Tests"
            value={stats.activeTests}
            icon={<CheckCircle />}
            color="success"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Attempts"
            value={stats.totalAttempts}
            icon={<Assignment />}
            color="info"
            trend={15}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pass Rate"
            value={`${stats.passRate}%`}
            subtitle={`Avg Score: ${stats.averageScore}`}
            icon={<BarChart />}
            color="warning"
            trend={5}
          />
        </Grid>
      </Grid>

      {/* Test Type Distribution */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Types Distribution
              </Typography>
              <List>
                {Array.isArray(stats.topTestTypes) && stats.topTestTypes.map((testType, index) => (
                  <ListItem key={testType.type}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Quiz />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={testType.type}
                      secondary={`${testType.count} tests, avg score: ${testType.averageScore}%`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Performance
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Pass Rate</Typography>
                  <Typography variant="body2">{stats.passRate}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={stats.passRate} color="success" sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Average Score</Typography>
                  <Typography variant="body2">{stats.averageScore}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={stats.averageScore} color="info" sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Completion Rate</Typography>
                  <Typography variant="body2">85%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={85} color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search tests..."
              variant="outlined"
              size="small"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 250 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value={PsychometricTestType.APTITUDE}>Aptitude</MenuItem>
                <MenuItem value={PsychometricTestType.PERSONALITY}>Personality</MenuItem>
                <MenuItem value={PsychometricTestType.BEHAVIORAL}>Behavioral</MenuItem>
                <MenuItem value={PsychometricTestType.SKILLS}>Skills</MenuItem>
                <MenuItem value={PsychometricTestType.COGNITIVE}>Cognitive</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={filters.difficulty}
                label="Difficulty"
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setTestDialog({ open: true, mode: 'create', test: null })}
            >
              Create Test
            </Button>

            <Button
              variant="outlined"
              startIcon={<Download />}
            >
              Export
            </Button>

            <IconButton onClick={loadTests}>
              <Refresh />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading && <LinearProgress />}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Attempts</TableCell>
                  <TableCell>Performance</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(tests) && tests.map((test) => (
                  <TableRow key={test._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <Psychology />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {test.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {test.industry} • {test.jobRole}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <Timer fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            {test.timeLimit} minutes
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={test.type.replace('_', ' ').toUpperCase()}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Chip
                          icon={getStatusIcon(test.status)}
                          label={test.status.toUpperCase()}
                          color={getStatusColor(test.status) as any}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={test.difficulty.toUpperCase()}
                          color={getDifficultyColor(test.difficulty) as any}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {test.attempts.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        attempts
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {test.averageScore}% avg
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {test.passRate}% pass rate
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(test.createdAt)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        by {test.createdBy.firstName} {test.createdBy.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleTestAction('view', test)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Test">
                          <IconButton
                            size="small"
                            onClick={() => handleTestAction('edit', test)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => setActionMenu({ anchorEl: e.currentTarget, test })}
                        >
                          <MoreVert />
                        </IconButton>
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
            count={totalTests}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={() => setActionMenu({ anchorEl: null, test: null })}
      >
        <MenuItem onClick={() => handleTestAction('view', actionMenu.test!)}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleTestAction('edit', actionMenu.test!)}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Test</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleTestAction('analytics', actionMenu.test!)}>
          <ListItemIcon><BarChart /></ListItemIcon>
          <ListItemText>View Analytics</ListItemText>
        </MenuItem>
        <Divider />
        {actionMenu.test?.status === 'active' ? (
          <MenuItem onClick={() => handleTestAction('archive', actionMenu.test!)}>
            <ListItemIcon><Archive /></ListItemIcon>
            <ListItemText>Archive Test</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleTestAction('activate', actionMenu.test!)}>
            <ListItemIcon><CheckCircle /></ListItemIcon>
            <ListItemText>Activate Test</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleTestAction('duplicate', actionMenu.test!)}>
          <ListItemIcon><Share /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleTestAction('delete', actionMenu.test!)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete Test</ListItemText>
        </MenuItem>
      </Menu>

      {/* Test Dialog */}
      <Dialog
        open={testDialog.open}
        onClose={() => setTestDialog({ open: false, mode: 'view', test: null })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {testDialog.mode === 'create' ? 'Create New Test' :
           testDialog.mode === 'edit' ? 'Edit Test' : 'Test Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Test Title"
                variant="outlined"
                defaultValue={testDialog.test?.title}
                disabled={testDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Test Type</InputLabel>
                <Select
                  label="Test Type"
                  defaultValue={testDialog.test?.type || ''}
                  disabled={testDialog.mode === 'view'}
                >
                  <MenuItem value={PsychometricTestType.APTITUDE}>Aptitude</MenuItem>
                  <MenuItem value={PsychometricTestType.PERSONALITY}>Personality</MenuItem>
                  <MenuItem value={PsychometricTestType.BEHAVIORAL}>Behavioral</MenuItem>
                  <MenuItem value={PsychometricTestType.SKILLS}>Skills</MenuItem>
                  <MenuItem value={PsychometricTestType.COGNITIVE}>Cognitive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  label="Difficulty"
                  defaultValue={(testDialog.test as ExtendedTest)?.difficulty || ''}
                  disabled={testDialog.mode === 'view'}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                variant="outlined"
                defaultValue={testDialog.test?.description}
                disabled={testDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time Limit (minutes)"
                type="number"
                variant="outlined"
                defaultValue={testDialog.test?.timeLimit}
                disabled={testDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Industry"
                variant="outlined"
                defaultValue={testDialog.test?.industry}
                disabled={testDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Role"
                variant="outlined"
                defaultValue={testDialog.test?.jobRole}
                disabled={testDialog.mode === 'view'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog({ open: false, mode: 'view', test: null })}>
            Cancel
          </Button>
          {testDialog.mode !== 'view' && (
            <Button variant="contained">
              {testDialog.mode === 'create' ? 'Create Test' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestManagement;