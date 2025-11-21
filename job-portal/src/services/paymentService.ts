const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface TestPackage {
  _id: string;
  name: string;
  description: string;
  level: 'basic' | 'standard' | 'premium' | 'enterprise';
  price: number;
  currency: string;
  features: {
    questionCount: number;
    timeLimit: number;
    attempts: number;
    validityDays: number;
    industrySpecific: boolean;
    detailedReports: boolean;
    comparativeAnalysis: boolean;
    certificateIncluded: boolean;
  };
  isActive: boolean;
}

// New simplified interface for test levels
export interface TestLevel {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: {
    questionCount: number;
    timeLimit: number;
    attempts: number;
    validityDays: number;
    detailedReports: boolean;
  };
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  fee: number;
  processingTime: string;
  currency: string;
  isActive: boolean;
}

export interface TestPurchase {
  _id: string;
  user: string;
  test: {
    _id: string;
    title: string;
    description: string;
    type: string;
  };
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  purchasedAt: Date;
  expiresAt: Date;
  maxAttempts: number;
  attemptsUsed: number;
  remainingAttempts: number;
  metadata: {
    packageLevel: string;
    jobTitle?: string;
    jobDescription?: string;
    industry?: string;
    experienceLevel?: string;
    features: any;
    paymentMethod: string;
  };
}

export interface PurchaseRequest {
  packageId: string;
  jobTitle: string;
  jobDescription?: string;
  industry?: string;
  experienceLevel?: 'entry-level' | 'mid-level' | 'senior-level' | 'executive';
  paymentMethod: string;
}

class PaymentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getTestPackages(): Promise<TestPackage[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/test-packages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch test packages');
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching test packages:', error);
      throw error;
    }
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/methods`);
      
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

  async purchaseTestPackage(purchaseData: PurchaseRequest): Promise<{
    purchase: TestPurchase;
    paymentUrl?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/purchase-test-package`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase test package');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error purchasing test package:', error);
      throw error;
    }
  }

  async getUserPurchases(): Promise<TestPurchase[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/my-purchases`, {
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

  async validateTestAccess(purchaseId: string): Promise<{
    canTake: boolean;
    reason?: string;
    purchase?: TestPurchase;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/validate-test-access`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ purchaseId }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate test access');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error validating test access:', error);
      throw error;
    }
  }

  async generateQuestionsFromPurchase(purchaseId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/psychometric-tests/generate-from-purchase`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ purchaseId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate test questions');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error generating questions from purchase:', error);
      throw error;
    }
  }

  formatCurrency(amount: number, currency: string = 'RWF'): string {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  getPackageBadgeColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'basic': return '#2196f3';
      case 'standard': return '#4caf50';
      case 'premium': return '#ff9800';
      case 'enterprise': return '#9c27b0';
      default: return '#666';
    }
  }

  getPackageIcon(level: string): string {
    switch (level.toLowerCase()) {
      case 'basic': return '🎯';
      case 'standard': return '📊';
      case 'premium': return '💎';
      case 'enterprise': return '👑';
      default: return '📋';
    }
  }

  // New Simplified API Methods

  /**
   * Get available test levels
   */
  async getTestLevels(): Promise<TestLevel[]> {
    try {
      console.log('🔍 Fetching test levels from:', `${API_BASE_URL}/test-levels-early`);
      const response = await fetch(`${API_BASE_URL}/test-levels-early`);
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('🔍 Error data:', errorData);
        throw new Error(errorData.error || 'Failed to fetch test levels');
      }

      const data = await response.json();
      console.log('🔍 Successfully fetched test levels:', data);
      return data.data || [];
    } catch (error) {
      console.error('Error fetching test levels:', error);
      throw error;
    }
  }

  /**
   * Purchase a test level
   */
  async purchaseTestLevel(purchaseData: {
    levelId: string;
    paymentMethodId: string;
  }) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/payments/purchase-test-level`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(purchaseData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase test level');
      }

      return await response.json();
    } catch (error) {
      console.error('Error purchasing test level:', error);
      throw error;
    }
  }

  /**
   * Generate psychometric test for a specific job (temporary - without purchase requirement)
   */
  async generatePsychometricTest(testData: {
    jobId: string;
    levelId: string;
  }) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/psychometric-tests/generate-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate test');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating psychometric test:', error);
      throw error;
    }
  }

  /**
   * Start a psychometric test session
   */
  async startPsychometricTest(sessionId: string) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/psychometric-tests/start/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start test');
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting psychometric test:', error);
      throw error;
    }
  }

  /**
   * Submit psychometric test answers
   */
  async submitPsychometricTest(sessionId: string, answers: any) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/psychometric-tests/submit/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit test');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting psychometric test:', error);
      throw error;
    }
  }

  /**
   * Get user's test results
   */
  async getUserTestResults() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/psychometric-tests/my-results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch test results');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching test results:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();