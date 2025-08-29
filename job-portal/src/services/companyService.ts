import { api } from './api';

export interface Company {
  _id: string;
  name: string;
  description?: string;
  industry: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  location: string;
  size: string;
  founded?: number;
  employees: string[];
  followers: string[];
  followersCount: number;
  jobsCount: number;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  isVerified: boolean;
  recentJobs?: Array<{
    _id: string;
    title: string;
    location: string;
    jobType: string;
    experienceLevel: string;
    applicationDeadline?: string;
  }>;
  isFollowing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
}

export interface CreateCompanyData {
  name: string;
  description?: string;
  industry: string;
  website?: string;
  location: string;
  size: string;
  founded?: number;
  logo?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
}

class CompanyService {
  async getCompanies(filters: CompanyFilters = {}) {
    const { page = 1, limit = 20, search, industry } = filters;
    const response = await api.get('/companies', {
      params: { page, limit, search, industry }
    });
    return response.data;
  }

  async getCompany(companyId: string) {
    const response = await api.get(`/companies/${companyId}`);
    return response.data;
  }

  async getCompanySuggestions(limit = 10) {
    const response = await api.get('/companies/suggestions', {
      params: { limit }
    });
    return response.data;
  }

  async followCompany(companyId: string) {
    const response = await api.post(`/companies/${companyId}/follow`);
    return response.data;
  }

  async createCompany(companyData: CreateCompanyData) {
    const response = await api.post('/companies', companyData);
    return response.data;
  }

  async updateCompany(companyId: string, companyData: Partial<CreateCompanyData>) {
    const response = await api.put(`/companies/${companyId}`, companyData);
    return response.data;
  }

  async getCompaniesByIndustry(industry: string) {
    const response = await api.get(`/companies/industry/${industry}`);
    return response.data;
  }

  async getFollowedCompanies() {
    const response = await api.get('/companies/following');
    return response.data;
  }
}

export const companyService = new CompanyService();