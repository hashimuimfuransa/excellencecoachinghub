import api from './api';

export interface MaterialProgress {
  courseId: string;
  weekId: string;
  materialId: string;
  timeSpent: number;
  lastPosition?: number;
  readSections?: number[];
  completedSections?: number[];
  bookmarks?: number[];
  userNotes?: { [sectionId: number]: string };
  isCompleted: boolean;
  completedAt?: Date;
  lastAccessed: Date;
}

export interface SessionProgress {
  sessionId: string;
  courseId: string;
  materialId: string;
  startTime: Date;
  endTime?: Date;
  timeSpent: number;
  actions: ProgressAction[];
}

export interface ProgressAction {
  type: 'section_read' | 'section_bookmarked' | 'note_added' | 'search_performed' | 'fullscreen_entered';
  timestamp: Date;
  data?: any;
}

class ProgressTrackingService {
  private static instance: ProgressTrackingService;
  private progressCache: Map<string, MaterialProgress> = new Map();
  private sessionCache: Map<string, SessionProgress> = new Map();
  private localStorageKey = 'material_progress_cache';
  private sessionStorageKey = 'material_session_cache';

  constructor() {
    this.loadFromLocalStorage();
  }

  static getInstance(): ProgressTrackingService {
    if (!ProgressTrackingService.instance) {
      ProgressTrackingService.instance = new ProgressTrackingService();
    }
    return ProgressTrackingService.instance;
  }

  // Load progress from localStorage on initialization
  private loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem(this.localStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Convert date strings back to Date objects
        const progressMap = new Map();
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object') {
            if (value.lastAccessed) value.lastAccessed = new Date(value.lastAccessed);
            if (value.completedAt) value.completedAt = new Date(value.completedAt);
          }
          progressMap.set(key, value);
        });
        this.progressCache = progressMap;
      }

      const sessionCached = sessionStorage.getItem(this.sessionStorageKey);
      if (sessionCached) {
        const parsed = JSON.parse(sessionCached);
        // Convert date strings back to Date objects
        const sessionMap = new Map();
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object') {
            if (value.startTime) value.startTime = new Date(value.startTime);
            if (value.endTime) value.endTime = new Date(value.endTime);
            if (value.actions && Array.isArray(value.actions)) {
              value.actions = value.actions.map((action: any) => ({
                ...action,
                timestamp: new Date(action.timestamp)
              }));
            }
          }
          sessionMap.set(key, value);
        });
        this.sessionCache = sessionMap;
      }
    } catch (error) {
      console.warn('Failed to load progress from localStorage:', error);
    }
  }

  // Save progress to localStorage
  private saveToLocalStorage() {
    try {
      const progressObj = Object.fromEntries(this.progressCache);
      localStorage.setItem(this.localStorageKey, JSON.stringify(progressObj));

      const sessionObj = Object.fromEntries(this.sessionCache);
      sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(sessionObj));
    } catch (error) {
      console.warn('Failed to save progress to localStorage:', error);
    }
  }

  // Get progress key
  private getProgressKey(courseId: string, materialId: string): string {
    return `${courseId}_${materialId}`;
  }

  // Get session key
  private getSessionKey(courseId: string, materialId: string): string {
    return `${courseId}_${materialId}_session`;
  }

  // Start a new session
  startSession(courseId: string, weekId: string, materialId: string): string {
    const sessionId = `${courseId}_${materialId}_${Date.now()}`;
    const session: SessionProgress = {
      sessionId,
      courseId,
      materialId,
      startTime: new Date(),
      timeSpent: 0,
      actions: []
    };

    this.sessionCache.set(sessionId, session);
    this.saveToLocalStorage();
    return sessionId;
  }

  // End a session
  endSession(sessionId: string) {
    const session = this.sessionCache.get(sessionId);
    if (session) {
      session.endTime = new Date();
      
      // Ensure startTime is a Date object
      const startTime = session.startTime instanceof Date ? session.startTime : new Date(session.startTime);
      session.timeSpent = Math.floor((session.endTime.getTime() - startTime.getTime()) / 1000);
      
      this.saveToLocalStorage();
    }
  }

  // Add action to session
  addAction(sessionId: string, action: Omit<ProgressAction, 'timestamp'>) {
    const session = this.sessionCache.get(sessionId);
    if (session) {
      session.actions.push({
        ...action,
        timestamp: new Date()
      });
      this.saveToLocalStorage();
    }
  }

  // Get or create material progress
  getMaterialProgress(courseId: string, weekId: string, materialId: string): MaterialProgress {
    const key = this.getProgressKey(courseId, materialId);
    let progress = this.progressCache.get(key);

    if (!progress) {
      progress = {
        courseId,
        weekId,
        materialId,
        timeSpent: 0,
        readSections: [],
        completedSections: [],
        bookmarks: [],
        userNotes: {},
        isCompleted: false,
        lastAccessed: new Date()
      };
      this.progressCache.set(key, progress);
      this.saveToLocalStorage();
    }

    return progress;
  }

  // Update material progress
  updateMaterialProgress(
    courseId: string, 
    weekId: string, 
    materialId: string, 
    updates: Partial<MaterialProgress>
  ): MaterialProgress {
    const key = this.getProgressKey(courseId, materialId);
    const progress = this.getMaterialProgress(courseId, weekId, materialId);
    
    const updatedProgress = {
      ...progress,
      ...updates,
      lastAccessed: new Date()
    };

    this.progressCache.set(key, updatedProgress);
    this.saveToLocalStorage();
    return updatedProgress;
  }

  // Mark section as read
  markSectionRead(courseId: string, weekId: string, materialId: string, sectionIndex: number) {
    const progress = this.getMaterialProgress(courseId, weekId, materialId);
    const readSections = new Set(progress.readSections || []);
    readSections.add(sectionIndex);
    
    this.updateMaterialProgress(courseId, weekId, materialId, {
      readSections: Array.from(readSections)
    });
  }

  // Add bookmark
  addBookmark(courseId: string, weekId: string, materialId: string, sectionIndex: number) {
    const progress = this.getMaterialProgress(courseId, weekId, materialId);
    const bookmarks = new Set(progress.bookmarks || []);
    bookmarks.add(sectionIndex);
    
    this.updateMaterialProgress(courseId, weekId, materialId, {
      bookmarks: Array.from(bookmarks)
    });
  }

  // Remove bookmark
  removeBookmark(courseId: string, weekId: string, materialId: string, sectionIndex: number) {
    const progress = this.getMaterialProgress(courseId, weekId, materialId);
    const bookmarks = new Set(progress.bookmarks || []);
    bookmarks.delete(sectionIndex);
    
    this.updateMaterialProgress(courseId, weekId, materialId, {
      bookmarks: Array.from(bookmarks)
    });
  }

  // Add user note
  addUserNote(courseId: string, weekId: string, materialId: string, sectionIndex: number, note: string) {
    const progress = this.getMaterialProgress(courseId, weekId, materialId);
    const userNotes = { ...progress.userNotes };
    userNotes[sectionIndex] = note;
    
    this.updateMaterialProgress(courseId, weekId, materialId, {
      userNotes
    });
  }

  // Update time spent
  updateTimeSpent(courseId: string, weekId: string, materialId: string, timeSpent: number) {
    this.updateMaterialProgress(courseId, weekId, materialId, {
      timeSpent
    });
  }

  // Mark material as completed
  async markMaterialCompleted(courseId: string, weekId: string, materialId: string, timeSpent: number) {
    const progress = this.updateMaterialProgress(courseId, weekId, materialId, {
      isCompleted: true,
      completedAt: new Date(),
      timeSpent
    });

    // Sync with server
    try {
      await api.post(`/progress/weeks/${weekId}/materials/${materialId}/complete`, {
        timeSpent,
        progressData: {
          readSections: progress.readSections,
          bookmarks: progress.bookmarks,
          userNotes: progress.userNotes
        }
      });
    } catch (error) {
      console.error('Failed to sync progress with server:', error);
    }

    return progress;
  }

  // Get all progress for a course
  getCourseProgress(courseId: string): MaterialProgress[] {
    return Array.from(this.progressCache.values())
      .filter(progress => progress.courseId === courseId);
  }

  // Clear progress for a material
  clearMaterialProgress(courseId: string, materialId: string) {
    const key = this.getProgressKey(courseId, materialId);
    this.progressCache.delete(key);
    this.saveToLocalStorage();
  }

  // Clear all progress
  clearAllProgress() {
    this.progressCache.clear();
    this.sessionCache.clear();
    localStorage.removeItem(this.localStorageKey);
    sessionStorage.removeItem(this.sessionStorageKey);
  }

  // Sync with server with retry logic
  async syncWithServer(courseId: string, retries: number = 2): Promise<void> {
    try {
      const courseProgress = this.getCourseProgress(courseId);
      
      if (!courseProgress || Object.keys(courseProgress).length === 0) {
        console.log('No progress data to sync');
        return;
      }
      
      console.log('🔄 Syncing progress data:', courseProgress);
      
      await api.post(`/progress/courses/${courseId}/sync`, {
        progressData: courseProgress
      });
      
      console.log('✅ Progress successfully synced with server');
      
    } catch (error: any) {
      console.error('❌ Failed to sync progress with server:', error);
      
      // Retry logic for network errors
      if (retries > 0 && (error.code === 'NETWORK_ERROR' || error.response?.status >= 500)) {
        console.log(`🔄 Retrying sync... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return this.syncWithServer(courseId, retries - 1);
      }
      
      // Store failed sync for later retry
      const failedSyncs = JSON.parse(localStorage.getItem('failedProgressSyncs') || '[]');
      failedSyncs.push({
        courseId,
        timestamp: new Date().toISOString(),
        progressData: this.getCourseProgress(courseId)
      });
      localStorage.setItem('failedProgressSyncs', JSON.stringify(failedSyncs.slice(-10))); // Keep last 10
      
      throw error;
    }
  }

  // Retry failed syncs
  async retryFailedSyncs() {
    const failedSyncs = JSON.parse(localStorage.getItem('failedProgressSyncs') || '[]');
    
    if (failedSyncs.length === 0) return;
    
    console.log(`🔄 Retrying ${failedSyncs.length} failed syncs...`);
    
    const remainingFailures = [];
    
    for (const syncData of failedSyncs) {
      try {
        await api.post(`/progress/courses/${syncData.courseId}/sync`, {
          progressData: syncData.progressData
        });
        console.log(`✅ Retry successful for course ${syncData.courseId}`);
      } catch (error) {
        console.error(`❌ Retry failed for course ${syncData.courseId}:`, error);
        remainingFailures.push(syncData);
      }
    }
    
    localStorage.setItem('failedProgressSyncs', JSON.stringify(remainingFailures));
  }

  // Load progress from server
  async loadFromServer(courseId: string) {
    try {
      const response = await api.get(`/progress/courses/${courseId}/progress`);
      const serverProgress = response.data.data;

      // Merge server progress with local cache
      if (serverProgress.materialProgresses) {
        serverProgress.materialProgresses.forEach((serverProgress: any) => {
          const key = this.getProgressKey(courseId, serverProgress.materialId);
          const localProgress = this.progressCache.get(key);

          // Ensure we have valid dates for comparison
          const serverUpdatedAt = new Date(serverProgress.updatedAt || serverProgress.createdAt);
          const localLastAccessed = localProgress?.lastAccessed instanceof Date 
            ? localProgress.lastAccessed 
            : new Date(localProgress?.lastAccessed || 0);

          // Use server data if it's more recent or if we don't have local data
          if (!localProgress || serverUpdatedAt > localLastAccessed) {
            this.progressCache.set(key, {
              courseId,
              weekId: serverProgress.weekId,
              materialId: serverProgress.materialId,
              timeSpent: serverProgress.timeSpent || 0,
              readSections: serverProgress.progressData?.readSections || [],
              completedSections: serverProgress.progressData?.completedSections || [],
              bookmarks: serverProgress.progressData?.bookmarks || [],
              userNotes: serverProgress.progressData?.userNotes || {},
              isCompleted: serverProgress.status === 'completed',
              completedAt: serverProgress.completedAt ? new Date(serverProgress.completedAt) : undefined,
              lastAccessed: serverUpdatedAt
            });
          }
        });
      }

      this.saveToLocalStorage();
    } catch (error) {
      console.error('Failed to load progress from server:', error);
    }
  }
}

export const progressTrackingService = ProgressTrackingService.getInstance();
