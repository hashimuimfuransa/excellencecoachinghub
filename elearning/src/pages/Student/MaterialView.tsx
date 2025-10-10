import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Tooltip,
  Fab,
  Breadcrumbs,
  Link,
  Stack,
  Grid,
  Tabs,
  Tab,
  Zoom
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  CheckCircle,
  Schedule,
  Description,
  VideoFile,
  VolumeUp,
  Link as LinkIcon,
  Quiz,
  Download,
  Share,
  Bookmark,
  Timer,
  School,
  Assignment,
  Grade,
  PictureAsPdf,
  Fullscreen,
  FullscreenExit,
  OpenInNew,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Print,
  Search,
  MenuBook,
  VisibilityOff
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { weekService, Week, WeekMaterial } from '../../services/weekService';
import { progressService } from '../../services/weekService';
import { progressTrackingService } from '../../services/progressTrackingService';

// Modern Document Viewer Imports
import { Document, Page, pdfjs } from 'react-pdf';
import WebViewer from '@pdftron/webviewer';

// Import Structured Notes Viewer
import { StructuredNotesViewer } from '../../components/StructuredNotesViewer';

// Import Simple Viewers
import { 
  SimplePDFViewer, 
  SimpleMediaViewer, 
  SimpleImageViewer, 
  SimpleOfficeViewer 
} from '../../components/SimpleViewers';

// Import Cloudinary URL processor
import { getDocumentViewingUrl, needsCloudinarySpecialHandling } from '../../utils/cloudinaryUrlProcessor';

// Import custom styles
import './MaterialView.css';

const MaterialView: React.FC = () => {
  const { courseId, materialId } = useParams<{ courseId: string; materialId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [week, setWeek] = useState<Week | null>(null);
  const [material, setMaterial] = useState<WeekMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [materialProgress, setMaterialProgress] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [documentError, setDocumentError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);

  // Modern Document Viewer State
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [viewerType, setViewerType] = useState<'pdf' | 'office' | 'other' | 'webviewer'>('other');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfCache, setPdfCache] = useState<Map<string, string>>(new Map());
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // WebViewer State
  const [webViewerInstance, setWebViewerInstance] = useState<any>(null);
  const [webViewerReady, setWebViewerReady] = useState(false);
  const viewerRef = React.useRef<HTMLDivElement>(null);
  
  // Document caching for faster loading
  const [documentCache, setDocumentCache] = useState<Map<string, any>>(new Map());
  const [preloadedDocuments, setPreloadedDocuments] = useState<Set<string>>(new Set());

  // Load material data and initialize progress tracking
  useEffect(() => {
    if (courseId && materialId) {
      loadMaterialData();
      initializeProgressTracking();
    }
  }, [courseId, materialId]);

  // Initialize progress tracking
  const initializeProgressTracking = async () => {
    if (!courseId || !materialId || !week) return;

    try {
      // Load progress from server
      await progressTrackingService.loadFromServer(courseId);
      
      // Get existing progress
      const progress = progressTrackingService.getMaterialProgress(courseId, week._id, materialId);
      setMaterialProgress(progress);
      setTimeSpent(progress.timeSpent);
      setIsCompleted(progress.isCompleted);

      // Start new session
      const newSessionId = progressTrackingService.startSession(courseId, week._id, materialId);
      setSessionId(newSessionId);

      // Set start time for time tracking
      setStartTime(new Date());
    } catch (error) {
      console.error('Failed to initialize progress tracking:', error);
    }
  };

  // Configure PDF worker on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Use CDN worker for better performance
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      } catch (error) {
        console.warn('Failed to configure PDF worker:', error);
      }
    }
  }, []);

  // Determine document type and viewer
  useEffect(() => {
    if (material?.url) {
      const url = material.url.toLowerCase();
      // Use WebViewer for all supported formats (PDF, Office documents)
      if (url.includes('.pdf') || url.match(/\.(doc|docx|ppt|pptx|xls|xlsx|txt|rtf)$/)) {
        setViewerType('webviewer');
        setPdfLoading(false);
      } else if (url.match(/\.(mp4|avi|mov|wmv|flv|webm|mp3|wav|ogg)$/)) {
        setViewerType('other'); // Will use Universal Material Viewer
      } else if (url.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/)) {
        setViewerType('other'); // Will use Universal Material Viewer
      } else {
        setViewerType('other');
      }
    }
  }, [material?.url]);

  // Preload document for faster loading
  const preloadDocument = async (url: string) => {
    if (preloadedDocuments.has(url)) return;
    
    try {
      // Preload document data
      const response = await fetch(url, { 
        method: 'HEAD',
        cache: 'force-cache'
      });
      
      if (response.ok) {
        setPreloadedDocuments(prev => new Set(prev).add(url));
        console.log('Document preloaded:', url);
      }
    } catch (error) {
      console.warn('Failed to preload document:', error);
    }
  };

  // Initialize WebViewer with optimizations
  useEffect(() => {
    if (viewerRef.current && viewerType === 'webviewer' && material?.url) {
      const initializeWebViewer = async () => {
        try {
          setWebViewerReady(false);
          setDocumentError(false);
          
          // Process URL for Cloudinary documents
          const processedUrl = getDocumentViewingUrl(material.url);
          const needsSpecialHandling = needsCloudinarySpecialHandling(material.url);
          
          console.log('Initializing WebViewer with URL:', {
            original: material.url,
            processed: processedUrl,
            needsSpecialHandling
          });
          
          // Check cache first
          const cachedInstance = documentCache.get(processedUrl);
          if (cachedInstance) {
            console.log('Using cached WebViewer instance');
            setWebViewerInstance(cachedInstance);
            setWebViewerReady(true);
            return;
          }
          
          // Preload document while initializing WebViewer
          preloadDocument(processedUrl);
          
          const instance = await WebViewer({
            path: '/webviewer/lib',
            initialDoc: processedUrl,
            licenseKey: process.env.REACT_APP_PDFTRON_LICENSE_KEY || '',
            // Performance optimizations
            enableAnnotations: false, // Disable for faster loading
            enableRedaction: false,
            enableMeasurement: false,
            enableFilePicker: false,
            enablePrint: true,
            enableDownload: true,
            enableFullAPI: false, // Disable full API for faster loading
            css: '/webviewer/lib/ui/index.css',
            // Stream loading for faster initial display
            streaming: true,
            streamingOptions: {
              enableStreaming: true,
              maxConcurrentRequests: 3,
              chunkSize: 1024 * 1024, // 1MB chunks
            },
            // Disable heavy features
            disabledElements: [
              'ribbons',
              'toolsHeader',
              'toolbarGroup-Insert',
              'toolbarGroup-Edit',
              'toolbarGroup-Forms',
              'toolbarGroup-FillAndSign',
              'toolbarGroup-Share',
              'annotationCommentButton',
              'annotationTextButton',
              'searchPanel',
              'thumbnailsPanel'
            ],
            // Optimize rendering
            renderOptions: {
              enableAnnotations: false,
              enableTextSelection: true,
              enableFormFilling: false,
              enableDigitalSignatures: false
            }
          }, viewerRef.current);

          setWebViewerInstance(instance);
          setWebViewerReady(true);
          
          // Cache the instance for faster future loads
          setDocumentCache(prev => new Map(prev).set(processedUrl, instance));

          // Configure for fast student view (minimal features)
          instance.UI.setToolbarGroup('toolbarGroup-View');
          instance.UI.disableElements(['toolbarGroup-Edit', 'toolbarGroup-Insert']);
          
          // Enable annotations only after document loads (lazy loading)
          instance.Core.documentViewer.addEventListener('documentLoaded', () => {
            console.log('Document loaded successfully in WebViewer');
            // Enable annotations after document is loaded for better performance
            if (process.env.REACT_APP_PDFTRON_LICENSE_KEY && process.env.REACT_APP_PDFTRON_LICENSE_KEY !== 'demo:1700000000000:your_key_here') {
              instance.UI.enableElements(['annotationCommentButton', 'annotationTextButton']);
            }
          });

          instance.Core.documentViewer.addEventListener('documentLoadError', (error: any) => {
            console.error('Document load error in WebViewer:', error);
            setDocumentError(true);
          });

        } catch (error) {
          console.error('Failed to initialize WebViewer:', error);
          setDocumentError(true);
          setWebViewerReady(false);
        }
      };

      initializeWebViewer();
    }
  }, [viewerType, material?.url, user?.name]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup PDF blob URL
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      
      // Cleanup WebViewer instance
      if (webViewerInstance) {
        webViewerInstance.UI.dispose();
      }
      
      // End progress tracking session
      if (sessionId) {
        progressTrackingService.endSession(sessionId);
      }
      
      // Sync progress with server
      if (courseId) {
        progressTrackingService.syncWithServer(courseId);
      }
    };
  }, [pdfBlobUrl, webViewerInstance, sessionId, courseId]);

  // Track time spent and update progress
  useEffect(() => {
    if (material && !isCompleted && sessionId) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - (startTime?.getTime() || Date.now())) / 1000 / 60);
        const newTimeSpent = (materialProgress?.timeSpent || 0) + elapsed;
        
        setTimeSpent(newTimeSpent);
        
        // Update progress tracking
        if (courseId && week && materialId) {
          progressTrackingService.updateTimeSpent(courseId, week._id, materialId, newTimeSpent);
        }
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [material, isCompleted, sessionId, startTime, materialProgress, courseId, week, materialId]);

  // Handle PDF loading timeout
  useEffect(() => {
    if (material?.type === 'document' && material.url?.toLowerCase().includes('.pdf')) {
      setPdfLoading(true);
      setDocumentError(false);
      
      // Set a timeout to detect if PDF fails to load
      const timeout = setTimeout(() => {
        if (pdfLoading) {
          console.log('PDF loading timeout');
          setDocumentError(true);
          setPdfLoading(false);
        }
      }, 30000); // 30 second timeout for large PDFs

      return () => clearTimeout(timeout);
    }
  }, [material?.url, pdfLoading]);

  const loadMaterialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all weeks for the course
      const weeks = await weekService.getCourseWeeks(courseId!);
      
      // Find the week and material
      let foundWeek: Week | null = null;
      let foundMaterial: WeekMaterial | null = null;

      for (const weekItem of weeks) {
        const materialItem = weekItem.materials.find(m => m._id === materialId);
        if (materialItem) {
          foundWeek = weekItem;
          foundMaterial = materialItem;
          break;
        }
      }

      if (!foundWeek || !foundMaterial) {
        throw new Error('Material not found');
      }

      setWeek(foundWeek);
      setMaterial(foundMaterial);
      
      // Debug logging for structured notes
      if (foundMaterial.type === 'structured_notes') {
        console.log('📚 MaterialView - Found structured notes material:', {
          title: foundMaterial.title,
          type: foundMaterial.type,
          hasContent: !!foundMaterial.content,
          contentKeys: foundMaterial.content ? Object.keys(foundMaterial.content) : [],
          hasStructuredNotes: foundMaterial.content?.structuredNotes ? 'yes' : 'no',
          structuredNotesKeys: foundMaterial.content?.structuredNotes ? Object.keys(foundMaterial.content.structuredNotes) : [],
          fullContent: foundMaterial.content,
          fullMaterial: foundMaterial
        });
        
        // Check if structuredNotes exists and has the expected structure
        if (foundMaterial.content?.structuredNotes) {
          console.log('✅ Structured notes found:', foundMaterial.content.structuredNotes);
        } else {
          console.log('❌ No structured notes found in content');
        }
      }

      // Check if material is completed
      const progress = await progressService.getStudentCourseProgress(courseId!);
      const materialProgress = progress.materialProgresses.find(
        mp => mp.weekId === foundWeek._id && mp.materialId === materialId
      );
      
      if (materialProgress && materialProgress.status === 'completed') {
        setIsCompleted(true);
        setTimeSpent(materialProgress.timeSpent);
      }
    } catch (err: any) {
      console.error('Error loading material data:', err);
      setError(err.message || 'Failed to load material');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!courseId || !week || !materialId || !sessionId) return;

    try {
      // Mark as completed in progress tracking
      await progressTrackingService.markMaterialCompleted(courseId, week._id, materialId, timeSpent);
      
      // End session
      progressTrackingService.endSession(sessionId);
      
      // Add completion action
      progressTrackingService.addAction(sessionId, {
        type: 'section_read',
        data: { completed: true, timeSpent }
      });

      setIsCompleted(true);
      
      // Sync with server
      await progressTrackingService.syncWithServer(courseId);
    } catch (err: any) {
      console.error('Error marking material complete:', err);
      setError(err.message || 'Failed to mark material complete');
    }
  };

  const handleBackToCourse = () => {
    navigate(`/dashboard/student/course/${courseId}/learn`);
  };

  // PDF Document Handlers
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfLoading(false);
    setDocumentError(false);
    
    // Cache the PDF URL for future use
    if (material?.url && !pdfCache.has(material.url)) {
      setPdfCache(prev => new Map(prev).set(material.url!, pdfBlobUrl || material.url));
    }
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setDocumentError(true);
    setPdfLoading(false);
    
    // Check if it's an authentication error
    if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('ResponseException')) {
      console.log('PDF requires authentication - showing download option');
    }
  };

  const onPageLoadSuccess = () => {
    setPdfLoading(false);
  };

  const onPageLoadError = (error: Error) => {
    console.error('Page load error:', error);
    setDocumentError(true);
    setPdfLoading(false);
  };

  // PDF Navigation Functions
  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const rotateDocument = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document': return <Description />;
      case 'video': return <VideoFile />;
      case 'audio': return <VolumeUp />;
      case 'link': return <LinkIcon />;
      case 'quiz': return <Quiz />;
      case 'structured_notes': return <MenuBook />;
      default: return <Description />;
    }
  };

  const getMaterialTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'primary';
      case 'video': return 'secondary';
      case 'audio': return 'info';
      case 'link': return 'warning';
      case 'quiz': return 'error';
      case 'structured_notes': return 'success';
      default: return 'primary';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadMaterialData}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!week || !material) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Material not found
        </Alert>
      </Container>
    );
  }

  // Define urlLower for document info display
  const url = material?.url || '';
  const urlLower = url.toLowerCase();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/dashboard/student/courses');
          }}
        >
          Courses
        </Link>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigate(`/dashboard/student/course/${courseId}/learn`);
          }}
        >
          {week.title}
        </Link>
        <Typography color="text.primary">{material.title}</Typography>
      </Breadcrumbs>

      {/* Material Header */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 64, height: 64 }}>
                {getFileIcon(material.type)}
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" gutterBottom>
                  {material.title}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  {material.description}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<Timer />} 
                    label={`${material.estimatedDuration} minutes`} 
                    variant="outlined" 
                    sx={{ color: 'white', borderColor: 'white' }}
                  />
                  <Chip 
                    label={material.type} 
                    variant="outlined" 
                    sx={{ color: 'white', borderColor: 'white' }}
                  />
                  {material.isRequired && (
                    <Chip 
                      label="Required" 
                      variant="outlined" 
                      sx={{ color: 'white', borderColor: 'white' }}
                    />
                  )}
                  {isCompleted && (
                    <Chip 
                      icon={<CheckCircle />} 
                      label="Completed" 
                      variant="outlined" 
                      sx={{ color: 'white', borderColor: 'white' }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: 'white' }}>
                <Bookmark />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Share />
              </IconButton>
            </Box>
          </Box>

          {/* Progress */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Time Spent</Typography>
              <Typography variant="body2">{timeSpent} / {material.estimatedDuration} minutes</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((timeSpent / material.estimatedDuration) * 100, 100)} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'white'
                }
              }} 
            />
          </Box>
        </CardContent>
      </Card>

      {/* Material Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Material Content
              </Typography>
              
              {(material.url || material.type === 'structured_notes') ? (
                <Box sx={{ width: '100%' }}>
                      {/* Modern Document Viewer Header */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 2,
                        p: 2,
                        backgroundColor: 'grey.50',
                        borderRadius: 1
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PictureAsPdf sx={{ color: 'error.main' }} />
                          <Typography variant="h6">
                            {material.title}
                          </Typography>
                          {viewerType === 'pdf' && numPages && (
                            <Chip 
                              label={`${numPages} pages`} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {/* WebViewer Controls */}
                          {viewerType === 'webviewer' && webViewerInstance && (
                            <>
                              <Tooltip title="Add Comment">
                                <IconButton 
                                  onClick={() => webViewerInstance.UI.enableElements(['annotationCommentButton'])}
                                  color="primary"
                                >
                                  <Assignment />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Search">
                                <IconButton 
                                  onClick={() => webViewerInstance.UI.openElements(['searchPanel'])}
                                  color="primary"
                                >
                                  <Search />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          
                          {/* PDF Controls */}
                          {viewerType === 'pdf' && (
                            <>
                              <Tooltip title="Previous Page">
                                <span>
                                  <IconButton 
                                    onClick={goToPrevPage}
                                    disabled={pageNumber <= 1}
                                    color="primary"
                                  >
                                    <ArrowBack />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Next Page">
                                <span>
                                  <IconButton 
                                    onClick={goToNextPage}
                                    disabled={pageNumber >= (numPages || 1)}
                                    color="primary"
                                  >
                                    <ArrowBack sx={{ transform: 'rotate(180deg)' }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Zoom In">
                                <IconButton onClick={zoomIn} color="primary">
                                  <ZoomIn />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Zoom Out">
                                <IconButton onClick={zoomOut} color="primary">
                                  <ZoomOut />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rotate">
                                <IconButton onClick={rotateDocument} color="primary">
                                  <RotateRight />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          
                          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen for Better Viewing"}>
                            <Button
                              variant="contained"
                              onClick={() => setIsFullscreen(!isFullscreen)}
                              startIcon={isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                              sx={{
                                backgroundColor: isFullscreen ? 'error.main' : 'primary.main',
                                color: 'white',
                                px: 3,
                                py: 1.5,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  backgroundColor: isFullscreen ? 'error.dark' : 'primary.dark',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                                },
                                '&:active': {
                                  transform: 'translateY(0px)',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                },
                                animation: !isFullscreen ? 'pulse 2s infinite' : 'none',
                                '@keyframes pulse': {
                                  '0%': {
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  },
                                  '50%': {
                                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                                  },
                                  '100%': {
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  },
                                },
                              }}
                            >
                              {isFullscreen ? 'Exit Fullscreen' : 'View in Fullscreen'}
                            </Button>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Fullscreen Prompt Overlay */}
                      {!isFullscreen && showFullscreenPrompt && (
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1000,
                          borderRadius: 2,
                          animation: 'fadeIn 0.5s ease-in-out',
                          '@keyframes fadeIn': {
                            '0%': { opacity: 0 },
                            '100%': { opacity: 1 },
                          },
                        }}>
                          <Box sx={{
                            textAlign: 'center',
                            color: 'white',
                            p: 3,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                          }}>
                            <IconButton
                              onClick={() => setShowFullscreenPrompt(false)}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                color: 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                },
                              }}
                            >
                              <VisibilityOff />
                            </IconButton>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                              📖 Better Reading Experience
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                              Click "View in Fullscreen" for optimal material viewing
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                              <Button
                                variant="contained"
                                size="large"
                                onClick={() => setIsFullscreen(true)}
                                startIcon={<Fullscreen />}
                                sx={{
                                  backgroundColor: 'primary.main',
                                  color: 'white',
                                  px: 4,
                                  py: 1.5,
                                  borderRadius: 2,
                                  fontWeight: 'bold',
                                  fontSize: '1rem',
                                  textTransform: 'none',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                  '&:hover': {
                                    backgroundColor: 'primary.dark',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                                  },
                                }}
                              >
                                View in Fullscreen
                              </Button>
                              <Button
                                variant="outlined"
                                size="large"
                                onClick={() => setShowFullscreenPrompt(false)}
                                sx={{
                                  color: 'white',
                                  borderColor: 'rgba(255, 255, 255, 0.5)',
                                  px: 3,
                                  py: 1.5,
                                  borderRadius: 2,
                                  fontWeight: 'bold',
                                  fontSize: '1rem',
                                  textTransform: 'none',
                                  '&:hover': {
                                    borderColor: 'white',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  },
                                }}
                              >
                                Continue Reading
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      )}

                      {/* Modern Document Viewer */}
                      <Box sx={{ 
                        width: '100%', 
                        height: isFullscreen ? '100vh' : '70vh',
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        overflow: 'hidden',
                        backgroundColor: 'white',
                        position: isFullscreen ? 'fixed' : 'relative',
                        top: isFullscreen ? 0 : 'auto',
                        left: isFullscreen ? 0 : 'auto',
                        zIndex: isFullscreen ? 9999 : 'auto'
                      }}>
                        {viewerType === 'webviewer' ? (
                          // WebViewer for all supported formats
                          <Box sx={{ width: '100%', height: '100%' }}>
                            {!webViewerReady ? (
                              <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                gap: 2,
                                p: 4
                              }}>
                                <CircularProgress size={60} />
                                <Typography variant="body1" color="text.secondary">
                                  Loading document viewer...
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Supporting PDF, DOCX, PPTX, XLSX, and more
                                </Typography>
                              </Box>
                            ) : (
                              <div 
                                ref={viewerRef}
                                style={{ 
                                  width: '100%', 
                                  height: '100%',
                                  position: 'relative'
                                }}
                              />
                            )}
                          </Box>
                        ) : (
                          // Use appropriate viewer based on material type
                          (() => {
                            console.log('🎯 MaterialView - Rendering material:', {
                              title: material.title,
                              type: material.type,
                              hasContent: !!material.content,
                              hasStructuredNotes: !!material.content?.structuredNotes
                            });
                            
                            // Use appropriate viewer based on material type
                            if (material.type === 'structured_notes') {
                              return (
                                <StructuredNotesViewer
                                  material={material}
                                  content={material.content}
                                  title={material.title}
                                  height="100%"
                                  onTimeSpent={setTimeSpent}
                                  onComplete={() => {
                                    setIsCompleted(true);
                                    handleMarkComplete();
                                  }}
                                  showProgress={true}
                                  userId={user?._id}
                                  autoRetry={true}
                                  maxRetries={3}
                                  validateContent={true}
                                  onBack={handleBackToCourse}
                                  onTimeSpent={(time) => {
                                    if (courseId && week && materialId) {
                                      progressTrackingService.updateTimeSpent(courseId, week._id, materialId, time);
                                    }
                                  }}
                                  onComplete={() => {
                                    if (!isCompleted) {
                                      handleMarkComplete();
                                    }
                                  }}
                                  userId={user?._id}
                                  autoRetry={true}
                                  maxRetries={3}
                                  validateContent={true}
                                  progressData={materialProgress}
                                  onProgressUpdate={(progress) => {
                                    if (courseId && week && materialId) {
                                      progressTrackingService.updateMaterialProgress(courseId, week._id, materialId, progress);
                                    }
                                  }}
                                />
                              );
                            }
                            
                            // For other material types, determine viewer based on URL extension
                            
                            if (urlLower.includes('.pdf')) {
                              return (
                                <SimplePDFViewer
                                  url={url}
                                  title={material.title}
                                  height="100%"
                                />
                              );
                            } else if (urlLower.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/)) {
                              return (
                                <SimpleOfficeViewer
                                  url={url}
                                  title={material.title}
                                  height="100%"
                                />
                              );
                            } else if (urlLower.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) {
                              return (
                                <SimpleMediaViewer
                                  url={url}
                                  title={material.title}
                                  type="video"
                                  height="100%"
                                />
                              );
                            } else if (urlLower.match(/\.(mp3|wav|ogg)$/)) {
                              return (
                                <SimpleMediaViewer
                                  url={url}
                                  title={material.title}
                                  type="audio"
                                  height="100%"
                                />
                              );
                            } else if (urlLower.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/)) {
                              return (
                                <SimpleImageViewer
                                  url={url}
                                  title={material.title}
                                  height="100%"
                                />
                              );
                            } else {
                              // Fallback for unsupported formats
                              return (
                                <Box 
                                  display="flex" 
                                  flexDirection="column" 
                                  justifyContent="center" 
                                  alignItems="center" 
                                  height="100%" 
                                  p={3}
                                >
                                  <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                      Unsupported File Format
                                    </Typography>
                                    <Typography variant="body2">
                                      This file format is not supported for inline viewing.
                                    </Typography>
                                  </Alert>
                                  <Button 
                                    variant="contained" 
                                    onClick={() => window.open(url, '_blank')}
                                    startIcon={<OpenInNew />}
                                  >
                                    Open in New Tab
                                  </Button>
                                </Box>
                              );
                            }
                          })()
                        )}
                      </Box>

                      {/* Document Info */}
                      <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>File Type:</strong> {material.url?.split('.').pop()?.toUpperCase() || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Estimated Duration:</strong> {material.estimatedDuration} minutes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Viewer:</strong> {material.type === 'structured_notes' ? 'Structured Notes Viewer' :
                                                   urlLower.includes('.pdf') ? 'PDF Viewer' :
                                                   urlLower.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/) ? 'Office Document Viewer' :
                                                   urlLower.match(/\.(mp4|avi|mov|wmv|flv|webm|mp3|wav|ogg)$/) ? 'Media Viewer' :
                                                   urlLower.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/) ? 'Image Viewer' : 'Generic Viewer'}
                        </Typography>
                        {material.type === 'structured_notes' && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Features:</strong> Search, Bookmarks, Progress Tracking, User Notes
                          </Typography>
                        )}
                        {urlLower.includes('.pdf') && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Features:</strong> Zoom, Fullscreen, Download, Print
                          </Typography>
                        )}
                        {urlLower.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/) && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Features:</strong> Online Viewing, Download, Fullscreen
                          </Typography>
                        )}
                        {urlLower.match(/\.(mp4|avi|mov|wmv|flv|webm|mp3|wav|ogg)$/) && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Features:</strong> Media Controls, Fullscreen, Download
                          </Typography>
                        )}
                        {urlLower.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/) && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Features:</strong> Zoom, Rotate, Fullscreen, Download
                          </Typography>
                        )}
                        {viewerType === 'pdf' && numPages && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Pages:</strong> {numPages}
                          </Typography>
                        )}
                        {material.isRequired && (
                          <Chip label="Required" size="small" color="error" sx={{ mt: 1 }} />
                        )}
                      </Box>
                    </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Content Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This material doesn't have any content to display.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Material Info */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Material Information
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Type
                    </Typography>
                    <Chip 
                      label={material.type} 
                      color={getMaterialTypeColor(material.type) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body1">
                      {material.estimatedDuration} minutes
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip 
                      label={isCompleted ? 'Completed' : 'In Progress'} 
                      color={isCompleted ? 'success' : 'primary'}
                      size="small"
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Time Spent
                    </Typography>
                    <Typography variant="body1">
                      {timeSpent} minutes
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                
                <Stack spacing={2}>
                  {!isCompleted && (
                    <Button 
                      variant="contained" 
                      fullWidth
                      startIcon={<CheckCircle />}
                      onClick={handleMarkComplete}
                      disabled={timeSpent < material.estimatedDuration * 0.5} // Require at least 50% time spent
                    >
                      Mark as Complete
                    </Button>
                  )}
                  
                  <Button 
                    variant="outlined" 
                    fullWidth
                    startIcon={<ArrowBack />}
                    onClick={handleBackToCourse}
                  >
                    Back to Course
                  </Button>
                  
                </Stack>
              </CardContent>
            </Card>

            {/* Week Progress */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Week Progress
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Week {week.weekNumber}: {week.title}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Materials Completed</Typography>
                    <Typography variant="body2">
                      {week.materials.filter(m => m._id === materialId).length > 0 ? 1 : 0} / {week.materials.length}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={week.materials.length > 0 ? (1 / week.materials.length) * 100 : 0}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleBackToCourse}
      >
        <School />
      </Fab>
    </Container>
  );
};

export default MaterialView;
