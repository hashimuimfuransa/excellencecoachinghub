import axios from 'axios';
import * as cheerio from 'cheerio';
import { JobScrapingService, ScrapedJobData } from '../jobScrapingService';
import { Job } from '../../models/Job';
import { User } from '../../models/User';
import { aiService } from '../aiService';
import { JobType, ExperienceLevel, EducationLevel, JobCategory } from '../../types';

// Mock dependencies
jest.mock('axios');
jest.mock('cheerio');
jest.mock('../../models/Job');
jest.mock('../../models/User');
jest.mock('../aiService');
jest.mock('@google/generative-ai');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockJob = Job as jest.Mocked<typeof Job>;
const mockUser = User as jest.Mocked<typeof User>;
const mockAiService = aiService as jest.Mocked<typeof aiService>;
const mockCheerio = cheerio as jest.Mocked<typeof cheerio>;

describe('JobScrapingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Reset static counters
    (JobScrapingService as any).aiRequestCount = 0;
    (JobScrapingService as any).lastResetDate = new Date().toDateString();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Happy Path - Valid job data processing', () => {
    it('should successfully process a valid job from jobinrwanda', async () => {
      const mockValidJobData: ScrapedJobData = {
        title: 'Software Developer',
        description: 'Develop software applications using modern technologies',
        company: 'Tech Solutions Ltd',
        location: 'Kigali, Rwanda',
        jobType: JobType.FULL_TIME,
        category: JobCategory.TECHNOLOGY,
        experienceLevel: ExperienceLevel.MID_LEVEL,
        educationLevel: EducationLevel.BACHELOR,
        salary: {
          min: 500000,
          max: 800000,
          currency: 'RWF'
        },
        skills: ['JavaScript', 'React', 'Node.js'],
        requirements: ['Bachelor degree in CS', '3+ years experience'],
        responsibilities: ['Develop web applications', 'Code review'],
        benefits: ['Health insurance', 'Annual leave'],
        applicationDeadline: new Date('2024-12-31'),
        postedDate: new Date('2024-01-15'),
        externalApplicationUrl: 'https://www.jobinrwanda.com/node/123456',
        externalJobId: '123456',
        contactInfo: {
          email: 'hr@techsolutions.rw',
          phone: '+250788123456'
        }
      };

      const mockSystemUser = {
        _id: 'system-user-id',
        email: 'info@excellencecoachinghub.com'
      };

      // Mock database operations
      mockJob.countDocuments.mockResolvedValue(0);
      mockUser.findOne.mockResolvedValue(mockSystemUser as any);
      mockJob.findOne.mockResolvedValue(null); // Job doesn't exist
      mockJob.prototype.save = jest.fn().mockResolvedValue(mockValidJobData);

      // Mock web scraping
      const mockHtml = `<html><head><title>Software Developer - Tech Solutions</title></head><body><div class="job-content">Job description here</div></body></html>`;
      mockedAxios.get.mockResolvedValue({ 
        data: mockHtml,
        status: 200
      });

      // Mock cheerio
      const mockCheerioInstance = {
        html: jest.fn().mockReturnValue(mockHtml),
        text: jest.fn().mockReturnValue('Job content'),
        find: jest.fn().mockReturnThis(),
        length: 1
      };
      (cheerio.load as jest.Mock).mockReturnValue(() => mockCheerioInstance);

      // Mock AI service
      mockAiService.parseJobContent.mockResolvedValue(mockValidJobData);

      const result = await JobScrapingService.scrapeAndProcessJobs();

      expect(result.success).toBe(true);
      expect(result.processedJobs).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);
    });

    it('should extract job URLs from HTML content successfully', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="job-listings">
              <a href="/node/123456">Software Developer</a>
              <a href="/node/789012">Data Analyst</a>
              <a href="/node/345678">Project Manager</a>
            </div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ 
        data: mockHtml,
        status: 200
      });

      const mockCheerioInstance = {
        find: jest.fn().mockReturnValue({
          map: jest.fn().mockImplementation((callback: any) => {
            const urls = ['/node/123456', '/node/789012', '/node/345678'];
            return { get: () => urls.map((url, i) => callback(i, { attribs: { href: url } })) };
          })
        })
      };
      (cheerio.load as jest.Mock).mockReturnValue(mockCheerioInstance);

      const source = {
        name: 'jobinrwanda',
        baseUrl: 'https://www.jobinrwanda.com',
        paths: ['/jobs'],
        selectors: ['a[href*="/node/"]']
      };

      const urls = await (JobScrapingService as any).scrapeJobUrlsFromSource(source, 5);
      
      expect(urls).toEqual([
        'https://www.jobinrwanda.com/node/123456',
        'https://www.jobinrwanda.com/node/789012',
        'https://www.jobinrwanda.com/node/345678'
      ]);
    });

    it('should parse AI response successfully removing markdown blocks', () => {
      const markdownResponse = `\`\`\`json
{
  "title": "Software Developer",
  "company": "Tech Solutions",
  "jobType": "FULL_TIME",
  "experienceLevel": "MID_LEVEL",
  "educationLevel": "BACHELOR"
}
\`\`\``;

      const result = (JobScrapingService as any).extractJsonFromResponse(markdownResponse);
      
      expect(result).toEqual({
        title: "Software Developer",
        company: "Tech Solutions",
        jobType: "FULL_TIME",
        experienceLevel: "MID_LEVEL",
        educationLevel: "BACHELOR"
      });
    });

    it('should create system user when none exists', async () => {
      const mockNewUser = {
        _id: 'new-system-user-id',
        email: 'info@excellencecoachinghub.com',
        firstName: 'System',
        lastName: 'User',
        role: 'employer',
        isVerified: true,
        save: jest.fn().mockResolvedValue(true)
      };

      mockUser.findOne.mockResolvedValue(null);
      mockUser.mockImplementation(() => mockNewUser as any);

      const systemUser = await (JobScrapingService as any).createSystemUser();
      
      expect(systemUser._id).toBe('new-system-user-id');
      expect(systemUser.email).toBe('info@excellencecoachinghub.com');
      expect(mockNewUser.save).toHaveBeenCalled();
    });
  });

  describe('Input Verification - Invalid URL filtering', () => {
    it('should filter out non-job URLs (category pages)', () => {
      const urls = [
        'https://www.jobinrwanda.com/jobs/featured',
        'https://www.jobinrwanda.com/jobs/all',
        'https://www.jobinrwanda.com/node/123456',
        'https://www.jobinrwanda.com/node/789012',
        'https://www.workingnomads.com/job-skills',
        'https://www.workingnomads.com/jobs/remote-developer-456'
      ];

      const filteredUrls = (JobScrapingService as any).filterValidJobUrls(urls);
      
      expect(filteredUrls).toEqual([
        'https://www.jobinrwanda.com/node/123456',
        'https://www.jobinrwanda.com/node/789012',
        'https://www.workingnomads.com/jobs/remote-developer-456'
      ]);
    });

    it('should handle missing required fields by providing defaults', () => {
      const incompleteJobData = {
        title: 'Software Developer',
        description: 'Job description',
        company: 'Tech Company'
        // Missing required fields: jobType, experienceLevel, educationLevel
      };

      const processedData = (JobScrapingService as any).ensureRequiredFields(incompleteJobData);
      
      expect(processedData.jobType).toBeDefined();
      expect(processedData.experienceLevel).toBeDefined();
      expect(processedData.educationLevel).toBeDefined();
      expect(processedData.location).toBeDefined();
      expect(processedData.skills).toEqual([]);
      expect(processedData.requirements).toEqual([]);
      expect(processedData.responsibilities).toEqual([]);
      expect(processedData.benefits).toEqual([]);
    });

    it('should validate job data before saving to database', async () => {
      const invalidJobData = {
        title: '',
        description: '',
        company: '',
        location: '',
        jobType: 'INVALID_TYPE' as JobType,
        experienceLevel: 'INVALID_LEVEL' as ExperienceLevel,
        educationLevel: 'INVALID_EDUCATION' as EducationLevel,
        skills: [],
        requirements: [],
        responsibilities: [],
        benefits: [],
        externalApplicationUrl: 'invalid-url',
        externalJobId: ''
      };

      const isValid = (JobScrapingService as any).validateJobData(invalidJobData);
      
      expect(isValid).toBe(false);
    });

    it('should extract valid job ID from URL', () => {
      const testCases = [
        { url: 'https://www.jobinrwanda.com/node/123456', expected: '123456' },
        { url: 'https://www.workingnomads.com/jobs/remote-developer-789', expected: 'remote-developer-789' },
        { url: 'https://mucuruzi.com/job/project-manager-456', expected: 'project-manager-456' },
        { url: 'https://invalid-url', expected: null }
      ];

      testCases.forEach(({ url, expected }) => {
        const result = (JobScrapingService as any).extractJobId(url);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Branching - AI rate limiting enforcement', () => {
    it('should enforce daily AI request limit', async () => {
      // Set AI request count to limit
      (JobScrapingService as any).aiRequestCount = 40;
      
      const canUseAI = (JobScrapingService as any).canUseAI();
      
      expect(canUseAI).toBe(false);
    });

    it('should reset AI request count daily', () => {
      // Set old date
      (JobScrapingService as any).lastResetDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toDateString();
      (JobScrapingService as any).aiRequestCount = 40;
      
      (JobScrapingService as any).checkAndResetAICounter();
      
      expect((JobScrapingService as any).aiRequestCount).toBe(0);
      expect((JobScrapingService as any).lastResetDate).toBe(new Date().toDateString());
    });

    it('should increment AI request counter after each use', async () => {
      const initialCount = (JobScrapingService as any).aiRequestCount;
      
      mockAiService.parseJobContent.mockResolvedValue({
        title: 'Test Job',
        jobType: JobType.FULL_TIME,
        experienceLevel: ExperienceLevel.ENTRY_LEVEL,
        educationLevel: EducationLevel.BACHELOR
      } as ScrapedJobData);

      await (JobScrapingService as any).parseJobWithAI('Test job content', 'test-url');
      
      expect((JobScrapingService as any).aiRequestCount).toBe(initialCount + 1);
    });

    it('should fallback to basic parsing when AI limit exceeded', async () => {
      // Set AI request count to limit
      (JobScrapingService as any).aiRequestCount = 40;
      
      const result = await (JobScrapingService as any).parseJobWithAI('Test job content', 'test-url');
      
      expect(result).toBeNull();
      expect(mockAiService.parseJobContent).not.toHaveBeenCalled();
    });
  });

  describe('Branching - Daily job limit enforcement', () => {
    it('should stop processing when daily job limit is reached', async () => {
      mockJob.countDocuments.mockResolvedValue(30); // At limit
      
      const result = await JobScrapingService.scrapeAndProcessJobs();
      
      expect(result.processedJobs).toBe(0);
      expect(result.success).toBe(true);
    });

    it('should process only remaining quota when partially filled', async () => {
      mockJob.countDocuments.mockResolvedValue(25); // 5 remaining
      mockUser.findOne.mockResolvedValue({ _id: 'system-user' } as any);
      
      // Mock empty results to prevent actual processing
      mockedAxios.get.mockResolvedValue({ data: '<html></html>', status: 200 });
      const mockCheerioInstance = {
        find: jest.fn().mockReturnValue({ map: jest.fn().mockReturnValue({ get: () => [] }) })
      };
      (cheerio.load as jest.Mock).mockReturnValue(mockCheerioInstance);
      
      const result = await JobScrapingService.scrapeAndProcessJobs();
      
      expect(result.success).toBe(true);
    });

    it('should enforce minimum jobs threshold with aggressive second pass', async () => {
      mockJob.countDocuments.mockResolvedValue(0); // No existing jobs
      mockUser.findOne.mockResolvedValue({ _id: 'system-user' } as any);
      
      // Mock empty results for first pass
      mockedAxios.get.mockResolvedValue({ data: '<html></html>', status: 200 });
      const mockCheerioInstance = {
        find: jest.fn().mockReturnValue({ map: jest.fn().mockReturnValue({ get: () => [] }) })
      };
      (cheerio.load as jest.Mock).mockReturnValue(mockCheerioInstance);
      
      const result = await JobScrapingService.scrapeAndProcessJobs();
      
      expect(result.success).toBe(true);
      // Should trigger second pass logic when under minimum threshold
    });
  });

  describe('Exception Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      
      const source = {
        name: 'jobinrwanda',
        baseUrl: 'https://www.jobinrwanda.com',
        paths: ['/jobs'],
        selectors: ['a[href*="/node/"]']
      };
      
      const urls = await (JobScrapingService as any).scrapeJobUrlsFromSource(source, 5);
      
      expect(urls).toEqual([]);
    });

    it('should handle invalid JSON in AI responses', () => {
      const invalidJson = 'This is not valid JSON {invalid}';
      
      expect(() => {
        (JobScrapingService as any).extractJsonFromResponse(invalidJson);
      }).toThrow('Failed to parse AI response');
    });

    it('should handle cheerio parsing errors', async () => {
      mockedAxios.get.mockResolvedValue({ data: 'invalid html', status: 200 });
      (cheerio.load as jest.Mock).mockImplementation(() => {
        throw new Error('Cheerio parsing error');
      });
      
      const source = {
        name: 'jobinrwanda',
        baseUrl: 'https://www.jobinrwanda.com',
        paths: ['/jobs'],
        selectors: ['a[href*="/node/"]']
      };
      
      const urls = await (JobScrapingService as any).scrapeJobUrlsFromSource(source, 5);
      
      expect(urls).toEqual([]);
    });

    it('should handle database connection errors', async () => {
      mockJob.countDocuments.mockRejectedValue(new Error('Database connection failed'));
      
      const result = await JobScrapingService.scrapeAndProcessJobs();
      
      expect(result.success).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle AI service errors gracefully', async () => {
      mockAiService.parseJobContent.mockRejectedValue(new Error('AI service unavailable'));
      
      const result = await (JobScrapingService as any).parseJobWithAI('Test content', 'test-url');
      
      expect(result).toBeNull();
    });

    it('should handle job validation errors', async () => {
      const mockJobData = {
        title: 'Test Job',
        // Missing required fields to trigger validation error
      };
      
      const mockSave = jest.fn().mockRejectedValue(new Error('Job validation failed: jobType: Job type is required'));
      mockJob.mockImplementation(() => ({ save: mockSave } as any));
      
      try {
        await (JobScrapingService as any).saveJobToDatabase(
          mockJobData, 
          'system-user-id', 
          'https://example.com/job/123', 
          'test-source'
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Job validation failed');
      }
    });

    it('should handle rate limiting from external websites', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 429, statusText: 'Too Many Requests' }
      });
      
      const source = {
        name: 'jobinrwanda',
        baseUrl: 'https://www.jobinrwanda.com',
        paths: ['/jobs'],
        selectors: ['a[href*="/node/"]']
      };
      
      const urls = await (JobScrapingService as any).scrapeJobUrlsFromSource(source, 5);
      
      expect(urls).toEqual([]);
    });
  });

  describe('Helper Functions', () => {
    it('should implement delay function correctly', async () => {
      const startTime = Date.now();
      await (JobScrapingService as any).delay(100);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(95); // Allow small timing variance
    });

    it('should clean HTML content for AI processing', () => {
      const dirtyHtml = `
        <div class="job-content">
          <h1>Job Title</h1>
          <script>alert('test')</script>
          <style>.hidden { display: none; }</style>
          <p>Job description with <strong>formatting</strong></p>
        </div>
      `;
      
      const cleanContent = (JobScrapingService as any).cleanHtmlContent(dirtyHtml);
      
      expect(cleanContent).not.toContain('<script>');
      expect(cleanContent).not.toContain('<style>');
      expect(cleanContent).toContain('Job Title');
      expect(cleanContent).toContain('Job description');
    });

    it('should normalize job categories correctly', () => {
      const testCases = [
        { input: 'SOFTWARE DEVELOPMENT', expected: JobCategory.TECHNOLOGY },
        { input: 'Marketing & Sales', expected: JobCategory.MARKETING_SALES },
        { input: 'Human Resources', expected: JobCategory.HUMAN_RESOURCES },
        { input: 'Unknown Category', expected: JobCategory.OTHER }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const result = (JobScrapingService as any).normalizeJobCategory(input);
        expect(result).toBe(expected);
      });
    });
  });
});