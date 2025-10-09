import { CentralAIManager } from './centralAIManager';
import fs from 'fs';
import path from 'path';

export interface DocumentProcessingResult {
  success: boolean;
  extractedText?: string;
  structuredNotes?: StructuredNotes;
  error?: string;
  processingTime?: number;
}

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

export class DocumentProcessorService {
  private static instance: DocumentProcessorService;
  private aiManager: CentralAIManager;

  private constructor() {
    this.aiManager = CentralAIManager.getInstance();
  }

  public static getInstance(): DocumentProcessorService {
    if (!DocumentProcessorService.instance) {
      DocumentProcessorService.instance = new DocumentProcessorService();
    }
    return DocumentProcessorService.instance;
  }

  /**
   * Process a document file and extract structured notes
   */
  async processDocument(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<DocumentProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📄 Processing document: ${fileName} (${mimeType})`);
      
      // Extract text from the document
      const extractedText = await this.extractTextFromDocument(fileBuffer, fileName, mimeType);
      
      if (!extractedText) {
        return {
          success: false,
          error: 'Could not extract text from document'
        };
      }

      console.log(`📝 Extracted ${extractedText.length} characters from document`);

      // Process text with Gemini AI to create structured notes
      const structuredNotes = await this.createStructuredNotes(extractedText, fileName);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Document processed successfully in ${processingTime}ms`);

      return {
        success: true,
        extractedText,
        structuredNotes,
        processingTime
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ Document processing failed after ${processingTime}ms:`, error);
      
      return {
        success: false,
        error: error.message || 'Document processing failed',
        processingTime
      };
    }
  }

  /**
   * Extract text from various document formats
   */
  private async extractTextFromDocument(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string | null> {
    try {
      // Handle different file types
      if (mimeType === 'application/pdf') {
        return await this.extractTextFromPDF(fileBuffer);
      } else if (mimeType.includes('word') || mimeType.includes('document')) {
        return await this.extractTextFromWord(fileBuffer);
      } else if (mimeType.includes('text')) {
        return fileBuffer.toString('utf-8');
      } else {
        // For other formats, try to extract as text
        return fileBuffer.toString('utf-8');
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      return null;
    }
  }

  /**
   * Extract text from PDF using a simple approach
   * Note: For production, you might want to use a proper PDF parsing library
   */
  private async extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
    // For now, we'll use Gemini AI to extract text from PDF
    // This is a simplified approach - in production you might use pdf-parse or similar
    try {
      // Convert PDF buffer to base64 for Gemini AI processing
      const base64Content = fileBuffer.toString('base64');
      
      const prompt = `
        Please extract all the text content from this PDF document and return it as plain text.
        Preserve the structure and formatting as much as possible.
        Do not include any analysis or commentary, just the raw text content.
      `;

      const result = await this.aiManager.generateContent({
        prompt,
        context: {
          documentType: 'pdf',
          task: 'text_extraction'
        },
        options: {
          maxTokens: 8000,
          temperature: 0.1
        }
      });

      return result.content || '';
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from Word documents
   */
  private async extractTextFromWord(fileBuffer: Buffer): Promise<string> {
    try {
      // For Word documents, we'll use Gemini AI to extract text
      const base64Content = fileBuffer.toString('base64');
      
      const prompt = `
        Please extract all the text content from this Word document and return it as plain text.
        Preserve the structure, headings, and formatting as much as possible.
        Do not include any analysis or commentary, just the raw text content.
      `;

      const result = await this.aiManager.generateContent({
        prompt,
        context: {
          documentType: 'word',
          task: 'text_extraction'
        },
        options: {
          maxTokens: 8000,
          temperature: 0.1
        }
      });

      return result.content || '';
    } catch (error) {
      console.error('Word document text extraction failed:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  /**
   * Create structured notes from extracted text using Gemini AI
   */
  private async createStructuredNotes(text: string, fileName: string): Promise<StructuredNotes> {
    const prompt = `
      Please analyze the following document and create structured notes in JSON format.
      
      Document: ${fileName}
      Content: ${text.substring(0, 6000)} ${text.length > 6000 ? '...' : ''}
      
      Create a JSON response with the following structure:
      {
        "title": "A clear, descriptive title for the document",
        "summary": "A comprehensive summary of the main content (2-3 paragraphs)",
        "keyPoints": ["Key point 1", "Key point 2", "Key point 3", ...],
        "sections": [
          {
            "title": "Section title",
            "content": "Detailed content of this section",
            "keyPoints": ["Section key point 1", "Section key point 2"],
            "order": 1
          }
        ],
        "metadata": {
          "totalSections": number,
          "estimatedReadingTime": number in minutes,
          "difficulty": "beginner" | "intermediate" | "advanced",
          "topics": ["topic1", "topic2", ...]
        }
      }
      
      Please ensure:
      1. The JSON is valid and properly formatted
      2. Sections are logically organized
      3. Key points are concise and meaningful
      4. Reading time is estimated based on content length
      5. Difficulty level is appropriate for the content
      6. Topics are relevant and specific
    `;

    try {
      const result = await this.aiManager.generateContent({
        prompt,
        context: {
          documentType: 'structured_notes',
          fileName,
          task: 'note_creation'
        },
        options: {
          maxTokens: 4000,
          temperature: 0.3
        }
      });

      // Parse the JSON response
      const jsonMatch = result.content?.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const structuredNotes = JSON.parse(jsonMatch[0]) as StructuredNotes;
      
      // Validate the structure
      this.validateStructuredNotes(structuredNotes);
      
      return structuredNotes;

    } catch (error) {
      console.error('Failed to create structured notes:', error);
      throw new Error('Failed to create structured notes from document');
    }
  }

  /**
   * Validate the structure of generated notes
   */
  private validateStructuredNotes(notes: any): void {
    if (!notes.title || !notes.summary || !Array.isArray(notes.keyPoints) || !Array.isArray(notes.sections)) {
      throw new Error('Invalid structured notes format');
    }

    // Ensure all sections have required fields
    for (const section of notes.sections) {
      if (!section.title || !section.content || !Array.isArray(section.keyPoints) || typeof section.order !== 'number') {
        throw new Error('Invalid section format in structured notes');
      }
    }

    // Ensure metadata is present
    if (!notes.metadata || typeof notes.metadata.totalSections !== 'number') {
      throw new Error('Invalid metadata in structured notes');
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(): Promise<{
    totalProcessed: number;
    averageProcessingTime: number;
    successRate: number;
  }> {
    // This would typically come from a database
    // For now, return mock data
    return {
      totalProcessed: 0,
      averageProcessingTime: 0,
      successRate: 0
    };
  }
}

export default DocumentProcessorService;
