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
  Avatar,
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
  LinearProgress
} from '@mui/material';
import {
  Search,
  FilterList,
  PersonAdd,
  Visibility,
  Edit,
  Delete,
  Block,
  CheckCircle,
  MoreVert,
  Download,
  Upload,
  Email,
  Phone,
  LocationOn,
  Work,
  School,
  Security,
  AdminPanelSettings,
  SupervisorAccount,
  Person,
  Business,
  Psychology,
  Assignment,
  CardMembership,
  Timeline,
  Warning,
  Error,
  Info
} from '@mui/icons-material';
import type { User } from '../../types/user';
import { UserRole } from '../../types/user';
import { superAdminService } from '../../services/superAdminService';

interface UserManagementProps {
  onUserSelect?: (user: User) => void;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  suspendedUsers: number;
  usersByRole: Record<string, number>;
}

interface UserFilter {
  search: string;
  role: string;
  status: string;
  dateRange: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ onUserSelect }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('UserManagement component mounted');
    return () => {
      console.log('UserManagement component unmounting');
    };
  }, []);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    suspendedUsers: 0,
    usersByRole: {}
  });

  const [filters, setFilters] = useState<UserFilter>({
    search: '',
    role: '',
    status: '',
    dateRange: ''
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialog, setUserDialog] = useState({
    open: false,
    mode: 'view' as 'view' | 'edit' | 'create',
    user: null as User | null
  });

  const [actionMenu, setActionMenu] = useState<{
    anchorEl: HTMLElement | null;
    user: User | null;
  }>({ anchorEl: null, user: null });

  const [bulkActions, setBulkActions] = useState({
    selectedUsers: [] as string[],
    selectAll: false
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: UserRole.STUDENT,
    isActive: true,
    company: '',
    jobTitle: ''
  });

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [page, rowsPerPage, filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getAllUsers({
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        search: filters.search || undefined,
        role: filters.role || undefined,
        status: filters.status || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      console.log('🔍 UserManagement: Raw API response:', response);

      // Handle different possible response structures
      let usersData: User[] = [];
      let totalCount = 0;

      if (response) {
        // Check if response has users directly
        if (response.users && Array.isArray(response.users)) {
          usersData = response.users;
          totalCount = response.total || response.users.length;
        }
        // Check if response has data.users structure
        else if (response.data && response.data.users && Array.isArray(response.data.users)) {
          usersData = response.data.users;
          totalCount = response.data.total || response.data.users.length;
        }
        // Check if response is directly an array
        else if (Array.isArray(response)) {
          usersData = response;
          totalCount = response.length;
        }
        // Check if response has success and data structure
        else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            usersData = response.data;
            totalCount = response.data.length;
          } else if (response.data.users) {
            usersData = response.data.users;
            totalCount = response.data.total || response.data.users.length;
          }
        }
      }

      console.log('🔍 UserManagement: Extracted users data:', usersData);
      console.log('🔍 UserManagement: Total count:', totalCount);

      setUsers(usersData);
      setTotalUsers(totalCount);
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback to mock data if API fails
      const mockUsers: User[] = [
        {
          _id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: UserRole.JOB_SEEKER,
          avatar: '',
          isActive: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T15:30:00Z'
        },
        {
          _id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com',
          role: UserRole.EMPLOYER,
          avatar: '',
          company: 'TechCorp Inc.',
          jobTitle: 'HR Manager',
          isActive: true,
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-19T14:20:00Z'
        },
        {
          _id: '3',
          firstName: 'Dr. Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@university.edu',
          role: UserRole.TEACHER,
          avatar: '',
          isActive: true,
          createdAt: '2024-01-05T11:00:00Z',
          updatedAt: '2024-01-18T16:45:00Z'
        },
        {
          _id: '4',
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike.wilson@student.edu',
          role: UserRole.STUDENT,
          avatar: '',
          isActive: false,
          createdAt: '2024-01-12T13:00:00Z',
          updatedAt: '2024-01-17T12:10:00Z'
        },
        {
          _id: '5',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@platform.com',
          role: UserRole.ADMIN,
          avatar: '',
          isActive: true,
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-20T10:00:00Z'
        }
      ];

      setUsers(mockUsers);
      setTotalUsers(mockUsers.length);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('🔍 UserManagement: Loading real user stats...');
      const statsData = await superAdminService.getUserStats();
      console.log('📊 UserManagement: Loaded stats:', statsData);
      
      setStats({
        totalUsers: statsData.totalUsers || 0,
        activeUsers: statsData.activeUsers || 0,
        newUsersThisMonth: statsData.newUsersThisMonth || 0,
        suspendedUsers: statsData.suspendedUsers || 0,
        usersByRole: statsData.usersByRole || {}
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to basic stats if API fails
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        suspendedUsers: 0,
        usersByRole: {}
      });
    }
  };

  const handleFilterChange = (field: keyof UserFilter, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleUserAction = async (action: string, user: User) => {
    setActionMenu({ anchorEl: null, user: null });
    
    switch (action) {
      case 'view': {
        try {
          // Fetch full profile like job portal for accurate profile completion & details
          const fullUser = await superAdminService.getUserById(user._id);
          setUserDialog({ open: true, mode: 'view', user: fullUser });
        } catch (e) {
          setUserDialog({ open: true, mode: 'view', user });
        }
        break;
      }
      case 'edit':
        setUserDialog({ open: true, mode: 'edit', user });
        break;
      case 'suspend':
        handleSuspendUser(user);
        break;
      case 'activate':
        handleActivateUser(user);
        break;
      case 'delete':
        handleDeleteUser(user);
        break;
      case 'impersonate':
        handleImpersonateUser(user);
        break;
    }
  };

  const handleSuspendUser = async (user: User) => {
    try {
      await superAdminService.suspendUser(user._id, 'Suspended by admin');
      console.log('User suspended successfully:', user.email);
      // Refresh users list
      loadUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const handleActivateUser = async (user: User) => {
    try {
      await superAdminService.activateUser(user._id);
      console.log('User activated successfully:', user.email);
      // Refresh users list
      loadUsers();
    } catch (error) {
      console.error('Error activating user:', error);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      try {
        await superAdminService.deleteUser(user._id);
        console.log('User deleted successfully:', user.email);
        // Refresh users list
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleImpersonateUser = (user: User) => {
    if (window.confirm(`Impersonate ${user.firstName} ${user.lastName}? This will log you in as this user.`)) {
      // Implement impersonation logic
      console.log('Impersonating user:', user.email);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Create a user object without the password field since it's not part of the User interface
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        company: formData.company || undefined,
        jobTitle: formData.jobTitle || undefined
      };
      
      await superAdminService.createUser(userData);
      
      console.log('User created successfully:', formData.email);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: UserRole.STUDENT,
        isActive: true,
        company: '',
        jobTitle: ''
      });
      
      // Close dialog and refresh users
      setUserDialog({ open: false, mode: 'view', user: null });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
    }
  };

  const handleBulkAction = (action: string) => {
    const selectedUserIds = bulkActions.selectedUsers;
    if (selectedUserIds.length === 0) return;

    switch (action) {
      case 'activate':
        console.log('Bulk activating users:', selectedUserIds);
        break;
      case 'suspend':
        console.log('Bulk suspending users:', selectedUserIds);
        break;
      case 'delete':
        if (window.confirm(`Delete ${selectedUserIds.length} selected users?`)) {
          console.log('Bulk deleting users:', selectedUserIds);
        }
        break;
      case 'export':
        console.log('Exporting selected users:', selectedUserIds);
        break;
    }
    
    setBulkActions({ selectedUsers: [], selectAll: false });
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <AdminPanelSettings color="error" />;
      case UserRole.ADMIN:
        return <SupervisorAccount color="warning" />;
      case UserRole.EMPLOYER:
        return <Business color="primary" />;
      case UserRole.TEACHER:
        return <School color="success" />;
      case UserRole.STUDENT:
        return <Person color="info" />;
      case UserRole.JOB_SEEKER:
        return <Work color="secondary" />;
      default:
        return <Person />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'error';
      case UserRole.ADMIN:
        return 'warning';
      case UserRole.EMPLOYER:
        return 'primary';
      case UserRole.TEACHER:
        return 'success';
      case UserRole.STUDENT:
        return 'info';
      case UserRole.JOB_SEEKER:
        return 'secondary';
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

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalUsers.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Person />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {stats.activeUsers.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    New This Month
                  </Typography>
                  <Typography variant="h4">
                    {stats.newUsersThisMonth.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <PersonAdd />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Suspended
                  </Typography>
                  <Typography variant="h4">
                    {stats.suspendedUsers.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Block />
                </Avatar>
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
              placeholder="Search users..."
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
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                label="Role"
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value={UserRole.JOB_SEEKER}>Job Seeker</MenuItem>
                <MenuItem value={UserRole.EMPLOYER}>Employer</MenuItem>
                <MenuItem value={UserRole.TEACHER}>Teacher</MenuItem>
                <MenuItem value={UserRole.STUDENT}>Student</MenuItem>
                <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                <MenuItem value={UserRole.SUPER_ADMIN}>Super Admin</MenuItem>
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
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setUserDialog({ open: true, mode: 'create', user: null })}
            >
              Add User
            </Button>

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleBulkAction('export')}
            >
              Export
            </Button>
          </Box>

          {/* Bulk Actions */}
          {bulkActions.selectedUsers.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>
                  {bulkActions.selectedUsers.length} user(s) selected
                </Typography>
                <Button size="small" onClick={() => handleBulkAction('activate')}>
                  Activate
                </Button>
                <Button size="small" onClick={() => handleBulkAction('suspend')}>
                  Suspend
                </Button>
                <Button size="small" color="error" onClick={() => handleBulkAction('delete')}>
                  Delete
                </Button>
                <Button size="small" onClick={() => setBulkActions({ selectedUsers: [], selectAll: false })}>
                  Clear
                </Button>
              </Box>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading && <LinearProgress />}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Switch
                      checked={bulkActions.selectAll}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBulkActions({
                          selectAll: checked,
                          selectedUsers: checked && Array.isArray(users) ? users.map(u => u._id) : []
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Profile Completion</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(users) && users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell padding="checkbox">
                      <Switch
                        checked={bulkActions.selectedUsers.includes(user._id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBulkActions(prev => ({
                            selectAll: false,
                            selectedUsers: checked
                              ? [...prev.selectedUsers, user._id]
                              : prev.selectedUsers.filter(id => id !== user._id)
                          }));
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            user.isActive ? (
                              <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                            ) : (
                              <Error sx={{ color: 'error.main', fontSize: 16 }} />
                            )
                          }
                        >
                          <Avatar sx={{ mr: 2 }}>
                            {(user.firstName?.[0] || '') + (user.lastName?.[0] || '') || user.email?.[0] || '?'}
                          </Avatar>
                        </Badge>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                          {user.company && (
                            <Typography variant="caption" color="text.secondary">
                              {user.company}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={user.role.replace('_', ' ').toUpperCase()}
                        color={getRoleColor(user.role) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.profileCompletion ? (
                        <Box sx={{ minWidth: 160 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption">{user.profileCompletion.status.toUpperCase()}</Typography>
                            <Typography variant="caption">{user.profileCompletion.percentage}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={user.profileCompletion.percentage} />
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">No data</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(user.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getTimeSince(user.updatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleUserAction('view', user)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleUserAction('edit', user)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => setActionMenu({ anchorEl: e.currentTarget, user })}
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
            count={totalUsers}
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
        onClose={() => setActionMenu({ anchorEl: null, user: null })}
      >
        <MenuItem onClick={() => handleUserAction('view', actionMenu.user!)}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUserAction('edit', actionMenu.user!)}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        <Divider />
        {actionMenu.user?.isActive ? (
          <MenuItem onClick={() => handleUserAction('suspend', actionMenu.user!)}>
            <ListItemIcon><Block /></ListItemIcon>
            <ListItemText>Suspend User</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleUserAction('activate', actionMenu.user!)}>
            <ListItemIcon><CheckCircle /></ListItemIcon>
            <ListItemText>Activate User</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleUserAction('impersonate', actionMenu.user!)}>
          <ListItemIcon><Security /></ListItemIcon>
          <ListItemText>Impersonate</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleUserAction('delete', actionMenu.user!)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      {/* User Dialog */}
      <Dialog
        open={userDialog.open}
        onClose={() => setUserDialog({ open: false, mode: 'view', user: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {userDialog.mode === 'create' ? 'Create New User' :
           userDialog.mode === 'edit' ? 'Edit User' : 'User Details'}
        </DialogTitle>
        <DialogContent>
          {userDialog.mode === 'view' && userDialog.user && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56 }}>
                  {(userDialog.user.firstName?.[0] || '') + (userDialog.user.lastName?.[0] || '') || userDialog.user.email?.[0] || '?'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">
                    {userDialog.user.firstName} {userDialog.user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{userDialog.user.email}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip size="small" label={userDialog.user.role.replace('_', ' ').toUpperCase()} color={getRoleColor(userDialog.user.role) as any} variant="outlined" />
                    <Chip size="small" label={userDialog.user.isActive ? 'Active' : 'Inactive'} color={userDialog.user.isActive ? 'success' : 'error'} />
                  </Box>
                </Box>
                {userDialog.user.profileCompletion && (
                  <Box sx={{ minWidth: 220 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption">Profile: {userDialog.user.profileCompletion.status.toUpperCase()}</Typography>
                      <Typography variant="caption">{userDialog.user.profileCompletion.percentage}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={userDialog.user.profileCompletion.percentage} />
                  </Box>
                )}
              </Box>
              <Grid container spacing={2}>
                {userDialog.user.phone && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone fontSize="small" />
                      <Typography variant="body2">{userDialog.user.phone}</Typography>
                    </Box>
                  </Grid>
                )}
                {userDialog.user.location && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" />
                      <Typography variant="body2">{userDialog.user.location}</Typography>
                    </Box>
                  </Grid>
                )}
                {userDialog.user.jobTitle && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Work fontSize="small" />
                      <Typography variant="body2">{userDialog.user.jobTitle}</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
              {userDialog.user.bio && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>About</Typography>
                  <Typography variant="body2" color="text.secondary">{userDialog.user.bio}</Typography>
                </Box>
              )}
              {userDialog.user.skills && userDialog.user.skills.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Skills</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {userDialog.user.skills.map((s) => (
                      <Chip key={s} label={s} size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Experience */}
              {userDialog.user.experience && userDialog.user.experience.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Experience</Typography>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    {userDialog.user.experience.map((exp, idx) => (
                      <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{exp.position} {exp.company ? `• ${exp.company}` : ''}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {exp.startDate} {exp.endDate ? `- ${exp.endDate}` : '(Present)'}
                        </Typography>
                        {exp.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {exp.description}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Education */}
              {userDialog.user.education && userDialog.user.education.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Education</Typography>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    {userDialog.user.education.map((ed, idx) => (
                      <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{ed.degree} {ed.institution ? `• ${ed.institution}` : ''}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ed.startDate} {ed.endDate ? `- ${ed.endDate}` : ''}
                        </Typography>
                        {ed.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {ed.description}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                variant="outlined"
                value={userDialog.mode === 'create' ? formData.firstName : userDialog.user?.firstName || ''}
                onChange={(e) => userDialog.mode === 'create' && setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={userDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                variant="outlined"
                value={userDialog.mode === 'create' ? formData.lastName : userDialog.user?.lastName || ''}
                onChange={(e) => userDialog.mode === 'create' && setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={userDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
                value={userDialog.mode === 'create' ? formData.email : userDialog.user?.email || ''}
                onChange={(e) => userDialog.mode === 'create' && setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={userDialog.mode === 'view'}
              />
            </Grid>
            {userDialog.mode === 'create' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  helperText="Minimum 8 characters required"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  value={userDialog.mode === 'create' ? formData.role : userDialog.user?.role || ''}
                  onChange={(e) => userDialog.mode === 'create' && setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  disabled={userDialog.mode === 'view'}
                >
                  <MenuItem value={UserRole.JOB_SEEKER}>Job Seeker</MenuItem>
                  <MenuItem value={UserRole.EMPLOYER}>Employer</MenuItem>
                  <MenuItem value={UserRole.TEACHER}>Teacher</MenuItem>
                  <MenuItem value={UserRole.STUDENT}>Student</MenuItem>
                  <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                  <MenuItem value={UserRole.SUPER_ADMIN}>Super Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userDialog.mode === 'create' ? formData.isActive : userDialog.user?.isActive}
                    onChange={(e) => userDialog.mode === 'create' && setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    disabled={userDialog.mode === 'view'}
                  />
                }
                label="Active"
              />
            </Grid>
            {userDialog.user?.company && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company"
                  variant="outlined"
                  defaultValue={userDialog.user.company}
                  disabled={userDialog.mode === 'view'}
                />
              </Grid>
            )}
            {userDialog.user?.jobTitle && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job Title"
                  variant="outlined"
                  defaultValue={userDialog.user.jobTitle}
                  disabled={userDialog.mode === 'view'}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog({ open: false, mode: 'view', user: null })}>
            Cancel
          </Button>
          {userDialog.mode !== 'view' && (
            <Button 
              variant="contained"
              onClick={userDialog.mode === 'create' ? handleCreateUser : undefined}
            >
              {userDialog.mode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;