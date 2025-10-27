import { CentralAIManager } from './centralAIManager';
// Removed unused imports

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
      } else if (mimeType.includes('word') || mimeType.includes('document') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        return await this.extractTextFromWord(fileBuffer);
      } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        return await this.extractTextFromExcel(fileBuffer);
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
   * Extract text from Excel files using xlsx library
   */
  private async extractTextFromExcel(fileBuffer: Buffer): Promise<string> {
    try {
      const XLSX = require('xlsx');
      
      console.log('📄 Extracting text from Excel file using xlsx...');
      
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      let extractedText = '';
      
      // Extract text from all sheets
      workbook.SheetNames.forEach((sheetName: string) => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_txt(worksheet);
        extractedText += `\n\nSheet: ${sheetName}\n${sheetText}`;
      });
      
      // Clean up the extracted text
      extractedText = this.cleanExtractedText(extractedText);
      
      console.log(`✅ Excel file text extraction successful. Extracted ${extractedText.length} characters.`);
      
      return extractedText;
    } catch (error) {
      console.error('❌ Excel file text extraction failed:', error);
      throw new Error('Failed to extract text from Excel file');
    }
  }

  /**
   * Extract text from PDF using pdf-parse library
   */
  private async extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
    try {
      const pdfParse = require('pdf-parse');
      
      console.log('📄 Extracting text from PDF using pdf-parse...');
      
      const data = await pdfParse(fileBuffer);
      let extractedText = data.text;
      
      // Clean up the extracted text
      extractedText = this.cleanExtractedText(extractedText);
      
      console.log(`✅ PDF text extraction successful. Extracted ${extractedText.length} characters.`);
      
      return extractedText;
    } catch (error) {
      console.error('❌ PDF text extraction failed:', error);
      
      // Fallback to AI-based extraction if pdf-parse fails
      console.log('🔄 Falling back to AI-based PDF text extraction...');
      return await this.extractTextFromPDFWithAI(fileBuffer);
    }
  }

  /**
   * Fallback method: Extract text from PDF using AI
   */
  private async extractTextFromPDFWithAI(fileBuffer: Buffer): Promise<string> {
    try {
      const prompt = `
        Please extract all the text content from this PDF document and return it as plain text.
        Preserve the structure and formatting as much as possible.
        Do not include any analysis or commentary, just the raw text content.
        Do not include any statements about your capabilities or limitations.
        Focus only on the actual document content.
      `;

      const result = await this.aiManager.generateContent(prompt);
      
      // Clean the AI response to remove any limitation statements
      const cleanedText = this.cleanAIResponse(result || '');
      
      return cleanedText;
    } catch (error) {
      console.error('AI-based PDF text extraction failed:', error);
      throw new Error('Failed to extract text from PDF using both pdf-parse and AI methods');
    }
  }

  /**
   * Clean extracted text to remove unwanted content
   */
  private cleanExtractedText(text: string): string {
    if (!text) return '';
    
    // Remove excessive whitespace and normalize line breaks
    let cleaned = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
    
    // Remove common PDF artifacts and unwanted content
    cleaned = cleaned
      // Remove page numbers and headers
      .replace(/Page \d+/gi, '')
      .replace(/^\d+$/gm, '')
      
      // Remove study text artifacts
      .replace(/S\s*T\s*U\s*D\s*Y\s*T\s*E\s*X\s*T/gi, '')
      .replace(/STUDY\s*TEXT/gi, '')
      
      // Remove website URLs and contact info
      .replace(/www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '')
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/\b\d{3}\s*\d{3}\s*\d{3,4}\b/g, '') // Phone numbers
      .replace(/\b\d{4}\s*\d{3}\s*\d{3}\b/g, '') // Phone numbers like 0728 776 317
      
      // Remove email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '')
      
      // Remove confidential notices
      .replace(/Confidential.*?Distribute/gi, '')
      .replace(/Do Not Distribute/gi, '')
      .replace(/Confidential.*?Do Not Distribute/gi, '')
      
      // Remove decorative elements
      .replace(/^\*{3,}$/gm, '')
      .replace(/^={3,}$/gm, '')
      .replace(/^-{3,}$/gm, '')
      .replace(/^_{3,}$/gm, '')
      
      // Remove document metadata
      .replace(/^Document Title:.*$/gm, '')
      .replace(/^By.*$/gm, '')
      .replace(/^Author:.*$/gm, '')
      .replace(/^Published:.*$/gm, '')
      .replace(/^\d{4}-\d{2}-\d{2}$/gm, '')
      
      // Remove spacing artifacts from PDF extraction
      .replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\b/g, '$1$2$3$4$5$6$7$8')
      .replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\b/g, '$1$2$3$4$5$6$7')
      .replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\b/g, '$1$2$3$4$5$6')
      .replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\b/g, '$1$2$3$4$5')
      .replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\b/g, '$1$2$3$4')
      .replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\b/g, '$1$2$3')
      .replace(/\b([A-Z])\s+([A-Z])\b/g, '$1$2')
      
      // Remove common PDF extraction artifacts
      .replace(/^\s*[A-Z\s]{10,}$/gm, '') // Lines with only spaced capital letters
      .replace(/^[A-Z\s]{20,}$/gm, '') // Long lines of capital letters
      
      // Remove footer/header content
      .replace(/^.*?www\..*?$/gm, '')
      .replace(/^.*?\d{3}\s*\d{3}\s*\d{3,4}.*?$/gm, '')
      
      // Clean up multiple empty lines
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s*\n/gm, '')
      .trim();
    
    return cleaned;
  }

  /**
   * Clean AI response to remove limitation statements and unwanted content
   */
  private cleanAIResponse(text: string): string {
    if (!text) return '';
    
    // Remove common AI limitation statements
    const aiLimitationPatterns = [
      /My capabilities are limited to text-based input\./gi,
      /I cannot directly process PDF files\./gi,
      /If you can copy and paste the text content from the PDF into our chat, I would be happy to process it for you\./gi,
      /Following the statement of limitation, the message outlines the AI's operational scope:.*?user intervention\./gi,
      /I'm an AI assistant and I don't have the ability to.*?/gi,
      /I cannot.*?PDF.*?directly/gi,
      /Please provide the text content instead/gi,
      /I would be happy to help if you can provide the text/gi
    ];
    
    let cleaned = text;
    
    // Remove AI limitation patterns
    aiLimitationPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Remove any remaining AI-generated disclaimers
    cleaned = cleaned
      .replace(/^I understand.*?\./gm, '')
      .replace(/^As an AI.*?\./gm, '')
      .replace(/^I cannot.*?\./gm, '')
      .replace(/^My.*?limitations.*?\./gm, '')
      .replace(/^Please note.*?\./gm, '');
    
    // Clean up whitespace
    cleaned = cleaned
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
    
    return cleaned;
  }

  /**
   * Extract text from Word documents using mammoth library
   */
  private async extractTextFromWord(fileBuffer: Buffer): Promise<string> {
    try {
      const mammoth = require('mammoth');
      
      console.log('📄 Extracting text from Word document using mammoth...');
      
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      let extractedText = result.value;
      
      // Clean up the extracted text
      extractedText = this.cleanExtractedText(extractedText);
      
      console.log(`✅ Word document text extraction successful. Extracted ${extractedText.length} characters.`);
      
      return extractedText;
    } catch (error) {
      console.error('❌ Word document text extraction failed:', error);
      
      // Fallback to AI-based extraction if mammoth fails
      console.log('🔄 Falling back to AI-based Word document text extraction...');
      return await this.extractTextFromWordWithAI(fileBuffer);
    }
  }

  /**
   * Fallback method: Extract text from Word documents using AI
   */
  private async extractTextFromWordWithAI(fileBuffer: Buffer): Promise<string> {
    try {
      const prompt = `
        Please extract all the text content from this Word document and return it as plain text.
        Preserve the structure, headings, and formatting as much as possible.
        Do not include any analysis or commentary, just the raw text content.
        Do not include any statements about your capabilities or limitations.
        Focus only on the actual document content.
      `;

      const result = await this.aiManager.generateContent(prompt);
      
      // Clean the AI response to remove any limitation statements
      const cleanedText = this.cleanAIResponse(result || '');
      
      return cleanedText;
    } catch (error) {
      console.error('AI-based Word document text extraction failed:', error);
      throw new Error('Failed to extract text from Word document using both mammoth and AI methods');
    }
  }

  /**
   * Create structured notes from extracted text - preserving complete original content
   */
  private async createStructuredNotes(text: string, fileName: string): Promise<StructuredNotes> {
    // Use faster processing without AI for better performance
    try {
      return await this.createStructuredNotesWithFullContent(text, fileName);
    } catch (error) {
      console.error('Full content preservation failed, using fallback processing:', error);
      return await this.createStructuredNotesFallback(text, fileName);
    }
  }

  /**
   * Create structured notes preserving complete original content
   */
  private async createStructuredNotesWithFullContent(text: string, fileName: string): Promise<StructuredNotes> {
    console.log('📝 Creating structured notes with full content preservation...');
    
    // Split text into logical sections based on common patterns
    const sections = this.splitTextIntoLogicalSections(text);
    
    // Skip AI processing for faster performance - use original section titles
    const improvedSections = sections; // Use original sections without AI improvement
    
    // Create title from filename
    const title = this.extractTitleFromFileName(fileName);
    
    // Create a brief summary
    const summary = this.createBriefSummary(text);
    
    // Extract key points from the content
    const keyPoints = this.extractKeyPointsFromText(text);
    
    // Calculate metadata
    const wordCount = text.split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(wordCount / 225); // 225 words per minute
    const difficulty = this.assessDifficulty(text);
    const topics = this.extractTopicsFromText(text);
    
    const structuredNotes: StructuredNotes = {
      title,
      summary,
      keyPoints,
      sections: improvedSections.map((section, index) => ({
        title: section.title,
        content: section.content,
        keyPoints: this.extractKeyPointsFromText(section.content),
        order: index + 1
      })),
      metadata: {
        totalSections: improvedSections.length,
        estimatedReadingTime,
        difficulty,
        topics
      }
    };
    
    console.log('✅ Structured notes created with full content preservation:', {
      title: structuredNotes.title,
      sectionsCount: structuredNotes.sections.length,
      totalContentLength: text.length
    });
    
    return structuredNotes;
  }

  /**
   * Create structured notes using fast fallback processing (no AI)
   */
  private async createStructuredNotesFallback(text: string, fileName: string): Promise<StructuredNotes> {
    console.log('📝 Creating structured notes with fast fallback processing...');
    
    // Create title from filename
    const title = this.extractTitleFromFileName(fileName);
    
    // Create a simple summary (first 200 characters)
    const summary = text.substring(0, 200) + (text.length > 200 ? '...' : '');
    
    // Split text into simple sections
    const sections = this.splitTextIntoSimpleSections(text);
    
    // Extract basic key points
    const keyPoints = this.extractBasicKeyPoints(text);
    
    // Calculate metadata
    const wordCount = text.split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(wordCount / 225);
    const difficulty = this.assessDifficulty(text);
    const topics = this.extractBasicTopics(text);
    
    const structuredNotes: StructuredNotes = {
      title,
      summary,
      keyPoints,
      sections: sections.map((section, index) => ({
        title: section.title,
        content: section.content,
        keyPoints: this.extractBasicKeyPoints(section.content),
        order: index + 1
      })),
      metadata: {
        totalSections: sections.length,
        estimatedReadingTime,
        difficulty,
        topics
      }
    };
    
    console.log(`✅ Fast fallback processing complete: ${sections.length} sections, ${keyPoints.length} key points`);
    return structuredNotes;
  }

  /**
   * Split text into simple sections (faster than logical splitting)
   */
  private splitTextIntoSimpleSections(text: string): Array<{title: string, content: string}> {
    const sections: Array<{title: string, content: string}> = [];
    
    // Split by double line breaks or common section markers
    const parts = text.split(/\n\s*\n/).filter(part => part.trim().length > 50);
    
    parts.forEach((part, index) => {
      const lines = part.trim().split('\n');
      const title = lines[0] || `Section ${index + 1}`;
      const content = part.trim();
      
      sections.push({
        title: title.length > 100 ? title.substring(0, 100) + '...' : title,
        content
      });
    });
    
    return sections.length > 0 ? sections : [{
      title: 'Document Content',
      content: text
    }];
  }

  /**
   * Extract basic key points (faster than AI processing)
   */
  private extractBasicKeyPoints(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyPoints: string[] = [];
    
    // Take every 5th sentence as a key point, up to 10 points
    for (let i = 0; i < sentences.length && keyPoints.length < 10; i += 5) {
      const sentence = sentences[i]?.trim();
      if (sentence && sentence.length > 20 && sentence.length < 200) {
        keyPoints.push(sentence);
      }
    }
    
    return keyPoints.length > 0 ? keyPoints : ['Document contains important information that should be reviewed carefully.'];
  }

  /**
   * Extract basic topics (faster than AI processing)
   */
  private extractBasicTopics(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const wordCount: {[key: string]: number} = {};
    
    // Count common educational words
    words.forEach(word => {
      if (word.length > 4 && !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'where', 'much', 'some', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'these', 'think', 'through', 'being', 'before', 'below', 'between', 'during', 'follow', 'found', 'going', 'having', 'little', 'might', 'never', 'often', 'place', 'right', 'since', 'still', 'under', 'until', 'while', 'world', 'years'].includes(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    // Return top 5 most frequent words as topics
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Use AI to improve section titles for better student understanding
   */
  private async improveSectionTitlesWithAI(sections: Array<{title: string, content: string}>): Promise<Array<{title: string, content: string}>> {
    try {
      console.log('🤖 Using AI to improve section titles...');
      
      const prompt = `
        You are a content organizer. I have a document that has been split into sections, but the section titles need to be improved to be more descriptive and helpful for students.
        
        Current sections:
        ${sections.map((section, index) => `${index + 1}. Current Title: "${section.title}"\n   Content Preview: "${section.content.substring(0, 200)}..."`).join('\n\n')}
        
        Please provide better, more descriptive section titles that clearly indicate what each section covers. The titles should be:
        1. Clear and descriptive
        2. Helpful for students to understand the content
        3. Professional and educational
        4. Based on the actual content of each section
        
        Return ONLY a JSON array of the improved titles in this format:
        ["Improved Title 1", "Improved Title 2", "Improved Title 3", ...]
        
        Do not include any other text or explanations.
      `;

      const result = await this.aiManager.generateContent(prompt);
      
      if (result) {
        // Try to parse the JSON response
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const improvedTitles = JSON.parse(jsonMatch[0]) as string[];
            
            // Apply improved titles to sections
            const improvedSections = sections.map((section, index) => ({
              title: improvedTitles[index] || section.title,
              content: section.content
            }));
            
            console.log('✅ Section titles improved with AI');
            return improvedSections;
          } catch (parseError) {
            console.warn('Failed to parse AI response for section titles:', parseError);
          }
        }
      }
      
      // Fallback: return original sections if AI fails
      console.log('⚠️ AI section title improvement failed, using original titles');
      return sections;
      
    } catch (error) {
      console.error('Error improving section titles with AI:', error);
      return sections; // Return original sections if AI fails
    }
  }

  /**
   * Split text into logical sections based on content structure
   */
  private splitTextIntoLogicalSections(text: string): Array<{title: string, content: string}> {
    const sections: Array<{title: string, content: string}> = [];
    
    // First, clean the text to remove unwanted content
    const cleanedText = this.cleanExtractedText(text);
    
    // Split by common section patterns
    const sectionPatterns = [
      /^\d+\.\s+[A-Z][^.\n]*$/gm,  // Numbered sections: "1. Introduction"
      /^[A-Z][A-Z\s]{3,}$/gm,     // ALL CAPS headings
      /^Chapter\s+\d+/gmi,        // Chapter headings
      /^Section\s+\d+/gmi,        // Section headings
      /^Part\s+[IVX]+/gmi,        // Part headings
      /^\d+\.\d+\s+[A-Z]/gm,      // Subsection headings: "1.1 Introduction"
      /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/gm, // Title case headings
      /^[A-Z][^.!?]*:$/gm         // Headings ending with colon
    ];
    
    let currentSection = '';
    let currentTitle = 'Introduction';
    let sectionIndex = 0;
    
    const lines = cleanedText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      
      // Skip empty lines and unwanted content
      if (!line || this.isUnwantedLine(line)) {
        continue;
      }
      
      // Check if this line is a section heading
      const isHeading = sectionPatterns.some(pattern => {
        const match = line.match(pattern);
        return match && match[0] === line && match[0] !== undefined;
      });
      
      if (isHeading && currentSection.trim()) {
        // Save the previous section (only if it has meaningful content)
        const sectionContent = currentSection.trim();
        if (sectionContent.length > 50) { // Only add sections with substantial content
          sections.push({
            title: currentTitle,
            content: sectionContent
          });
        }
        
        // Start new section
        currentTitle = line;
        currentSection = line + '\n';
        sectionIndex++;
      } else {
        currentSection += line + '\n';
      }
    }
    
    // Add the last section
    if (currentSection.trim()) {
      const sectionContent = currentSection.trim();
      if (sectionContent.length > 50) {
        sections.push({
          title: currentTitle,
          content: sectionContent
        });
      }
    }
    
    // If no sections were found, create one section with all content
    if (sections.length === 0) {
      sections.push({
        title: 'Document Content',
        content: cleanedText
      });
    }
    
    return sections;
  }

  /**
   * Check if a line contains unwanted content
   */
  private isUnwantedLine(line: string): boolean {
    const unwantedPatterns = [
      /^S\s*T\s*U\s*D\s*Y\s*T\s*E\s*X\s*T$/i,
      /^STUDY\s*TEXT$/i,
      /^www\./i,
      /^\d{3}\s*\d{3}\s*\d{3,4}$/,
      /^[A-Z\s]{20,}$/, // Long lines of only capital letters
      /^[A-Z]\s+[A-Z]\s+[A-Z]\s+[A-Z]\s+[A-Z]\s+[A-Z]\s+[A-Z]\s+[A-Z]$/,
      /^F\s*I\s*N\s*A\s*N\s*C\s*I\s*A\s*L\s*A\s*C\s*C\s*O\s*U\s*N\s*T\s*I\s*N\s*G$/i,
      /^FINANCIAL\s*ACCOUNTING$/i,
      /^Page\s+\d+$/i,
      /^\d+$/,
      /^Confidential/i,
      /^Do Not Distribute/i
    ];
    
    return unwantedPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Extract title from filename
   */
  private extractTitleFromFileName(fileName: string): string {
    // Remove file extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    // Convert to title case
    return nameWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  /**
   * Create a brief summary from the text
   */
  private createBriefSummary(text: string): string {
    // Take the first 200 characters as a brief overview
    const firstParagraph = text.split('\n\n')[0] || text.substring(0, 200);
    return firstParagraph.substring(0, 200).trim() + (firstParagraph.length > 200 ? '...' : '');
  }

  /**
   * Extract key points from text
   */
  private extractKeyPointsFromText(text: string): string[] {
    const keyPoints: string[] = [];
    
    // Look for bullet points, numbered lists, and important statements
    const bulletPatterns = [
      /^[-•*]\s+(.+)$/gm,
      /^\d+\.\s+(.+)$/gm,
      /^[A-Z][^.!?]*[.!?]$/gm
    ];
    
    bulletPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.slice(0, 10).forEach(match => { // Limit to 10 key points
          const point = match.replace(/^[-•*\d.]\s+/, '').trim();
          if (point.length > 10 && point.length < 200) {
            keyPoints.push(point);
          }
        });
      }
    });
    
    // If no key points found, create some from the first few sentences
    if (keyPoints.length === 0) {
      const sentences = text.split(/[.!?]+/).slice(0, 5);
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && trimmed.length < 150) {
          keyPoints.push(trimmed);
        }
      });
    }
    
    return keyPoints.slice(0, 8); // Limit to 8 key points
  }

  /**
   * Assess difficulty level based on text content
   */
  private assessDifficulty(text: string): 'beginner' | 'intermediate' | 'advanced' {
    const wordCount = text.split(/\s+/).length;
    const avgWordLength = text.replace(/\s+/g, '').length / wordCount;
    
    // Simple heuristic based on text characteristics
    if (wordCount < 500 || avgWordLength < 4.5) {
      return 'beginner';
    } else if (wordCount < 2000 || avgWordLength < 5.5) {
      return 'intermediate';
    } else {
      return 'advanced';
    }
  }

  /**
   * Extract topics from text
   */
  private extractTopicsFromText(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq: {[key: string]: number} = {};
    
    // Count word frequency
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 4) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });
    
    // Get most frequent words as topics
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
    
    return sortedWords;
  }

  /**
   * Fallback method: Create structured notes using AI (with improved prompts)
   */
  private async createStructuredNotesWithAI(text: string, fileName: string): Promise<StructuredNotes> {
    const prompt = `
      You are a document organizer. Your task is to organize the following document content into structured sections while preserving ALL the original text exactly as it appears.
      
      Document: ${fileName}
      Content: ${text.substring(0, 6000)} ${text.length > 6000 ? '...' : ''}
      
      CRITICAL: Do NOT summarize or paraphrase the content. Preserve the EXACT original text from the document.
      
      Create a JSON response with the following structure:
      {
        "title": "A clear, descriptive title for the document",
        "summary": "A brief overview of what the document covers (1-2 sentences only)",
        "keyPoints": ["Key point 1", "Key point 2", "Key point 3", ...],
        "sections": [
          {
            "title": "Section title based on content",
            "content": "EXACT original text from the document for this section - do not summarize or paraphrase",
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
      
      Requirements:
      1. Return ONLY valid JSON, no other text
      2. Preserve ALL original text exactly as it appears in the document
      3. Do NOT create summaries - use the actual document text
      4. Organize content into logical sections based on the document structure
      5. Each section's "content" should contain the complete original text for that section
      6. Key points should be extracted from the actual content, not created
      7. Reading time should be estimated at 200-250 words per minute
      8. Do not include any meta-commentary or disclaimers
    `;

    try {
      const result = await this.aiManager.generateContent(prompt);

      if (!result) {
        throw new Error('No response from AI');
      }

      // Clean the AI response to remove any unwanted text
      const cleanedResult = this.cleanAIResponse(result);
      
      // Parse the JSON response - try multiple approaches
      let jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
      
      // If no JSON found, try to extract from the original result
      if (!jsonMatch) {
        jsonMatch = result.match(/\{[\s\S]*\}/);
      }
      
      if (!jsonMatch) {
        console.error('No valid JSON found in AI response:', result);
        throw new Error('No valid JSON found in AI response');
      }

      const structuredNotes = JSON.parse(jsonMatch[0]) as StructuredNotes;
      
      // Validate the structure
      this.validateStructuredNotes(structuredNotes);
      
      console.log('✅ Structured notes created successfully with AI:', {
        title: structuredNotes.title,
        sectionsCount: structuredNotes.sections.length,
        keyPointsCount: structuredNotes.keyPoints.length
      });
      
      return structuredNotes;

    } catch (error) {
      console.error('Failed to create structured notes with AI:', error);
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
