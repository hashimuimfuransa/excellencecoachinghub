import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Avatar,
  Divider,
  Paper
} from '@mui/material';
import {
  School,
  Person,
  Schedule,
  AttachMoney,
  Category,
  TrendingUp,
  CalendarToday
} from '@mui/icons-material';
import { ICourse } from '../../services/courseService';
import { CourseStatus } from '../../shared/types';

interface AdminCourseOverviewProps {
  course: ICourse;
}

const AdminCourseOverview: React.FC<AdminCourseOverviewProps> = ({ course }) => {
  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.APPROVED:
        return 'success';
      case CourseStatus.PENDING_APPROVAL:
        return 'warning';
      case CourseStatus.REJECTED:
        return 'error';
      case CourseStatus.DRAFT:
        return 'info';
      case CourseStatus.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  const formatStatus = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PENDING_APPROVAL:
        return 'Pending Approval';
      case CourseStatus.APPROVED:
        return 'Approved';
      case CourseStatus.REJECTED:
        return 'Rejected';
      case CourseStatus.DRAFT:
        return 'Draft';
      case CourseStatus.ARCHIVED:
        return 'Archived';
      default:
        return 'Unknown';
    }
  };

  const getLevelColor = (level: string) => {
    const normalizedLevel = level?.toLowerCase();
    switch (normalizedLevel) {
      case 'beginner':
        return 'info';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 56,
              height: 56,
              mr: 2
            }}
          >
            <School />
          </Avatar>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              {course.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              by {course.instructor?.firstName} {course.instructor?.lastName}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Course Status */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Chip
                label={formatStatus(course.status)}
                color={getStatusColor(course.status)}
                size="large"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Course Status
              </Typography>
            </Paper>
          </Grid>

          {/* Course Level */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Chip
                label={course.level}
                color={getLevelColor(course.level)}
                size="large"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Difficulty Level
              </Typography>
            </Paper>
          </Grid>

          {/* Duration */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <Schedule color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{course.duration}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Hours Duration
              </Typography>
            </Paper>
          </Grid>

          {/* Price */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {course.price > 0 ? `$${course.price}` : 'FREE'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Course Price
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Course Details */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Course Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Category
              </Typography>
              <Box display="flex" alignItems="center">
                <Category sx={{ mr: 1, fontSize: 20 }} />
                <Chip label={course.category} variant="outlined" />
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Enrollments
              </Typography>
              <Box display="flex" alignItems="center">
                <TrendingUp sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body1">{course.enrollmentCount || 0}</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Created Date
              </Typography>
              <Box display="flex" alignItems="center">
                <CalendarToday sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body1">{formatDate(course.createdAt)}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Instructor Information
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ mr: 2 }}>
                {course.instructor?.firstName?.charAt(0)}{course.instructor?.lastName?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {course.instructor?.firstName} {course.instructor?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.instructor?.email}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Course Description */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Course Description
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            {course.description}
          </Typography>
        </Box>

        {/* Prerequisites */}
        {course.prerequisites && course.prerequisites.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Prerequisites
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {course.prerequisites.map((prereq: string, index: number) => (
                <Chip
                  key={index}
                  label={prereq}
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Learning Outcomes */}
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Learning Outcomes
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {course.learningOutcomes.map((outcome: string, index: number) => (
                <Typography key={index} component="li" variant="body1" sx={{ mb: 1 }}>
                  {outcome}
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {course.tags.map((tag: string, index: number) => (
                <Chip
                  key={index}
                  label={tag}
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCourseOverview;
