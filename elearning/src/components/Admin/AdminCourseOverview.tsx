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
    <Card sx={{ mb: { xs: 2, sm: 3 } }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box 
          display="flex" 
          alignItems="center" 
          mb={{ xs: 2, sm: 3 }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          textAlign={{ xs: 'center', sm: 'left' }}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              mr: { xs: 0, sm: 2 },
              mb: { xs: 1, sm: 0 }
            }}
          >
            <School />
          </Avatar>
          <Box>
            <Typography 
              variant="h5" 
              component="h1" 
              gutterBottom
              sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
            >
              {course.title}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              by {course.instructor?.firstName} {course.instructor?.lastName}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Course Status */}
          <Grid item xs={6} sm={6} md={3}>
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Chip
                label={formatStatus(course.status)}
                color={getStatusColor(course.status)}
                size="small"
                sx={{ 
                  mb: 1, 
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  height: { xs: 24, sm: 32 }
                }}
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Course Status
              </Typography>
            </Paper>
          </Grid>

          {/* Course Level */}
          <Grid item xs={6} sm={6} md={3}>
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Chip
                label={course.level}
                color={getLevelColor(course.level)}
                size="small"
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  height: { xs: 24, sm: 32 }
                }}
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Difficulty Level
              </Typography>
            </Paper>
          </Grid>

          {/* Duration */}
          <Grid item xs={6} sm={6} md={3}>
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <Schedule 
                  color="primary" 
                  sx={{ 
                    mr: { xs: 0.5, sm: 1 }, 
                    fontSize: { xs: 16, sm: 20 } 
                  }} 
                />
                <Typography 
                  variant="h6"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
                >
                  {course.duration}
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Hours Duration
              </Typography>
            </Paper>
          </Grid>

          {/* Price */}
          <Grid item xs={6} sm={6} md={3}>
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <AttachMoney 
                  color="success" 
                  sx={{ 
                    mr: { xs: 0.5, sm: 1 }, 
                    fontSize: { xs: 16, sm: 20 } 
                  }} 
                />
                <Typography 
                  variant="h6"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
                >
                  {course.price > 0 ? `$${course.price}` : 'FREE'}
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Course Price
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Course Details */}
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              Course Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Category
              </Typography>
              <Box display="flex" alignItems="center">
                <Category sx={{ mr: 1, fontSize: { xs: 16, sm: 20 } }} />
                <Chip 
                  label={course.category} 
                  variant="outlined" 
                  size="small"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Enrollments
              </Typography>
              <Box display="flex" alignItems="center">
                <TrendingUp sx={{ mr: 1, fontSize: { xs: 16, sm: 20 } }} />
                <Typography 
                  variant="body1"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {course.enrollmentCount || 0}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Created Date
              </Typography>
              <Box display="flex" alignItems="center">
                <CalendarToday sx={{ mr: 1, fontSize: { xs: 16, sm: 20 } }} />
                <Typography 
                  variant="body1"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {formatDate(course.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              Instructor Information
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ 
                mr: 2, 
                width: { xs: 40, sm: 48 }, 
                height: { xs: 40, sm: 48 },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                {course.instructor?.firstName?.charAt(0)}{course.instructor?.lastName?.charAt(0)}
              </Avatar>
              <Box>
                <Typography 
                  variant="body1" 
                  fontWeight="medium"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {course.instructor?.firstName} {course.instructor?.lastName}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {course.instructor?.email}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Course Description */}
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
          >
            Course Description
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.6,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {course.description}
          </Typography>
        </Box>

        {/* Prerequisites */}
        {course.prerequisites && course.prerequisites.length > 0 && (
          <Box sx={{ mt: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              Prerequisites
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 } }}>
              {course.prerequisites.map((prereq: string, index: number) => (
                <Chip
                  key={index}
                  label={prereq}
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Learning Outcomes */}
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <Box sx={{ mt: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              Learning Outcomes
            </Typography>
            <Box component="ul" sx={{ pl: { xs: 1.5, sm: 2 } }}>
              {course.learningOutcomes.map((outcome: string, index: number) => (
                <Typography 
                  key={index} 
                  component="li" 
                  variant="body1" 
                  sx={{ 
                    mb: 1,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {outcome}
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <Box sx={{ mt: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 } }}>
              {course.tags.map((tag: string, index: number) => (
                <Chip
                  key={index}
                  label={tag}
                  color="secondary"
                  variant="outlined"
                  size="small"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
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
