import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export interface DocumentParseResult {
  text: string;
  metadata?: {
    pages?: number;
    title?: string;
    author?: string;
  };
}

export class DocumentParser {
  /**
   * Parse document based on file type
   */
  static async parseDocument(
    buffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<DocumentParseResult> {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.parsePDF(buffer);
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.parseWord(buffer);
        
        case 'text/plain':
          return this.parseText(buffer);
        
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('Error parsing document:', error);
      throw new Error(`Failed to parse document: ${filename}`);
    }
  }

  /**
   * Parse PDF document
   */
  private static async parsePDF(buffer: Buffer): Promise<DocumentParseResult> {
    try {
      const data = await pdfParse(buffer);
      
      return {
        text: data.text,
        metadata: {
          pages: data.numpages,
          title: data.info?.Title,
          author: data.info?.Author
        }
      };
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF document');
    }
  }

  /**
   * Parse Word document (.docx)
   */
  private static async parseWord(buffer: Buffer): Promise<DocumentParseResult> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      return {
        text: result.value,
        metadata: {}
      };
    } catch (error) {
      console.error('Error parsing Word document:', error);
      throw new Error('Failed to parse Word document');
    }
  }

  /**
   * Parse plain text document
   */
  private static parseText(buffer: Buffer): DocumentParseResult {
    try {
      const text = buffer.toString('utf-8');
      
      return {
        text,
        metadata: {}
      };
    } catch (error) {
      console.error('Error parsing text document:', error);
      throw new Error('Failed to parse text document');
    }
  }

  /**
   * Clean and normalize extracted text
   */
  static cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .trim();
  }

  /**
   * Extract questions from structured text
   */
  static extractStructuredQuestions(text: string): Array<{
    question: string;
    options?: string[];
    answer?: string;
    type: string;
  }> {
    const questions: Array<{
      question: string;
      options?: string[];
      answer?: string;
      type: string;
    }> = [];

    // Split text into potential question blocks
    const blocks = text.split(/\n\s*\n/);

    for (const block of blocks) {
      const trimmedBlock = block.trim();
      
      // Skip empty blocks
      if (!trimmedBlock) continue;

      // Look for question patterns
      const questionMatch = trimmedBlock.match(/^\d+[\.\)]\s*(.+?)(?:\n|$)/);
      if (questionMatch) {
        const questionText = questionMatch[1].trim();
        
        // Look for multiple choice options
        const optionMatches = trimmedBlock.match(/^[A-D][\.\)]\s*(.+?)$/gm);
        
        if (optionMatches && optionMatches.length >= 2) {
          // Multiple choice question
          const options = optionMatches.map(match => 
            match.replace(/^[A-D][\.\)]\s*/, '').trim()
          );
          
          // Look for answer indication
          const answerMatch = trimmedBlock.match(/(?:Answer|Correct|Solution):\s*([A-D])/i);
          const answer = answerMatch ? answerMatch[1] : undefined;
          
          questions.push({
            question: questionText,
            options,
            answer,
            type: 'multiple-choice'
          });
        } else {
          // Open-ended question
          questions.push({
            question: questionText,
            type: 'short-answer'
          });
        }
      }
    }

    return questions;
  }

  /**
   * Validate document for assessment creation
   */
  static validateDocument(parseResult: DocumentParseResult): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if document has content
    if (!parseResult.text || parseResult.text.trim().length < 50) {
      errors.push('Document appears to be empty or too short');
    }

    // Check for minimum content length
    if (parseResult.text.length < 100) {
      warnings.push('Document content is quite short, may not generate many questions');
    }

    // Check for structured content
    const hasQuestionMarkers = /\d+[\.\)]\s*/.test(parseResult.text);
    if (!hasQuestionMarkers) {
      warnings.push('Document does not appear to contain structured questions');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default DocumentParser;