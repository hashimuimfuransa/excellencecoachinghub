import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Alert,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Box,
  Paper
} from '@mui/material';
import {
  Person,
  Schedule,
  CheckCircle,
  Close,
  Edit,
  TrendingUp,
  MenuBook,
  People,
  CalendarToday
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

const TeacherDashboardContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Here's what's happening with your teaching journey
        </Typography>
      </Box>

      {/* Welcome Card */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Person color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h5" component="h2">
                  Welcome to Your Teaching Dashboard
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" paragraph>
                Manage your courses, students, and teaching activities from this central hub.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} textAlign="right">
              <Button 
                variant="contained" 
                color="primary"
                component={Link}
                to="/dashboard/teacher/profile"
                startIcon={<Person />}
              >
                View Profile
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <MenuBook color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <People color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <CalendarToday color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live Sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                0%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completion Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                🚀 Get Started
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Ready to start teaching? Create your first course and begin your teaching journey.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  component={Link}
                  to="/dashboard/teacher/courses/create"
                  startIcon={<MenuBook />}
                >
                  Create Course
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  component={Link}
                  to="/dashboard/teacher/courses"
                >
                  View Courses
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📚 Teaching Resources
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Access tools and resources to enhance your teaching experience.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  component={Link}
                  to="/dashboard/teacher/live-sessions"
                  startIcon={<CalendarToday />}
                >
                  Live Sessions
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  component={Link}
                  to="/dashboard/teacher/analytics"
                  startIcon={<TrendingUp />}
                >
                  Analytics
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            📈 Recent Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No recent activity yet. Start by creating your first course!
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

const TeacherDashboard: React.FC = () => {
  return <TeacherDashboardContent />;
};

export default TeacherDashboard;