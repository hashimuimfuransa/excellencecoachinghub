import { apiService } from './api';

// Support ticket interfaces
export interface ISupportTicket {
  id: string;
  title: string;
  description: string;
  user: string;
  userEmail: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  responses: number;
}

export interface IFeedback {
  id: string;
  user: string;
  userEmail: string;
  course: string;
  rating: number;
  comment: string;
  category: string;
  createdAt: string;
  helpful: number;
  flagged: boolean;
}

export interface TicketListResponse {
  tickets: ISupportTicket[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTickets: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FeedbackListResponse {
  feedback: IFeedback[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalFeedback: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SupportStats {
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  feedback: {
    total: number;
    averageRating: number;
    positive: number;
    flagged: number;
  };
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
}

export interface FeedbackFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UpdateTicketData {
  status: 'open' | 'in-progress' | 'resolved';
  response?: string;
}

export const supportService = {
  // Get all support tickets with filters and pagination
  getAllTickets: async (filters: TicketFilters = {}): Promise<TicketListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<TicketListResponse>(
      `/support/tickets?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch support tickets');
  },

  // Get all feedback with filters and pagination
  getAllFeedback: async (filters: FeedbackFilters = {}): Promise<FeedbackListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<FeedbackListResponse>(
      `/support/feedback?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch feedback');
  },

  // Update ticket status
  updateTicketStatus: async (id: string, data: UpdateTicketData): Promise<ISupportTicket> => {
    const response = await apiService.put<{ ticket: ISupportTicket }>(`/support/tickets/${id}`, data);
    
    if (response.success && response.data) {
      return response.data.ticket;
    }
    
    throw new Error(response.error || 'Failed to update ticket');
  },

  // Get support statistics
  getSupportStats: async (): Promise<SupportStats> => {
    const response = await apiService.get<SupportStats>('/support/stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch support statistics');
  }
};
