import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Job, IJobDocument } from '../models/Job';
import { User } from '../models/User';
import { JobStatus, JobType, ExperienceLevel, EducationLevel, JobCategory } from '../types';
import { aiService } from './aiService';
import * as cheerio from 'cheerio';

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface ScrapedJobData {
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: JobType;
  category?: JobCategory;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicationDeadline?: Date;
  postedDate?: Date;
  externalApplicationUrl: string;
  externalJobId: string;
  // Contact information extracted from the job posting
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    contactPerson?: string;
    applicationInstructions?: string;
  };
}

export class JobScrapingService {
  private static readonly MAX_JOBS_PER_DAY = 24;
  private static readonly JOB_IN_RWANDA_BASE_URL = 'https://www.jobinrwanda.com';
  private static readonly DEFAULT_EMPLOYER_EMAIL = 'info@excellencecoachinghub.com';

  /**
   * Helper function to extract JSON from AI responses that might be wrapped in markdown
   */
  private static extractJsonFromResponse(text: string): any {
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json') && jsonText.endsWith('```')) {
      jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith('```') && jsonText.endsWith('```')) {
      jsonText = jsonText.slice(3, -3).trim();
    }
    
    // Find JSON content between first { and last }
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }
    
    try {
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Failed to parse JSON from AI response:', error);
      console.error('Raw response:', text);
      console.error('Processed JSON text:', jsonText);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
    }
  }

  /**
   * Main function to scrape and process jobs
   */
  static async scrapeAndProcessJobs(): Promise<{
    success: boolean;
    processedJobs: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      processedJobs: 0,
      errors: [] as string[]
    };

    try {
      console.log('Starting job scraping process...');

      // Check today's processed jobs count to avoid exceeding limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayJobsCount = await Job.countDocuments({
        isExternalJob: true,
        externalJobSource: 'jobinrwanda',
        createdAt: { $gte: today, $lt: tomorrow }
      });

      if (todayJobsCount >= this.MAX_JOBS_PER_DAY) {
        console.log(`Daily limit of ${this.MAX_JOBS_PER_DAY} jobs already reached for today`);
        return results;
      }

      const remainingQuota = this.MAX_JOBS_PER_DAY - todayJobsCount;
      console.log(`Processing up to ${remainingQuota} jobs today`);

      // Get the system user (employer for external jobs)
      let systemUser = await User.findOne({ email: this.DEFAULT_EMPLOYER_EMAIL });
      if (!systemUser) {
        systemUser = await this.createSystemUser();
      }

      // Scrape jobs from jobinrwanda.com
      const jobUrls = await this.scrapeJobUrls(remainingQuota);
      console.log(`Found ${jobUrls.length} job URLs to process`);

      // Process each job URL one by one with proper delays
      for (let i = 0; i < jobUrls.length; i++) {
        const jobUrl = jobUrls[i];
        try {
          console.log(`Processing job ${i + 1}/${jobUrls.length}: ${jobUrl}`);
          
          // Check if job already exists
          const existingJob = await Job.findOne({
            externalJobSource: 'jobinrwanda',
            externalJobId: this.extractJobId(jobUrl)
          });

          if (existingJob) {
            console.log(`Job already exists, skipping: ${jobUrl}`);
            continue;
          }

          // Add delay before scraping to be respectful to the source
          console.log('Waiting before scraping to be respectful...');
          await this.delay(3000);

          const jobData = await this.scrapeAndParseJob(jobUrl);
          if (jobData) {
            await this.saveJobToDatabase(jobData, systemUser._id, jobUrl);
            results.processedJobs++;
            console.log(`✅ Successfully processed job ${i + 1}/${jobUrls.length}: ${jobData.title} at ${jobData.company}`);
            
            // Additional delay after successful processing
            await this.delay(2000);
          } else {
            console.log(`❌ Failed to extract job data from: ${jobUrl}`);
          }
        } catch (error) {
          const errorMsg = `Error processing job ${jobUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
          
          // Delay even after errors to prevent overwhelming the server
          await this.delay(1000);
        }
      }

      console.log(`Job scraping completed. Processed ${results.processedJobs} jobs`);
    } catch (error) {
      console.error('Job scraping process failed:', error);
      results.success = false;
      results.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  /**
   * Scrape job URLs from the main job listings page
   */
  private static async scrapeJobUrls(limit: number): Promise<string[]> {
    // Try different possible URLs for job listings
    const urlsToTry = [
      `${this.JOB_IN_RWANDA_BASE_URL}/jobs`,
      `${this.JOB_IN_RWANDA_BASE_URL}/job`,
      `${this.JOB_IN_RWANDA_BASE_URL}/vacancies`,
      `${this.JOB_IN_RWANDA_BASE_URL}/opportunities`,
      `${this.JOB_IN_RWANDA_BASE_URL}`,  // Try the homepage
    ];

    for (const url of urlsToTry) {
      try {
        console.log(`Attempting to fetch job listings from: ${url}`);
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          timeout: 30000,
          maxRedirects: 5
        });

        console.log(`✅ Successfully fetched from: ${url}`);
        console.log(`Response status: ${response.status}`);
        console.log(`Response content length: ${response.data.length}`);
        console.log(`Response content type: ${response.headers['content-type']}`);

        // Add error handling for cheerio.load
        let $: cheerio.CheerioAPI;
        try {
          if (!response.data) {
            throw new Error('Response data is empty');
          }
          
          if (typeof response.data !== 'string') {
            console.log('Response data type:', typeof response.data);
            console.log('Converting response data to string...');
          }
          
          $ = cheerio.load(response.data);
          console.log('✅ Successfully loaded HTML with cheerio');
        } catch (cheerioError) {
          console.error(`❌ Error loading HTML with cheerio:`, cheerioError);
          console.log('Response data sample:', String(response.data).substring(0, 200));
          continue; // Try next URL
        }
        
        const jobUrls: string[] = [];

        // Try multiple selectors for different possible job link structures
        const selectors = [
          'a[href*="/job/"]',
          'a[href*="/jobs/"]', 
          'a[href*="/node/"]',
          '.views-row a[href*="/node/"]',
          '.job-item a',
          '.job-listing a',
          '.job-card a',
          '.view-content a[href*="/node/"]',
          'h2 a[href*="/node/"]',
          'h3 a[href*="/node/"]',
          '.field-content a[href*="/node/"]',
          '.view-jobs a',
          '.job-title a',
          '.node-title a'
        ];

        for (const selector of selectors) {
          $(selector).each((index, element) => {
            if (jobUrls.length >= limit) return false;

            const href = $(element).attr('href');
            if (href && (href.includes('/job/') || href.includes('/node/') || href.includes('/vacancy'))) {
              const fullUrl = href.startsWith('http') ? href : `${this.JOB_IN_RWANDA_BASE_URL}${href}`;
              
              // Avoid duplicates and ensure it's a job-related URL
              if (!jobUrls.includes(fullUrl) && !fullUrl.includes('#')) {
                jobUrls.push(fullUrl);
                console.log(`Found job URL: ${fullUrl}`);
              }
            }
          });

          if (jobUrls.length >= limit) break;
        }

        // If no jobs found with standard selectors, try to find any content links
        if (jobUrls.length === 0) {
          console.log('No job URLs found with standard selectors, trying alternative approach...');
          
          $('a').each((index, element) => {
            if (jobUrls.length >= limit) return false;
            
            const href = $(element).attr('href');
            const linkText = $(element).text().toLowerCase().trim();
            
            // Check if link text contains job-related keywords or href contains job patterns
            if (href && (
              linkText.includes('job') || 
              linkText.includes('position') || 
              linkText.includes('career') || 
              linkText.includes('vacancy') ||
              linkText.includes('opportunity') ||
              href.includes('/node/') ||
              href.includes('/job')
            )) {
              const fullUrl = href.startsWith('http') ? href : `${this.JOB_IN_RWANDA_BASE_URL}${href}`;
              if (!jobUrls.includes(fullUrl) && fullUrl.includes(this.JOB_IN_RWANDA_BASE_URL)) {
                jobUrls.push(fullUrl);
                console.log(`Found job URL (by content): ${fullUrl} - "${linkText}"`);
              }
            }
          });
        }

        console.log(`Total job URLs found: ${jobUrls.length}`);
        if (jobUrls.length > 0) {
          return jobUrls.slice(0, limit);
        }

      } catch (error) {
        console.log(`❌ Failed to fetch from: ${url}`);
        console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue; // Try next URL
      }
    }

    // If we get here, all URLs failed
    console.error('❌ All job listing URLs failed to load');
    return [];
  }

  /**
   * Scrape individual job page and use AI to parse the content
   */
  private static async scrapeAndParseJob(jobUrl: string): Promise<ScrapedJobData | null> {
    try {
      const response = await axios.get(jobUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });

      if (!response.data) {
        throw new Error('Empty response data from job URL');
      }

      const $ = cheerio.load(response.data);
      
      // Extract raw text content more comprehensively
      const pageTitle = $('title').text().trim();
      
      // Try to get clean content by removing debug information
      $('script, style, noscript, .theme-debug, .debug').remove();
      
      // Extract main content areas
      const mainContent = $('.main-content, .content, .field-content, .views-row, .node-content').text().replace(/\s+/g, ' ').trim();
      const bodyText = mainContent || $('body').text().replace(/\s+/g, ' ').replace(/<!--[\s\S]*?-->/g, '').trim();
      
      console.log(`Extracting job data from: ${pageTitle}`);
      console.log(`Content length: ${bodyText.length} characters`);
      
      // Use AI to parse the job information
      const aiPrompt = `
        You are an expert job data extractor. Parse the following job posting content and extract structured job information. Return ONLY a valid JSON object with these exact fields:

        {
          "title": "Job title as stated in the posting",
          "description": "Comprehensive job description including key details (max 4000 chars)",
          "company": "Company or organization name",
          "location": "Job location (if Rwanda/Kigali mentioned, use those)",
          "jobType": "full_time|part_time|contract|internship|freelance",
          "experienceLevel": "entry_level|mid_level|senior_level|executive",
          "educationLevel": "high_school|associate|bachelor|master|doctorate|professional",
          "salary": {
            "min": number or null,
            "max": number or null,
            "currency": "RWF|USD|EUR"
          },
          "skills": ["skill1", "skill2", "skill3"] (relevant technical and soft skills),
          "requirements": ["requirement1", "requirement2"] (what's needed to apply),
          "responsibilities": ["responsibility1", "responsibility2"] (what the job involves),
          "benefits": ["benefit1", "benefit2"] (what's offered),
          "applicationDeadline": "YYYY-MM-DD" or null,
          "postedDate": "YYYY-MM-DD" or null,
          "contactInfo": {
            "email": "contact email if found" or null,
            "phone": "contact phone number if found" or null,
            "website": "company website if found" or null,
            "address": "physical address if found" or null,
            "contactPerson": "contact person name if found" or null,
            "applicationInstructions": "how to apply instructions if found" or null
          }
        }

        CONTENT TO PARSE:
        Page Title: ${pageTitle}
        
        Body Content: ${bodyText.substring(0, 4000)}

        EXTRACTION RULES:
        - Extract ONLY information explicitly mentioned in the content
        - Look for dates like "Posted on", "Application deadline", "Closing date", "Apply by"
        - If salary is not clearly stated, set to null
        - For Rwanda jobs, prefer RWF currency when applicable
        - Infer jobType from context (permanent=full_time, temporary=contract, etc.)
        - Infer experienceLevel from years mentioned or job title context
        - Keep description comprehensive but under 4000 characters
        - Ensure all arrays have relevant, non-empty items
        - Return ONLY the JSON object, no explanatory text
        - Parse dates in various formats (DD/MM/YYYY, DD-MM-YYYY, Month DD, YYYY)
        - If deadline mentions "ASAP", "immediate", or similar, set to null
        - If content seems incomplete or corrupted, extract what you can
        - CONTACT INFO EXTRACTION:
          * Look for email patterns like @domain.com
          * Look for phone numbers with country codes or local formats
          * Look for company websites or URLs
          * Look for physical addresses or office locations
          * Look for contact person names (HR Manager, Recruiter, etc.)
          * Look for application instructions ("Send CV to...", "Apply via...", etc.)
      `;

      const result = await model.generateContent(aiPrompt);
      const response_text = result.response.text();
      
      console.log(`AI Response received, length: ${response_text.length}`);
      
      // Use helper function to extract and parse JSON
      const parsedData = this.extractJsonFromResponse(response_text);
      
      // Validate and normalize the parsed data
      const jobData = this.validateAndNormalizeJobData(parsedData, jobUrl);
      
      // Add AI categorization if job data is valid
      if (jobData) {
        try {
          const category = await aiService.categorizeJob(jobData.title, jobData.description);
          jobData.category = category as JobCategory;
          console.log(`Job "${jobData.title}" categorized as: ${category}`);
        } catch (error) {
          console.error('Error categorizing job:', error);
          jobData.category = JobCategory.JOBS; // Default fallback
        }
      }
      
      return jobData;

    } catch (error) {
      console.error(`Error scraping job ${jobUrl}:`, error);
      return null;
    }
  }

  /**
   * Validate and normalize parsed job data
   */
  private static validateAndNormalizeJobData(data: any, jobUrl: string): ScrapedJobData | null {
    try {
      // Validate required fields
      if (!data.title || !data.company || !data.location) {
        throw new Error('Missing required fields: title, company, or location');
      }

      // Normalize job type
      const jobType = this.normalizeJobType(data.jobType);
      const experienceLevel = this.normalizeExperienceLevel(data.experienceLevel);
      const educationLevel = this.normalizeEducationLevel(data.educationLevel);

      // Process salary
      let salary = null;
      if (data.salary && (data.salary.min || data.salary.max)) {
        salary = {
          min: data.salary.min || 0,
          max: data.salary.max || data.salary.min || 0,
          currency: data.salary.currency || 'RWF'
        };
      }

      // Parse deadline
      let applicationDeadline = null;
      if (data.applicationDeadline) {
        const deadline = new Date(data.applicationDeadline);
        if (deadline > new Date() && !isNaN(deadline.getTime())) {
          applicationDeadline = deadline;
        }
      }

      // Parse posted date
      let postedDate = null;
      if (data.postedDate) {
        const posted = new Date(data.postedDate);
        if (!isNaN(posted.getTime()) && posted <= new Date()) {
          postedDate = posted;
        }
      }

      // Process contact information
      let contactInfo = null;
      if (data.contactInfo && typeof data.contactInfo === 'object') {
        contactInfo = {
          email: data.contactInfo.email?.substring(0, 200) || null,
          phone: data.contactInfo.phone?.substring(0, 50) || null,
          website: data.contactInfo.website?.substring(0, 300) || null,
          address: data.contactInfo.address?.substring(0, 500) || null,
          contactPerson: data.contactInfo.contactPerson?.substring(0, 100) || null,
          applicationInstructions: data.contactInfo.applicationInstructions?.substring(0, 1000) || null
        };

        // Only keep contact info if at least one field has a value
        const hasContactInfo = Object.values(contactInfo).some(value => value !== null && value !== '');
        if (!hasContactInfo) {
          contactInfo = null;
        }
      }

      return {
        title: data.title.substring(0, 200),
        description: data.description?.substring(0, 4000) || `Job opportunity at ${data.company} in ${data.location}`,
        company: data.company.substring(0, 200),
        location: data.location.substring(0, 200),
        jobType,
        experienceLevel,
        educationLevel,
        salary,
        skills: Array.isArray(data.skills) ? data.skills.map((s: string) => s.substring(0, 100)).slice(0, 10) : [],
        requirements: Array.isArray(data.requirements) ? data.requirements.map((r: string) => r.substring(0, 500)).slice(0, 10) : [],
        responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities.map((r: string) => r.substring(0, 500)).slice(0, 10) : [],
        benefits: Array.isArray(data.benefits) ? data.benefits.map((b: string) => b.substring(0, 200)).slice(0, 10) : [],
        applicationDeadline,
        postedDate,
        externalApplicationUrl: jobUrl,
        externalJobId: this.extractJobId(jobUrl),
        contactInfo
      };
    } catch (error) {
      console.error('Error validating job data:', error);
      return null;
    }
  }

  /**
   * Save job to database
   */
  private static async saveJobToDatabase(jobData: ScrapedJobData, employerId: string, originalUrl: string): Promise<IJobDocument> {
    const job = new Job({
      title: jobData.title,
      description: jobData.description,
      company: jobData.company,
      employer: employerId,
      location: jobData.location,
      jobType: jobData.jobType,
      category: jobData.category,
      experienceLevel: jobData.experienceLevel,
      educationLevel: jobData.educationLevel,
      salary: jobData.salary,
      skills: jobData.skills,
      requirements: jobData.requirements,
      responsibilities: jobData.responsibilities,
      benefits: jobData.benefits,
      applicationDeadline: jobData.applicationDeadline,
      postedDate: jobData.postedDate || new Date(), // Use extracted date or current date
      status: JobStatus.ACTIVE,
      isCurated: true, // Mark as curated since it's AI-processed
      curatedBy: employerId,
      isExternalJob: true,
      externalApplicationUrl: originalUrl,
      externalJobSource: 'jobinrwanda',
      externalJobId: jobData.externalJobId,
      contactInfo: jobData.contactInfo, // Include extracted contact information
      psychometricTestRequired: false,
      psychometricTests: [],
      relatedCourses: []
    });

    return await job.save();
  }

  /**
   * Create system user for external jobs
   */
  private static async createSystemUser(): Promise<any> {
    const systemUser = new User({
      email: this.DEFAULT_EMPLOYER_EMAIL,
      firstName: 'ExJobNet',
      lastName: 'System',
      password: 'system_generated_password_' + Date.now(),
      role: 'employer',
      isVerified: true,
      company: 'ExJobNet External Jobs',
      jobTitle: 'System Administrator'
    });

    return await systemUser.save();
  }

  /**
   * Extract job ID from URL
   */
  private static extractJobId(url: string): string {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    return lastPart.split('?')[0] || url.substring(url.lastIndexOf('/') + 1, url.length).substring(0, 50);
  }

  /**
   * Normalize job type
   */
  private static normalizeJobType(jobType: string): JobType {
    const normalized = jobType?.toLowerCase() || '';
    if (normalized.includes('part')) return JobType.PART_TIME;
    if (normalized.includes('contract')) return JobType.CONTRACT;
    if (normalized.includes('intern')) return JobType.INTERNSHIP;
    if (normalized.includes('freelance')) return JobType.FREELANCE;
    return JobType.FULL_TIME;
  }

  /**
   * Normalize experience level
   */
  private static normalizeExperienceLevel(level: string): ExperienceLevel {
    const normalized = level?.toLowerCase() || '';
    if (normalized.includes('entry') || normalized.includes('junior') || normalized.includes('0-2')) return ExperienceLevel.ENTRY_LEVEL;
    if (normalized.includes('senior') || normalized.includes('lead')) return ExperienceLevel.SENIOR_LEVEL;
    if (normalized.includes('executive') || normalized.includes('director') || normalized.includes('manager')) return ExperienceLevel.EXECUTIVE;
    return ExperienceLevel.MID_LEVEL;
  }

  /**
   * Normalize education level
   */
  private static normalizeEducationLevel(level: string): EducationLevel {
    const normalized = level?.toLowerCase() || '';
    if (normalized.includes('high school') || normalized.includes('secondary')) return EducationLevel.HIGH_SCHOOL;
    if (normalized.includes('associate') || normalized.includes('diploma')) return EducationLevel.ASSOCIATE;
    if (normalized.includes('master') || normalized.includes('mba')) return EducationLevel.MASTER;
    if (normalized.includes('phd') || normalized.includes('doctorate')) return EducationLevel.DOCTORATE;
    if (normalized.includes('professional') || normalized.includes('certification')) return EducationLevel.PROFESSIONAL;
    return EducationLevel.BACHELOR;
  }

  /**
   * Delay function for rate limiting
   */
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get scraping statistics
   */
  static async getScrapingStats(): Promise<{
    totalExternalJobs: number;
    todayJobs: number;
    jobinrwandaJobs: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalExternalJobs, todayJobs, jobinrwandaJobs] = await Promise.all([
      Job.countDocuments({ isExternalJob: true }),
      Job.countDocuments({
        isExternalJob: true,
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      Job.countDocuments({
        isExternalJob: true,
        externalJobSource: 'jobinrwanda'
      })
    ]);

    return {
      totalExternalJobs,
      todayJobs,
      jobinrwandaJobs
    };
  }

  /**
   * Test connection and find working URLs for job scraping
   */
  static async testScrapingConnection(): Promise<{
    success: boolean;
    workingUrls: string[];
    failedUrls: string[];
    details: any[];
  }> {
    const urlsToTest = [
      `${this.JOB_IN_RWANDA_BASE_URL}`,
      `${this.JOB_IN_RWANDA_BASE_URL}/jobs`,
      `${this.JOB_IN_RWANDA_BASE_URL}/job`,
      `${this.JOB_IN_RWANDA_BASE_URL}/vacancies`,
      `${this.JOB_IN_RWANDA_BASE_URL}/opportunities`,
    ];

    const workingUrls: string[] = [];
    const failedUrls: string[] = [];
    const details: any[] = [];

    for (const url of urlsToTest) {
      try {
        console.log(`Testing connection to: ${url}`);
        
        const startTime = Date.now();
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: 15000,
          maxRedirects: 5
        });
        const responseTime = Date.now() - startTime;

        workingUrls.push(url);
        
        // Try to find job-related content
        const $ = cheerio.load(response.data);
        const jobLinks = $('a[href*="/job"], a[href*="/node"], a[href*="/vacancy"]').length;
        const jobKeywords = response.data.toLowerCase().match(/job|vacancy|position|career|opportunity/g)?.length || 0;

        details.push({
          url,
          status: 'success',
          httpStatus: response.status,
          responseTime: `${responseTime}ms`,
          contentLength: response.data.length,
          jobLinksFound: jobLinks,
          jobKeywordsCount: jobKeywords,
          isLikelyJobPage: jobLinks > 0 || jobKeywords > 5
        });

      } catch (error) {
        failedUrls.push(url);
        details.push({
          url,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          httpStatus: (error as any).response?.status || null
        });
      }
    }

    return {
      success: workingUrls.length > 0,
      workingUrls,
      failedUrls,
      details
    };
  }
}