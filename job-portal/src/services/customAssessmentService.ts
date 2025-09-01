const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface CustomAssessmentLevel {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Intermediate' | 'Hard';
  price: number;
  currency: string;
  questionCount: number;
  timeLimit: number;
  features: string[];
  maxAttempts: number;
  validityDays: number;
}

export interface CustomAssessmentPurchase {
  _id: string;
  user: string;
  levelId: string;
  level: CustomAssessmentLevel;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  purchasedAt: Date;
  approvedAt?: Date;
  expiresAt: Date;
  maxAttempts: number;
  attemptsUsed: number;
  remainingAttempts: number;
  paymentMethod: string;
  transactionId?: string;
}

export interface JobTestGeneration {
  _id: string;
  purchase: string;
  job: {
    _id: string;
    title: string;
    company: string;
    description: string;
  };
  generatedTest: {
    _id: string;
    questions: any[];
    timeLimit: number;
    difficulty: string;
  };
  status: 'generating' | 'ready' | 'completed' | 'expired';
  generatedAt: Date;
  expiresAt: Date;
  attemptCount: number;
}

export interface PaymentRequest {
  levelId: string;
  paymentMethodId: string;
  returnUrl?: string;
}

export interface TestGenerationRequest {
  purchaseId: string;
  jobId?: string;
  jobTitle?: string;
  jobDescription?: string;
  company?: string;
  customRequirements?: string[];
}

class CustomAssessmentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get available assessment levels
   */
  async getAssessmentLevels(): Promise<CustomAssessmentLevel[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-assessments/levels`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch assessment levels');
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching assessment levels:', error);
      throw error;
    }
  }

  /**
   * Purchase an assessment level
   */
  async purchaseAssessmentLevel(purchaseData: PaymentRequest): Promise<{
    purchase: CustomAssessmentPurchase;
    paymentUrl?: string;
    requiresApproval: boolean;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-assessments/purchase`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase assessment level');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error purchasing assessment level:', error);
      throw error;
    }
  }

  /**
   * Get user's assessment purchases
   */
  async getUserPurchases(): Promise<CustomAssessmentPurchase[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-assessments/my-purchases`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user purchases');
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      throw error;
    }
  }

  /**
   * Generate a custom test for a specific job
   */
  async generateJobTest(testData: TestGenerationRequest): Promise<JobTestGeneration> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-assessments/generate-test`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate custom test');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error generating custom test:', error);
      throw error;
    }
  }

  /**
   * Get user's generated tests
   */
  async getUserGeneratedTests(): Promise<JobTestGeneration[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-assessments/my-tests`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user generated tests');
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching user generated tests:', error);
      throw error;
    }
  }

  /**
   * Start a generated test session
   */
  async startTestSession(testGenerationId: string): Promise<{
    sessionId: string;
    test: any;
    timeLimit: number;
    questions: any[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-assessments/start-test/${testGenerationId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start test session');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error starting test session:', error);
      throw error;
    }
  }

  /**
   * Submit test answers
   */
  async submitTestAnswers(sessionId: string, answers: Record<string, any>): Promise<{
    score: number;
    results: any;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-assessments/submit-test/${sessionId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit test answers');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error submitting test answers:', error);
      throw error;
    }
  }

  /**
   * Check purchase validation and remaining attempts
   */
  async validatePurchase(purchaseId: string): Promise<{
    isValid: boolean;
    remainingAttempts: number;
    expiresAt: Date;
    canGenerateTest: boolean;
    reason?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-assessments/validate-purchase/${purchaseId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to validate purchase');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error validating purchase:', error);
      throw error;
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    fee: number;
    processingTime: string;
    currency: string;
    isActive: boolean;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-assessments/payment-methods`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  /**
   * Check approval status of a purchase
   */
  async checkApprovalStatus(purchaseId: string): Promise<{
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approvedAt?: Date;
    rejectionReason?: string;
    notificationSent: boolean;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-assessments/approval-status/${purchaseId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to check approval status');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error checking approval status:', error);
      throw error;
    }
  }

  /**
   * Get test results and analytics
   */
  async getTestResults(sessionId: string): Promise<{
    results: any;
    score: number;
    categoryScores: Record<string, number>;
    insights: string[];
    recommendations: string[];
    detailedAnalysis: any;
    comparisonData?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-assessments/test-results/${sessionId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch test results');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching test results:', error);
      throw error;
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'RWF'): string {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Get level badge color
   */
  getLevelColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'hard': return '#9C27B0';
      default: return '#666';
    }
  }

  /**
   * Get level icon
   */
  getLevelIcon(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '⭐';
      case 'intermediate': return '📊';
      case 'hard': return '🧠';
      default: return '📋';
    }
  }

  /**
   * Calculate time remaining for a purchase
   */
  calculateTimeRemaining(expiresAt: Date): {
    days: number;
    hours: number;
    minutes: number;
    expired: boolean;
  } {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, expired: false };
  }
}

export const customAssessmentService = new CustomAssessmentService();