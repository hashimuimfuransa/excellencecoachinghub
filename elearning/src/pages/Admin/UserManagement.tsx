import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Tooltip,
  FormHelperText
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  PersonAdd,
  Block,
  CheckCircle,
  Email,
  EmailOutlined,
  Refresh,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { userService, UserFilters } from '../../services/userService';
import { IUser, UserRole } from '../../shared/types';
import { useAuth } from '../../hooks/useAuth';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: undefined,
    status: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{userId: string, oldRole: string, newRole: string} | null>(null);

  // Create user form state
  const [createUserForm, setCreateUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.STUDENT
  });
  const [createUserErrors, setCreateUserErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);

  // Edit user form state
  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: UserRole.STUDENT
  });
  const [editUserErrors, setEditUserErrors] = useState<Record<string, string>>({});
  const [editUserLoading, setEditUserLoading] = useState(false);

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.getAllUsers({
        ...filters,
        page: page + 1,
        limit: rowsPerPage
      });
      
      setUsers(response.users);
      setTotalUsers(response.pagination.totalUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, rowsPerPage, filters]);

  // Handle search
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: event.target.value }));
    setPage(0);
  };

  // Handle filter changes
  const handleRoleFilterChange = (event: any) => {
    setFilters(prev => ({ ...prev, role: event.target.value || undefined }));
    setPage(0);
  };

  const handleStatusFilterChange = (event: any) => {
    setFilters(prev => ({ ...prev, status: event.target.value || undefined }));
    setPage(0);
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle menu
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, user: IUser) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  // Handle user actions
  const handleEditUser = () => {
    if (selectedUser) {
      setEditUserForm({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        role: selectedUser.role
      });
      setEditUserErrors({});
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteUser = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;
    
    try {
      if (selectedUser.isActive) {
        await userService.deactivateUser(selectedUser._id);
        setSuccess('User deactivated successfully');
      } else {
        await userService.activateUser(selectedUser._id);
        setSuccess('User activated successfully');
      }
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
    handleMenuClose();
  };

  const handleToggleEmailVerification = async () => {
    if (!selectedUser) return;
    
    try {
      if (selectedUser.isEmailVerified) {
        await userService.unverifyUserEmail(selectedUser._id);
        setSuccess('User email unverified');
      } else {
        await userService.verifyUserEmail(selectedUser._id);
        setSuccess('User email verified');
      }
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email verification');
    }
    handleMenuClose();
  };

  // Get role color
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return 'error';
      case UserRole.TEACHER:
        return 'warning';
      case UserRole.STUDENT:
        return 'info';
      default:
        return 'default';
    }
  };

  // Get status color
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Validate create user form
  const validateCreateUserForm = () => {
    const errors: Record<string, string> = {};

    if (!createUserForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (createUserForm.firstName.trim().length > 50) {
      errors.firstName = 'First name cannot exceed 50 characters';
    }

    if (!createUserForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (createUserForm.lastName.trim().length > 50) {
      errors.lastName = 'Last name cannot exceed 50 characters';
    }

    if (!createUserForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createUserForm.email)) {
      errors.email = 'Please enter a valid email address';
    } else {
      // Check if email already exists in current users list
      const emailExists = users.some(user =>
        user.email.toLowerCase() === createUserForm.email.trim().toLowerCase()
      );
      if (emailExists) {
        errors.email = 'A user with this email address already exists';
      }
    }

    if (!createUserForm.password) {
      errors.password = 'Password is required';
    } else if (createUserForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(createUserForm.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }

    if (!createUserForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (createUserForm.password !== createUserForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setCreateUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create user form submission
  const handleCreateUser = async () => {
    if (!validateCreateUserForm()) {
      return;
    }

    try {
      setCreateUserLoading(true);
      setError(null);

      await userService.createUser({
        firstName: createUserForm.firstName.trim(),
        lastName: createUserForm.lastName.trim(),
        email: createUserForm.email.trim().toLowerCase(),
        password: createUserForm.password,
        role: createUserForm.role
      });

      const userCredentials = `Email: ${createUserForm.email} | Password: ${createUserForm.password}`;
      setSuccess(`User "${createUserForm.firstName} ${createUserForm.lastName}" created successfully! Login credentials - ${userCredentials}`);

      // Copy credentials to clipboard for easy sharing
      navigator.clipboard.writeText(`Login Credentials for ${createUserForm.firstName} ${createUserForm.lastName}:\nEmail: ${createUserForm.email}\nPassword: ${createUserForm.password}`).catch(() => {
        // Clipboard copy failed, but that's okay
      });

      setCreateDialogOpen(false);
      resetCreateUserForm();
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreateUserLoading(false);
    }
  };

  // Handle create user form changes
  const handleCreateUserFormChange = (field: string, value: any) => {
    setCreateUserForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (createUserErrors[field]) {
      setCreateUserErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Reset create user form
  const resetCreateUserForm = () => {
    setCreateUserForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: UserRole.STUDENT
    });
    setCreateUserErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Handle create dialog close
  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    resetCreateUserForm();
  };

  // Validate edit user form
  const validateEditUserForm = () => {
    console.log('🔍 Validating edit user form:', editUserForm);
    const errors: Record<string, string> = {};

    if (!editUserForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (editUserForm.firstName.trim().length > 50) {
      errors.firstName = 'First name cannot exceed 50 characters';
    }

    if (!editUserForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (editUserForm.lastName.trim().length > 50) {
      errors.lastName = 'Last name cannot exceed 50 characters';
    }

    if (!editUserForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserForm.email)) {
      errors.email = 'Please enter a valid email address';
    } else {
      // Check if email already exists in current users list (excluding current user)
      const emailExists = users.some(user =>
        user.email.toLowerCase() === editUserForm.email.trim().toLowerCase() &&
        user._id !== selectedUser?._id
      );
      if (emailExists) {
        errors.email = 'A user with this email address already exists';
      }
    }

    // Role-specific validation
    if (editUserForm.role && !Object.values(UserRole).includes(editUserForm.role)) {
      errors.role = 'Invalid role selected';
    }

    // Prevent changing current user's own role to non-admin
    if (selectedUser && currentUser?._id === selectedUser._id && editUserForm.role !== UserRole.ADMIN && editUserForm.role !== UserRole.SUPER_ADMIN) {
      errors.role = 'You cannot change your own role from Admin/Super Admin';
    }

    console.log('🔍 Validation errors:', errors);
    setEditUserErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log('🔍 Form is valid:', isValid);
    return isValid;
  };

  // Handle edit user form submission
  const handleEditUserSubmit = async () => {
    console.log('🎯 Edit User Submit clicked!', {
      selectedUser: selectedUser?._id,
      editUserForm,
      validationPassed: validateEditUserForm()
    });

    if (!validateEditUserForm() || !selectedUser) {
      console.log('❌ Validation failed or no selected user');
      return;
    }

    // Check if role is being changed
    const isRoleChanging = selectedUser.role !== editUserForm.role;
    
    if (isRoleChanging) {
      console.log('🔄 Role change detected:', {
        from: selectedUser.role,
        to: editUserForm.role
      });
      
      // Show role change confirmation dialog
      setPendingRoleChange({
        userId: selectedUser._id,
        oldRole: selectedUser.role,
        newRole: editUserForm.role
      });
      setRoleChangeDialogOpen(true);
      return;
    }

    // Proceed with regular update if no role change
    await performUserUpdate();
  };

  // Perform the actual user update
  const performUserUpdate = async () => {
    if (!selectedUser) return;

    try {
      setEditUserLoading(true);
      setError(null);

      console.log('🔄 Updating user with data:', {
        userId: selectedUser._id,
        updateData: {
          firstName: editUserForm.firstName.trim(),
          lastName: editUserForm.lastName.trim(),
          email: editUserForm.email.trim().toLowerCase(),
          role: editUserForm.role
        }
      });

      const result = await userService.updateUser(selectedUser._id, {
        firstName: editUserForm.firstName.trim(),
        lastName: editUserForm.lastName.trim(),
        email: editUserForm.email.trim().toLowerCase(),
        role: editUserForm.role
      });

      console.log('✅ User update successful:', result);

      setSuccess(`User "${editUserForm.firstName} ${editUserForm.lastName}" updated successfully!`);

      setEditDialogOpen(false);
      setRoleChangeDialogOpen(false);
      setPendingRoleChange(null);
      loadUsers();
    } catch (err) {
      console.error('❌ User update failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setEditUserLoading(false);
    }
  };

  // Handle role change confirmation
  const handleRoleChangeConfirm = async () => {
    await performUserUpdate();
  };

  // Handle role change cancellation
  const handleRoleChangeCancel = () => {
    setRoleChangeDialogOpen(false);
    setPendingRoleChange(null);
  };

  // Handle edit user form changes
  const handleEditUserFormChange = (field: string, value: any) => {
    console.log(`📝 Form field '${field}' changed:`, value);
    
    setEditUserForm(prev => {
      const newForm = { ...prev, [field]: value };
      console.log('📝 Updated form state:', newForm);
      return newForm;
    });
    
    // Clear error for this field when user starts typing
    if (editUserErrors[field]) {
      setEditUserErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle edit dialog close
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditUserForm({
      firstName: '',
      lastName: '',
      email: '',
      role: UserRole.STUDENT
    });
    setEditUserErrors({});
  };

  // Generate random password
  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&";
    let password = "";

    // Ensure at least one character from each required category
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // number
    password += "@$!%*?&"[Math.floor(Math.random() * 7)]; // special character

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    const shuffled = password.split('').sort(() => Math.random() - 0.5).join('');

    handleCreateUserFormChange('password', shuffled);
    handleCreateUserFormChange('confirmPassword', shuffled);

    // Copy to clipboard
    navigator.clipboard.writeText(shuffled).then(() => {
      setSuccess('Password generated and copied to clipboard!');
    }).catch(() => {
      setSuccess('Password generated successfully!');
    });
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all users in the Excellence Coaching Hub platform.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={filters.search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role || ''}
                onChange={handleRoleFilterChange}
                label="Role"
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                <MenuItem value={UserRole.SUPER_ADMIN}>Super Admin</MenuItem>
                <MenuItem value={UserRole.TEACHER}>Teacher</MenuItem>
                <MenuItem value={UserRole.STUDENT}>Student</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadUsers}
              disabled={loading}
            >
              Refresh
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Add User
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Email Verified</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          src={user.avatar || undefined}
                          sx={{ mr: 2 }}
                        >
                          {user.firstName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.firstName} {user.lastName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={getStatusColor(user.isActive)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.isEmailVerified ? (
                        <Tooltip title="Email Verified">
                          <Email color="success" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Email Not Verified">
                          <EmailOutlined color="disabled" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, user)}
                        disabled={currentUser?._id === user._id}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditUser}>
          <Edit sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={handleToggleUserStatus}>
          {selectedUser?.isActive ? (
            <>
              <Block sx={{ mr: 1 }} />
              Deactivate
            </>
          ) : (
            <>
              <CheckCircle sx={{ mr: 1 }} />
              Activate
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleToggleEmailVerification}>
          {selectedUser?.isEmailVerified ? (
            <>
              <EmailOutlined sx={{ mr: 1 }} />
              Unverify Email
            </>
          ) : (
            <>
              <Email sx={{ mr: 1 }} />
              Verify Email
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* Create User Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add New User
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Create a new user account with login credentials. The user will be able to log in immediately after creation.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={createUserForm.firstName}
                  onChange={(e) => handleCreateUserFormChange('firstName', e.target.value)}
                  error={!!createUserErrors.firstName}
                  helperText={createUserErrors.firstName || `${createUserForm.firstName.length}/50 characters`}
                  disabled={createUserLoading}
                  inputProps={{ maxLength: 50 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={createUserForm.lastName}
                  onChange={(e) => handleCreateUserFormChange('lastName', e.target.value)}
                  error={!!createUserErrors.lastName}
                  helperText={createUserErrors.lastName || `${createUserForm.lastName.length}/50 characters`}
                  disabled={createUserLoading}
                  inputProps={{ maxLength: 50 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => handleCreateUserFormChange('email', e.target.value)}
                  error={!!createUserErrors.email}
                  helperText={createUserErrors.email}
                  disabled={createUserLoading}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!createUserErrors.role}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={createUserForm.role}
                    onChange={(e) => handleCreateUserFormChange('role', e.target.value)}
                    label="Role"
                    disabled={createUserLoading}
                  >
                    <MenuItem value={UserRole.STUDENT}>Student</MenuItem>
                    <MenuItem value={UserRole.TEACHER}>Teacher</MenuItem>
                    <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                    <MenuItem value={UserRole.SUPER_ADMIN}>Super Admin</MenuItem>
                  </Select>
                  {createUserErrors.role && (
                    <FormHelperText>{createUserErrors.role}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={createUserForm.password}
                  onChange={(e) => handleCreateUserFormChange('password', e.target.value)}
                  error={!!createUserErrors.password}
                  helperText={createUserErrors.password || 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character'}
                  disabled={createUserLoading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={generateRandomPassword}
                    disabled={createUserLoading}
                  >
                    Generate Secure Password
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={createUserForm.confirmPassword}
                  onChange={(e) => handleCreateUserFormChange('confirmPassword', e.target.value)}
                  error={!!createUserErrors.confirmPassword}
                  helperText={createUserErrors.confirmPassword}
                  disabled={createUserLoading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCreateDialogClose}
            disabled={createUserLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={createUserLoading}
            startIcon={createUserLoading ? <CircularProgress size={20} /> : <PersonAdd />}
          >
            {createUserLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit User
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Update user information and role. Changes will take effect immediately.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editUserForm.firstName}
                  onChange={(e) => handleEditUserFormChange('firstName', e.target.value)}
                  error={!!editUserErrors.firstName}
                  helperText={editUserErrors.firstName || `${editUserForm.firstName.length}/50 characters`}
                  disabled={editUserLoading}
                  inputProps={{ maxLength: 50 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editUserForm.lastName}
                  onChange={(e) => handleEditUserFormChange('lastName', e.target.value)}
                  error={!!editUserErrors.lastName}
                  helperText={editUserErrors.lastName || `${editUserForm.lastName.length}/50 characters`}
                  disabled={editUserLoading}
                  inputProps={{ maxLength: 50 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => handleEditUserFormChange('email', e.target.value)}
                  error={!!editUserErrors.email}
                  helperText={editUserErrors.email}
                  disabled={editUserLoading}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!editUserErrors.role}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={editUserForm.role}
                    onChange={(e) => {
                      console.log('🔄 Role changed from', editUserForm.role, 'to', e.target.value);
                      handleEditUserFormChange('role', e.target.value);
                    }}
                    label="Role"
                    disabled={editUserLoading}
                  >
                    <MenuItem value={UserRole.STUDENT}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: 'info.main', 
                          mr: 1 
                        }} />
                        Student
                      </Box>
                    </MenuItem>
                    <MenuItem value={UserRole.TEACHER}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: 'warning.main', 
                          mr: 1 
                        }} />
                        Teacher
                      </Box>
                    </MenuItem>
                    <MenuItem value={UserRole.ADMIN}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: 'error.main', 
                          mr: 1 
                        }} />
                        Admin
                      </Box>
                    </MenuItem>
                    <MenuItem value={UserRole.SUPER_ADMIN}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: 'error.dark', 
                          mr: 1 
                        }} />
                        Super Admin
                      </Box>
                    </MenuItem>
                  </Select>
                  {editUserErrors.role && (
                    <FormHelperText>{editUserErrors.role}</FormHelperText>
                  )}
                  <FormHelperText>
                    Current role: {selectedUser?.role} → New role: {editUserForm.role}
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleEditDialogClose}
            disabled={editUserLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={(e) => {
              console.log('🔘 Save Changes button clicked!', e);
              handleEditUserSubmit();
            }}
            disabled={editUserLoading}
            startIcon={editUserLoading ? <CircularProgress size={20} /> : <Edit />}
          >
            {editUserLoading ? 'Updating...' : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Change Confirmation Dialog */}
      <Dialog
        open={roleChangeDialogOpen}
        onClose={handleRoleChangeCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Role Change
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                ⚠️ Important: Role Change Detected
              </Typography>
              <Typography variant="body2">
                You are about to change the user's role from <strong>{pendingRoleChange?.oldRole}</strong> to <strong>{pendingRoleChange?.newRole}</strong>.
              </Typography>
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>This change will:</strong>
            </Typography>
            
            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
              <li>Immediately update the user's permissions and access levels</li>
              <li>Change their dashboard navigation and available features</li>
              <li>Affect their ability to access certain parts of the system</li>
              <li>Require the user to log out and log back in to see changes</li>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> The user will need to refresh their browser or log out and back in to see the new role permissions.
              </Typography>
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Are you sure you want to proceed with this role change?
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleRoleChangeCancel}
            disabled={editUserLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRoleChangeConfirm}
            disabled={editUserLoading}
            startIcon={editUserLoading ? <CircularProgress size={20} /> : <Edit />}
          >
            {editUserLoading ? 'Updating...' : 'Confirm Role Change'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{selectedUser?.firstName} {selectedUser?.lastName}"?
            This action will deactivate the user account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={async () => {
              if (selectedUser) {
                try {
                  await userService.deleteUser(selectedUser._id);
                  setSuccess('User deleted successfully');
                  loadUsers();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to delete user');
                }
              }
              setDeleteDialogOpen(false);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
