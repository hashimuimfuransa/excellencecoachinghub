import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  LinearProgress,
  Paper,
  IconButton,
  Collapse,
  Fade,
  useTheme,
  useMediaQuery,
  Stack,
  Badge,
  Tooltip,
  Pagination,
  Divider
} from '@mui/material';
import { 
  Search, 
  FilterList, 
  School, 
  Close, 
  ExpandMore, 
  Star, 
  People, 
  AccessTime, 
  PlayCircleOutline,
  TrendingUp,
  AutoAwesome,
  BookmarkBorder,
  Bookmark,
  Quiz,
  EmojiEvents,
  Timer,
  Grade,
  Subject,
  CalendarToday,
  Assessment,
  Psychology,
  Science,
  Language,
  Business,
  Build,
  Palette,
  LocalHospital,
  Computer,
  Calculate
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface PastPaper {
  _id: string;
  title: string;
  description: string;
  subject: string;
  level: 'O-Level' | 'A-Level' | 'University' | 'Professional' | 'General';
  year: number;
  examBoard?: string;
  duration: number;
  totalMarks: number;
  totalAttempts: number;
  averageScore: number;
  difficultyRating: number;
  tags: string[];
  isPublished: boolean;
  publishedAt: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  questions: Array<{
    id: string;
    question: string;
    type: string;
    points: number;
    section?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }>;
}

const PastPapersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [examBoardFilter, setExamBoardFilter] = useState('');
  const [sortBy, setSortBy] = useState('publishedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarkedPapers, setBookmarkedPapers] = useState<Set<string>>(new Set());

  // Filter options
  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History',
    'Geography', 'Economics', 'Computer Science', 'Business Studies',
    'Psychology', 'Sociology', 'Literature', 'Art', 'Music', 'Physical Education'
  ];

  const levels = ['O-Level', 'A-Level', 'University', 'Professional', 'General'];
  
  const examBoards = [
    'Cambridge', 'Edexcel', 'AQA', 'OCR', 'WJEC', 'SQA', 'CCEA', 'Pearson'
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  // Load past papers
  const loadPastPapers = async (isLoadMore = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy,
        sortOrder
      });

      if (searchTerm) params.append('search', searchTerm);
      if (subjectFilter) params.append('subject', subjectFilter);
      if (levelFilter) params.append('level', levelFilter);
      if (yearFilter) params.append('year', yearFilter);
      if (examBoardFilter) params.append('examBoard', examBoardFilter);

      const response = await api.get(`/past-papers?${params}`);
      
      if (response.data.success) {
        if (isLoadMore) {
          setPastPapers(prev => [...prev, ...response.data.data.pastPapers]);
        } else {
          setPastPapers(response.data.data.pastPapers);
        }
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalItems(response.data.data.pagination.totalItems);
      }
    } catch (err: any) {
      console.error('Error loading past papers:', err);
      setError(err.response?.data?.message || 'Failed to load past papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPastPapers();
  }, [page, searchTerm, subjectFilter, levelFilter, yearFilter, examBoardFilter, sortBy, sortOrder]);

  // Load bookmarked papers
  useEffect(() => {
    const bookmarked = localStorage.getItem('bookmarkedPastPapers');
    if (bookmarked) {
      setBookmarkedPapers(new Set(JSON.parse(bookmarked)));
    }
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'subject':
        setSubjectFilter(value);
        break;
      case 'level':
        setLevelFilter(value);
        break;
      case 'year':
        setYearFilter(value);
        break;
      case 'examBoard':
        setExamBoardFilter(value);
        break;
      case 'sortBy':
        setSortBy(value);
        break;
      case 'sortOrder':
        setSortOrder(value);
        break;
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSubjectFilter('');
    setLevelFilter('');
    setYearFilter('');
    setExamBoardFilter('');
    setSortBy('publishedAt');
    setSortOrder('desc');
    setPage(1);
  };

  const handleBookmark = (paperId: string) => {
    const newBookmarked = new Set(bookmarkedPapers);
    if (newBookmarked.has(paperId)) {
      newBookmarked.delete(paperId);
    } else {
      newBookmarked.add(paperId);
    }
    setBookmarkedPapers(newBookmarked);
    localStorage.setItem('bookmarkedPastPapers', JSON.stringify([...newBookmarked]));
  };

  const handleTakeExam = (paperId: string) => {
    navigate(`/past-papers/${paperId}/take`);
  };

  const getSubjectIcon = (subject: string) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('math')) return <Calculate />;
    if (subjectLower.includes('physics')) return <Science />;
    if (subjectLower.includes('chemistry')) return <Psychology />;
    if (subjectLower.includes('biology')) return <LocalHospital />;
    if (subjectLower.includes('english') || subjectLower.includes('literature')) return <Language />;
    if (subjectLower.includes('business')) return <Business />;
    if (subjectLower.includes('computer')) return <Computer />;
    if (subjectLower.includes('art')) return <Palette />;
    return <School />;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'O-Level': return 'primary';
      case 'A-Level': return 'secondary';
      case 'University': return 'success';
      case 'Professional': return 'warning';
      case 'General': return 'info';
      default: return 'default';
    }
  };

  const getDifficultyColor = (rating: number) => {
    if (rating >= 4) return 'error';
    if (rating >= 3) return 'warning';
    if (rating >= 2) return 'info';
    return 'success';
  };

  const getDifficultyText = (rating: number) => {
    if (rating >= 4) return 'Very Hard';
    if (rating >= 3) return 'Hard';
    if (rating >= 2) return 'Medium';
    return 'Easy';
  };

  if (loading && pastPapers.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading past papers...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            mb: 2
          }}
        >
          📚 Past Papers Library
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ textAlign: 'center', mb: 4 }}
        >
          Practice with real exam questions and improve your performance
        </Typography>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search past papers..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ minWidth: 120 }}
            >
              Filters
            </Button>
            <Button
              variant="text"
              onClick={clearFilters}
              sx={{ minWidth: 100 }}
            >
              Clear All
            </Button>
          </Box>

          <Collapse in={showFilters}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={subjectFilter}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                    label="Subject"
                  >
                    <MenuItem value="">All Subjects</MenuItem>
                    {subjects.map((subject) => (
                      <MenuItem key={subject} value={subject}>
                        {subject}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={levelFilter}
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                    label="Level"
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    {levels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={yearFilter}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    label="Year"
                  >
                    <MenuItem value="">All Years</MenuItem>
                    {years.map((year) => (
                      <MenuItem key={year} value={year.toString()}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Exam Board</InputLabel>
                  <Select
                    value={examBoardFilter}
                    onChange={(e) => handleFilterChange('examBoard', e.target.value)}
                    label="Exam Board"
                  >
                    <MenuItem value="">All Boards</MenuItem>
                    {examBoards.map((board) => (
                      <MenuItem key={board} value={board}>
                        {board}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Collapse>
        </Paper>
      </Box>

      {/* Results Summary */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" color="text.secondary">
          {totalItems} past papers found
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              label="Sort by"
            >
              <MenuItem value="publishedAt">Date</MenuItem>
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="year">Year</MenuItem>
              <MenuItem value="totalAttempts">Popularity</MenuItem>
              <MenuItem value="averageScore">Average Score</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              label="Order"
            >
              <MenuItem value="desc">Descending</MenuItem>
              <MenuItem value="asc">Ascending</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Past Papers Grid */}
      <Grid container spacing={3}>
        {pastPapers.map((paper) => (
          <Grid item xs={12} sm={6} md={4} key={paper._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getSubjectIcon(paper.subject)}
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {paper.subject}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleBookmark(paper._id)}
                    sx={{ color: bookmarkedPapers.has(paper._id) ? 'primary.main' : 'text.secondary' }}
                  >
                    {bookmarkedPapers.has(paper._id) ? <Bookmark /> : <BookmarkBorder />}
                  </IconButton>
                </Box>

                {/* Title */}
                <Typography 
                  variant="h6" 
                  component="h3" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    lineHeight: 1.3,
                    mb: 1
                  }}
                >
                  {paper.title}
                </Typography>

                {/* Description */}
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {paper.description}
                </Typography>

                {/* Chips */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    label={paper.level}
                    color={getLevelColor(paper.level) as any}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={paper.year}
                    size="small"
                    variant="outlined"
                    icon={<CalendarToday />}
                  />
                  {paper.examBoard && (
                    <Chip
                      label={paper.examBoard}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Stats */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Quiz sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {paper.questions.length} questions
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Timer sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {paper.duration} min
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Grade sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {paper.totalMarks} marks
                    </Typography>
                  </Box>
                </Box>

                {/* Difficulty and Performance */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={getDifficultyText(paper.difficultyRating)}
                    color={getDifficultyColor(paper.difficultyRating) as any}
                    size="small"
                    icon={<TrendingUp />}
                  />
                  {paper.totalAttempts > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {paper.totalAttempts} attempts • {Math.round(paper.averageScore)}% avg
                    </Typography>
                  )}
                </Box>

                {/* Action Button */}
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlayCircleOutline />}
                  onClick={() => handleTakeExam(paper._id)}
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                    }
                  }}
                >
                  Take Exam
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* No Results */}
      {!loading && pastPapers.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <School sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No past papers found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Try adjusting your search criteria or filters
          </Typography>
          <Button variant="contained" onClick={clearFilters}>
            Clear Filters
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default PastPapersPage;
