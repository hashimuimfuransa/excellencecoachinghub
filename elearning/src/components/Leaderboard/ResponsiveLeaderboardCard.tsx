import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Avatar,
  Typography,
  Box,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Star,
  WorkspacePremium as Medal
} from '@mui/icons-material';

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatar?: string;
  totalScore: number;
  averageScore: number;
  completedAssessments: number;
  completedAssignments: number;
  totalPoints: number;
  badges: string[];
  streak: number;
  improvement: number;
  courseId?: string;
  courseName?: string;
}

interface ResponsiveLeaderboardCardProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  showCourse?: boolean;
}

const ResponsiveLeaderboardCard: React.FC<ResponsiveLeaderboardCardProps> = ({
  entry,
  isCurrentUser = false,
  showCourse = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const isTopThree = entry.rank <= 3;
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return <Medal />;
    }
  };
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'warning.main';
    if (rank === 2) return 'grey.400';
    if (rank === 3) return '#CD7F32';
    return 'primary.main';
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        border: '2px solid',
        borderColor: isCurrentUser ? 'primary.main' : 
                    isTopThree ? 'warning.main' : 'divider',
        borderRadius: 2,
        background: isCurrentUser 
          ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.05))'
          : isTopThree 
            ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))'
            : 'background.paper',
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
          borderColor: isCurrentUser ? 'primary.dark' : 
                      isTopThree ? 'warning.dark' : 'primary.main'
        }
      }}
    >
      {/* Top 3 Badge */}
      {isTopThree && (
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            right: 16,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontSize: '0.875rem',
            fontWeight: 'bold',
            zIndex: 1,
            boxShadow: 2
          }}
        >
          TOP {entry.rank}
        </Box>
      )}
      
      {/* Current User Badge */}
      {isCurrentUser && (
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            left: 16,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontSize: '0.875rem',
            fontWeight: 'bold',
            zIndex: 1,
            boxShadow: 2
          }}
        >
          YOU
        </Box>
      )}
      
      <CardContent sx={{ p: { xs: 2, sm: 3 }, pt: isTopThree || isCurrentUser ? 3 : 2 }}>
        <Grid container spacing={3}>
          {/* Student Info Section */}
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mb: { xs: 2, md: 0 }
            }}>
              {/* Rank Display */}
              <Box sx={{ 
                textAlign: 'center', 
                minWidth: { xs: 50, sm: 60 },
                flexShrink: 0
              }}>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    mb: 0.5,
                    lineHeight: 1
                  }}
                >
                  {getRankIcon(entry.rank)}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: getRankColor(entry.rank),
                    fontSize: { xs: '0.9rem', sm: '1.1rem' },
                    lineHeight: 1
                  }}
                >
                  #{entry.rank}
                </Typography>
              </Box>
              
              {/* Avatar */}
              <Avatar 
                src={entry.avatar}
                sx={{ 
                  width: { xs: 56, sm: 64 }, 
                  height: { xs: 56, sm: 64 },
                  bgcolor: isCurrentUser ? 'primary.main' : 
                          isTopThree ? 'warning.main' : 'secondary.main',
                  fontSize: { xs: '1.5rem', sm: '1.8rem' },
                  fontWeight: 'bold',
                  flexShrink: 0,
                  border: '3px solid',
                  borderColor: 'background.paper',
                  boxShadow: 2
                }}
              >
                {entry.studentName.charAt(0)}
              </Avatar>
              
              {/* Student Details */}
              <Box sx={{ 
                flex: 1,
                minWidth: 0
              }}>
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  sx={{ 
                    fontWeight: 'bold',
                    color: 'text.primary',
                    mb: 0.5,
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  {entry.studentName}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    wordBreak: 'break-all',
                    lineHeight: 1.3,
                    mb: showCourse && entry.courseName ? 0.5 : 0
                  }}
                >
                  {entry.studentEmail}
                </Typography>
                {showCourse && entry.courseName && (
                  <Chip
                    label={entry.courseName}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
            </Box>
          </Grid>
          
          {/* Performance Stats Section */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3} md={6}>
                <Box sx={{ 
                  textAlign: 'center',
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: 'primary.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'primary.100',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: 'primary.main',
                      mb: 0.5,
                      fontSize: { xs: '1.1rem', sm: '1.5rem' }
                    }}
                  >
                    {entry.averageScore}%
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontWeight: 'medium',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      lineHeight: 1.2
                    }}
                  >
                    Average Score
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3} md={6}>
                <Box sx={{ 
                  textAlign: 'center',
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: 'success.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.100',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: 'success.main',
                      mb: 0.5,
                      fontSize: { xs: '1.1rem', sm: '1.5rem' }
                    }}
                  >
                    {entry.totalPoints}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontWeight: 'medium',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      lineHeight: 1.2
                    }}
                  >
                    Total Points
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3} md={6}>
                <Box sx={{ 
                  textAlign: 'center',
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: 'info.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'info.100',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: 'info.main',
                      mb: 0.5,
                      fontSize: { xs: '1.1rem', sm: '1.5rem' }
                    }}
                  >
                    {entry.completedAssessments}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontWeight: 'medium',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      lineHeight: 1.2
                    }}
                  >
                    Assessments
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3} md={6}>
                <Box sx={{ 
                  textAlign: 'center',
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: 'warning.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'warning.100',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: 'warning.main',
                      mb: 0.5,
                      fontSize: { xs: '1.1rem', sm: '1.5rem' }
                    }}
                  >
                    {entry.completedAssignments}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontWeight: 'medium',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      lineHeight: 1.2
                    }}
                  >
                    Assignments
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Badges Section */}
        {entry.badges && entry.badges.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5, 
            justifyContent: 'center', 
            mt: 2 
          }}>
            {entry.badges.slice(0, 3).map((badge, badgeIndex) => (
              <Chip
                key={badgeIndex}
                label={badge}
                size="small"
                color="primary"
                variant="outlined"
                icon={<Star />}
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
            {entry.badges.length > 3 && (
              <Chip
                label={`+${entry.badges.length - 3}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        )}

        {/* Improvement Indicator */}
        {entry.improvement !== 0 && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            mt: 2,
            p: 1,
            bgcolor: entry.improvement > 0 ? 'success.50' : 
                     entry.improvement < 0 ? 'error.50' : 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: entry.improvement > 0 ? 'success.100' : 
                        entry.improvement < 0 ? 'error.100' : 'grey.200'
          }}>
            {entry.improvement > 0 ? (
              <TrendingUp color="success" sx={{ mr: 0.5, fontSize: 16 }} />
            ) : entry.improvement < 0 ? (
              <TrendingDown color="error" sx={{ mr: 0.5, fontSize: 16 }} />
            ) : (
              <TrendingFlat color="disabled" sx={{ mr: 0.5, fontSize: 16 }} />
            )}
            <Typography 
              variant="caption" 
              color={entry.improvement > 0 ? 'success.main' : 
                     entry.improvement < 0 ? 'error.main' : 'text.secondary'}
              sx={{ fontWeight: 'bold' }}
            >
              {entry.improvement > 0 ? '+' : ''}{entry.improvement}% from last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponsiveLeaderboardCard;