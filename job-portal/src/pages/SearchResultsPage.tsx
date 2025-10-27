import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tab,
  Tabs,
  Avatar,
  Chip,
  Button,
  IconButton,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Divider,
  Paper,
  useTheme,
  alpha,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  ExpandMore,
  Person,
  Work,
  Article,
  LocationOn,
  Business,
  Schedule,
  Star,
  StarBorder,
  Connect,
  Message,
  Share,
  BookmarkBorder,
  Bookmark,
  FilterList,
  Sort,
  Search,
  Clear,
} from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import searchService, { SearchResults, SearchUser, SearchJob, SearchPost } from '../services/searchService';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const SearchResultsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    location: '',
    jobType: [] as string[],
    experienceLevel: [] as string[],
    postedWithin: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, type, page, sortBy, filters]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const results = await searchService.search(query, {
        type: type as any,
        page,
        limit: 10,
        sortBy: sortBy as any,
        ...filters,
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    const tabTypes = ['all', 'users', 'jobs', 'posts'];
    setSearchParams({ q: query, type: tabTypes[newValue] });
    setPage(1);
  };

  const handleConnect = async (userId: string) => {
    // Implement connection logic
    console.log('Connect to user:', userId);
  };

  const handleSaveJob = async (jobId: string) => {
    // Implement save job logic
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const UserCard: React.FC<{ user: SearchUser }> = ({ user }) => (
    <Card
      component={motion.div}
      whileHover={{ y: -2 }}
      sx={{
        mb: 2,
        overflow: 'visible',
        '&:hover': {
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={user.profilePicture}
            sx={{ width: 60, height: 60, mr: 2 }}
          >
            {user.firstName?.[0]}{user.lastName?.[0]}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user.title}
            </Typography>
            {user.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {user.location}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Connect />}
              onClick={() => handleConnect(user._id)}
              disabled={user.isConnected}
            >
              {user.isConnected ? 'Connected' : user.isConnectionPending ? 'Pending' : 'Connect'}
            </Button>
            <IconButton size="small">
              <Message />
            </IconButton>
          </Box>
        </Box>
        
        {user.skills && user.skills.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {user.skills.slice(0, 5).map((skill, index) => (
              <Chip key={index} label={skill} size="small" variant="outlined" />
            ))}
            {user.skills.length > 5 && (
              <Chip label={`+${user.skills.length - 5} more`} size="small" variant="outlined" />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const JobCard: React.FC<{ job: SearchJob }> = ({ job }) => (
    <Card
      component={motion.div}
      whileHover={{ y: -2 }}
      sx={{
        mb: 2,
        overflow: 'visible',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: theme.shadows[8],
        },
      }}
      onClick={() => navigate(`/app/jobs/${job._id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            src={job.company.logo}
            sx={{ width: 48, height: 48, mr: 2 }}
          >
            <Business />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {job.title}
            </Typography>
            <Typography variant="body2" color="primary" gutterBottom>
              {job.company.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {job.location}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Schedule fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleSaveJob(job._id);
            }}
            size="small"
          >
            {savedJobs.has(job._id) ? <Bookmark color="primary" /> : <BookmarkBorder />}
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {job.description.substring(0, 150)}...
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          <Chip label={job.type} size="small" color="primary" />
          <Chip label={job.level} size="small" color="secondary" />
          {job.isRemote && <Chip label="Remote" size="small" color="success" />}
        </Box>
        
        {job.skills && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {job.skills.slice(0, 4).map((skill, index) => (
              <Chip key={index} label={skill} size="small" variant="outlined" />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const PostCard: React.FC<{ post: SearchPost }> = ({ post }) => (
    <Card
      component={motion.div}
      whileHover={{ y: -2 }}
      sx={{
        mb: 2,
        overflow: 'visible',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: theme.shadows[8],
        },
      }}
      onClick={() => navigate(`/app/network?post=${post._id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={post.author.profilePicture}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {post.author.firstName?.[0]}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2">
              {post.author.firstName} {post.author.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {post.author.title} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </Typography>
          </Box>
          <Chip 
            label={post.postType.replace('_', ' ')} 
            size="small" 
            variant="outlined"
          />
        </Box>
        
        <Typography variant="body2" paragraph>
          {post.content}
        </Typography>
        
        {post.tags && post.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {post.tags.map((tag, index) => (
              <Chip key={index} label={`#${tag}`} size="small" variant="outlined" color="primary" />
            ))}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
          <Typography variant="caption">
            {post.likes} likes
          </Typography>
          <Typography variant="caption">
            {post.comments} comments
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const LoadingSkeleton = () => (
    <Box>
      {[...Array(3)].map((_, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} />
              </Box>
            </Box>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="80%" height={20} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  if (!query) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          Please enter a search query to see results.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Search Results
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isLoading ? 'Searching...' : `Results for "${query}"`}
        </Typography>
        {searchResults && (
          <Typography variant="body2" color="text.secondary">
            Found {searchResults.total.users + searchResults.total.jobs + searchResults.total.posts} results
          </Typography>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="popular">Most Popular</MenuItem>
              </Select>
            </FormControl>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2">Location</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2">Job Type</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'].map((type) => (
                    <ListItem key={type} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          const newJobTypes = filters.jobType.includes(type)
                            ? filters.jobType.filter(t => t !== type)
                            : [...filters.jobType, type];
                          setFilters({ ...filters, jobType: newJobTypes });
                        }}
                        dense
                      >
                        <ListItemText primary={type} />
                        {filters.jobType.includes(type) && <Star fontSize="small" />}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab
                label={`All (${searchResults?.total.users || 0 + searchResults?.total.jobs || 0 + searchResults?.total.posts || 0})`}
                icon={<Search />}
                iconPosition="start"
              />
              <Tab
                label={`People (${searchResults?.total.users || 0})`}
                icon={<Person />}
                iconPosition="start"
              />
              <Tab
                label={`Jobs (${searchResults?.total.jobs || 0})`}
                icon={<Work />}
                iconPosition="start"
              />
              <Tab
                label={`Posts (${searchResults?.total.posts || 0})`}
                icon={<Article />}
                iconPosition="start"
              />
            </Tabs>
          </Paper>

          {isLoading ? (
            <LoadingSkeleton />
          ) : searchResults ? (
            <>
              <TabPanel value={currentTab} index={0}>
                {searchResults.users.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
                {searchResults.jobs.map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
                {searchResults.posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                {searchResults.users.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
              </TabPanel>

              <TabPanel value={currentTab} index={2}>
                {searchResults.jobs.map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </TabPanel>

              <TabPanel value={currentTab} index={3}>
                {searchResults.posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </TabPanel>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={10}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            </>
          ) : (
            <Alert severity="info">
              No results found for your search query.
            </Alert>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default SearchResultsPage;