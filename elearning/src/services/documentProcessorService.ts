import api from './api';

export interface StructuredNotes {
  title: string;
  summary: string;
  keyPoints: string[];
  sections: NoteSection[];
  metadata: {
    totalSections: number;
    estimatedReadingTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topics: string[];
  };
}

export interface NoteSection {
  title: string;
  content: string;
  keyPoints: string[];
  order: number;
}

export interface DocumentProcessingResult {
  success: boolean;
  material?: {
    title: string;
    description: string;
    type: string;
    content: {
      extractedText: string;
      structuredNotes: StructuredNotes;
      originalFileName: string;
      fileSize: number;
      mimeType: string;
      processedAt: string;
      processingTime: number;
    };
    metadata: {
      courseId?: string;
      weekId?: string;
      uploadedBy: string;
      uploadDate: string;
      isProcessed: boolean;
      processingStats: {
        textLength: number;
        sectionsCount: number;
        keyPointsCount: number;
        estimatedReadingTime: number;
      };
    };
  };
  processingStats?: {
    processingTime: number;
    textLength: number;
    sectionsCount: number;
    keyPointsCount: number;
  };
  error?: string;
}

export interface ProcessingStats {
  totalProcessed: number;
  averageProcessingTime: number;
  successRate: number;
}

class DocumentProcessorService {
  private static instance: DocumentProcessorService;

  private constructor() {}

  public static getInstance(): DocumentProcessorService {
    if (!DocumentProcessorService.instance) {
      DocumentProcessorService.instance = new DocumentProcessorService();
    }
    return DocumentProcessorService.instance;
  }

  /**
   * Process a document and create structured notes
   */
  async processDocument(
    file: File,
    title: string,
    description?: string,
    courseId?: string,
    weekId?: string
  ): Promise<DocumentProcessingResult> {
    try {
      console.log('📄 Processing document:', {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        title,
        courseId,
        weekId
      });

      const formData = new FormData();
      formData.append('file', file); // Changed from 'document' to 'file' to match backend expectation
      formData.append('title', title);
      
      if (description) {
        formData.append('description', description);
      }
      
      if (courseId) {
        formData.append('courseId', courseId);
      }
      
      if (weekId) {
        formData.append('weekId', weekId);
      }

      const response = await api.post('/documents/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Reduced to 1 minute timeout for faster processing
      });

      console.log('✅ Document processed successfully:', response.data);
      return response.data.data; // Return the data object from the response

    } catch (error: any) {
      console.error('❌ Document processing error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid document or missing required fields');
      }
      
      if (error.response?.status === 413) {
        throw new Error('File too large. Please upload a smaller document (max 50MB)');
      }
      
      if (error.response?.status === 415) {
        throw new Error('Document type not supported. Please upload PDF, Word, or text documents');
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Processing timed out. Please try again with a smaller document');
      }

      throw new Error(error.response?.data?.message || 'Document processing failed. Please try again.');
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(): Promise<ProcessingStats> {
    try {
      const response = await api.get('/documents/processing-stats');
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting processing stats:', error);
      throw new Error('Failed to get processing statistics');
    }
  }

  /**
   * Test document processing (for development)
   */
  async testDocumentProcessing(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await api.post('/documents/test-process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000,
      });

      return response.data;
    } catch (error: any) {
      console.error('Test processing error:', error);
      throw new Error(error.response?.data?.message || 'Test processing failed');
    }
  }

  /**
   * Validate file before processing
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File too large. Maximum size is 50MB'
      };
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload PDF, Word, or text documents'
      };
    }

    return { isValid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file type icon
   */
  getFileTypeIcon(mimeType: string): string {
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('text')) return '📃';
    return '📄';
  }

  /**
   * Estimate processing time based on file size
   */
  estimateProcessingTime(fileSize: number): number {
    // Rough estimate: 1 second per MB, minimum 5 seconds, maximum 60 seconds
    const baseTime = Math.max(5, Math.min(60, Math.ceil(fileSize / (1024 * 1024))));
    return baseTime;
  }
}

export default DocumentProcessorService;
