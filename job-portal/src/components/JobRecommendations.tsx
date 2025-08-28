import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Stack,
  IconButton,
  useTheme,
  alpha,
  Grid,
  Paper,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Business,
  LocationOn,
  Schedule,
  AttachMoney,
  BookmarkBorder,
  Bookmark,
  Share,
  ArrowForward,
  TrendingUp,
  WorkOutline,
  Star,
  Verified,
  AccessTime,
  Group
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salary?: { min: number; max: number; currency: string } | string;
  skills?: string[];
  postedAt?: string;
  applicationsCount?: number;
  urgent?: boolean;
  remote?: boolean;
  verified?: boolean;
  matchPercentage?: number;
}

interface JobRecommendationsProps {
  jobs: Job[];
  title?: string;
  subtitle?: string;
  onViewAll?: () => void;
  compact?: boolean;
}

const JobRecommendations: React.FC<JobRecommendationsProps> = ({
  jobs,
  title = "Recommended Jobs",
  subtitle = "Jobs that match your profile",
  onViewAll,
  compact = false
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  // Format salary for display
  const formatSalary = (salary?: { min: number; max: number; currency: string } | string) => {
    if (!salary) return 'Competitive salary';
    if (typeof salary === 'string') return salary;
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.currency} ${salary.max.toLocaleString()}`;
  };

  // Force navigation to ensure page actually changes
  const forceNavigate = (path: string) => {
    console.log(`🔍 [JobRecommendations] Force navigating to: ${path}`);
    window.location.href = path;
  };

  const handleSaveJob = (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
    // TODO: API call to save/unsave job
  };

  const handleShareJob = (job: Job, event: React.MouseEvent) => {
    event.stopPropagation();
    // TODO: Implement sharing functionality
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job opportunity: ${job.title} at ${job.company}`,
        url: `/jobs/${job._id}`
      });
    }
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const JobCard: React.FC<{ job: Job; index: number }> = ({ job, index }) => {
    const isSaved = savedJobs.has(job._id);
    
    return (
      <Card
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[12],
            border: `1px solid ${theme.palette.primary.main}`,
            '& .job-actions': {
              opacity: 1
            }
          }
        }}
        onClick={() => forceNavigate(`/app/jobs/${job._id}`)}
      >
        {/* Match Percentage Badge */}
        {job.matchPercentage && job.matchPercentage > 70 && (
          <Chip
            label={`${job.matchPercentage}% match`}
            size="small"
            color="success"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 1,
              fontWeight: 600
            }}
          />
        )}

        {/* Urgent Badge */}
        {job.urgent && (
          <Chip
            label="Urgent Hiring"
            size="small"
            color="error"
            sx={{
              position: 'absolute',
              top: job.matchPercentage ? 44 : 12,
              right: 12,
              zIndex: 1,
              fontWeight: 600,
              animation: 'pulse 2s infinite'
            }}
          />
        )}

        <CardContent sx={{ p: 3, pb: 2 }}>
          {/* Company Logo and Basic Info */}
          <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 48,
                height: 48
              }}
            >
              <Business />
            </Avatar>
            <Box flex={1}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                  {job.title}
                </Typography>
                {job.verified && (
                  <Tooltip title="Verified Company">
                    <Verified sx={{ color: 'primary.main', fontSize: '20px' }} />
                  </Tooltip>
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {job.company}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                <Box display="flex" alignItems="center">
                  <LocationOn sx={{ fontSize: '16px', color: 'text.secondary', mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    {job.location}
                  </Typography>
                  {job.remote && (
                    <Chip
                      label="Remote"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              </Stack>
            </Box>
          </Stack>

          {/* Job Details */}
          <Stack spacing={1.5} mb={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Schedule sx={{ fontSize: '16px', color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {job.jobType} • {job.experienceLevel}
                </Typography>
              </Box>
              {job.salary && (
                <Box display="flex" alignItems="center">
                  <AttachMoney sx={{ fontSize: '16px', color: 'success.main', mr: 0.5 }} />
                  <Typography variant="caption" color="success.main" fontWeight="medium">
                    {formatSalary(job.salary)}
                  </Typography>
                </Box>
              )}
            </Stack>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                {job.skills.slice(0, 3).map((skill, skillIndex) => (
                  <Chip
                    key={skillIndex}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }}
                  />
                ))}
                {job.skills.length > 3 && (
                  <Chip
                    label={`+${job.skills.length - 3}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      bgcolor: alpha(theme.palette.grey[500], 0.1)
                    }}
                  />
                )}
              </Stack>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Footer */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <AccessTime sx={{ fontSize: '14px', color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">
                {formatTimeAgo(job.postedAt)}
              </Typography>
              {job.applicationsCount && (
                <>
                  <Typography variant="caption" color="text.disabled">
                    •
                  </Typography>
                  <Group sx={{ fontSize: '14px', color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.disabled">
                    {job.applicationsCount} applicants
                  </Typography>
                </>
              )}
            </Stack>

            {/* Action Buttons */}
            <Stack
              direction="row"
              spacing={0.5}
              className="job-actions"
              sx={{ opacity: 0, transition: 'opacity 0.2s ease' }}
            >
              <Tooltip title={isSaved ? "Unsave job" : "Save job"}>
                <IconButton
                  size="small"
                  onClick={(e) => handleSaveJob(job._id, e)}
                  sx={{
                    color: isSaved ? 'primary.main' : 'text.secondary',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                  }}
                >
                  {isSaved ? <Bookmark /> : <BookmarkBorder />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Share job">
                <IconButton
                  size="small"
                  onClick={(e) => handleShareJob(job, e)}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) }
                  }}
                >
                  <Share />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  if (jobs.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <WorkOutline sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No job recommendations available
        </Typography>
        <Typography variant="body2" color="text.disabled" paragraph>
          Complete your profile to get personalized job recommendations
        </Typography>
        <Button variant="outlined" onClick={() => forceNavigate('/app/profile')}>
          Complete Profile
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        {onViewAll && (
          <Button
            endIcon={<ArrowForward />}
            onClick={onViewAll}
            sx={{ textTransform: 'none' }}
          >
            View All
          </Button>
        )}
      </Stack>

      {/* Jobs Grid */}
      <Grid container spacing={3}>
        {jobs.slice(0, compact ? 4 : 6).map((job, index) => (
          <Grid item xs={12} sm={6} lg={compact ? 6 : 4} key={job._id}>
            <JobCard job={job} index={index} />
          </Grid>
        ))}
      </Grid>

      {/* Show More Button for Compact Mode */}
      {compact && jobs.length > 4 && onViewAll && (
        <Box textAlign="center" mt={3}>
          <Button
            variant="outlined"
            size="large"
            onClick={onViewAll}
            startIcon={<TrendingUp />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 4
            }}
          >
            View {jobs.length - 4} More Jobs
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default JobRecommendations;