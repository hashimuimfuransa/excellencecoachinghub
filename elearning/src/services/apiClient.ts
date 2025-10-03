import api from './api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class ApiClient {
  private static instance: ApiClient;

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Keep all existing methods unchanged...
  
  async getJobs(params?: { page?: number; limit?: number; search?: string }) {
    try {
      const response = await api.get('/jobs', { params });
      const { data } = response.data || {};
      return Array.isArray(data) ? data : (data?.jobs || []);
    } catch (error) {
      console.warn('Failed to fetch jobs:', 'error' in error ? error.error : error);
      return [];
    }
  }

  async getLearningOpportunitiesByProfile(completedCourses: string[]) {
    try {
      console.log('🔍 Fetching opportunities from ExJobNet...');
      
      // Try multiple endpoints to get all available jobs
      let allJobs: any[] = [];
      
      // Primary endpoint for early-stage jobs
      try {
        const response = await api.get<{ success: boolean; data: any[] }>('/test-jobs-early');
        const jobs1 = Array.isArray(response.data?.data) ? response.data.data : [];
        allJobs.push(...jobs1);
        console.log('📊 Early jobs fetched:', jobs1.length);
      } catch (e) {
        console.warn('Early jobs endpoint failed:', e);
      }

      // Secondary endpoint for additional jobs
      try {
        const response2 = await api.get<{ success: boolean; data: any[] }>('/jobs');
        const jobs2 = Array.isArray(response2.data?.data) ? response2.data.data : [];
        allJobs.push(...jobs2);
        console.log('📊 Additional jobs fetched:', jobs2.length);
      } catch (e) {
        console.warn('Additional jobs endpoint failed:', e);
      }

      // Remove duplicates based on title and company
      const uniqueJobs = allJobs.filter((job, index, self) => 
        index === self.findIndex(j => 
          j.title === job.title && 
          (j.company || j.employer?.company) === (job.company || job.employer?.company)
        )
      );

      console.log('📈 Total unique jobs found:', uniqueJobs.length);

      const opps = uniqueJobs.map((job: any) => ({
        id: String(job._id || job.id || Math.random()),
        title: job.title,
        company: job.company || job.employer?.company || '',
        description: job.description || '',
        skills: Array.isArray(job.skillsRequired) ? job.skillsRequired : 
                Array.isArray(job.skills) ? job.skills : 
                Array.isArray(job.requiredSkills) ? job.requiredSkills : [],
        location: job.location || '',
        type: job.jobType || job.type || 'full_time',
        category: job.category || job.jobCategory || '',
        experienceLevel: job.experienceLevel || job.experience || 'entry_level',
        educationLevel: job.educationLevel || job.education || '',
        salary: job.salary || job.salaryRange || null,
        original: job
      }));

      // Return ALL jobs, not just limited to 4 or 10
      console.log('🎯 Returning ALL opportunities:', opps.length);
      return opps;
    } catch (error) {
      console.error('❌ Failed to fetch opportunities:', error);
      return [];
    }
  }
}

export default ApiClient.getInstance();
