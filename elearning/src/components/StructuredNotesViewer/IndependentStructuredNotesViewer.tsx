import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Badge,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Grid,
  CardActionArea,
  Collapse,
  CircularProgress
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
  PictureAsPdf,
  Share,
  Bookmark,
  BookmarkBorder,
  Search,
  Print,
  Fullscreen,
  FullscreenExit,
  Notes,
  Quiz,
  Assignment,
  School,
  AutoAwesome,
  Visibility,
  VisibilityOff,
  FilterList,
  Sort,
  Star,
  StarBorder,
  ContentCopy,
  Highlight,
  NoteAdd,
  Assessment,
  ArrowBack
} from '@mui/icons-material';
import { StructuredNotes } from '../../services/documentProcessorService';
import './StructuredNotesViewer.css';

interface IndependentStructuredNotesViewerProps {
  // Direct content props
  structuredNotes?: StructuredNotes;
  content?: any; // For backward compatibility with nested content structure
  title: string;
  height?: string;
  onTimeSpent?: (timeSpent: number) => void;
  onComplete?: () => void;
  progressData?: any;
  onProgressUpdate?: (progress: any) => void;
  showProgress?: boolean;
  userId?: string;
  
  // Loading and error states
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  
  // Navigation
  onBack?: () => void;
}

// Memoized section component for performance
const SectionAccordion = React.memo(({ 
  section, 
  originalIndex,
  index,
  isExpanded, 
  onExpansionChange, 
  readSections, 
  starredSections, 
  onToggleStar, 
  onToggleUserNote, 
  showUserNotes, 
  userNotes, 
  onAddUserNote, 
  showKeyPointsOnly, 
  onCopyToClipboard, 
  onMarkAsRead,
  expandedContent,
  onToggleExpandedContent,
  searchQuery,
  highlightSearchTerms
}: any) => (
  <Accordion 
    expanded={isExpanded}
    onChange={(event, isExpanded) => {
      console.log('Accordion onChange:', index, isExpanded);
      onExpansionChange(index, isExpanded);
    }}
    sx={{ 
      mb: 2,
      bgcolor: 'white',
      '&:before': { display: 'none' },
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderRadius: 2,
      overflow: 'hidden'
    }}
  >
    <AccordionSummary 
      expandIcon={<ExpandMore />}
      sx={{ 
        backgroundColor: readSections.has(originalIndex) ? 'action.hover' : 'transparent',
        '&:hover': { backgroundColor: 'action.hover' },
        px: 3,
        py: 2,
        minHeight: 64
      }}
    >
      <Box display="flex" alignItems="center" gap={1} flex={1}>
        {readSections.has(originalIndex) && (
          <CheckCircle color="success" fontSize="small" />
        )}
        {starredSections.has(originalIndex) && (
          <Star color="warning" fontSize="small" />
        )}
        <Typography variant="subtitle1" component="span">
          Section {index + 1}: {searchQuery ? highlightSearchTerms(section.title, searchQuery) : section.title}
        </Typography>
      </Box>
      
      <Box display="flex" gap={0.5}>
        <Tooltip title={starredSections.has(originalIndex) ? "Remove from favorites" : "Add to favorites"}>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(originalIndex);
            }}
          >
            {starredSections.has(originalIndex) ? <Star /> : <StarBorder />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Add personal note">
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onToggleUserNote(originalIndex);
            }}
          >
            <NoteAdd />
          </IconButton>
        </Tooltip>
      </Box>
    </AccordionSummary>
    
    <AccordionDetails sx={{ px: 3, py: 2 }}>
      {/* User Notes */}
      <Collapse in={showUserNotes.get(originalIndex) || false}>
        <Card sx={{ mb: 3, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your Notes:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Add your personal notes here..."
              value={userNotes.get(originalIndex) || ''}
              onChange={(e) => onAddUserNote(originalIndex, e.target.value)}
              variant="outlined"
              size="small"
            />
          </CardContent>
        </Card>
      </Collapse>
      
      {/* Section Content */}
      {!showKeyPointsOnly && (
        <Typography 
          variant="body1" 
          paragraph 
          sx={{ 
            lineHeight: 1.7, 
            fontSize: '1.05rem',
            mb: 3,
            color: 'text.primary'
          }}
        >
          {section.content.length > 2000 && !expandedContent.has(originalIndex) ? (
            <>
              {searchQuery ? highlightSearchTerms(section.content.substring(0, 2000), searchQuery) : section.content.substring(0, 2000)}...
              <Button 
                size="small" 
                onClick={() => onToggleExpandedContent(originalIndex)}
                sx={{ ml: 1 }}
              >
                Show More
              </Button>
            </>
          ) : (
            <>
              {searchQuery ? highlightSearchTerms(section.content, searchQuery) : section.content}
              {section.content.length > 2000 && expandedContent.has(originalIndex) && (
                <Button 
                  size="small" 
                  onClick={() => onToggleExpandedContent(originalIndex)}
                  sx={{ ml: 1 }}
                >
                  Show Less
                </Button>
              )}
            </>
          )}
        </Typography>
      )}
      
      {/* Key Points */}
      {section.keyPoints && section.keyPoints.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Key Points:
          </Typography>
          <List>
            {section.keyPoints.map((point: string, pointIndex: number) => (
              <ListItem key={pointIndex} sx={{ pl: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Lightbulb color="secondary" />
                </ListItemIcon>
                <ListItemText 
                  primary={searchQuery ? highlightSearchTerms(point, searchQuery) : point}
                  primaryTypographyProps={{ 
                    component: 'div',
                    sx: { 
                      fontSize: '1.05rem',
                      lineHeight: 1.6
                    }
                  }}
                />
                <IconButton 
                  size="small" 
                  onClick={() => onCopyToClipboard(point)}
                  title="Copy point"
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      
      {/* Action Buttons */}
      <Box mt={3} display="flex" gap={2} flexWrap="wrap" sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          variant="outlined"
          onClick={() => onMarkAsRead(originalIndex)}
          disabled={readSections.has(originalIndex)}
          startIcon={<CheckCircle />}
          sx={{ minWidth: 140 }}
        >
          {readSections.has(originalIndex) ? 'Read' : 'Mark as Read'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => onCopyToClipboard(section.content)}
          startIcon={<ContentCopy />}
          sx={{ minWidth: 140 }}
        >
          Copy Content
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => onToggleUserNote(originalIndex)}
          startIcon={<NoteAdd />}
          sx={{ minWidth: 140 }}
        >
          {showUserNotes.get(originalIndex) ? 'Hide Notes' : 'Add Notes'}
        </Button>
      </Box>
    </AccordionDetails>
  </Accordion>
));

const IndependentStructuredNotesViewer: React.FC<IndependentStructuredNotesViewerProps> = ({
  structuredNotes,
  content,
  title,
  height = '70vh',
  onTimeSpent,
  onComplete,
  progressData,
  onProgressUpdate,
  showProgress = false,
  userId,
  loading = false,
  error = null,
  onRetry,
  onBack
}) => {
  const [readSections, setReadSections] = useState<Set<number>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  // Initialize with progress data
  useEffect(() => {
    if (progressData) {
      setReadSections(new Set(progressData.readSections || []));
      setTimeSpent(progressData.timeSpent || 0);
      setIsBookmarked(progressData.bookmarks && progressData.bookmarks.length > 0);
    }
  }, [progressData]);
  
  // Enhanced features state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = React.useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showKeyPointsOnly, setShowKeyPointsOnly] = useState(false);
  const [starredSections, setStarredSections] = useState<Set<number>>(new Set());
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSpeedDial, setShowSpeedDial] = useState(false);
  const [userNotes, setUserNotes] = useState<Map<number, string>>(new Map());
  const [showUserNotes, setShowUserNotes] = useState<Map<number, boolean>>(new Map());
  
  // Performance optimization state
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set([0, 1, 2])); // First 3 sections visible initially
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0])); // Only first section expanded initially
  const [isLoading, setIsLoading] = useState(false);
  const [expandedContent, setExpandedContent] = useState<Set<number>>(new Set()); // Track which sections have full content expanded
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Extract structured notes from various possible sources
  const notes = React.useMemo(() => {
    // Priority 1: Direct structuredNotes prop
    if (structuredNotes) {
      return structuredNotes;
    }
    
    // Priority 2: Nested in content.structuredNotes
    if (content?.structuredNotes) {
      return content.structuredNotes;
    }
    
    // Priority 3: Content itself is structured notes
    if (content && typeof content === 'object' && content.title && content.sections) {
      return content;
    }
    
    return null;
  }, [structuredNotes, content]);

  // Initialize filtered sections when notes change
  useEffect(() => {
    if (notes?.sections) {
      setFilteredSections(notes.sections);
    }
  }, [notes]);

  // Calculate reading progress
  const totalSections = notes?.sections?.length || 0;
  const readCount = readSections.size;
  const progress = totalSections > 0 ? (readCount / totalSections) * 100 : 0;

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeSpent(elapsed);
      onTimeSpent?.(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, onTimeSpent]);

  // Search functionality - only search on Enter key press
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Handle search on Enter key press
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      performSearch();
    }
  };

  // Perform search function
  const performSearch = () => {
    if (searchQuery.trim() === '') {
      setActiveSearchQuery('');
      setFilteredSections(notes?.sections || []);
      setVisibleSections(new Set([0, 1, 2]));
      setExpandedSections(new Set([0]));
      return;
    }

    setIsSearching(true);
    
    // Use requestIdleCallback for non-blocking search
    const executeSearch = () => {
      const searchTerm = searchQuery.toLowerCase();
      const filtered = (notes?.sections || []).filter((section: any) => {
        // Check title first (fastest)
        if (section.title.toLowerCase().includes(searchTerm)) return true;
        
        // Check key points (medium speed)
        if (section.keyPoints?.some((point: string) => 
          point.toLowerCase().includes(searchTerm)
        )) return true;
        
        // Check content last (slowest, but only if other checks fail)
        if (section.content.toLowerCase().includes(searchTerm)) return true;
        
        return false;
      });
      
      setActiveSearchQuery(searchQuery);
      setFilteredSections(filtered);
      // Show all filtered sections when searching
      setVisibleSections(new Set(filtered.map((_, index) => index)));
      setExpandedSections(new Set(filtered.map((_, index) => index)));
      setIsSearching(false);
    };

    // Use requestIdleCallback if available, otherwise use setTimeout
    if (window.requestIdleCallback) {
      window.requestIdleCallback(executeSearch);
    } else {
      setTimeout(executeSearch, 0);
    }
  };

  // Initialize filtered sections when notes change
  useEffect(() => {
    if (notes?.sections) {
      setFilteredSections(notes.sections);
      setVisibleSections(new Set([0, 1, 2]));
      setExpandedSections(new Set([0]));
    }
  }, [notes?.sections]);

  // Intersection Observer for lazy loading sections
  useEffect(() => {
    if (!scrollContainerRef.current || !filteredSections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionIndex = parseInt(entry.target.getAttribute('data-section-index') || '0');
            setVisibleSections(prev => new Set([...prev, sectionIndex]));
          }
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '200px', // Load sections 200px before they come into view
        threshold: 0.1
      }
    );

    // Observe all section elements (both placeholders and actual sections)
    const sectionElements = scrollContainerRef.current.querySelectorAll('[data-section-index]');
    sectionElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [filteredSections]);

  // Enhanced functionality methods
  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  const toggleStar = (sectionIndex: number) => {
    setStarredSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionIndex)) {
        newSet.delete(sectionIndex);
        showMessage('Removed from favorites');
      } else {
        newSet.add(sectionIndex);
        showMessage('Added to favorites');
      }
      return newSet;
    });
  };

  const addUserNote = (sectionIndex: number, note: string) => {
    setUserNotes(prev => new Map(prev.set(sectionIndex, note)));
    showMessage('Note saved');
  };

  const toggleUserNote = (sectionIndex: number) => {
    setShowUserNotes(prev => new Map(prev.set(sectionIndex, !prev.get(sectionIndex))));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage('Copied to clipboard');
  };

  const printNotes = () => {
    window.print();
  };

  // Mark section as read
  const markSectionAsRead = (sectionIndex: number) => {
    setReadSections(prev => {
      const newSet = new Set([...prev, sectionIndex]);
      
      // Update progress tracking
      onProgressUpdate?.({
        readSections: Array.from(newSet)
      });
      
      return newSet;
    });
    
    // Check if all sections are read
    if (readSections.size + 1 === totalSections) {
      onComplete?.();
    }
  };

  // Handle section expansion with performance optimization
  const handleSectionExpansion = (sectionIndex: number, isExpanded: boolean) => {
    console.log('Section expansion:', sectionIndex, 'isExpanded:', isExpanded);
    
    if (isExpanded) {
      // Find the original index for this section
      const originalIndex = notes.sections.findIndex((s: any) => s === filteredSections[sectionIndex]);
      
      // Mark section as read when expanded (only if originalIndex is valid)
      if (originalIndex >= 0) {
        markSectionAsRead(originalIndex);
      }
      
      // Add to expanded sections
      setExpandedSections(prev => {
        const newSet = new Set([...prev, sectionIndex]);
        console.log('Expanded sections updated:', Array.from(newSet));
        return newSet;
      });
      
      // Make section visible if not already
      setVisibleSections(prev => {
        const newSet = new Set([...prev, sectionIndex]);
        console.log('Visible sections updated:', Array.from(newSet));
        return newSet;
      });
    } else {
      // Remove from expanded sections
      setExpandedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionIndex);
        console.log('Expanded sections updated (removed):', Array.from(newSet));
        return newSet;
      });
    }
  };

  // Load more sections when user scrolls near the end
  const handleLoadMore = () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Load next 5 sections
    const currentMax = Math.max(...Array.from(visibleSections), -1);
    const nextSections = Array.from({ length: 5 }, (_, i) => currentMax + i + 1)
      .filter(index => index < filteredSections.length);
    
    if (nextSections.length > 0) {
      setVisibleSections(prev => new Set([...prev, ...nextSections]));
      setExpandedSections(prev => new Set([...prev, ...nextSections]));
    }
    
    setTimeout(() => setIsLoading(false), 300);
  };

  // Toggle expanded content for long sections
  const toggleExpandedContent = (sectionIndex: number) => {
    setExpandedContent(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionIndex)) {
        newSet.delete(sectionIndex);
      } else {
        newSet.add(sectionIndex);
      }
      return newSet;
    });
  };

  // Optimized search highlighting with memoization
  const highlightSearchTerms = React.useCallback((text: string, searchTerm: string) => {
    if (!searchTerm.trim() || !text) return text;
    
    // Limit highlighting to prevent performance issues
    if (text.length > 5000) {
      return text; // Skip highlighting for very long text
    }
    
    try {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '0 2px' }}>
            {part}
          </mark>
        ) : part
      );
    } catch (error) {
      // Fallback to plain text if regex fails
      console.warn('Search highlighting failed:', error);
      return text;
    }
  }, []);

  // Toggle bookmark
  const toggleBookmark = () => {
    setIsBookmarked(prev => {
      const newValue = !prev;
      
      // Update progress tracking
      onProgressUpdate?.({
        isBookmarked: newValue
      });
      
      return newValue;
    });
  };

  // Enhanced fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (fullscreenRef.current) {
          if (fullscreenRef.current.requestFullscreen) {
            await fullscreenRef.current.requestFullscreen();
          } else if ((fullscreenRef.current as any).webkitRequestFullscreen) {
            await (fullscreenRef.current as any).webkitRequestFullscreen();
          } else if ((fullscreenRef.current as any).msRequestFullscreen) {
            await (fullscreenRef.current as any).msRequestFullscreen();
          }
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      // Fallback to simple state toggle if fullscreen API fails
      setIsFullscreen(!isFullscreen);
    }
  };

  // Handle fullscreen change events and keyboard shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Exit fullscreen with ESC key
      if (event.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Download notes as text with enhanced content
  const downloadNotes = () => {
    if (!notes) return;
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const currentDate = new Date();
    const readingProgress = Math.round((readSections.size / totalSections) * 100);
    
    let content = `
${'='.repeat(60)}
${notes.title.toUpperCase()}
${'='.repeat(60)}

Generated on: ${formatDate(currentDate)}
Source: ${title}
Reading Progress: ${readingProgress}% (${readSections.size}/${totalSections} sections read)
Time Spent: ${Math.round(timeSpent / 60)} minutes
Bookmarked: ${isBookmarked ? 'Yes' : 'No'}

${'='.repeat(60)}
SUMMARY
${'='.repeat(60)}

${notes.summary}

${'='.repeat(60)}
KEY POINTS
${'='.repeat(60)}

${notes.keyPoints.map((point: string, index: number) => `${index + 1}. ${point}`).join('\n')}

${'='.repeat(60)}
DOCUMENT SECTIONS
${'='.repeat(60)}

`;

    // Add each section with full content and user notes
    notes.sections.forEach((section: any, index: number) => {
      const sectionNumber = index + 1;
      const isRead = readSections.has(index);
      const isStarred = starredSections.has(index);
      const userNote = userNotes.get(index);
      
      content += `
${'-'.repeat(50)}
SECTION ${sectionNumber}: ${section.title}
${'-'.repeat(50)}

Status: ${isRead ? '✓ READ' : '○ UNREAD'} ${isStarred ? '⭐ STARRED' : ''}

${section.content}

Key Points:
${section.keyPoints.map((point: string, pointIndex: number) => `  ${pointIndex + 1}. ${point}`).join('\n')}

`;

      // Add user notes if they exist
      if (userNote && userNote.trim()) {
        content += `
MY NOTES:
${userNote}

`;
      }
      
      content += '\n';
    });

    // Add metadata and footer
    content += `
${'='.repeat(60)}
METADATA
${'='.repeat(60)}

Total Sections: ${notes.metadata?.totalSections || totalSections}
Estimated Reading Time: ${notes.metadata?.estimatedReadingTime || 'N/A'} minutes
Difficulty Level: ${notes.metadata?.difficulty || 'N/A'}
Topics: ${notes.metadata?.topics?.join(', ') || 'N/A'}

${'='.repeat(60)}
STUDY STATISTICS
${'='.repeat(60)}

Sections Read: ${readSections.size}/${totalSections} (${readingProgress}%)
Starred Sections: ${starredSections.size}
Personal Notes Added: ${Array.from(userNotes.values()).filter(note => note.trim()).length}
Time Spent Reading: ${Math.round(timeSpent / 60)} minutes
Bookmarked: ${isBookmarked ? 'Yes' : 'No'}

${'='.repeat(60)}
Generated by Excellence Coaching Hub
${'='.repeat(60)}
    `.trim();

    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_complete_notes_${formatDate(currentDate).replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    showMessage('Notes downloaded successfully!');
  };

  // Download notes as PDF (HTML format for printing)
  const downloadNotesAsPDF = () => {
    if (!notes) return;
    
    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${notes.title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .key-points { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; }
        .user-notes { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
        .metadata { background-color: #e9ecef; padding: 15px; margin-top: 30px; }
        .status { font-weight: bold; }
        .read { color: #28a745; }
        .unread { color: #6c757d; }
        .starred { color: #ffc107; }
        @media print { body { margin: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>${notes.title}</h1>
        <p>Generated on: ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p>Source: ${title}</p>
    </div>

    <div class="section">
        <h2>Summary</h2>
        <p>${notes.summary}</p>
    </div>

    <div class="section">
        <h2>Key Points</h2>
        <div class="key-points">
            <ol>
                ${notes.keyPoints.map((point: string) => `<li>${point}</li>`).join('')}
            </ol>
        </div>
    </div>

    <h2>Document Sections</h2>
    ${notes.sections.map((section: any, index: number) => {
      const isRead = readSections.has(index);
      const isStarred = starredSections.has(index);
      const userNote = userNotes.get(index);
      
      return `
        <div class="section">
            <div class="section-title">
                Section ${index + 1}: ${section.title}
                <span class="status ${isRead ? 'read' : 'unread'}">${isRead ? '✓ READ' : '○ UNREAD'}</span>
                ${isStarred ? '<span class="starred">⭐ STARRED</span>' : ''}
            </div>
            
            <p>${section.content}</p>
            
            <div class="key-points">
                <h4>Key Points:</h4>
                <ol>
                    ${section.keyPoints.map((point: string) => `<li>${point}</li>`).join('')}
                </ol>
            </div>
            
            ${userNote && userNote.trim() ? `
                <div class="user-notes">
                    <h4>My Notes:</h4>
                    <p>${userNote}</p>
                </div>
            ` : ''}
        </div>
      `;
    }).join('')}

    <div class="metadata">
        <h2>Study Statistics</h2>
        <p><strong>Sections Read:</strong> ${readSections.size}/${totalSections} (${Math.round((readSections.size / totalSections) * 100)}%)</p>
        <p><strong>Starred Sections:</strong> ${starredSections.size}</p>
        <p><strong>Personal Notes Added:</strong> ${Array.from(userNotes.values()).filter(note => note.trim()).length}</p>
        <p><strong>Time Spent Reading:</strong> ${Math.round(timeSpent / 60)} minutes</p>
        <p><strong>Bookmarked:</strong> ${isBookmarked ? 'Yes' : 'No'}</p>
        
        <h3>Document Metadata</h3>
        <p><strong>Total Sections:</strong> ${notes.metadata?.totalSections || totalSections}</p>
        <p><strong>Estimated Reading Time:</strong> ${notes.metadata?.estimatedReadingTime || 'N/A'} minutes</p>
        <p><strong>Difficulty Level:</strong> ${notes.metadata?.difficulty || 'N/A'}</p>
        <p><strong>Topics:</strong> ${notes.metadata?.topics?.join(', ') || 'N/A'}</p>
    </div>

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
        <p><em>Generated by Excellence Coaching Hub</em></p>
    </div>
</body>
</html>
    `;

    // Create and download the HTML file (can be opened in browser and printed as PDF)
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Notes downloaded as HTML! Open in browser and use Print > Save as PDF for best results.');
  };

  // Share notes
  const shareNotes = async () => {
    if (!notes) return;
    
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

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading structured notes...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={height} p={3}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>
            Error Loading Content
          </Typography>
          <Typography variant="body2" paragraph>
            {error}
          </Typography>
        </Alert>
        {onRetry && (
          <Button variant="contained" onClick={onRetry} sx={{ mt: 2 }}>
            Retry
          </Button>
        )}
      </Box>
    );
  }

  // No content state
  if (!notes) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={height} p={3}>
        <Alert severity="warning" sx={{ mb: 2, maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>
            No Content Available
          </Typography>
          <Typography variant="body2" paragraph>
            This material doesn't have any structured notes content to display.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Debug Info: HasContent={content ? 'Yes' : 'No'}, HasStructuredNotes={structuredNotes ? 'Yes' : 'No'}
          </Typography>
        </Alert>
        {onRetry && (
          <Button variant="contained" onClick={onRetry} sx={{ mt: 2 }}>
            Retry
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box 
      ref={fullscreenRef}
      height={isFullscreen ? '100vh' : height} 
      display="flex" 
      flexDirection="column" 
      position="relative" 
      className="structured-notes-viewer"
      sx={{ 
        overflow: 'hidden',
        bgcolor: isFullscreen ? 'white' : 'grey.50',
        transition: 'all 0.3s ease-in-out',
        ...(isFullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          width: '100vw',
          height: '100vh'
        })
      }}
    >
      {/* Compact Header */}
      <Paper 
        elevation={isFullscreen ? 4 : 2} 
        sx={{ 
          p: isFullscreen ? 2 : 1.5, 
          mb: isFullscreen ? 2 : 1.5, 
          position: 'sticky', 
          top: 0, 
          zIndex: 10,
          flexShrink: 0,
          bgcolor: 'white',
          transition: 'all 0.3s ease-in-out',
          ...(isFullscreen && {
            borderRadius: 0,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          })
        }}
      >
        {/* Top Row: Back Button and Title */}
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          {onBack && (
            <IconButton 
              onClick={onBack} 
              color="primary"
              sx={{ 
                bgcolor: 'primary.light', 
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.main' }
              }}
            >
              <ArrowBack />
            </IconButton>
          )}
          <Box flex={1}>
            <Typography variant="h5" noWrap>
              {notes.title}
            </Typography>
          </Box>
          {isFullscreen && (
            <Chip 
              label="Fullscreen" 
              size="small" 
              color="primary" 
              variant="outlined"
              icon={<Fullscreen />}
            />
          )}
        </Box>
        {/* Second Row: Action Buttons */}
        <Box display="flex" gap={1} mb={1}>
          <Tooltip title={isBookmarked ? "Remove bookmark" : "Bookmark"}>
            <IconButton onClick={toggleBookmark} color={isBookmarked ? "primary" : "default"} size="small">
              {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download as Text">
            <IconButton onClick={downloadNotes} size="small">
              <Download />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download as PDF">
            <IconButton onClick={downloadNotesAsPDF} size="small">
              <PictureAsPdf />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Print notes">
            <IconButton onClick={printNotes} size="small">
              <Print />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Share notes">
            <IconButton onClick={shareNotes} size="small">
              <Share />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
            <IconButton onClick={toggleFullscreen} size="small">
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Third Row: Search Bar */}
        <Box display="flex" gap={1} mb={1}>
          <TextField
            fullWidth
            placeholder="Search in notes, sections, and key points... (Press Enter to search)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {isSearching && (
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                  )}
                  {searchQuery && (
                    <IconButton 
                      onClick={() => {
                        setSearchQuery('');
                        setActiveSearchQuery('');
                        setFilteredSections(notes?.sections || []);
                        setVisibleSections(new Set([0, 1, 2]));
                        setExpandedSections(new Set([0]));
                      }} 
                      size="small"
                      title="Clear search"
                    >
                      <VisibilityOff fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              )
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={performSearch}
            disabled={isSearching}
            startIcon={isSearching ? <CircularProgress size={16} /> : <Search />}
            sx={{ minWidth: 100 }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </Box>
        
        {/* Search Results Info */}
        {activeSearchQuery && (
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="body2" color="text.secondary">
              Found {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} matching "{activeSearchQuery}"
            </Typography>
            {filteredSections.length === 0 && (
              <Typography variant="body2" color="error.main">
                No results found. Try different keywords.
              </Typography>
            )}
          </Box>
        )}

        {/* Fourth Row: Compact Controls and Metadata */}
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" justifyContent="space-between">
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <Button
              size="small"
              variant={showKeyPointsOnly ? "contained" : "outlined"}
              onClick={() => setShowKeyPointsOnly(!showKeyPointsOnly)}
              startIcon={<Highlight />}
            >
              Key Points Only
            </Button>
            
            <Button
              size="small"
              variant="outlined"
              onClick={() => copyToClipboard(notes.summary)}
              startIcon={<ContentCopy />}
            >
              Copy Summary
            </Button>
            
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setVisibleSections(new Set(filteredSections.map((_, index) => index)));
                setExpandedSections(new Set(filteredSections.map((_, index) => index)));
              }}
              startIcon={<Visibility />}
            >
              Show All Sections
            </Button>
          </Box>
          
          <Box display="flex" gap={0.5} flexWrap="wrap">
            <Chip 
              icon={<MenuBook />} 
              label={`${notes.metadata?.totalSections || totalSections}`} 
              size="small" 
              variant="outlined"
            />
            <Chip 
              icon={<Timer />} 
              label={`${notes.metadata?.estimatedReadingTime || 'N/A'}m`} 
              size="small" 
              variant="outlined"
            />
            <Chip 
              icon={<TrendingUp />} 
              label={notes.metadata?.difficulty || 'N/A'} 
              size="small" 
              color={notes.metadata?.difficulty === 'beginner' ? 'success' : 
                     notes.metadata?.difficulty === 'intermediate' ? 'warning' : 'error'}
              variant="outlined"
            />
            {showProgress && (
              <Chip 
                icon={<Schedule />} 
                label={`${readCount}/${totalSections}`} 
                size="small" 
                variant="outlined"
                color={progress === 100 ? 'success' : 'default'}
              />
            )}
          </Box>
        </Box>

        {/* Progress Bar */}
        {showProgress && (
          <Box mt={1}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </Paper>

      {/* Scrollable Content Area */}
      <Box 
        ref={scrollContainerRef}
        flex={1} 
        overflow="auto" 
        sx={{ 
          px: isFullscreen ? 4 : 2,
          pb: isFullscreen ? 4 : 2,
          transition: 'all 0.3s ease-in-out',
          '&::-webkit-scrollbar': {
            width: isFullscreen ? '12px' : '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8',
          },
        }}
      >
        {/* Summary */}
        <Card sx={{ mb: 3, bgcolor: 'white' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Summary
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, fontSize: '1.1rem' }}>
              {notes.summary}
            </Typography>
          </CardContent>
        </Card>

        {/* Key Points */}
        {notes.keyPoints && notes.keyPoints.length > 0 && (
          <Card sx={{ mb: 3, bgcolor: 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Key Points
              </Typography>
              <List>
                {notes.keyPoints.map((point: string, index: number) => (
                  <ListItem key={index} sx={{ pl: 0, py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Lightbulb color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={point}
                      primaryTypographyProps={{ 
                        component: 'div',
                        sx: { 
                          fontSize: '1.05rem',
                          lineHeight: 1.6
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Table of Contents */}
        {!activeSearchQuery && filteredSections.length > 3 && (
          <Card sx={{ mb: 3, bgcolor: 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MenuBook color="primary" />
                Table of Contents
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {filteredSections.slice(0, 10).map((section: any, index: number) => (
                  <Chip
                    key={`toc-${index}`}
                    label={`${index + 1}. ${section.title}`}
                    variant={expandedSections.has(index) ? "filled" : "outlined"}
                    color={expandedSections.has(index) ? "primary" : "default"}
                    size="small"
                    onClick={() => {
                      if (!visibleSections.has(index)) {
                        setVisibleSections(prev => new Set([...prev, index]));
                      }
                      setExpandedSections(prev => new Set([...prev, index]));
                      // Scroll to section
                      const element = document.querySelector(`[data-section-index="${index}"]`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-1px)' } }}
                  />
                ))}
                {filteredSections.length > 10 && (
                  <Chip
                    label={`+${filteredSections.length - 10} more sections`}
                    variant="outlined"
                    size="small"
                    color="secondary"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Sections */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" />
            Document Sections {activeSearchQuery && `(${filteredSections.length} found)`}
          </Typography>
        
        {filteredSections.map((section: any, index: number) => {
          const originalIndex = notes.sections.findIndex((s: any) => s === section);
          const isVisible = visibleSections.has(index);
          const isExpanded = expandedSections.has(index);
          
          // Use a unique key that combines index and section title to avoid duplicates
          const uniqueKey = `section-${index}-${section.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown'}`;
          
          // For performance: only render visible sections or if searching
          // Also show sections if there are fewer than 10 total sections (for small documents)
          if (!isVisible && !activeSearchQuery && filteredSections.length > 10) {
            return (
              <Box 
                key={uniqueKey}
                data-section-index={index}
                sx={{ 
                  mb: 2, 
                  minHeight: 64,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'grey.200',
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
                onClick={() => {
                  console.log('Loading section:', index, 'Original index:', originalIndex, 'Title:', section.title);
                  // Immediately make section visible and expanded
                  setVisibleSections(prev => new Set([...prev, index]));
                  setExpandedSections(prev => new Set([...prev, index]));
                  if (originalIndex >= 0) {
                    markSectionAsRead(originalIndex);
                  }
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Click to load section: {section.title}
                </Typography>
              </Box>
            );
          }
          
          return (
            <SectionAccordion
              key={uniqueKey}
              data-section-index={index}
              section={section}
              originalIndex={originalIndex >= 0 ? originalIndex : index}
              index={index}
              isExpanded={isExpanded}
              onExpansionChange={handleSectionExpansion}
              readSections={readSections}
              starredSections={starredSections}
              onToggleStar={toggleStar}
              onToggleUserNote={toggleUserNote}
              showUserNotes={showUserNotes}
              userNotes={userNotes}
              onAddUserNote={addUserNote}
              showKeyPointsOnly={showKeyPointsOnly}
              onCopyToClipboard={copyToClipboard}
              onMarkAsRead={markSectionAsRead}
              expandedContent={expandedContent}
              onToggleExpandedContent={toggleExpandedContent}
              searchQuery={activeSearchQuery}
              highlightSearchTerms={highlightSearchTerms}
            />
          );
        })}
        
        {/* Load More Button */}
        {!activeSearchQuery && visibleSections.size < filteredSections.length && (
          <Box display="flex" justifyContent="center" gap={2} mt={3}>
            <Button
              variant="outlined"
              onClick={handleLoadMore}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <ExpandMore />}
              sx={{ minWidth: 200 }}
            >
              {isLoading ? 'Loading...' : `Load More Sections (${filteredSections.length - visibleSections.size} remaining)`}
            </Button>
            
            {filteredSections.length > 10 && (
              <Button
                variant="contained"
                onClick={() => {
                  setVisibleSections(new Set(filteredSections.map((_, index) => index)));
                  setExpandedSections(new Set(filteredSections.map((_, index) => index)));
                }}
                startIcon={<Visibility />}
                sx={{ minWidth: 180 }}
              >
                Load All Sections
              </Button>
            )}
          </Box>
        )}
        
        {/* Progress Indicator */}
        {!activeSearchQuery && (
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} p={2} bgcolor="grey.50" borderRadius={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Progress: {visibleSections.size} of {filteredSections.length} sections loaded
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(visibleSections.size / filteredSections.length) * 100} 
                sx={{ width: 100, height: 6, borderRadius: 3 }}
              />
              <Typography variant="body2" color="text.secondary">
                {Math.round((visibleSections.size / filteredSections.length) * 100)}%
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Reading Progress: {readSections.size}/{filteredSections.length} sections read
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(readSections.size / filteredSections.length) * 100} 
                sx={{ width: 100, height: 6, borderRadius: 3 }}
                color="success"
              />
              <Typography variant="body2" color="success.main">
                {Math.round((readSections.size / filteredSections.length) * 100)}%
              </Typography>
            </Box>
          </Box>
        )}
        
        {/* Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
            <Typography variant="caption" display="block">
              Debug Info:
            </Typography>
            <Typography variant="caption" display="block">
              Visible Sections: {Array.from(visibleSections).join(', ')}
            </Typography>
            <Typography variant="caption" display="block">
              Expanded Sections: {Array.from(expandedSections).join(', ')}
            </Typography>
            <Typography variant="caption" display="block">
              Total Sections: {filteredSections.length}
            </Typography>
            <Typography variant="caption" display="block">
              Search Query: "{searchQuery}"
            </Typography>
            <Box mt={1} display="flex" gap={1}>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => {
                  console.log('Test: Expanding section 1');
                  handleSectionExpansion(1, true);
                }}
              >
                Test Expand Section 1
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => {
                  console.log('Test: Collapsing section 1');
                  handleSectionExpansion(1, false);
                }}
              >
                Test Collapse Section 1
              </Button>
            </Box>
          </Box>
        )}
        </Box>

        {/* Completion Message */}
        {readCount === totalSections && totalSections > 0 && (
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              mt: 3, 
              backgroundColor: 'success.light', 
              color: 'success.contrastText',
              borderRadius: 2
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircle sx={{ fontSize: 32 }} />
              <Typography variant="h6">
                Congratulations! You've completed reading all sections.
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        onClose={() => setShowSpeedDial(false)}
        onOpen={() => setShowSpeedDial(true)}
        open={showSpeedDial}
      >
        <SpeedDialAction
          icon={<Assessment />}
          tooltipTitle="Create Quiz"
          onClick={() => showMessage('Quiz creation feature coming soon!')}
        />
        <SpeedDialAction
          icon={<Assignment />}
          tooltipTitle="Create Assignment"
          onClick={() => showMessage('Assignment creation feature coming soon!')}
        />
        <SpeedDialAction
          icon={<Notes />}
          tooltipTitle="Export as Text"
          onClick={downloadNotes}
        />
        <SpeedDialAction
          icon={<PictureAsPdf />}
          tooltipTitle="Export as PDF"
          onClick={downloadNotesAsPDF}
        />
        <SpeedDialAction
          icon={<Print />}
          tooltipTitle="Print"
          onClick={printNotes}
        />
      </SpeedDial>

      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default IndependentStructuredNotesViewer;
