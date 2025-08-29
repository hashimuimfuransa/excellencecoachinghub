import api from './api';

export interface CVSection {
  id: string;
  title: string;
  content: string;
  order: number;
  isVisible: boolean;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  website?: string;
  professionalSummary: string;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  isCurrentJob: boolean;
  responsibilities: string[];
  achievements: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  graduationDate: string;
  gpa?: string;
  relevantCourses?: string[];
}

export interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: 'Technical' | 'Soft' | 'Language' | 'Other';
}

export interface CVData {
  personalInfo: PersonalInfo;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  projects?: any[];
  certifications?: any[];
  awards?: any[];
  languages?: any[];
  customSections?: CVSection[];
}

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  style: 'modern' | 'classic' | 'creative' | 'minimal';
  color: string;
  preview: string;
}

export interface AIAnalysisResult {
  suggestions: string[];
  score: number;
  improvements: Array<{
    section: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  keywords: string[];
  missingElements: string[];
}

export interface CVOptimizationRequest {
  cvData: CVData;
  targetJob?: {
    title: string;
    description: string;
    requirements: string[];
  };
  industry?: string;
}

class CVBuilderService {
  // Get available CV templates
  async getTemplates(): Promise<CVTemplate[]> {
    const response = await api.get('/cv-builder/templates');
    return response.data;
  }

  // Generate AI-powered CV content suggestions
  async generateAIContent(prompt: string, section: string): Promise<string> {
    const response = await api.post('/cv-builder/ai/generate-content', {
      prompt,
      section,
    });
    return response.data.content;
  }

  // Get AI-powered professional summary
  async generateProfessionalSummary(cvData: Partial<CVData>): Promise<string> {
    const response = await api.post('/cv-builder/ai/professional-summary', {
      cvData,
    });
    return response.data.summary;
  }

  // Optimize CV for specific job
  async optimizeForJob(request: CVOptimizationRequest): Promise<{
    optimizedCV: CVData;
    analysis: AIAnalysisResult;
  }> {
    const response = await api.post('/cv-builder/ai/optimize', request);
    return response.data;
  }

  // Analyze CV and provide feedback
  async analyzeCV(cvData: CVData): Promise<AIAnalysisResult> {
    const response = await api.post('/cv-builder/ai/analyze', { cvData });
    return response.data;
  }

  // Generate job-specific achievements
  async generateAchievements(
    jobTitle: string,
    company: string,
    responsibilities: string[]
  ): Promise<string[]> {
    const response = await api.post('/cv-builder/ai/achievements', {
      jobTitle,
      company,
      responsibilities,
    });
    return response.data.achievements;
  }

  // Improve existing content with AI
  async improveContent(
    content: string,
    type: 'experience' | 'summary' | 'skill' | 'achievement'
  ): Promise<string> {
    const response = await api.post('/cv-builder/ai/improve', {
      content,
      type,
    });
    return response.data.improvedContent;
  }

  // Generate CV from LinkedIn profile or existing resume
  async generateFromProfile(profileData: any): Promise<CVData> {
    const response = await api.post('/cv-builder/generate-from-profile', {
      profileData,
    });
    return response.data.cvData;
  }

  // Save CV draft
  async saveDraft(cvData: CVData): Promise<{ id: string }> {
    const response = await api.post('/cv-builder/save-draft', { cvData });
    return response.data;
  }

  // Get saved CV drafts
  async getDrafts(): Promise<Array<{ id: string; name: string; lastModified: string; cvData: CVData }>> {
    const response = await api.get('/cv-builder/drafts');
    return response.data;
  }

  // Export CV as PDF
  async exportToPDF(cvData: CVData, templateId: string): Promise<Blob> {
    const response = await api.post('/cv-builder/export/pdf', {
      cvData,
      templateId,
    }, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Export CV as Word document
  async exportToWord(cvData: CVData, templateId: string): Promise<Blob> {
    const response = await api.post('/cv-builder/export/word', {
      cvData,
      templateId,
    }, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Get keyword suggestions for industry/role
  async getKeywordSuggestions(industry: string, role: string): Promise<string[]> {
    const response = await api.post('/cv-builder/ai/keywords', {
      industry,
      role,
    });
    return response.data.keywords;
  }

  // Parse existing resume/CV file
  async parseResumeFile(file: File): Promise<CVData> {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await api.post('/cv-builder/parse-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.cvData;
  }

  // Get industry-specific templates
  async getIndustryTemplates(industry: string): Promise<CVTemplate[]> {
    const response = await api.get(`/cv-builder/templates/industry/${industry}`);
    return response.data;
  }

  // Generate cover letter
  async generateCoverLetter(cvData: CVData, jobDescription: string): Promise<string> {
    const response = await api.post('/cv-builder/ai/cover-letter', {
      cvData,
      jobDescription,
    });
    return response.data.coverLetter;
  }

  // Get CV statistics and analytics
  async getCVAnalytics(cvId: string): Promise<{
    views: number;
    downloads: number;
    applications: number;
    feedback: any[];
  }> {
    const response = await api.get(`/cv-builder/analytics/${cvId}`);
    return response.data;
  }
}

export default new CVBuilderService();