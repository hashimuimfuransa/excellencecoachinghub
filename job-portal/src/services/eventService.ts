import { api } from './api';

export interface Event {
  _id: string;
  title: string;
  description: string;
  organizer: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string; // For company organizers
  };
  organizerType: 'User' | 'Company';
  eventType: 'training' | 'webinar' | 'workshop' | 'conference' | 'networking' | 'job_fair';
  date: string;
  endDate?: string;
  location: string;
  isOnline: boolean;
  meetingLink?: string;
  capacity?: number;
  attendees: string[];
  attendeesCount: number;
  price?: number;
  currency?: string;
  tags: string[];
  banner?: string;
  isPublic: boolean;
  registrationRequired: boolean;
  registrationDeadline?: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  isRegistered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  eventType: 'training' | 'webinar' | 'workshop' | 'conference' | 'networking' | 'job_fair';
  date: string;
  endDate?: string;
  location: string;
  isOnline?: boolean;
  meetingLink?: string;
  capacity?: number;
  price?: number;
  currency?: string;
  tags?: string[];
  banner?: string;
  isPublic?: boolean;
  registrationRequired?: boolean;
  registrationDeadline?: string;
}

class EventService {
  async getUpcomingEvents(limit = 10, eventType?: string) {
    const response = await api.get('/events/upcoming', {
      params: { limit, type: eventType }
    });
    return response.data;
  }

  async getEvents(filters: EventFilters = {}) {
    const { page = 1, limit = 20, search, type, status = 'published' } = filters;
    const response = await api.get('/events', {
      params: { page, limit, search, type, status }
    });
    return response.data;
  }

  async getEvent(eventId: string) {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  }

  async createEvent(eventData: CreateEventData) {
    const response = await api.post('/events', eventData);
    return response.data;
  }

  async updateEvent(eventId: string, eventData: Partial<CreateEventData>) {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  }

  async deleteEvent(eventId: string) {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  }

  async registerForEvent(eventId: string) {
    const response = await api.post(`/events/${eventId}/register`);
    return response.data;
  }

  async unregisterFromEvent(eventId: string) {
    const response = await api.post(`/events/${eventId}/unregister`);
    return response.data;
  }

  async getEventsByType(eventType: string) {
    const response = await api.get(`/events/type/${eventType}`);
    return response.data;
  }

  async getMyEvents() {
    const response = await api.get('/events/my-events');
    return response.data;
  }

  async getRegisteredEvents() {
    const response = await api.get('/events/registered');
    return response.data;
  }
}

export const eventService = new EventService();