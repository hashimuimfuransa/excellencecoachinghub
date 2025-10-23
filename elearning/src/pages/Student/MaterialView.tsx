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
  Zoom,
  AppBar,
  Toolbar,
  Fade,
  Slide,
  Grow,
  Badge,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Slider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemSecondaryAction,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  AlertTitle,
  Skeleton,
  Backdrop,
  Modal,
  Fade as MuiFade,
  useTheme,
  useMediaQuery,
  alpha,
  styled,
  keyframes
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
  VisibilityOff,
  Translate,
  Mic,
  MicOff,
  VolumeOff,
  VolumeUp as VolumeUpIcon,
  RecordVoiceOver,
  Hearing,
  Accessibility,
  AutoAwesome,
  Star,
  StarBorder,
  Favorite,
  FavoriteBorder,
  ThumbUp,
  ThumbDown,
  Comment,
  Notes,
  Highlight,
  ContentCopy,
  Refresh,
  Settings,
  MoreVert,
  ExpandMore,
  ExpandLess,
  KeyboardArrowUp,
  KeyboardArrowDown,
  PlayCircleOutline,
  PauseCircleOutline,
  StopCircle,
  SkipNext,
  SkipPrevious,
  Replay,
  Speed,
  Close,
  Check,
  Error,
  Warning,
  Info,
  Lightbulb,
  TrendingUp,
  Assessment,
  Analytics,
  Timeline,
  BarChart,
  PieChart,
  TableChart,
  ViewModule,
  ViewList,
  ViewComfy,
  ViewStream,
  ViewCarousel,
  ViewQuilt,
  ViewSidebar,
  ViewWeek,
  ViewDay,
  ViewAgenda,
  ViewHeadline,
  ViewColumn,
  ViewArray,
  ViewCompact,
  ViewKanban,
  ViewTimeline,
  ViewInAr,
  ViewInArOutlined,
  View3D,
  View3DOutlined,
  View360,
  View360Outlined,
  ViewComfyOutlined,
  ViewListOutlined,
  ViewModuleOutlined,
  ViewQuiltOutlined,
  ViewStreamOutlined,
  ViewCarouselOutlined,
  ViewSidebarOutlined,
  ViewWeekOutlined,
  ViewDayOutlined,
  ViewAgendaOutlined,
  ViewHeadlineOutlined,
  ViewColumnOutlined,
  ViewArrayOutlined,
  ViewCompactOutlined,
  ViewKanbanOutlined,
  ViewTimelineOutlined,
  ViewInArOutlined as ViewInArOutlinedIcon,
  View3DOutlined as View3DOutlinedIcon,
  View360Outlined as View360OutlinedIcon,
  ViewComfyOutlined as ViewComfyOutlinedIcon,
  ViewListOutlined as ViewListOutlinedIcon,
  ViewModuleOutlined as ViewModuleOutlinedIcon,
  ViewQuiltOutlined as ViewQuiltOutlinedIcon,
  ViewStreamOutlined as ViewStreamOutlinedIcon,
  ViewCarouselOutlined as ViewCarouselOutlinedIcon,
  ViewSidebarOutlined as ViewSidebarOutlinedIcon,
  ViewWeekOutlined as ViewWeekOutlinedIcon,
  ViewDayOutlined as ViewDayOutlinedIcon,
  ViewAgendaOutlined as ViewAgendaOutlinedIcon,
  ViewHeadlineOutlined as ViewHeadlineOutlinedIcon,
  ViewColumnOutlined as ViewColumnOutlinedIcon,
  ViewArrayOutlined as ViewArrayOutlinedIcon,
  ViewCompactOutlined as ViewCompactOutlinedIcon,
  ViewKanbanOutlined as ViewKanbanOutlinedIcon,
  ViewTimelineOutlined as ViewTimelineOutlinedIcon,
  SmartToy,
  Send
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
import { geminiAIService } from '../../services/geminiAIService';

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

  // Voice and Translation State
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedText, setTranslatedText] = useState('');
  const [voiceRecognition, setVoiceRecognition] = useState<any>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<any>(null);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: null as any
  });
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState<string[]>([]);
  const [isVoiceAssistantActive, setIsVoiceAssistantActive] = useState(false);

  // AI Assistant State
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

  // Track time spent on page and update progress
  useEffect(() => {
    if (material && !isCompleted) {
      // Set start time when component mounts
      if (!startTime) {
        setStartTime(new Date());
      }

      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - (startTime?.getTime() || now.getTime())) / 1000 / 60);
        const newTimeSpent = Math.max(elapsed, timeSpent);
        
        setTimeSpent(newTimeSpent);
        
        // Update progress tracking based on time spent on page
        if (courseId && week && materialId) {
          progressTrackingService.updateTimeSpent(courseId, week._id, materialId, newTimeSpent);
          
          // Calculate progress based on time spent vs estimated duration
          const estimatedDuration = material.estimatedDuration || 10; // Default to 10 minutes
          const progressPercentage = Math.min((newTimeSpent / estimatedDuration) * 100, 100);
          
          console.log(`📊 Page time progress: ${progressPercentage.toFixed(1)}% (${newTimeSpent}/${estimatedDuration} min)`);
          
          // Sync with server every 2 minutes (4 intervals of 30s) and at progress milestones
          const shouldSync = (
            (newTimeSpent > 0 && newTimeSpent % 2 === 0) || // Every 2 minutes
            (progressPercentage >= 25 && !sessionStorage.getItem(`sync_25_${materialId}`)) || // 25% milestone
            (progressPercentage >= 50 && !sessionStorage.getItem(`sync_50_${materialId}`)) || // 50% milestone
            (progressPercentage >= 75 && !sessionStorage.getItem(`sync_75_${materialId}`))    // 75% milestone
          );
          
          if (shouldSync) {
            console.log(`🔄 Syncing progress with server... (${progressPercentage.toFixed(1)}% complete)`);
            progressTrackingService.syncWithServer(courseId).catch(err => {
              console.warn('⚠️ Background sync failed:', err);
            });
            
            // Mark milestones as synced
            if (progressPercentage >= 25) sessionStorage.setItem(`sync_25_${materialId}`, 'true');
            if (progressPercentage >= 50) sessionStorage.setItem(`sync_50_${materialId}`, 'true');
            if (progressPercentage >= 75) sessionStorage.setItem(`sync_75_${materialId}`, 'true');
          }
        }
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [material, isCompleted, startTime, timeSpent, courseId, week, materialId]);

  // Save progress when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (courseId && week && materialId && timeSpent > 0) {
        console.log('💾 Saving progress before page unload...');
        // Force sync progress to local storage before leaving
        progressTrackingService.updateTimeSpent(courseId, week._id, materialId, timeSpent);
        // Try to sync with server (may not complete if page closes quickly)
        progressTrackingService.syncWithServer(courseId).catch(() => {
          console.warn('⚠️ Final sync failed - progress saved locally');
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && courseId && week && materialId && timeSpent > 0) {
        console.log('👁️ Page hidden - saving progress...');
        progressTrackingService.updateTimeSpent(courseId, week._id, materialId, timeSpent);
        progressTrackingService.syncWithServer(courseId).catch(() => {
          console.warn('⚠️ Hidden sync failed - progress saved locally');
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [courseId, week, materialId, timeSpent]);

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

  // Voice and Translation Functions
  const initializeVoiceFeatures = () => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        console.log('Voice recognition started');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setVoiceCommands(prev => [...prev, finalTranscript]);
          handleVoiceCommand(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setVoiceRecognition(recognition);
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  };

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('scroll down') || lowerCommand.includes('scroll down')) {
      window.scrollBy(0, 200);
    } else if (lowerCommand.includes('scroll up') || lowerCommand.includes('scroll up')) {
      window.scrollBy(0, -200);
    } else if (lowerCommand.includes('next page') || lowerCommand.includes('next')) {
      if (pageNumber < (numPages || 1)) {
        setPageNumber(prev => prev + 1);
      }
    } else if (lowerCommand.includes('previous page') || lowerCommand.includes('previous')) {
      if (pageNumber > 1) {
        setPageNumber(prev => prev - 1);
      }
    } else if (lowerCommand.includes('zoom in')) {
      setScale(prev => Math.min(prev + 0.2, 3));
    } else if (lowerCommand.includes('zoom out')) {
      setScale(prev => Math.max(prev - 0.2, 0.5));
    } else if (lowerCommand.includes('fullscreen') || lowerCommand.includes('full screen')) {
      toggleFullscreen();
    } else if (lowerCommand.includes('translate') || lowerCommand.includes('translation')) {
      setShowVoicePanel(true);
    } else if (lowerCommand.includes('read aloud') || lowerCommand.includes('read')) {
      readCurrentContent();
    } else if (lowerCommand.includes('stop') || lowerCommand.includes('pause')) {
      stopReading();
    }
  };

  const startVoiceRecognition = () => {
    if (voiceRecognition) {
      voiceRecognition.start();
    }
  };

  const stopVoiceRecognition = () => {
    if (voiceRecognition) {
      voiceRecognition.stop();
    }
  };

  const readCurrentContent = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      
      let textToRead = '';
      if (material?.type === 'structured_notes' && material?.content?.summary) {
        textToRead = material.content.summary;
      } else if (material?.title) {
        textToRead = material.title;
      }

      if (textToRead) {
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = voiceSettings.rate;
        utterance.pitch = voiceSettings.pitch;
        utterance.volume = voiceSettings.volume;
        utterance.voice = voiceSettings.voice;
        
        utterance.onstart = () => {
          console.log('Reading started');
        };
        
        utterance.onend = () => {
          console.log('Reading completed');
        };
        
        speechSynthesis.speak(utterance);
      }
    }
  };

  const stopReading = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
  };

  const translateText = async (text: string, targetLang: string) => {
    setIsTranslating(true);
    try {
      // This would integrate with a translation service like Google Translate API
      // For now, we'll simulate translation
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Translation not available');
    } finally {
      setIsTranslating(false);
    }
  };

  const speakTranslatedText = () => {
    if (speechSynthesis && translatedText) {
      const utterance = new SpeechSynthesisUtterance(translatedText);
      utterance.lang = selectedLanguage;
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;
      speechSynthesis.speak(utterance);
    }
  };

  // Initialize voice features on component mount
  useEffect(() => {
    initializeVoiceFeatures();
  }, [selectedLanguage]);

  // Initialize AI Assistant with welcome message
  useEffect(() => {
    if (showAIAssistant && chatMessages.length === 0) {
      const generateWelcomeMessage = async () => {
        try {
          // Use Gemini AI to generate a personalized welcome message
          const response = await geminiAIService.sendMessage({
            userMessage: `Generate a personalized welcome message for a student studying "${material?.title || 'this material'}"`,
            context: {
              page: 'material-view',
              courseId: courseId,
              courseTitle: material?.title,
              content: material?.content
            }
          });

          const welcomeMessage = {
            id: 'welcome-1',
            text: response.message || `Hello! I'm your AI learning assistant. I can help you understand "${material?.title || 'this material'}", answer questions, create quizzes, and provide study tips. What would you like to know?`,
            isUser: false,
            timestamp: new Date()
          };
          setChatMessages([welcomeMessage]);
        } catch (error) {
          console.error('Error generating welcome message:', error);
          // Fallback welcome message
          const welcomeMessage = {
            id: 'welcome-1',
            text: `Hello! I'm your AI learning assistant. I can help you understand "${material?.title || 'this material'}", answer questions, create quizzes, and provide study tips. What would you like to know?`,
            isUser: false,
            timestamp: new Date()
          };
          setChatMessages([welcomeMessage]);
        }
      };

      generateWelcomeMessage();
    }
  }, [showAIAssistant, material?.title, material?.content, courseId, chatMessages.length]);

  // AI Assistant Chat Functions
  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      text: currentMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      // Simulate AI response with a delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Generate AI response based on the message and material context
      const aiResponse = await generateAIResponse(currentMessage.trim(), material);
      
      const aiMessage = {
        id: `ai-${Date.now()}`,
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: "I'm sorry, I encountered an error. Please try again or ask a different question.",
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (message: string, material: any) => {
    try {
      // Use Gemini AI to generate contextual responses
      const materialContext = {
        title: material?.title || 'this material',
        content: material?.content || '',
        type: material?.type || 'text',
        courseId: courseId
      };

      const contextPrompt = `You are an AI learning assistant helping a student with their course material. 

MATERIAL CONTEXT:
- Title: ${materialContext.title}
- Content: ${materialContext.content}
- Material Type: ${materialContext.type}

STUDENT'S QUESTION: "${message}"

Please provide a helpful, educational response that:
1. Directly addresses the student's question
2. Uses the material content to provide specific, relevant information
3. Offers additional learning suggestions or clarifications
4. Maintains a friendly, encouraging tone
5. Keeps responses concise but informative (2-3 paragraphs max)

If the question is about creating quizzes, offer to help generate practice questions.
If the question is about explanations, provide clear, detailed explanations with examples.
If the question is about study tips, give specific, actionable advice.
If the question is about translations, offer to help with language support.

Respond as a knowledgeable tutor who has access to the course material.`;

      const response = await geminiAIService.sendMessage({
        userMessage: message,
        context: {
          page: 'material-view',
          courseId: courseId,
          courseTitle: materialContext.title,
          content: materialContext.content
        }
      });

      return response.message || `I understand you're asking about "${message}" regarding "${materialContext.title}". Let me help you with that based on the course material.`;
      
    } catch (error) {
      console.error('Error calling Gemini AI:', error);
      
      // Fallback to contextual responses if Gemini AI fails
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
        return `I can help you create a quiz about "${material?.title || 'this material'}". Based on the content, I can generate practice questions that test your understanding of the key concepts. Would you like me to create some questions for you?`;
      }
      
      if (lowerMessage.includes('explain') || lowerMessage.includes('what is') || lowerMessage.includes('how does')) {
        return `I'd be happy to explain "${material?.title || 'this topic'}" in more detail. The material covers important concepts that I can break down for you. What specific aspect would you like me to focus on?`;
      }
      
      if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
        return `Here's a summary of "${material?.title || 'this material'}": The content covers key concepts that are important for your understanding. Would you like me to create a detailed summary or highlight the main points?`;
      }
      
      if (lowerMessage.includes('help') || lowerMessage.includes('stuck')) {
        return `I'm here to help! I can assist you with understanding the material, creating study aids, answering questions, and providing learning strategies. What specific help do you need with "${material?.title || 'this topic'}"?`;
      }
      
      if (lowerMessage.includes('study') || lowerMessage.includes('learn')) {
        return `Great question about studying! For "${material?.title || 'this material'}", I recommend: 1) Review the key concepts regularly, 2) Create practice questions, 3) Use active recall techniques, and 4) Connect new information to what you already know. Would you like specific study tips?`;
      }
      
      // Default response
      return `That's an interesting question about "${material?.title || 'this material'}". I can help you understand this better by explaining concepts, creating practice questions, or providing study strategies. Could you be more specific about what you'd like to know?`;
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen();
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

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle back to course navigation
  const handleBackToCourse = () => {
    navigate(`/course/${courseId}/hub`);
  };

  // PDF navigation functions
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < (numPages || 1)) {
      setPageNumber(pageNumber + 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const rotateDocument = () => {
    setRotation(prev => (prev + 90) % 360);
  };

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
      
      if (materialProgress) {
        setIsCompleted(materialProgress.status === 'completed');
        setTimeSpent(materialProgress.timeSpent || 0);
        setMaterialProgress(materialProgress);
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
      setLoading(true);
      
      // Mark as completed in progress tracking with optimistic UI update
      setIsCompleted(true);
      
      // Use actual time spent (no minimum requirement) - user can complete anytime
      const actualTimeSpent = Math.max(timeSpent, 0.1); // Just ensure non-zero value
      
      // Update progress immediately in local storage with 100% completion
      progressTrackingService.markMaterialCompleted(courseId, week._id, materialId, actualTimeSpent);
      
      // End session and add completion action
      progressTrackingService.endSession(sessionId);
      progressTrackingService.addAction(sessionId, {
        type: 'section_read',
        data: { completed: true, timeSpent: actualTimeSpent }
      });

      console.log(`✅ Material marked as complete (Time spent: ${actualTimeSpent} minutes)`);
      
      // Sync with server in background - don't wait for it
      progressTrackingService.syncWithServer(courseId).then(() => {
        console.log('✅ Progress synced with server');
      }).catch((err) => {
        console.error('❌ Server sync failed, will retry later:', err);
      });
      
    } catch (err: any) {
      console.error('Error marking material complete:', err);
      setError(err.message || 'Failed to mark material complete');
      setIsCompleted(false); // Revert optimistic update
    } finally {
      setLoading(false);
    }
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
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      position: 'relative'
    }}>
      {/* Enhanced Header with Voice Controls */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Left Section - Navigation */}
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton 
              onClick={() => navigate('/dashboard/student/courses')}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <ArrowBack />
            </IconButton>
            
            <Box>
              <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                {material.title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {week.title}
              </Typography>
            </Box>
          </Box>

          {/* Right Section - Voice Controls */}
          <Box display="flex" alignItems="center" gap={1}>
            {/* Voice Assistant Toggle */}
            <Tooltip title={isVoiceEnabled ? "Disable Voice Assistant" : "Enable Voice Assistant"}>
              <IconButton
                onClick={() => {
                  setIsVoiceEnabled(!isVoiceEnabled);
                  if (!isVoiceEnabled) {
                    startVoiceRecognition();
                  } else {
                    stopVoiceRecognition();
                  }
                }}
                sx={{
                  color: isVoiceEnabled ? '#4caf50' : 'white',
                  bgcolor: isVoiceEnabled ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.1)',
                  '&:hover': { 
                    bgcolor: isVoiceEnabled ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.2)' 
                  }
                }}
              >
                {isVoiceEnabled ? <Mic /> : <MicOff />}
              </IconButton>
            </Tooltip>

            {/* Translation Button */}
            <Tooltip title="Voice Translation">
              <IconButton
                onClick={() => setShowVoicePanel(!showVoicePanel)}
                sx={{
                  color: showVoicePanel ? '#ff9800' : 'white',
                  bgcolor: showVoicePanel ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255,255,255,0.1)',
                  '&:hover': { 
                    bgcolor: showVoicePanel ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255,255,255,0.2)' 
                  }
                }}
              >
                <Translate />
              </IconButton>
            </Tooltip>

            {/* Read Aloud Button */}
            <Tooltip title="Read Aloud">
              <IconButton
                onClick={readCurrentContent}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <VolumeUp />
              </IconButton>
            </Tooltip>

            {/* Fullscreen Toggle */}
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              <IconButton
                onClick={toggleFullscreen}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Voice Commands Display */}
      {isVoiceEnabled && voiceCommands.length > 0 && (
        <Fade in={voiceCommands.length > 0}>
          <Paper 
            elevation={3} 
            sx={{ 
              position: 'fixed', 
              top: 80, 
              right: 16, 
              zIndex: 1000,
              p: 2,
              maxWidth: 300,
              bgcolor: 'rgba(0,0,0,0.8)',
              color: 'white',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Voice Commands:
            </Typography>
            {voiceCommands.slice(-3).map((command, index) => (
              <Chip 
                key={index}
                label={command}
                size="small"
                sx={{ mr: 1, mb: 1, bgcolor: 'rgba(255,255,255,0.2)' }}
              />
            ))}
          </Paper>
        </Fade>
      )}

      {/* Voice Panel Drawer */}
      <Drawer
        anchor="right"
        open={showVoicePanel}
        onClose={() => setShowVoicePanel(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            bgcolor: 'background.paper',
            p: 3
          }
        }}
      >
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Voice & Translation</Typography>
            <IconButton onClick={() => setShowVoicePanel(false)}>
              <Close />
            </IconButton>
          </Box>

          {/* Language Selection */}
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Target Language
            </Typography>
            <TextField
              select
              fullWidth
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              SelectProps={{
                native: true,
              }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
            </TextField>
          </Box>

          {/* Voice Settings */}
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Voice Settings
            </Typography>
            
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Speed: {voiceSettings.rate}x
              </Typography>
              <Slider
                value={voiceSettings.rate}
                onChange={(_, value) => setVoiceSettings(prev => ({ ...prev, rate: value as number }))}
                min={0.5}
                max={2}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Pitch: {voiceSettings.pitch}
              </Typography>
              <Slider
                value={voiceSettings.pitch}
                onChange={(_, value) => setVoiceSettings(prev => ({ ...prev, pitch: value as number }))}
                min={0.5}
                max={2}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Volume: {Math.round(voiceSettings.volume * 100)}%
              </Typography>
              <Slider
                value={voiceSettings.volume}
                onChange={(_, value) => setVoiceSettings(prev => ({ ...prev, volume: value as number }))}
                min={0}
                max={1}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>

          {/* Translation Section */}
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Text Translation
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Enter text to translate..."
              onChange={(e) => {
                if (e.target.value) {
                  translateText(e.target.value, selectedLanguage);
                }
              }}
            />
            
            {isTranslating && (
              <Box display="flex" alignItems="center" gap={1} mt={2}>
                <CircularProgress size={20} />
                <Typography variant="body2">Translating...</Typography>
              </Box>
            )}
            
            {translatedText && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Translation:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">{translatedText}</Typography>
                </Paper>
                <Button
                  startIcon={<VolumeUp />}
                  onClick={speakTranslatedText}
                  sx={{ mt: 1 }}
                  size="small"
                >
                  Speak Translation
                </Button>
              </Box>
            )}
          </Box>

          {/* Voice Commands Help */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Voice Commands
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Scroll down/up" 
                  secondary="Navigate through content"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Next/Previous page" 
                  secondary="Navigate pages"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Zoom in/out" 
                  secondary="Adjust zoom level"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Read aloud" 
                  secondary="Start text-to-speech"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Stop/Pause" 
                  secondary="Stop current action"
                />
              </ListItem>
            </List>
          </Box>
        </Box>
      </Drawer>

      <Container maxWidth="lg" sx={{ py: 4 }}>

      {/* Material Header */}
      <Card sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        // Mobile optimizations
        '@media (max-width: 768px)': {
          mb: 2
        }
      }}>
        <CardContent sx={{
          // Mobile padding optimizations
          '@media (max-width: 480px)': {
            padding: 2
          }
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            mb: 2,
            // Mobile layout optimizations
            '@media (max-width: 768px)': {
              flexDirection: 'column',
              gap: 2,
              alignItems: 'stretch'
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              flex: 1,
              // Mobile layout optimizations
              '@media (max-width: 480px)': {
                flexDirection: 'column',
                textAlign: 'center',
                gap: 1
              }
            }}>
              <Avatar sx={{ 
                bgcolor: 'white', 
                color: 'primary.main', 
                width: 64, 
                height: 64,
                // Mobile avatar optimizations
                '@media (max-width: 480px)': {
                  width: 48,
                  height: 48
                }
              }}>
                {getFileIcon(material.type)}
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h4" 
                  gutterBottom
                  sx={{
                    // Mobile typography optimizations
                    '@media (max-width: 768px)': {
                      fontSize: '1.75rem'
                    },
                    '@media (max-width: 480px)': {
                      fontSize: '1.5rem'
                    }
                  }}
                >
                  {material.title}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    opacity: 0.9, 
                    mb: 2,
                    // Mobile typography optimizations
                    '@media (max-width: 768px)': {
                      fontSize: '1rem'
                    },
                    '@media (max-width: 480px)': {
                      fontSize: '0.9rem',
                      mb: 1
                    }
                  }}
                >
                  {material.description}
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap',
                  // Mobile chip optimizations
                  '@media (max-width: 480px)': {
                    justifyContent: 'center',
                    gap: 0.5,
                    '& .MuiChip-root': {
                      fontSize: '0.75rem',
                      height: '28px'
                    }
                  }
                }}>
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
            
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              // Mobile action buttons optimizations
              '@media (max-width: 768px)': {
                justifyContent: 'center',
                alignSelf: 'center'
              },
              '@media (max-width: 480px)': {
                '& .MuiIconButton-root': {
                  padding: '8px'
                }
              }
            }}>
              <IconButton sx={{ color: 'white' }}>
                <Bookmark />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Share />
              </IconButton>
            </Box>
          </Box>

          {/* Progress */}
          <Box sx={{ 
            mt: 2,
            // Mobile progress optimizations
            '@media (max-width: 480px)': {
              mt: 1
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mb: 1,
              // Mobile progress text optimizations
              '@media (max-width: 480px)': {
                '& .MuiTypography-root': {
                  fontSize: '0.8rem'
                }
              }
            }}>
              <Typography variant="body2">
                {isCompleted ? 'Completed' : 'Progress'}
              </Typography>
              <Typography variant="body2">
                {isCompleted ? '100%' : `${Math.round((timeSpent / material.estimatedDuration) * 100)}%`} 
                ({timeSpent} / {material.estimatedDuration} min)
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={isCompleted ? 100 : Math.min((timeSpent / material.estimatedDuration) * 100, 100)} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: isCompleted ? '#4caf50' : 'white'
                },
                // Mobile progress bar optimizations
                '@media (max-width: 480px)': {
                  height: 6
                }
              }} 
            />
            {isCompleted && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  Material completed successfully!
                </Typography>
              </Box>
            )}
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
                              onClick={toggleFullscreen}
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
                            
                            // For other material types, determine viewer based on material type or URL extension
                            
                            // Check material type first
                            if (material.type === 'video') {
                              return (
                                <SimpleMediaViewer
                                  url={url}
                                  title={material.title}
                                  type="video"
                                  height="100%"
                                  description={material.description}
                                  estimatedDuration={material.estimatedDuration}
                                  isRequired={material.isRequired}
                                  materialType={material.type}
                                  onProgressUpdate={(progress, timeSpent) => {
                                    console.log(`📊 Video progress: ${progress.toFixed(1)}%, Time spent: ${timeSpent} min`);
                                    // Update the time spent state
                                    setTimeSpent(timeSpent);
                                    
                                    // Update progress tracking service
                                    if (courseId && week && materialId) {
                                      progressTrackingService.updateTimeSpent(courseId, week._id, materialId, timeSpent);
                                    }
                                  }}
                                  onVideoEnd={() => {
                                    console.log('🎬 Video ended - marking as completed');
                                    handleMarkComplete();
                                  }}
                                  onVideoStart={() => {
                                    console.log('▶️ Video started');
                                    if (!startTime) {
                                      setStartTime(new Date());
                                    }
                                  }}
                                />
                              );
                            } else if (material.type === 'image') {
                              return (
                                <SimpleImageViewer
                                  url={url}
                                  title={material.title}
                                  height="100%"
                                  description={material.description}
                                  estimatedDuration={material.estimatedDuration}
                                  isRequired={material.isRequired}
                                  materialType={material.type}
                                />
                              );
                            } else if (urlLower.includes('.pdf')) {
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
                                  description={material.description}
                                  estimatedDuration={material.estimatedDuration}
                                  isRequired={material.isRequired}
                                  materialType={material.type}
                                  onProgressUpdate={(progress, timeSpent) => {
                                    console.log(`📊 Video progress: ${progress.toFixed(1)}%, Time spent: ${timeSpent} min`);
                                    // Update the time spent state
                                    setTimeSpent(timeSpent);
                                    
                                    // Update progress tracking service
                                    if (courseId && week && materialId) {
                                      progressTrackingService.updateTimeSpent(courseId, week._id, materialId, timeSpent);
                                    }
                                  }}
                                  onVideoEnd={() => {
                                    console.log('🎬 Video ended - marking as completed');
                                    handleMarkComplete();
                                  }}
                                  onVideoStart={() => {
                                    console.log('▶️ Video started');
                                    if (!startTime) {
                                      setStartTime(new Date());
                                    }
                                  }}
                                />
                              );
                            } else if (urlLower.match(/\.(mp3|wav|ogg)$/)) {
                              return (
                                <SimpleMediaViewer
                                  url={url}
                                  title={material.title}
                                  type="audio"
                                  height="100%"
                                  description={material.description}
                                  estimatedDuration={material.estimatedDuration}
                                  isRequired={material.isRequired}
                                  materialType={material.type}
                                />
                              );
                            } else if (urlLower.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/)) {
                              return (
                                <SimpleImageViewer
                                  url={url}
                                  title={material.title}
                                  height="100%"
                                  description={material.description}
                                  estimatedDuration={material.estimatedDuration}
                                  isRequired={material.isRequired}
                                  materialType={material.type}
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
                
                <Stack spacing={2} sx={{
                  // Mobile button optimizations
                  '@media (max-width: 480px)': {
                    spacing: 1.5,
                    '& .MuiButton-root': {
                      minHeight: '48px',
                      fontSize: '0.9rem'
                    }
                  }
                }}>
                  {!isCompleted ? (
                    <Button 
                      variant="contained" 
                      fullWidth
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                      onClick={handleMarkComplete}
                      sx={{
                        // Mobile button styling
                        '@media (max-width: 480px)': {
                          py: 1.5
                        },
                        backgroundColor: loading ? 'action.disabled' : 'success.main',
                        '&:hover': {
                          backgroundColor: loading ? 'action.disabled' : 'success.dark',
                        }
                      }}
                    >
                      {loading ? 'Marking Complete...' : 'Mark as Complete'}
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      fullWidth
                      disabled
                      startIcon={<CheckCircle />}
                      sx={{
                        // Mobile button styling
                        '@media (max-width: 480px)': {
                          py: 1.5
                        },
                        backgroundColor: 'success.main',
                        color: 'white',
                        '&.Mui-disabled': {
                          backgroundColor: 'success.main',
                          color: 'white',
                          opacity: 0.8
                        }
                      }}
                    >
                      ✅ Completed
                    </Button>
                  )}
                  
                  <Button 
                    variant="outlined" 
                    fullWidth
                    startIcon={<ArrowBack />}
                    onClick={handleBackToCourse}
                    sx={{
                      // Mobile button styling
                      '@media (max-width: 480px)': {
                        py: 1.5
                      }
                    }}
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

      {/* Floating AI Assistant */}
      <Fab 
        className="ai-assistant-fab"
        color="secondary" 
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          left: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            transform: 'scale(1.1)'
          },
          transition: 'all 0.3s ease',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          zIndex: 10000, // Higher z-index to appear above fullscreen content
          // Ensure visibility in fullscreen
          '@media (display-mode: fullscreen)': {
            zIndex: 10000
          }
        }}
        onClick={() => setShowAIAssistant(true)}
      >
        <SmartToy />
      </Fab>

      {/* AI Assistant Badge */}
      <Chip
        className="ai-assistant-badge"
        label="AI Assistant"
        color="secondary"
        size="small"
        sx={{
          position: 'fixed',
          bottom: 80,
          left: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.75rem',
          zIndex: 10000, // Higher z-index to appear above fullscreen content
          animation: 'pulse 2s infinite',
          // Ensure visibility in fullscreen
          '@media (display-mode: fullscreen)': {
            zIndex: 10000
          }
        }}
      />

      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleBackToCourse}
      >
        <School />
      </Fab>

      {/* AI Assistant Dialog */}
      <Dialog
        open={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        maxWidth="md"
        fullWidth
        sx={{
          zIndex: 10001, // Higher z-index to appear above fullscreen content
          '& .MuiBackdrop-root': {
            zIndex: 10000
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '500px',
            zIndex: 10001
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          py: 2
        }}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <SmartToy />
            <Typography variant="h6" fontWeight="bold">
              AI Learning Assistant
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              Hi! I'm your AI assistant. I can help you understand this material, answer questions, 
              create quizzes, and provide study tips. What would you like to know?
            </Typography>
          </Box>

          {/* Quick Actions */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Quiz />}
                onClick={() => {
                  setCurrentMessage('Can you create a quiz for me?');
                  setTimeout(() => sendMessage(), 100);
                }}
                sx={{ 
                  borderRadius: 2,
                  py: 1.5,
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
                Generate Quiz
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<VolumeUp />}
                onClick={() => {
                  // Read material aloud
                  if (speechSynthesis) {
                    const utterance = new SpeechSynthesisUtterance(material.title + '. ' + material.content);
                    speechSynthesis.speak(utterance);
                  }
                }}
                sx={{ 
                  borderRadius: 2,
                  py: 1.5,
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
                Read Aloud
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Translate />}
                onClick={() => {
                  setCurrentMessage('Can you help me translate this material?');
                  setTimeout(() => sendMessage(), 100);
                }}
                sx={{ 
                  borderRadius: 2,
                  py: 1.5,
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
                Translate
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Lightbulb />}
                onClick={() => {
                  setCurrentMessage('Can you give me study tips for this material?');
                  setTimeout(() => sendMessage(), 100);
                }}
                sx={{ 
                  borderRadius: 2,
                  py: 1.5,
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
                Study Tips
              </Button>
            </Grid>
          </Grid>

          {/* Chat Interface */}
          <Box sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: 2, 
            p: 2, 
            backgroundColor: 'white',
            minHeight: '300px',
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Chat with AI Assistant
            </Typography>
            
            {/* Messages Display */}
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              mb: 2, 
              maxHeight: '250px',
              border: '1px solid #f0f0f0',
              borderRadius: 1,
              p: 1,
              backgroundColor: '#fafafa'
            }}>
              {chatMessages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '80%',
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: message.isUser 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : '#e3f2fd',
                      color: message.isUser ? 'white' : 'black',
                      fontSize: '0.9rem',
                      wordWrap: 'break-word'
                    }}
                  >
                    <Typography variant="body2">
                      {message.text}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.7, 
                        fontSize: '0.7rem',
                        display: 'block',
                        mt: 0.5
                      }}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: '#e3f2fd',
                      color: 'black',
                      fontSize: '0.9rem'
                    }}
                  >
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={12} />
                      AI is typing...
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
            
            {/* Message Input */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Ask me anything about this material..."
                variant="outlined"
                size="small"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#667eea' },
                    '&.Mui-focused fieldset': { borderColor: '#667eea' }
                  }
                }}
              />
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isTyping}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                  },
                  '&:disabled': {
                    background: '#ccc',
                    color: '#666'
                  },
                  minWidth: '100px'
                }}
              >
                {isTyping ? 'Sending...' : 'Send'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, background: '#f8f9fa' }}>
          <Button 
            onClick={() => setShowAIAssistant(false)}
            sx={{ color: '#667eea' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </Box>
  );
};

export default MaterialView;
