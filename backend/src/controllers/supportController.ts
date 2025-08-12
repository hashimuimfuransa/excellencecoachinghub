import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// Mock data for now - in a real app, these would be database models
interface SupportTicket {
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

interface Feedback {
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

// Mock data
const mockTickets: SupportTicket[] = [
  {
    id: 'T001',
    title: 'Cannot access course materials',
    description: 'I am unable to download the PDF materials for the Machine Learning course.',
    user: 'John Smith',
    userEmail: 'john.smith@example.com',
    category: 'technical',
    priority: 'high',
    status: 'open',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    assignedTo: 'Support Team',
    responses: 2
  },
  {
    id: 'T002',
    title: 'Quiz submission error',
    description: 'My quiz answers were not saved properly and I lost my progress.',
    user: 'Sarah Johnson',
    userEmail: 'sarah.j@example.com',
    category: 'technical',
    priority: 'medium',
    status: 'in-progress',
    createdAt: '2024-01-14T16:45:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
    assignedTo: 'Tech Support',
    responses: 1
  }
];

const mockFeedback: Feedback[] = [
  {
    id: 'F001',
    user: 'Alice Brown',
    userEmail: 'alice.brown@example.com',
    course: 'Machine Learning Basics',
    rating: 5,
    comment: 'Excellent course! The instructor explained complex concepts very clearly.',
    category: 'course',
    createdAt: '2024-01-15T12:00:00Z',
    helpful: 12,
    flagged: false
  },
  {
    id: 'F002',
    user: 'David Lee',
    userEmail: 'david.lee@example.com',
    course: 'Platform Experience',
    rating: 3,
    comment: 'The platform is good but could use better mobile optimization.',
    category: 'platform',
    createdAt: '2024-01-14T18:30:00Z',
    helpful: 8,
    flagged: false
  }
];

// Get all support tickets (Admin only)
export const getAllTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const priority = req.query.priority as string;

    let filtered = [...mockTickets];

    // Apply filters
    if (search) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(search.toLowerCase()) ||
        ticket.user.toLowerCase().includes(search.toLowerCase()) ||
        ticket.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === status);
    }

    if (priority && priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priority);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTickets = filtered.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        tickets: paginatedTickets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(filtered.length / limit),
          totalTickets: filtered.length,
          hasNextPage: endIndex < filtered.length,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all feedback (Admin only)
export const getAllFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';

    let filtered = [...mockFeedback];

    // Apply search filter
    if (search) {
      filtered = filtered.filter(feedback =>
        feedback.user.toLowerCase().includes(search.toLowerCase()) ||
        feedback.course.toLowerCase().includes(search.toLowerCase()) ||
        feedback.comment.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFeedback = filtered.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        feedback: paginatedFeedback,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(filtered.length / limit),
          totalFeedback: filtered.length,
          hasNextPage: endIndex < filtered.length,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update ticket status (Admin only)
export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const ticketIndex = mockTickets.findIndex(ticket => ticket.id === id);
    if (ticketIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
      return;
    }

    // Update ticket
    mockTickets[ticketIndex] = {
      ...mockTickets[ticketIndex],
      status,
      updatedAt: new Date().toISOString(),
      responses: response ? mockTickets[ticketIndex].responses + 1 : mockTickets[ticketIndex].responses
    };

    res.status(200).json({
      success: true,
      data: { ticket: mockTickets[ticketIndex] },
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get support statistics (Admin only)
export const getSupportStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const openTickets = mockTickets.filter(t => t.status === 'open').length;
    const inProgressTickets = mockTickets.filter(t => t.status === 'in-progress').length;
    const resolvedTickets = mockTickets.filter(t => t.status === 'resolved').length;
    const totalTickets = mockTickets.length;

    const averageRating = mockFeedback.reduce((sum, f) => sum + f.rating, 0) / mockFeedback.length;
    const totalFeedback = mockFeedback.length;
    const positiveFeedback = mockFeedback.filter(f => f.rating >= 4).length;
    const flaggedFeedback = mockFeedback.filter(f => f.flagged).length;

    res.status(200).json({
      success: true,
      data: {
        tickets: {
          total: totalTickets,
          open: openTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets
        },
        feedback: {
          total: totalFeedback,
          averageRating: Number(averageRating.toFixed(1)),
          positive: positiveFeedback,
          flagged: flaggedFeedback
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
