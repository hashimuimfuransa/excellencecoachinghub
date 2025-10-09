import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore,
  MenuBook,
  Timer,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  Schedule,
  Person,
  Download,
  Share,
  Bookmark,
  BookmarkBorder
} from '@mui/icons-material';
import { StructuredNotes } from '../../../services/documentProcessorService';

interface StructuredNotesViewerProps {
  notes: StructuredNotes;
  title: string;
  height?: string;
  onTimeSpent?: (timeSpent: number) => void;
  onComplete?: () => void;
  showProgress?: boolean;
  userId?: string;
}

const StructuredNotesViewer: React.FC<StructuredNotesViewerProps> = ({
  notes,
  title,
  height = '70vh',
  onTimeSpent,
  onComplete,
  showProgress = false,
  userId
}) => {
  const [readSections, setReadSections] = useState<Set<number>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  // Calculate reading progress
  const totalSections = notes.sections.length;
  const readCount = readSections.size;
  const progress = totalSections > 0 ? (readCount / totalSections) * 100 : 0;

  // Track time spent
  React.useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeSpent(elapsed);
      onTimeSpent?.(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, onTimeSpent]);

  // Mark section as read
  const markSectionAsRead = (sectionIndex: number) => {
    setReadSections(prev => new Set([...prev, sectionIndex]));
    
    // Check if all sections are read
    if (readSections.size + 1 === totalSections) {
      onComplete?.();
    }
  };

  // Toggle bookmark
  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  // Download notes as text
  const downloadNotes = () => {
    const content = `
${notes.title}

${notes.summary}

Key Points:
${notes.keyPoints.map(point => `• ${point}`).join('\n')}

${notes.sections.map(section => `
${section.title}

${section.content}

Key Points:
${section.keyPoints.map(point => `• ${point}`).join('\n')}
`).join('\n')}

---
Generated from: ${title}
Reading Time: ${notes.metadata.estimatedReadingTime} minutes
Difficulty: ${notes.metadata.difficulty}
Topics: ${notes.metadata.topics.join(', ')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Share notes
  const shareNotes = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: notes.title,
          text: notes.summary,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${notes.title}\n\n${notes.summary}\n\n${window.location.href}`);
    }
  };

  return (
    <Box height={height} display="flex" flexDirection="column">
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h4" gutterBottom>
              {notes.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" paragraph>
              {title}
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title={isBookmarked ? "Remove bookmark" : "Bookmark"}>
              <IconButton onClick={toggleBookmark} color={isBookmarked ? "primary" : "default"}>
                {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Download notes">
              <IconButton onClick={downloadNotes}>
                <Download />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Share notes">
              <IconButton onClick={shareNotes}>
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Metadata */}
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip 
            icon={<MenuBook />} 
            label={`${notes.metadata.totalSections} Sections`} 
            size="small" 
            variant="outlined"
          />
          <Chip 
            icon={<Timer />} 
            label={`${notes.metadata.estimatedReadingTime} min read`} 
            size="small" 
            variant="outlined"
          />
          <Chip 
            icon={<TrendingUp />} 
            label={notes.metadata.difficulty} 
            size="small" 
            color={notes.metadata.difficulty === 'beginner' ? 'success' : 
                   notes.metadata.difficulty === 'intermediate' ? 'warning' : 'error'}
            variant="outlined"
          />
          <Chip 
            icon={<Schedule />} 
            label={`${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')} spent`} 
            size="small" 
            variant="outlined"
          />
        </Box>

        {/* Progress Bar */}
        {showProgress && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Reading Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {readCount}/{totalSections} sections
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Key Topics */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Key Topics:
          </Typography>
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {notes.metadata.topics.map((topic, index) => (
              <Chip key={index} label={topic} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Summary */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Typography variant="body1" paragraph>
            {notes.summary}
          </Typography>
        </CardContent>
      </Card>

      {/* Key Points */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Key Points
          </Typography>
          <List dense>
            {notes.keyPoints.map((point, index) => (
              <ListItem key={index} sx={{ pl: 0 }}>
                <ListItemIcon>
                  <Lightbulb color="primary" />
                </ListItemIcon>
                <ListItemText primary={point} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Sections */}
      <Box flex={1} overflow="auto">
        <Typography variant="h6" gutterBottom>
          Document Sections
        </Typography>
        
        {notes.sections.map((section, index) => (
          <Accordion 
            key={index} 
            defaultExpanded={index === 0}
            onChange={(_, isExpanded) => {
              if (isExpanded) {
                markSectionAsRead(index);
              }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMore />}
              sx={{ 
                backgroundColor: readSections.has(index) ? 'action.hover' : 'transparent',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <Box display="flex" alignItems="center" gap={1} flex={1}>
                {readSections.has(index) && (
                  <CheckCircle color="success" fontSize="small" />
                )}
                <Typography variant="subtitle1">
                  {section.title}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                {section.content}
              </Typography>
              
              {section.keyPoints.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Key Points:
                  </Typography>
                  <List dense>
                    {section.keyPoints.map((point, pointIndex) => (
                      <ListItem key={pointIndex} sx={{ pl: 0 }}>
                        <ListItemIcon>
                          <Lightbulb color="secondary" />
                        </ListItemIcon>
                        <ListItemText primary={point} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              <Box mt={2}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => markSectionAsRead(index)}
                  disabled={readSections.has(index)}
                  startIcon={<CheckCircle />}
                >
                  {readSections.has(index) ? 'Read' : 'Mark as Read'}
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Completion Message */}
      {readCount === totalSections && totalSections > 0 && (
        <Paper elevation={2} sx={{ p: 2, mt: 2, backgroundColor: 'success.light', color: 'success.contrastText' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle />
            <Typography variant="body1">
              Congratulations! You've completed reading all sections.
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default StructuredNotesViewer;
