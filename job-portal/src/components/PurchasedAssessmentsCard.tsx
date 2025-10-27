import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  Button,
  Avatar,
  Divider,
  LinearProgress,
  Alert,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import {
  Psychology,
  Assessment,
  Star,
  PlayArrow,
  ExpandMore,
  ExpandLess,
  Schedule,
  CheckCircle,
  Lock,
  Refresh,
  Timer
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface PurchasedAssessment {
  levelId: string;
  purchaseId: string;
  levelName: string;
  difficulty: 'Easy' | 'Intermediate' | 'Hard';
  attemptsRemaining: number;
  maxAttempts: number;
  purchasedAt: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  price: number;
  currency: string;
}

interface PurchasedAssessmentsCardProps {
  assessments: PurchasedAssessment[];
  onStartAssessment: (assessment: PurchasedAssessment) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const PurchasedAssessmentsCard: React.FC<PurchasedAssessmentsCardProps> = ({
  assessments,
  onStartAssessment,
  onRefresh,
  loading = false
}) => {
  const theme = useTheme();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Filter assessments by status
  const approvedAssessments = assessments.filter(a => a.approvalStatus === 'approved');
  const pendingAssessments = assessments.filter(a => a.approvalStatus === 'pending');
  const rejectedAssessments = assessments.filter(a => a.approvalStatus === 'rejected');

  const getLevelColor = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'hard': return '#9C27B0';
      default: return '#666';
    }
  };

  const getLevelIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return <Star />;
      case 'intermediate': return <Assessment />;
      case 'hard': return <Psychology />;
      default: return <Assessment />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'RWF'): string => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpanded = (assessmentId: string) => {
    setExpandedCard(expandedCard === assessmentId ? null : assessmentId);
  };

  if (assessments.length === 0) {
    return (
      <Card sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Purchased Assessments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Purchase custom assessments to get started with personalized psychometric tests.
        </Typography>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Your Custom Assessments
        </Typography>
        {onRefresh && (
          <IconButton onClick={onRefresh} disabled={loading}>
            <Refresh sx={{ 
              animation: loading ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} />
          </IconButton>
        )}
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Approved Assessments */}
      {approvedAssessments.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="success.main">
            ✅ Ready to Use ({approvedAssessments.length})
          </Typography>
          <Stack spacing={2}>
            {approvedAssessments.map((assessment) => (
              <motion.div
                key={assessment.purchaseId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  sx={{
                    border: `2px solid ${getLevelColor(assessment.difficulty)}`,
                    background: `linear-gradient(135deg, ${alpha(getLevelColor(assessment.difficulty), 0.05)} 0%, white 100%)`,
                    '&:hover': {
                      boxShadow: `0 8px 25px ${alpha(getLevelColor(assessment.difficulty), 0.2)}`
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ 
                          bgcolor: getLevelColor(assessment.difficulty),
                          width: 48,
                          height: 48
                        }}>
                          {getLevelIcon(assessment.difficulty)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {assessment.levelName}
                          </Typography>
                          <Stack direction="row" spacing={1} mt={0.5}>
                            <Chip 
                              label={assessment.difficulty}
                              size="small"
                              sx={{ 
                                bgcolor: alpha(getLevelColor(assessment.difficulty), 0.1),
                                color: getLevelColor(assessment.difficulty),
                                fontWeight: 'bold'
                              }}
                            />
                            <Badge
                              badgeContent={assessment.attemptsRemaining}
                              color="success"
                              max={99}
                            >
                              <Chip 
                                label={`${assessment.attemptsRemaining}/${assessment.maxAttempts} attempts`}
                                size="small"
                                color={assessment.attemptsRemaining > 0 ? "success" : "error"}
                              />
                            </Badge>
                          </Stack>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton 
                          onClick={() => toggleExpanded(assessment.purchaseId)}
                          size="small"
                        >
                          {expandedCard === assessment.purchaseId ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                        <Button
                          variant="contained"
                          startIcon={<PlayArrow />}
                          onClick={() => onStartAssessment(assessment)}
                          disabled={assessment.attemptsRemaining <= 0}
                          sx={{
                            bgcolor: getLevelColor(assessment.difficulty),
                            '&:hover': {
                              bgcolor: alpha(getLevelColor(assessment.difficulty), 0.8)
                            }
                          }}
                        >
                          {assessment.attemptsRemaining > 0 ? 'Start Assessment' : 'No Attempts Left'}
                        </Button>
                      </Stack>
                    </Box>

                    <Collapse in={expandedCard === assessment.purchaseId}>
                      <Divider sx={{ mb: 2 }} />
                      <Stack spacing={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Purchase Date:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatDate(assessment.purchasedAt)}
                          </Typography>
                        </Box>
                        {assessment.approvedAt && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Approved:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" color="success.main">
                              {formatDate(assessment.approvedAt)}
                            </Typography>
                          </Box>
                        )}
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Amount Paid:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(assessment.price, assessment.currency)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Collapse>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Stack>
        </Box>
      )}

      {/* Pending Assessments */}
      {pendingAssessments.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="warning.main">
            ⏳ Awaiting Approval ({pendingAssessments.length})
          </Typography>
          <Stack spacing={2}>
            {pendingAssessments.map((assessment) => (
              <Card 
                key={assessment.purchaseId}
                sx={{
                  border: `2px solid ${theme.palette.warning.main}`,
                  background: alpha(theme.palette.warning.main, 0.05)
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <Schedule />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {assessment.levelName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Purchased on {formatDate(assessment.purchasedAt)}
                      </Typography>
                    </Box>
                    <Stack alignItems="center">
                      <Chip 
                        label="Pending Approval"
                        color="warning"
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        Usually approved within 5 minutes
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {/* Rejected Assessments */}
      {rejectedAssessments.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="error.main">
            ❌ Rejected ({rejectedAssessments.length})
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Some of your purchases were rejected. Please contact support for refund or clarification.
            </Typography>
          </Alert>
          <Stack spacing={2}>
            {rejectedAssessments.map((assessment) => (
              <Card 
                key={assessment.purchaseId}
                sx={{
                  border: `2px solid ${theme.palette.error.main}`,
                  background: alpha(theme.palette.error.main, 0.05),
                  opacity: 0.7
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <Lock />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {assessment.levelName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Purchased on {formatDate(assessment.purchasedAt)}
                      </Typography>
                    </Box>
                    <Chip 
                      label="Rejected"
                      color="error"
                      size="small"
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default PurchasedAssessmentsCard;