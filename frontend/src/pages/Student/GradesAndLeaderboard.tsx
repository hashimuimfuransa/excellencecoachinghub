import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Badge,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  School,
  Assignment,
  Quiz,
  Star,
  Person,
  Group,
  Analytics,
  Timeline,
  CheckCircle,
  Cancel,
  AccessTime,
  Grade,
  Leaderboard,
  WorkspacePremium as Medal,
  EmojiEvents as Trophy,
  WorkspacePremium,
  Celebration,
  AutoAwesome,
  Psychology,
  Speed,
  GpsFixed as Target,
  Insights,
  BarChart,
  PieChart,
  ShowChart,
  Refresh
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { assessmentService } from '../../services/assessmentService';
import { assignmentService } from '../../services/assignmentService';
import { gradesService, StudentGrade, LeaderboardEntry, CourseStats, GradesFilter, LeaderboardFilter } from '../../services/gradesService';

// Interfaces are now imported from gradesService

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`grades-tabpanel-${index}`}
      aria-labelledby={`grades-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const GradesAndLeaderboard: React.FC = () => {
  const { user } = useAuth();
  
  // State management
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [gradesFilter, setGradesFilter] = useState<GradesFilter>({
    type: 'all',
    timeFilter: 'all'
  });
  const [leaderboardFilter, setLeaderboardFilter] = useState<LeaderboardFilter>({
    type: 'overall',
    timeFilter: 'all',
    limit: 50
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [gradesFilter, leaderboardFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load student grades using the service
      const gradesData = await gradesService.getStudentGrades(gradesFilter);
      setGrades(gradesData);

      // Load leaderboard using the service
      const leaderboardData = await gradesService.getLeaderboard(leaderboardFilter);
      setLeaderboard(leaderboardData);

      // Load course stats using the service
      const stats = await gradesService.getCourseStats();
      setCourseStats(stats);

    } catch (err: any) {
      console.error('Failed to load grades and leaderboard:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Mock data functions removed - now using gradesService

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Get grade color
  const getGradeColor = (percentage: number) => {
    return gradesService.getGradeColor(percentage);
  };

  // Get rank color and icon
  const getRankDisplay = (rank: number) => {
    return gradesService.getRankDisplay(rank);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <Grade color="primary" sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            Grades & Leaderboard
          </Typography>
          
          {courseStats && (
            <Stack direction="row" spacing={2}>
              <Chip
                icon={<TrendingUp />}
                label={`Rank #${courseStats.currentRank}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<Star />}
                label={`${Math.round(courseStats.averageGrade)}% Avg`}
                color={getGradeColor(courseStats.averageGrade) as any}
                variant="outlined"
              />
            </Stack>
          )}
          
          <IconButton onClick={loadData} color="primary" sx={{ ml: 2 }}>
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        {courseStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 } }}>
                  <EmojiEvents sx={{ fontSize: { xs: 32, sm: 40 }, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    fontSize: { xs: '1.5rem', sm: '2.125rem' }
                  }}>
                    #{courseStats.currentRank}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Current Rank
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                    out of {courseStats.totalStudents} students
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 } }}>
                  <Star sx={{ fontSize: { xs: 32, sm: 40 }, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: 'success.main',
                    fontSize: { xs: '1.5rem', sm: '2.125rem' }
                  }}>
                    {Math.round(courseStats.averageGrade)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Average Grade
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                    {courseStats.improvementTrend === 'up' ? (
                      <TrendingUp color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                    ) : (
                      <TrendingDown color="error" sx={{ fontSize: 16, mr: 0.5 }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {courseStats.improvementTrend === 'up' ? 'Improving' : 'Needs Focus'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 } }}>
                  <Quiz sx={{ fontSize: { xs: 32, sm: 40 }, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: 'info.main',
                    fontSize: { xs: '1.5rem', sm: '2.125rem' }
                  }}>
                    {courseStats.completedAssessments}/{courseStats.totalAssessments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Assessments
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(courseStats.completedAssessments / courseStats.totalAssessments) * 100}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 } }}>
                  <Assignment sx={{ fontSize: { xs: 32, sm: 40 }, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: 'warning.main',
                    fontSize: { xs: '1.5rem', sm: '2.125rem' }
                  }}>
                    {courseStats.completedAssignments}/{courseStats.totalAssignments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Assignments
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(courseStats.completedAssignments / courseStats.totalAssignments) * 100}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabs */}
        <Card>
          <AppBar position="static" color="default" elevation={0}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab
                icon={<Grade />}
                label="My Grades"
                id="grades-tab-0"
                aria-controls="grades-tabpanel-0"
              />
              <Tab
                icon={<Leaderboard />}
                label="Leaderboard"
                id="grades-tab-1"
                aria-controls="grades-tabpanel-1"
              />
              <Tab
                icon={<Analytics />}
                label="Performance Analytics"
                id="grades-tab-2"
                aria-controls="grades-tabpanel-2"
              />
            </Tabs>
          </AppBar>

          {/* My Grades Tab */}
          <TabPanel value={tabValue} index={0}>
            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={gradesFilter.type || 'all'}
                  label="Type"
                  onChange={(e) => setGradesFilter(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="assessment">Assessments</MenuItem>
                  <MenuItem value="assignment">Assignments</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={gradesFilter.timeFilter || 'all'}
                  label="Time Period"
                  onChange={(e) => setGradesFilter(prev => ({ ...prev, timeFilter: e.target.value as any }))}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="semester">This Semester</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Grades List */}
            {grades.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Grade sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Grades Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete assessments and assignments to see your grades here.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {grades.map((grade) => (
                  <Grid item xs={12} md={6} key={grade._id}>
                    <Card sx={{ 
                      height: '100%',
                      border: '1px solid',
                      borderColor: `${getGradeColor(grade.percentage)}.200`,
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}>
                      <CardContent>
                        {/* Header */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start', 
                          mb: 2,
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: { xs: 2, sm: 0 }
                        }}>
                          <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 'bold', 
                              mb: 1,
                              fontSize: { xs: '1rem', sm: '1.25rem' },
                              lineHeight: 1.2,
                              wordBreak: 'break-word'
                            }}>
                              {grade.assessmentTitle || grade.assignmentTitle}
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              gap: 1, 
                              mb: 1,
                              flexWrap: 'wrap'
                            }}>
                              <Chip
                                icon={grade.type === 'assessment' ? <Quiz /> : <Assignment />}
                                label={grade.type.charAt(0).toUpperCase() + grade.type.slice(1)}
                                size="small"
                                color={grade.type === 'assessment' ? 'primary' : 'secondary'}
                              />
                              <Chip
                                label={grade.status}
                                size="small"
                                color={grade.status === 'graded' ? 'success' : 'warning'}
                              />
                            </Box>
                          </Box>
                          
                          <Box sx={{ 
                            textAlign: { xs: 'left', sm: 'right' },
                            minWidth: { xs: 'auto', sm: '120px' }
                          }}>
                            <Typography variant="h4" sx={{ 
                              fontWeight: 'bold', 
                              color: `${getGradeColor(grade.percentage)}.main`,
                              fontSize: { xs: '1.75rem', sm: '2.125rem' }
                            }}>
                              {grade.percentage}%
                            </Typography>
                            <Typography variant="h6" sx={{ 
                              color: `${getGradeColor(grade.percentage)}.main`,
                              fontWeight: 'bold',
                              fontSize: { xs: '1rem', sm: '1.25rem' }
                            }}>
                              {grade.grade}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Score Details */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            mb: 1,
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 0.5, sm: 0 }
                          }}>
                            <Typography variant="body2" color="text.secondary">
                              Score: {grade.score}/{grade.maxScore}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Time: {grade.timeSpent}min
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={grade.percentage}
                            color={getGradeColor(grade.percentage) as any}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>

                        {/* Metadata */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          mb: 2,
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: { xs: 0.5, sm: 0 }
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            Submitted: {format(new Date(grade.submittedAt), 'MMM dd, yyyy')}
                          </Typography>
                          {grade.gradedAt && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              Graded: {format(new Date(grade.gradedAt), 'MMM dd, yyyy')}
                            </Typography>
                          )}
                        </Box>

                        {/* Feedback */}
                        {(grade.feedback || grade.detailedFeedback) && (
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: 'grey.50', 
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'grey.200'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                Feedback:
                              </Typography>
                              {grade.aiGraded && (
                                <Chip
                                  icon={<Psychology />}
                                  label="AI Graded"
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            
                            {/* Overall Feedback */}
                            {grade.feedback && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {grade.feedback}
                              </Typography>
                            )}

                            {/* Performance Summary for Assessments */}
                            {grade.type === 'assessment' && grade.totalQuestions && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  Performance Summary:
                                </Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                                      <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                        {grade.correctAnswers || 0}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Correct
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'error.50', borderRadius: 1 }}>
                                      <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                        {grade.incorrectAnswers || 0}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Incorrect
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'info.50', borderRadius: 1 }}>
                                      <Typography variant="h6" sx={{ color: 'info.main', fontWeight: 'bold' }}>
                                        {grade.totalQuestions}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Total
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>
                              </Box>
                            )}

                            {/* Detailed Question Feedback */}
                            {grade.detailedFeedback && grade.detailedFeedback.length > 0 && (
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  Question-by-Question Feedback:
                                </Typography>
                                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                  {grade.detailedFeedback.map((feedback, index) => (
                                    <Box
                                      key={feedback.questionId}
                                      sx={{
                                        p: 1.5,
                                        mb: 1,
                                        bgcolor: feedback.isCorrect ? 'success.50' : 'error.50',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: feedback.isCorrect ? 'success.200' : 'error.200'
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                          Question {index + 1}:
                                        </Typography>
                                        <Chip
                                          label={feedback.isCorrect ? 'Correct' : 'Incorrect'}
                                          size="small"
                                          color={feedback.isCorrect ? 'success' : 'error'}
                                          variant="outlined"
                                        />
                                        {feedback.pointsEarned !== undefined && (
                                          <Typography variant="caption" sx={{ ml: 1 }}>
                                            ({feedback.pointsEarned} pts)
                                          </Typography>
                                        )}
                                      </Box>
                                      {feedback.feedback && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                          {feedback.feedback}
                                        </Typography>
                                      )}
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Leaderboard Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Class Leaderboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                See how you rank against your classmates based on overall performance.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Top 3 Podium */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mb: 3, bgcolor: 'gradient.primary' }}>
                  <Typography variant="h6" sx={{ textAlign: 'center', mb: 3, color: 'white' }}>
                    🏆 Top Performers 🏆
                  </Typography>
                  <Grid container spacing={2} justifyContent="center">
                    {leaderboard.slice(0, 3).map((entry, index) => {
                      const rankDisplay = getRankDisplay(entry.rank);
                      const isCurrentUser = entry.studentId === user?.id;
                      
                      return (
                        <Grid item xs={12} sm={6} md={4} key={entry.studentId}>
                          <Card sx={{ 
                            textAlign: 'center',
                            bgcolor: isCurrentUser ? 'primary.50' : 'white',
                            border: isCurrentUser ? '2px solid' : '1px solid',
                            borderColor: isCurrentUser ? 'primary.main' : 'grey.200',
                            transform: entry.rank === 1 ? 'scale(1.05)' : 'scale(1)',
                            zIndex: entry.rank === 1 ? 2 : 1
                          }}>
                            <CardContent>
                              <Box sx={{ position: 'relative', mb: 2 }}>
                                <Avatar sx={{ 
                                  width: 60, 
                                  height: 60, 
                                  mx: 'auto',
                                  bgcolor: 'primary.main'
                                }}>
                                  <Person sx={{ fontSize: 30 }} />
                                </Avatar>
                                <Box sx={{ 
                                  position: 'absolute', 
                                  top: -8, 
                                  right: '50%', 
                                  transform: 'translateX(50%)',
                                  bgcolor: 'white',
                                  borderRadius: '50%',
                                  p: 0.5
                                }}>
                                  {rankDisplay.icon}
                                </Box>
                              </Box>
                              
                              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {isCurrentUser ? 'You' : entry.studentName}
                              </Typography>
                              
                              <Typography variant="h4" sx={{ 
                                fontWeight: 'bold', 
                                color: 'primary.main',
                                mb: 1
                              }}>
                                {entry.averageScore}%
                              </Typography>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {entry.totalPoints} points
                              </Typography>
                              
                              {/* Badges */}
                              <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
                                {entry.badges && entry.badges.length > 0 && entry.badges.slice(0, 2).map((badge, badgeIndex) => (
                                  <Chip
                                    key={badgeIndex}
                                    label={badge}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                ))}
                              </Stack>
                              
                              {/* Improvement */}
                              {entry.improvement > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                                  <TrendingUp color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                                  <Typography variant="caption" color="success.main">
                                    +{entry.improvement}% improvement
                                  </Typography>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Paper>
              </Grid>

              {/* Full Leaderboard Table */}
              <Grid item xs={12}>
                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: { xs: 600, md: 750 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 80 }}>Rank</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>Student</TableCell>
                        <TableCell align="center" sx={{ minWidth: 100 }}>Score</TableCell>
                        <TableCell align="center" sx={{ minWidth: 90, display: { xs: 'none', sm: 'table-cell' } }}>Completed</TableCell>
                        <TableCell align="center" sx={{ minWidth: 90 }}>Points</TableCell>
                        <TableCell align="center" sx={{ minWidth: 80, display: { xs: 'none', md: 'table-cell' } }}>Streak</TableCell>
                        <TableCell align="center" sx={{ minWidth: 80, display: { xs: 'none', md: 'table-cell' } }}>Badges</TableCell>
                        <TableCell align="center" sx={{ minWidth: 80, display: { xs: 'none', sm: 'table-cell' } }}>Trend</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderboard.map((entry) => {
                        const isCurrentUser = entry.studentId === user?.id;
                        const rankDisplay = getRankDisplay(entry.rank);
                        
                        return (
                          <TableRow 
                            key={entry.studentId}
                            sx={{ 
                              bgcolor: isCurrentUser ? 'primary.50' : 'inherit',
                              '&:hover': { bgcolor: isCurrentUser ? 'primary.100' : 'grey.50' }
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {rankDisplay.icon}
                                <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                                  #{entry.rank}
                                </Typography>
                              </Box>
                            </TableCell>
                            
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                  <Person />
                                </Avatar>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: isCurrentUser ? 'bold' : 'normal',
                                  color: isCurrentUser ? 'primary.main' : 'inherit'
                                }}>
                                  {isCurrentUser ? 'You' : entry.studentName}
                                </Typography>
                              </Box>
                            </TableCell>
                            
                            <TableCell align="center">
                              <Typography variant="h6" sx={{ 
                                fontWeight: 'bold',
                                color: getGradeColor(entry.averageScore) + '.main'
                              }}>
                                {entry.averageScore}%
                              </Typography>
                            </TableCell>
                            
                            <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              <Typography variant="body2">
                                {entry.completedAssessments + entry.completedAssignments} items
                              </Typography>
                            </TableCell>
                            
                            <TableCell align="center">
                              <Chip
                                label={entry.totalPoints}
                                color="primary"
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                            
                            <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Celebration sx={{ fontSize: 16, mr: 0.5, color: 'warning.main' }} />
                                <Typography variant="body2">
                                  {entry.streak}
                                </Typography>
                              </Box>
                            </TableCell>
                            
                            <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <Badge badgeContent={entry.badges.length} color="primary">
                                <EmojiEvents color="warning" />
                              </Badge>
                            </TableCell>
                            
                            <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {entry.improvement > 0 ? (
                                  <>
                                    <TrendingUp color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                                    <Typography variant="body2" color="success.main">
                                      +{entry.improvement}%
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown color="error" sx={{ fontSize: 16, mr: 0.5 }} />
                                    <Typography variant="body2" color="error.main">
                                      {entry.improvement}%
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Performance Analytics Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              {/* Performance Overview */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <ShowChart sx={{ mr: 1 }} />
                      Performance Trend
                    </Typography>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Performance chart would be displayed here
                      </Typography>
                      <BarChart sx={{ fontSize: 64, color: 'grey.300', mt: 2 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Subject Breakdown */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <PieChart sx={{ mr: 1 }} />
                      Subject Performance
                    </Typography>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Subject breakdown chart would be displayed here
                      </Typography>
                      <PieChart sx={{ fontSize: 64, color: 'grey.300', mt: 2 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Strengths and Improvements */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Target sx={{ mr: 1 }} />
                      Strong Areas
                    </Typography>
                    {courseStats?.strongSubjects && courseStats.strongSubjects.length > 0 ? (
                      courseStats.strongSubjects.map((subject, index) => (
                        <Chip
                          key={index}
                          label={subject}
                          color="success"
                          sx={{ mr: 1, mb: 1 }}
                          icon={<CheckCircle />}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No strong areas identified yet.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Psychology sx={{ mr: 1 }} />
                      Areas for Improvement
                    </Typography>
                    {courseStats?.improvementAreas && courseStats.improvementAreas.length > 0 ? (
                      courseStats.improvementAreas.map((area, index) => (
                        <Chip
                          key={index}
                          label={area}
                          color="warning"
                          sx={{ mr: 1, mb: 1 }}
                          icon={<AutoAwesome />}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No improvement areas identified yet.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Card>
      </Container>
    </Box>
  );
};

export default GradesAndLeaderboard;