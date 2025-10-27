import { apiGet } from './api';

export interface HiredCandidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  position: string;
  department?: string;
  startDate?: string;
  hiredDate: string;
  salary?: string;
  jobTitle: string;
  skills: string[];
  avatar?: string;
  testScores?: {
    overall: number;
    technical: number;
    soft: number;
  };
  interviewScore?: number;
  hiringManager?: string;
  employeeId?: string;
  status: 'hired' | 'started' | 'probation' | 'confirmed';
  notes?: string;
  originalJobId: string;
  originalJobTitle: string;
}

export interface HiredCandidatesResponse {
  success: boolean;
  data: HiredCandidate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class HiredCandidatesService {
  // Get all hired candidates
  async getHiredCandidates(page: number = 1, limit: number = 10, status?: string): Promise<HiredCandidatesResponse> {
    try {
      let url = `/employer/hired-candidates?page=${page}&limit=${limit}`;
      if (status && status !== 'all') {
        url += `&status=${status}`;
      }
      
      const response = await apiGet<HiredCandidatesResponse>(url);
      return response;
    } catch (error) {
      console.error('Error getting hired candidates:', error);
      throw error;
    }
  }
}

export const hiredCandidatesService = new HiredCandidatesService();
export default hiredCandidatesService;