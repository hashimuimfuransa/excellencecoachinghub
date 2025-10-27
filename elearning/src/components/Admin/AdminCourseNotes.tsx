import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Collapse
} from '@mui/material';
import {
  AutoStories,
  Psychology,
  ExpandMore,
  Visibility,
  Download,
  Lightbulb,
  School,
  MenuBook,
  Article,
  Summarize
} from '@mui/icons-material';
import api from '../../services/api';

interface AdminCourseNotesProps {
  courseId: string;
}

interface StructuredNote {
  _id: string;
  title: string;
  content: string;
  type: 'summary' | 'key_points' | 'definitions' | 'examples' | 'exercises';
  weekId?: string;
  materialId?: string;
  createdAt: string;
  updatedAt: string;
  aiGenerated: boolean;
  confidence?: number;
}

const AdminCourseNotes: React.FC<AdminCourseNotesProps> = ({ courseId }) => {
  const [notes, setNotes] = useState<StructuredNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, [courseId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch structured notes for the course
      const response = await api.get(`/courses/${courseId}/notes`).catch(() => {
        // If endpoint doesn't exist, return empty array
        return { data: { data: [] } };
      });
      
      setNotes(response.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const getNoteIcon = (type: string) => {
    switch (type) {
      case 'summary':
        return <Summarize color="primary" />;
      case 'key_points':
        return <Lightbulb color="warning" />;
      case 'definitions':
        return <MenuBook color="info" />;
      case 'examples':
        return <Article color="success" />;
      case 'exercises':
        return <School color="secondary" />;
      default:
        return <AutoStories color="action" />;
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'summary':
        return 'primary';
      case 'key_points':
        return 'warning';
      case 'definitions':
        return 'info';
      case 'examples':
        return 'success';
      case 'exercises':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatNoteType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'default';
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const groupNotesByType = () => {
    const grouped = notes.reduce((acc, note) => {
      if (!acc[note.type]) {
        acc[note.type] = [];
      }
      acc[note.type].push(note);
      return acc;
    }, {} as Record<string, StructuredNote[]>);

    return grouped;
  };

  const handleNoteExpand = (noteId: string) => {
    setExpandedNote(expandedNote === noteId ? null : noteId);
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const groupedNotes = groupNotesByType();
  const noteTypes = Object.keys(groupedNotes);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Psychology sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">
            AI-Generated Notes ({notes.length})
          </Typography>
        </Box>

        {notes.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <AutoStories sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Structured Notes Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-generated notes and summaries will appear here once course materials are processed.
            </Typography>
          </Paper>
        ) : (
          <Box>
            {noteTypes.map((type) => (
              <Accordion key={type} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" width="100%">
                    {getNoteIcon(type)}
                    <Typography variant="subtitle1" sx={{ ml: 2, flexGrow: 1 }}>
                      {formatNoteType(type)}
                    </Typography>
                    <Chip
                      label={groupedNotes[type].length}
                      size="small"
                      color={getNoteTypeColor(type)}
                      sx={{ mr: 2 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {groupedNotes[type].map((note, index) => (
                      <React.Fragment key={note._id}>
                        <ListItem>
                          <ListItemIcon>
                            {getNoteIcon(note.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box>
                                <Box display="flex" alignItems="center" gap={2} mb={1}>
                                  <Typography variant="body1" fontWeight="medium">
                                    {note.title}
                                  </Typography>
                                  {note.aiGenerated && (
                                    <Chip
                                      label="AI Generated"
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  )}
                                  {note.confidence && (
                                    <Chip
                                      label={`${Math.round(note.confidence * 100)}% confidence`}
                                      size="small"
                                      color={getConfidenceColor(note.confidence)}
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  Created: {formatDate(note.createdAt)}
                                </Typography>
                                <Collapse in={expandedNote === note._id}>
                                  <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                      {note.content}
                                    </Typography>
                                  </Paper>
                                </Collapse>
                              </Box>
                            }
                          />
                          <Box>
                            <Tooltip title={expandedNote === note._id ? "Collapse" : "Expand"}>
                              <IconButton
                                size="small"
                                onClick={() => handleNoteExpand(note._id)}
                              >
                                <ExpandMore 
                                  sx={{ 
                                    transform: expandedNote === note._id ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s'
                                  }} 
                                />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download Note">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const blob = new Blob([note.content], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `${note.title}.txt`;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                <Download />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItem>
                        {index < groupedNotes[type].length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Notes Summary */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Notes Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {notes.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Notes
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="success">
                  {notes.filter(note => note.aiGenerated).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  AI Generated
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="warning">
                  {notes.filter(note => note.confidence && note.confidence >= 0.8).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  High Confidence
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="info">
                  {noteTypes.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Note Types
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdminCourseNotes;
