import { apiGet, apiPost, apiPut, apiDelete, handleApiResponse, handlePaginatedResponse } from './api';

// Define all necessary types locally to avoid import issues
enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  EXPIRED = 'expired'
}

enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance'
}

enum ExperienceLevel {
  ENTRY_LEVEL = 'entry_level',
  MID_LEVEL = 'mid_level',
  SENIOR_LEVEL = 'senior_level',
  EXECUTIVE = 'executive'
}

enum EducationLevel {
  HIGH_SCHOOL = 'high_school',
  ASSOCIATE = 'associate',
  BACHELOR = 'bachelor',
  MASTER = 'master',
  DOCTORATE = 'doctorate',
  PROFESSIONAL = 'professional'
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  address?: string;
  location?: string;
  industry?: string;
  socialLinks?: {
    linkedin?: string;
    website?: string;
    twitter?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration?: number;
  instructor?: User;
  createdAt: string;
  updatedAt: string;
}

interface PsychometricTest {
  _id: string;
  title: string;
  description: string;
  type: string;
  questions: any[];
  timeLimit: number;
  industry?: string;
  jobRole?: string;
  isActive: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

interface SalaryExpectation {
  min: number;
  max: number;
  currency: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  skills: string[];
  salary?: SalaryExpectation;
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  applicationDeadline?: string;
  status: JobStatus;
  employer: User;
  relatedCourses: Course[];
  psychometricTests: PsychometricTest[];
  isCurated: boolean;
  curatedBy?: User;
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface JobForm {
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  skills: string[];
  salary?: SalaryExpectation;
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  applicationDeadline?: string;
  relatedCourses: string[];
  psychometricTests: string[];
}

interface JobFilters {
  status?: JobStatus;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  educationLevel?: EducationLevel;
  location?: string;
  workLocation?: string | string[];
  skills?: string[];
  isCurated?: boolean;
  search?: string;
}

interface JobCourseMatch {
  _id: string;
  job: Job;
  course: Course;
  relevanceScore: number;
  matchingSkills: string[];
  createdBy: User;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class JobService {
  // Get all jobs with filtering and pagination
  async getJobs(filters: JobFilters = {}, page = 1, limit = 10, signal?: AbortSignal, includeExpired = false): Promise<PaginatedResponse<Job>> {
    const params = {
      ...filters,
      page,
      limit,
      includeExpired: includeExpired ? 'true' : 'false'
    };
    const response = await apiGet<PaginatedResponse<Job>>('/jobs', params, signal);
    return handlePaginatedResponse(response);
  }

  // Get jobs for students (filtered by education level)
  async getJobsForStudent(page = 1, limit = 10, signal?: AbortSignal): Promise<PaginatedResponse<Job>> {
    const params = { page, limit };
    const response = await apiGet<PaginatedResponse<Job>>('/jobs/student/available', params, signal);
    return handlePaginatedResponse(response);
  }

  // Get curated jobs
  async getCuratedJobs(page = 1, limit = 10, signal?: AbortSignal): Promise<PaginatedResponse<Job>> {
    const params = { page, limit };
    const response = await apiGet<PaginatedResponse<Job>>('/jobs/curated', params, signal);
    return handlePaginatedResponse(response);
  }

  // Get single job by ID
  async getJobById(id: string): Promise<Job> {
    const response = await apiGet<ApiResponse<Job>>(`/jobs/${id}`);
    return handleApiResponse(response);
  }

  // Create new job (Employer only)
  async createJob(jobData: JobForm): Promise<Job> {
    const response = await apiPost<ApiResponse<Job>>('/jobs', jobData);
    return handleApiResponse(response);
  }

  // Update job
  async updateJob(id: string, jobData: Partial<JobForm>): Promise<Job> {
    const response = await apiPut<ApiResponse<Job>>(`/jobs/${id}`, jobData);
    return handleApiResponse(response);
  }

  // Delete job
  async deleteJob(id: string): Promise<void> {
    const response = await apiDelete<ApiResponse<void>>(`/jobs/${id}`);
    handleApiResponse(response);
  }

  // Get jobs by employer
  async getJobsByEmployer(): Promise<Job[]> {
    const response = await apiGet<ApiResponse<Job[]>>('/jobs/employer/my-jobs');
    return handleApiResponse(response);
  }

  // Get recommended courses for a job
  async getRecommendedCourses(jobId: string): Promise<JobCourseMatch[]> {
    const response = await apiGet<ApiResponse<JobCourseMatch[]>>(`/jobs/${jobId}/recommended-courses`);
    return handleApiResponse(response);
  }

  // Search jobs
  async searchJobs(query: string, filters: JobFilters = {}, page = 1, limit = 10): Promise<PaginatedResponse<Job>> {
    const params = {
      ...filters,
      search: query,
      page,
      limit
    };
    const response = await apiGet<PaginatedResponse<Job>>('/jobs', params);
    return handlePaginatedResponse(response);
  }

  // Get job statistics
  async getJobStats(): Promise<any> {
    const response = await apiGet<ApiResponse<any>>('/jobs/stats');
    return handleApiResponse(response);
  }

  // Get popular skills
  async getPopularSkills(): Promise<{ skill: string; count: number }[]> {
    const response = await apiGet<ApiResponse<{ skill: string; count: number }[]>>('/jobs/popular-skills');
    return handleApiResponse(response);
  }

  // Get job locations
  async getJobLocations(): Promise<string[]> {
    const response = await apiGet<ApiResponse<string[]>>('/jobs/locations');
    return handleApiResponse(response);
  }

  // Get job companies
  async getJobCompanies(): Promise<string[]> {
    const response = await apiGet<ApiResponse<string[]>>('/jobs/companies');
    return handleApiResponse(response);
  }

  // Get job categories with counts
  async getJobCategories(): Promise<{ category: string; count: number; displayName: string }[]> {
    const response = await apiGet<ApiResponse<{ category: string; count: number; displayName: string }[]>>('/jobs/categories');
    return handleApiResponse(response);
  }

  // Get AI-matched jobs for the current user
  async getAIMatchedJobs(): Promise<{
    data: Job[];
    meta: {
      totalJobsEvaluated: number;
      matchesFound: number;
      userSkillsCount: number;
      averageMatchPercentage: number;
      userProfileSummary?: {
        skills: number;
        education: number;
        experience: number;
        location: string;
      };
    };
  }> {
    console.log('🌐 Making API call to /jobs/ai-matched');
    const response = await apiGet<ApiResponse<{
      data: Job[];
      meta: {
        totalJobsEvaluated: number;
        matchesFound: number;
        userSkillsCount: number;
        averageMatchPercentage: number;
        userProfileSummary?: {
          skills: number;
          education: number;
          experience: number;
          location: string;
        };
      };
    }>>('/jobs/ai-matched');
    console.log('🌐 Raw API response:', response);
    console.log('🌐 Response status:', response.status);
    console.log('🌐 Full response object:', JSON.stringify(response, null, 2));
    console.log('🌐 Response data structure:', {
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      successField: response.data?.success,
      dataField: response.data?.data,
      metaField: response.data?.meta,
      dataLength: Array.isArray(response.data?.data) ? response.data?.data.length : 'not array',
      responseType: typeof response.data,
      isResponseDataObject: typeof response.data === 'object'
    });
    
    // Check if response is the actual backend response (apiGet returns response.data directly)
    if (!response?.success) {
      console.error('❌ API Response validation failed:', {
        fullResponse: response,
        hasSuccess: 'success' in (response || {}),
        successValue: response?.success,
        errorMessage: response?.message || response?.error || 'No specific error message'
      });
      const error = new Error(response?.message || response?.error || 'AI job matching failed');
      (error as any).errorData = response;
      throw error;
    }

    // Return the full structure that includes both data and meta
    const result = {
      data: response.data,
      meta: response.meta
    };
    
    console.log('🌐 Final processed response:', {
      hasData: !!result.data,
      dataLength: Array.isArray(result.data) ? result.data.length : 'not array',
      hasMeta: !!result.meta,
      metaKeys: result.meta ? Object.keys(result.meta) : [],
      firstJob: result.data?.[0] ? {
        id: result.data[0]._id,
        title: result.data[0].title,
        matchPercentage: (result.data[0] as any).matchPercentage
      } : null
    });
    return result;
  }
}

export const jobService = new JobService();
export default jobService;

// Export types that might be needed by other components
export type { Job, JobForm, JobFilters };