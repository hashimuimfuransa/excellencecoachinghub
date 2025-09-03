import { apiGet, apiPost, apiPatch, apiDelete } from './api';

export interface SavedCandidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  currentPosition?: string;
  currentCompany?: string;
  experience?: Array<{
    _id?: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
    location?: string;
    achievements?: string[];
    employmentType?: string;
    industry?: string;
    responsibilities?: string[];
    technologies?: string[];
  }>;
  skills: string[];
  education?: {
    degree: string;
    school: string;
    year: string;
  }[];
  avatar?: string;
  savedAt: string;
  notes?: string;
  tags?: string[];
  profileCompletion?: number;
  isAvailable?: boolean;
  rating?: number;
  testScores?: {
    overall: number;
    technical: number;
    soft: number;
  };
  lastContacted?: string;
  matchScore?: number;
  yearsOfExperience?: number;
}

export interface SavedCandidatesResponse {
  success: boolean;
  data: SavedCandidate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class SavedCandidatesService {
  // Get all saved candidates
  async getSavedCandidates(page: number = 1, limit: number = 10): Promise<SavedCandidatesResponse> {
    try {
      const response = await apiGet<SavedCandidatesResponse>(`/employer/saved-candidates?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error getting saved candidates:', error);
      throw error;
    }
  }

  // Save a candidate
  async saveCandidate(candidateId: string, notes?: string, tags?: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiPost<{ success: boolean; message: string }>('/employer/saved-candidates', {
        candidateId,
        notes,
        tags
      });
      return response;
    } catch (error) {
      console.error('Error saving candidate:', error);
      throw error;
    }
  }

  // Remove saved candidate
  async removeSavedCandidate(candidateId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiDelete<{ success: boolean; message: string }>(`/employer/saved-candidates/${candidateId}`);
      return response;
    } catch (error) {
      console.error('Error removing saved candidate:', error);
      throw error;
    }
  }

  // Update saved candidate notes
  async updateSavedCandidateNotes(candidateId: string, notes: string, tags?: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiPatch<{ success: boolean; message: string }>(`/employer/saved-candidates/${candidateId}`, {
        notes,
        tags
      });
      return response;
    } catch (error) {
      console.error('Error updating candidate notes:', error);
      throw error;
    }
  }

  // Download candidate CV in original format
  async downloadCandidateCV(candidateId: string, firstName: string, lastName: string): Promise<void> {
    try {
      const response = await fetch(`/api/employer/candidates/${candidateId}/cv`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Get the content type to determine the file extension
        const contentType = response.headers.get('content-type') || '';
        let fileExtension = 'pdf'; // default
        
        if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
          fileExtension = 'docx';
        } else if (contentType.includes('application/msword')) {
          fileExtension = 'doc';
        } else if (contentType.includes('application/pdf')) {
          fileExtension = 'pdf';
        } else if (contentType.includes('text/plain')) {
          fileExtension = 'txt';
        } else if (contentType.includes('application/rtf')) {
          fileExtension = 'rtf';
        }
        
        // Try to get filename from Content-Disposition header
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `${firstName}_${lastName}_CV.${fileExtension}`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download CV from server');
      }
    } catch (error) {
      console.error('Error downloading CV:', error);
      throw error;
    }
  }
}

export const savedCandidatesService = new SavedCandidatesService();
export default savedCandidatesService;