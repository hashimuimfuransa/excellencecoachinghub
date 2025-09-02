import { apiPost, apiGet, handleApiResponse } from './api';

export interface PaymentRequest {
  _id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  jobId: string;
  jobTitle: string;
  company: string;
  testType: 'psychometric' | 'smart_test';
  questionCount: number;
  estimatedDuration: number;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNotes?: string;
  approvedAt?: string;
  approvedBy?: string;
  completedAt?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

class PaymentRequestService {
  // Create a new payment request
  async createPaymentRequest(requestData: Omit<PaymentRequest, '_id' | 'createdAt' | 'updatedAt'>): Promise<PaymentRequest> {
    try {
      const response = await apiPost('/payment-requests', requestData);
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('Error creating payment request:', error);
      throw new Error(error.message || 'Failed to create payment request');
    }
  }

  // Get user's payment requests
  async getUserPaymentRequests(): Promise<PaymentRequest[]> {
    try {
      const response = await apiGet('/payment-requests/my-requests');
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('Error fetching payment requests:', error);
      throw new Error(error.message || 'Failed to fetch payment requests');
    }
  }

  // Get all payment requests (Admin only)
  async getAllPaymentRequests(): Promise<PaymentRequest[]> {
    try {
      const response = await apiGet('/payment-requests');
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('Error fetching all payment requests:', error);
      throw new Error(error.message || 'Failed to fetch payment requests');
    }
  }

  // Check if user has approved payment for a specific job and test type
  async checkPaymentStatus(jobId: string, testType: 'psychometric' | 'smart_test' = 'psychometric'): Promise<{
    hasApprovedPayment: boolean;
    canTakeTest: boolean;
    paymentRequest?: PaymentRequest;
  }> {
    try {
      const response = await apiGet(`/payment-requests/check-status/${jobId}?testType=${testType}`);
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      return {
        hasApprovedPayment: false,
        canTakeTest: false
      };
    }
  }

  // Check if user has approved smart test payment for a specific job
  async checkSmartTestPaymentStatus(jobId: string): Promise<{
    hasApprovedPayment: boolean;
    canTakeTest: boolean;
    paymentRequest?: PaymentRequest;
  }> {
    return this.checkPaymentStatus(jobId, 'smart_test');
  }

  // Get pending payment requests count (for admin notifications)
  async getPendingRequestsCount(): Promise<number> {
    try {
      const response = await apiGet('/payment-requests/pending-count');
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('Error fetching pending requests count:', error);
      return 0;
    }
  }
}

export const paymentRequestService = new PaymentRequestService();
export default paymentRequestService;