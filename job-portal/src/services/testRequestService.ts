export interface TestRequest {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  job: {
    _id: string;
    title: string;
    company: string;
  };
  requestType: 'psychometric_test' | 'interview' | 'both';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  title?: string;
  description?: string;
  specifications?: {
    interviewType?: string;
    duration?: number;
    questionCount?: number;
    difficulty?: string;
    focusAreas?: string[];
  };
  
  // Admin approval details
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedAt?: string;
  rejectedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  rejectedAt?: string;
  rejectionReason?: string;
  
  // Test generation details
  psychometricTest?: {
    testId: string;
    generatedAt: string;
    isGenerated: boolean;
  };
  
  interview?: {
    interviewId: string;
    generatedAt: string;
    isGenerated: boolean;
  };
  
  requestedAt: string;
  priority: 'normal' | 'high' | 'urgent';
  notes?: string;
}

class TestRequestService {
  private apiUrl = import.meta.env.VITE_API_URL;

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get approved tests for the current user
  async getApprovedTests(): Promise<{ success: boolean; data: TestRequest[]; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/test-requests/my-approved`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch approved tests');
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || []
      };
    } catch (error) {
      console.error('Error fetching approved tests:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch approved tests'
      };
    }
  }

  // Get user's test requests (all statuses)
  async getUserTestRequests(): Promise<{ success: boolean; data: TestRequest[]; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/test-requests/my-requests`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch test requests');
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || []
      };
    } catch (error) {
      console.error('Error fetching test requests:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch test requests'
      };
    }
  }

  // Create a new test request
  async createTestRequest(params: {
    jobId: string;
    requestType: 'psychometric_test' | 'interview' | 'both';
    notes?: string;
    priority?: 'normal' | 'high' | 'urgent';
    title?: string;
    description?: string;
    specifications?: {
      interviewType?: string;
      duration?: number;
      questionCount?: number;
      difficulty?: string;
      focusAreas?: string[];
    };
  }): Promise<{ success: boolean; data?: TestRequest; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/test-requests/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create test request');
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error creating test request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create test request'
      };
    }
  }

  // Get a specific test request by ID
  async getTestRequestById(requestId: string): Promise<{ success: boolean; data?: TestRequest; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/test-requests/${requestId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch test request');
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error fetching test request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch test request'
      };
    }
  }
}

export const testRequestService = new TestRequestService();