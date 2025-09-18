import { api } from './api';

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
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  professionalSummary: string;
  photo?: string; // Base64 encoded image or file path
  title?: string; // Professional title/headline
  nationality?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  drivingLicense?: string;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  isOngoing: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate?: string;
  isOngoing?: boolean;
  gpa?: string;
  relevantCourses?: string[];
  achievements?: string[];
}

export interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: 'Technical' | 'Soft' | 'Other';
  yearsOfExperience?: number;
}

export interface Language {
  id: string;
  language: string;
  proficiency: 'Native' | 'Fluent' | 'Advanced' | 'Intermediate' | 'Beginner';
  certification?: string;
}

export interface Skills {
  technical: Array<{
    name: string;
    level: number; // 1-10
    category?: string;
  }>;
  soft: Array<{
    name: string;
    level: number; // 1-10
    category?: string;
  }>;
  languages: Array<{
    name: string;
    proficiency: string;
    certification?: string;
  }>;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate?: string;
  isOngoing?: boolean;
  projectUrl?: string;
  repositoryUrl?: string;
  organization?: string;
  role?: string;
  achievements?: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

export interface Award {
  id: string;
  name: string;
  issuingOrganization: string;
  dateReceived: string;
  description?: string;
}

export interface VolunteerExperience {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  isOngoing?: boolean;
  location?: string;
  description: string;
  achievements: string[];
}

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  journal?: string;
  conference?: string;
  date: string;
  url?: string;
  doi?: string;
  description?: string;
}

export interface ProfessionalMembership {
  id: string;
  organization: string;
  role?: string;
  startDate: string;
  endDate?: string;
  isActive?: boolean;
  membershipId?: string;
  description?: string;
}

export interface Reference {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  email?: string;
  phone?: string;
  relationship?: string;
  yearsKnown?: number;
}

export interface CVData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skills;
  projects: Project[];
  certifications: Certification[];
  references: Reference[];
  volunteerExperience: VolunteerExperience[];
  // Optional advanced sections
  awards?: Award[];
  publications?: Publication[];
  professionalMemberships?: ProfessionalMembership[];
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

  // Convenience methods for the enhanced CV builder
  async saveCVData(cvData: CVData): Promise<{ success: boolean; id: string }> {
    // Always save to localStorage first as primary storage
    try {
      localStorage.setItem('cv_builder_data', JSON.stringify(cvData));
      localStorage.setItem('cv_builder_data_timestamp', new Date().toISOString());
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }

    // Try to save to server as backup, but don't fail if it doesn't work
    try {
      const result = await this.saveDraft(cvData);
      return { success: true, id: result.id };
    } catch (error) {
      // Silently fail for server save, localStorage is primary
      console.log('Server save not available, using local storage');
      return { success: true, id: 'local' };
    }
  }

  async getCVData(): Promise<CVData | null> {
    // Try localStorage first (faster and more reliable)
    const localData = localStorage.getItem('cv_builder_data');
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (error) {
        console.error('Failed to parse local CV data:', error);
      }
    }

    // Only try server if no local data exists
    try {
      const drafts = await this.getDrafts();
      if (drafts.length > 0) {
        // Return the most recently modified draft
        const serverData = drafts.sort((a, b) => 
          new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
        )[0].cvData;
        
        // Save to localStorage for next time
        localStorage.setItem('cv_builder_data', JSON.stringify(serverData));
        return serverData;
      }
    } catch (error) {
      // Server not available, that's fine - we'll use localStorage only
      console.log('Server data not available, using local storage only');
    }

    return null;
  }

  async generateCV(cvData: CVData, templateId: string = 'modern'): Promise<Blob> {
    return await this.exportToPDF(cvData, templateId);
  }
}

export const cvBuilderService = new CVBuilderService();
export default cvBuilderService;