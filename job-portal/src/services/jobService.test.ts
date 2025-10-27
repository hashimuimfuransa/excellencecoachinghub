import { jobService } from './jobService';
import * as api from './api';

// Mock the api module
jest.mock('./api', () => ({
  apiGet: jest.fn()
}));

describe('JobService - AI Matched Jobs', () => {
  const mockApiGet = api.apiGet as jest.MockedFunction<typeof api.apiGet>;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log to prevent test output clutter
  });

  it('should correctly handle AI matched jobs response with data and meta', async () => {
    // Mock the backend response structure (what the backend actually sends)
    const mockBackendResponse = {
      data: {
        success: true,
        data: [
          {
            _id: '68a89b6887198d05a59c9b6a',
            title: 'Project Manager',
            company: 'Test Company',
            location: 'Kigali',
            description: 'Test description',
            matchPercentage: 48
          },
          {
            _id: '68a89b6887198d05a59c9b6b',
            title: 'Software Developer',
            company: 'Another Company',
            location: 'Rwanda',
            description: 'Developer role',
            matchPercentage: 45
          }
        ],
        meta: {
          totalJobsEvaluated: 71,
          matchesFound: 2,
          userSkillsCount: 1,
          averageMatchPercentage: 46.5,
          userProfileSummary: {
            skills: 1,
            education: 1,
            experience: 1,
            location: 'kigali city'
          }
        }
      }
    };

    // Mock the API call
    mockApiGet.mockResolvedValueOnce(mockBackendResponse);

    // Call the service method
    const result = await jobService.getAIMatchedJobs();

    // Verify the API was called correctly
    expect(mockApiGet).toHaveBeenCalledWith('/jobs/ai-matched');

    // Verify the result structure
    expect(result).toEqual({
      data: [
        {
          _id: '68a89b6887198d05a59c9b6a',
          title: 'Project Manager',
          company: 'Test Company',
          location: 'Kigali',
          description: 'Test description',
          matchPercentage: 48
        },
        {
          _id: '68a89b6887198d05a59c9b6b',
          title: 'Software Developer',
          company: 'Another Company',
          location: 'Rwanda',
          description: 'Developer role',
          matchPercentage: 45
        }
      ],
      meta: {
        totalJobsEvaluated: 71,
        matchesFound: 2,
        userSkillsCount: 1,
        averageMatchPercentage: 46.5,
        userProfileSummary: {
          skills: 1,
          education: 1,
          experience: 1,
          location: 'kigali city'
        }
      }
    });

    // Verify both data and meta are preserved
    expect(result.data).toHaveLength(2);
    expect(result.meta.totalJobsEvaluated).toBe(71);
    expect(result.meta.matchesFound).toBe(2);
    expect(result.data[0].matchPercentage).toBe(48);
  });

  it('should handle API errors correctly', async () => {
    // Mock an error response from the backend
    const mockErrorResponse = {
      data: {
        success: false,
        error: 'User profile incomplete',
        message: 'Please complete your profile to get AI matched jobs'
      }
    };

    mockApiGet.mockResolvedValueOnce(mockErrorResponse);

    // Call the service method and expect it to throw
    await expect(jobService.getAIMatchedJobs()).rejects.toThrow('Please complete your profile to get AI matched jobs');
  });

  it('should handle empty results correctly', async () => {
    // Mock empty results from backend
    const mockEmptyResponse = {
      data: {
        success: true,
        data: [],
        meta: {
          totalJobsEvaluated: 71,
          matchesFound: 0,
          userSkillsCount: 1,
          averageMatchPercentage: 0,
          userProfileSummary: {
            skills: 1,
            education: 0,
            experience: 0,
            location: 'Not specified'
          }
        }
      }
    };

    mockApiGet.mockResolvedValueOnce(mockEmptyResponse);

    const result = await jobService.getAIMatchedJobs();

    expect(result.data).toHaveLength(0);
    expect(result.meta.matchesFound).toBe(0);
    expect(result.meta.totalJobsEvaluated).toBe(71);
  });
});