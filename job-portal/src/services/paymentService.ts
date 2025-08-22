/**
 * Payment Service
 * Handles payment processing and simulation for various services
 */

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  serviceType: 'interview' | 'test' | 'course' | 'certificate';
  userId: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  transactionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  processingTime: string;
}

class PaymentService {
  // Available payment methods in Rwanda
  private readonly PAYMENT_METHODS: PaymentMethod[] = [
    {
      id: 'momo',
      name: 'MTN Mobile Money',
      icon: '📱',
      available: true,
      processingTime: 'Instant'
    },
    {
      id: 'airtel_money',
      name: 'Airtel Money',
      icon: '💳',
      available: true,
      processingTime: 'Instant'
    },
    {
      id: 'bank_card',
      name: 'Bank Card',
      icon: '💳',
      available: true,
      processingTime: '2-5 minutes'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: '🏦',
      available: true,
      processingTime: '5-10 minutes'
    }
  ];

  // Standard prices
  private readonly PRICES = {
    INTERVIEW_3_MIN: 3000, // 3,000 RWF
    PSYCHOMETRIC_TEST: 5000, // 5,000 RWF
    FULL_INTERVIEW: 10000, // 10,000 RWF
    COURSE_ACCESS: 15000 // 15,000 RWF
  };

  /**
   * Get available payment methods
   * @returns Array of available payment methods
   */
  getPaymentMethods(): PaymentMethod[] {
    return this.PAYMENT_METHODS.filter(method => method.available);
  }

  /**
   * Get service prices
   * @returns Object with service prices
   */
  getPrices() {
    return this.PRICES;
  }

  /**
   * Simulate payment processing
   * @param request - Payment request details
   * @param paymentMethodId - Selected payment method ID
   * @returns Promise<PaymentResponse>
   */
  async processPayment(request: PaymentRequest, paymentMethodId: string): Promise<PaymentResponse> {
    try {
      // Validate payment method
      const paymentMethod = this.PAYMENT_METHODS.find(method => method.id === paymentMethodId);
      if (!paymentMethod) {
        throw new Error('Invalid payment method');
      }

      // Validate amount
      if (request.amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Generate unique payment and transaction IDs
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Simulate processing delay based on payment method
      const processingDelay = this.getProcessingDelay(paymentMethodId);
      await new Promise(resolve => setTimeout(resolve, processingDelay));

      // Simulate success/failure (95% success rate)
      const isSuccessful = Math.random() > 0.05;

      if (!isSuccessful) {
        return {
          success: false,
          paymentId,
          amount: request.amount,
          currency: request.currency,
          status: 'failed',
          error: 'Payment processing failed. Please try again.',
          timestamp: new Date().toISOString()
        };
      }

      // Successful payment response
      const response: PaymentResponse = {
        success: true,
        paymentId,
        transactionId,
        amount: request.amount,
        currency: request.currency,
        status: 'completed',
        message: `Payment of ${request.amount} ${request.currency} completed successfully via ${paymentMethod.name}`,
        timestamp: new Date().toISOString()
      };

      // Store payment record (in real app, this would go to database)
      await this.storePaymentRecord({
        ...response,
        request,
        paymentMethodId
      });

      return response;
    } catch (error) {
      console.error('Payment processing error:', error);
      
      return {
        success: false,
        paymentId: `fail_${Date.now()}`,
        amount: request.amount,
        currency: request.currency,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown payment error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Process 3-minute interview payment
   * @param userId - User ID
   * @param jobTitle - Job title for the interview
   * @param paymentMethodId - Selected payment method
   * @returns Promise<PaymentResponse>
   */
  async processInterviewPayment(userId: string, jobTitle: string, paymentMethodId: string): Promise<PaymentResponse> {
    const request: PaymentRequest = {
      amount: this.PRICES.INTERVIEW_3_MIN,
      currency: 'RWF',
      description: `3-minute AI interview practice for ${jobTitle}`,
      serviceType: 'interview',
      userId,
      metadata: {
        jobTitle,
        duration: '3 minutes',
        type: 'ai_interview_practice'
      }
    };

    return this.processPayment(request, paymentMethodId);
  }

  /**
   * Validate payment before starting service
   * @param paymentId - Payment ID to validate
   * @returns Promise<boolean> - True if payment is valid
   */
  async validatePayment(paymentId: string): Promise<boolean> {
    try {
      // In real implementation, this would check with payment provider
      // For simulation, check our stored records
      const storedPayments = this.getStoredPayments();
      const payment = storedPayments.find(p => p.paymentId === paymentId);
      
      return payment?.status === 'completed' && payment?.success === true;
    } catch (error) {
      console.error('Payment validation error:', error);
      return false;
    }
  }

  /**
   * Get user's payment history
   * @param userId - User ID
   * @returns Array of payment records
   */
  async getUserPaymentHistory(userId: string): Promise<any[]> {
    try {
      const storedPayments = this.getStoredPayments();
      return storedPayments
        .filter(payment => payment.request?.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  /**
   * Format amount for display
   * @param amount - Amount in minor units
   * @param currency - Currency code
   * @returns Formatted amount string
   */
  formatAmount(amount: number, currency = 'RWF'): string {
    return new Intl.NumberFormat('rw', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Get processing delay based on payment method
   * @param paymentMethodId - Payment method ID
   * @returns Delay in milliseconds
   */
  private getProcessingDelay(paymentMethodId: string): number {
    switch (paymentMethodId) {
      case 'momo':
      case 'airtel_money':
        return 2000; // 2 seconds for mobile money
      case 'bank_card':
        return 3000; // 3 seconds for bank card
      case 'bank_transfer':
        return 5000; // 5 seconds for bank transfer
      default:
        return 2000;
    }
  }

  /**
   * Store payment record (mock storage)
   * @param paymentRecord - Complete payment record
   */
  private async storePaymentRecord(paymentRecord: any): Promise<void> {
    try {
      const storedPayments = this.getStoredPayments();
      storedPayments.push(paymentRecord);
      localStorage.setItem('payment_records', JSON.stringify(storedPayments));
    } catch (error) {
      console.error('Error storing payment record:', error);
    }
  }

  /**
   * Get stored payment records (mock storage)
   * @returns Array of payment records
   */
  private getStoredPayments(): any[] {
    try {
      const stored = localStorage.getItem('payment_records');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving payment records:', error);
      return [];
    }
  }
}

export const paymentService = new PaymentService();