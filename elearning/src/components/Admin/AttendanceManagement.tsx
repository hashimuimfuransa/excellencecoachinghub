import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  HelpOutline,
  Edit,
  Save,
  Close,
  CalendarToday,
  TrendingUp,
  Assessment
} from '@mui/icons-material';
// Removed MUI X date picker dependencies - using regular date inputs instead

import { 
  studentService, 
  IStudent, 
  IAttendanceRecord,
  MarkAttendanceData,
  BulkAttendanceData
} from '../../services/studentService';

interface AttendanceManagementProps {
  student: IStudent;
  open: boolean;
  onClose: () => void;
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({
  student,
  open,
  onClose
}) => {
  const [attendanceRecords, setAttendanceRecords] = useState<IAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Editing state
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  
  // Mark attendance dialog
  const [markAttendanceOpen, setMarkAttendanceOpen] = useState(false);
  const [markAttendanceData, setMarkAttendanceData] = useState<Partial<MarkAttendanceData>>({
    studentId: student._id,
    status: 'present'
  });

  // Load attendance records
  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll load all attendance records for the student
      // In a real implementation, you'd call the API with filters
      const response = await studentService.getStudentDetails(student._id);
      setAttendanceRecords(response.attendanceRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && student) {
      loadAttendanceRecords();
    }
  }, [open, student]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'error';
      case 'excused': return 'info';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string): React.ReactElement | undefined => {
    switch (status) {
      case 'present': return <CheckCircle />;
      case 'late': return <Schedule />;
      case 'absent': return <Cancel />;
      case 'excused': return <HelpOutline />;
      default: return undefined;
    }
  };

  // Handle edit attendance
  const handleEditAttendance = (record: IAttendanceRecord) => {
    setEditingRecord(record._id);
    setEditStatus(record.status);
    setEditNotes(record.notes || '');
  };

  // Save attendance edit
  const handleSaveEdit = async (recordId: string) => {
    try {
      setLoading(true);
      // In a real implementation, you'd call an update API
      // For now, we'll just update the local state
      setAttendanceRecords(prev => 
        prev.map(record => 
          record._id === recordId 
            ? { ...record, status: editStatus as any, notes: editNotes }
            : record
        )
      );
      setEditingRecord(null);
      setSuccess('Attendance updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditStatus('');
    setEditNotes('');
  };

  // Mark new attendance
  const handleMarkAttendance = async () => {
    try {
      setLoading(true);
      await studentService.markAttendance(markAttendanceData as MarkAttendanceData);
      setSuccess('Attendance marked successfully');
      setMarkAttendanceOpen(false);
      loadAttendanceRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  // Calculate attendance statistics
  const calculateStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const excused = attendanceRecords.filter(r => r.status === 'excused').length;
    const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

    return { total, present, late, absent, excused, attendanceRate };
  };

  const stats = calculateStats();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {student.firstName} {student.lastName} - Attendance Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<CalendarToday />}
            onClick={() => setMarkAttendanceOpen(true)}
          >
            Mark Attendance
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
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

        {/* Attendance Statistics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.present}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Present
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.late}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Late
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {stats.absent}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Absent
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {stats.excused}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Excused
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={stats.attendanceRate >= 75 ? 'success.main' : 'error.main'}>
                  {stats.attendanceRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Attendance Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Course</InputLabel>
                <Select
                  value={selectedCourse}
                  label="Course"
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <MenuItem value="all">All Courses</MenuItem>
                  {/* Add course options here */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={loadAttendanceRecords}
                disabled={loading}
              >
                Filter
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Attendance Records Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Marked By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : attendanceRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                attendanceRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {record.course.title}
                    </TableCell>
                    <TableCell>
                      {editingRecord === record._id ? (
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                          >
                            <MenuItem value="present">Present</MenuItem>
                            <MenuItem value="late">Late</MenuItem>
                            <MenuItem value="absent">Absent</MenuItem>
                            <MenuItem value="excused">Excused</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          icon={getStatusIcon(record.status)}
                          label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          color={getStatusColor(record.status) as any}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {record.checkInTime 
                        ? new Date(record.checkInTime).toLocaleTimeString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {record.duration ? `${record.duration} min` : '-'}
                    </TableCell>
                    <TableCell>
                      {editingRecord === record._id ? (
                        <TextField
                          size="small"
                          multiline
                          rows={2}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          sx={{ minWidth: 150 }}
                        />
                      ) : (
                        record.notes || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {record.markedBy.firstName} {record.markedBy.lastName}
                    </TableCell>
                    <TableCell>
                      {editingRecord === record._id ? (
                        <Box>
                          <Tooltip title="Save">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSaveEdit(record._id)}
                            >
                              <Save />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                            >
                              <Close />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditAttendance(record)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Mark Attendance Dialog */}
      <Dialog open={markAttendanceOpen} onClose={() => setMarkAttendanceOpen(false)}>
        <DialogTitle>Mark Attendance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Course</InputLabel>
                <Select
                  value={markAttendanceData.courseId || ''}
                  label="Course"
                  onChange={(e) => setMarkAttendanceData(prev => ({ ...prev, courseId: e.target.value }))}
                >
                  {student.enrollments?.map((enrollment) => (
                    <MenuItem key={enrollment.courseId} value={enrollment.courseId}>
                      Course {enrollment.courseId.slice(-6)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={markAttendanceData.status || 'present'}
                  label="Status"
                  onChange={(e) => setMarkAttendanceData(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="excused">Excused</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={markAttendanceData.notes || ''}
                onChange={(e) => setMarkAttendanceData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkAttendanceOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleMarkAttendance}
            disabled={!markAttendanceData.courseId || loading}
          >
            Mark Attendance
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default AttendanceManagement;
