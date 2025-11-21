import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  AppBar,
  Toolbar,
  Avatar,
  styled
} from '@mui/material';
import {
  QrCode,
  Download,
  Refresh,
  CheckCircle,
  AccessTime,
  History,
  Info,
  School,
  Person,
  Event,
  AccessTime as TimeIcon,
  Timer
} from '@mui/icons-material';

// Use require instead of import for qrcode.react to avoid import issues
const QRCode = require('qrcode.react').default || require('qrcode.react');

// Styled components for better UI
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  },
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.85rem',
  padding: '4px 8px',
  borderRadius: 20,
}));

const TeacherAttendancePage: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([
    { id: '1', name: 'John Smith', email: 'john.smith@school.edu', department: 'Mathematics' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@school.edu', department: 'Science' },
    { id: '3', name: 'Michael Brown', email: 'michael.brown@school.edu', department: 'English' },
    { id: '4', name: 'Emily Davis', email: 'emily.davis@school.edu', department: 'History' },
  ]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Fetch attendance records from backend
  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/teacher-attendance');
      const records = await response.json();
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance records on component mount
  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  const generateQRCodeValue = () => {
    return `http://localhost:3001?redirected=true`;
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'teacher-attendance-qr.png';
      link.click();
    }
  };

  const handleViewHistory = async (teacher: any) => {
    setSelectedTeacher(teacher);
    setDialogOpen(true);
    
    // Fetch specific teacher's attendance records
    try {
      const response = await fetch(`http://localhost:5000/api/teacher-attendance/teacher/${teacher.name}`);
      const records = await response.json();
      // Update attendance records for this teacher
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching teacher attendance records:', error);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTeacher(null);
  };

  // Calculate working hours for a record
  const calculateWorkingHours = (record: any) => {
    if (record.duration) {
      const hours = Math.floor(record.duration / 60);
      const minutes = record.duration % 60;
      return `${hours}h ${minutes}m`;
    }
    return '-';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <AppBar position="static" sx={{ borderRadius: 2, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <QrCode sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Teacher Attendance Dashboard
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={fetchAttendanceRecords}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
            }}
          >
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Avatar sx={{ 
          width: 80, 
          height: 80, 
          margin: '0 auto 20px', 
          bgcolor: 'primary.main',
          boxShadow: 3
        }}>
          <School sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          Teacher Attendance System
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          Monitor and manage teacher attendance with QR code scanning
        </Typography>
      </Box>

      <Alert 
        severity="info" 
        sx={{ 
          mb: 4, 
          borderRadius: 3,
          boxShadow: 2,
          '& .MuiAlert-message': { width: '100%' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Info sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>How It Works</Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Simple Process:</strong> Teachers scan the QR code when they start work and scan again when they end work. 
          The system automatically tracks their working hours.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">
              Teachers access: <Link href="http://localhost:3001" target="_blank" sx={{ fontWeight: 600 }}>http://localhost:3001</Link>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Timer sx={{ mr: 1, color: 'secondary.main' }} />
            <Typography variant="body2">
              Real-time tracking
            </Typography>
          </Box>
        </Box>
      </Alert>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      ) : (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <StyledCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Teachers Overview</Typography>
                  </Box>
                  <IconButton 
                    onClick={fetchAttendanceRecords}
                    sx={{ 
                      backgroundColor: 'grey.100',
                      '&:hover': { backgroundColor: 'grey.200' }
                    }}
                  >
                    <Refresh />
                  </IconButton>
                </Box>
                <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Teacher</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Today's Status</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teachers.map((teacher) => {
                        const todayRecord = attendanceRecords.find(
                          record => record.teacherName === teacher.name && record.date.split('T')[0] === date
                        );
                        
                        return (
                          <TableRow 
                            key={teacher.id} 
                            sx={{ 
                              '&:hover': { backgroundColor: 'grey.50' },
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                                  {teacher.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>{teacher.name}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {teacher.email}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={teacher.department} 
                                size="small" 
                                sx={{ 
                                  backgroundColor: 'primary.light', 
                                  color: 'primary.contrastText',
                                  fontWeight: 500
                                }} 
                              />
                            </TableCell>
                            <TableCell>
                              {todayRecord ? (
                                todayRecord.status === 'completed' ? (
                                  <StatusChip 
                                    icon={<CheckCircle />} 
                                    label={`Completed (${new Date(todayRecord.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${todayRecord.endTime ? new Date(todayRecord.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'In Progress'})`} 
                                    color="success" 
                                    size="small" 
                                  />
                                ) : (
                                  <StatusChip 
                                    icon={<AccessTime />} 
                                    label={`In Progress (${new Date(todayRecord.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`} 
                                    color="warning" 
                                    size="small" 
                                  />
                                )
                              ) : (
                                <StatusChip label="Not Started" color="default" size="small" />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="View History">
                                <IconButton 
                                  onClick={() => handleViewHistory(teacher)}
                                  sx={{ 
                                    color: 'primary.main',
                                    '&:hover': { backgroundColor: 'primary.light', color: 'primary.contrastText' }
                                  }}
                                >
                                  <History />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <StyledCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <QrCode sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Attendance QR Code</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Scan this QR code to mark attendance
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'white', 
                    borderRadius: 3, 
                    boxShadow: 2,
                    display: 'inline-block'
                  }}>
                    <QRCode
                      id="qr-code"
                      value={generateQRCodeValue()}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </Box>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleDownloadQR}
                  size="large"
                  sx={{ 
                    py: 1.5,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontWeight: 600,
                    boxShadow: 3,
                    '&:hover': {
                      boxShadow: 5,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Download QR Code
                </Button>
                
                <StyledCard sx={{ mt: 3, backgroundColor: '#f0f4f8' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Info sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Instructions</Typography>
                    </Box>
                    <Box component="ol" sx={{ pl: 2, mb: 0 }}>
                      <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                        Display this QR code in an accessible location
                      </Typography>
                      <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                        Teachers scan the QR code when starting work
                      </Typography>
                      <Typography component="li" variant="body2">
                        Teachers scan the same QR code when ending work
                      </Typography>
                    </Box>
                  </CardContent>
                </StyledCard>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Attendance History Dialog */}
          <Dialog 
            open={dialogOpen} 
            onClose={handleCloseDialog} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
              sx: { borderRadius: 3 }
            }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <History sx={{ mr: 1 }} />
                Attendance History for {selectedTeacher?.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}><Event sx={{ mr: 1, verticalAlign: 'middle' }} /> Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}><TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Start Time</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}><TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> End Time</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}><Timer sx={{ mr: 1, verticalAlign: 'middle' }} /> Duration</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceRecords
                      .filter(record => record.teacherName === selectedTeacher?.name)
                      .map((record) => (
                        <TableRow 
                          key={record._id || record.id}
                          sx={{ 
                            '&:hover': { backgroundColor: 'grey.50' },
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.startTime ? new Date(record.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</TableCell>
                          <TableCell>{record.endTime ? new Date(record.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</TableCell>
                          <TableCell>
                            {calculateWorkingHours(record)}
                          </TableCell>
                          <TableCell>
                            <StatusChip 
                              label={record.status === 'completed' ? 'Completed' : 'In Progress'} 
                              color={record.status === 'completed' ? 'success' : 'warning'} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button 
                onClick={handleCloseDialog}
                variant="contained"
                sx={{ 
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 600
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      )}
    </Container>
  );
};

export default TeacherAttendancePage;