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
  private static readonly DEFAULT_EMPLOYER_EMAIL = 'info@excellencecoachinghub.com';
  
  // Job sources configuration
  private static readonly JOB_SOURCES = [
    {
      name: 'jobinrwanda',
      baseUrl: 'https://www.jobinrwanda.com',
      paths: ['/jobs', '/job', '/vacancies', '/opportunities', ''],
      selectors: [
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
      ]
    },
    {
      name: 'workingnomads',
      baseUrl: 'https://www.workingnomads.com',
      paths: ['/jobs', '', '/remote-jobs', '/latest-jobs'],
      selectors: [
        '.job-item a',
        '.job-listing a',
        '.job-title a',
        'a[href*="/job/"]',
        'a[href*="/jobs/"]',
        '.post-title a',
        'h2 a',
        'h3 a',
        '.job-card a'
      ]
    },
    {
      name: 'mucuruzi',
      baseUrl: 'https://mucuruzi.com',
      paths: ['/all-jobs/', '/jobs', '/vacancies', ''],
      selectors: [
        '.job-item a',
        '.job-listing a',
        '.job-title a',
        'a[href*="/job"]',
        'a[href*="/vacancy"]',
        'a[href*="/opportunity"]',
        '.post-title a',
        'h2 a',
        'h3 a',
        '.entry-title a'
      ]
    },
    {
      name: 'unjobs',
      baseUrl: 'https://unjobs.org',
      paths: ['/duty_stations/kgl', '/duty_stations/kigali', '/jobs', ''],
      selectors: [
        '.job-item a',
        '.job-listing a',
        '.job-title a',
        'a[href*="/vacancy"]',
        'a[href*="/job"]',
        '.views-row a',
        'h2 a',
        'h3 a',
        '.field-content a'
      ]
    },
    {
      name: 'rwandajob',
      baseUrl: 'https://www.rwandajob.com',
      paths: ['/', '/jobs', '/vacancies', '/opportunities'],
      selectors: [
        '.job-item a',
        '.job-listing a',
        '.job-title a',
        'a[href*="/job"]',
        'a[href*="/vacancy"]',
        'a[href*="/opportunity"]',
        '.post-title a',
        'h2 a',
        'h3 a',
        '.entry-title a'
      ]
    },
    {
      name: 'mifotra',
      baseUrl: 'https://recruitment.mifotra.gov.rw',
      paths: ['/', '/jobs', '/vacancies', '/opportunities'],
      selectors: [
        '.views-row a[href*="/node/"]',
        '.view-content a[href*="/node/"]',
        '.field-content a[href*="/node/"]',
        'h2 a[href*="/node/"]',
        'h3 a[href*="/node/"]',
        '.node-title a',
        'a[href*="/job"]',
        'a[href*="/vacancy"]',
        'a[href*="/opportunity"]',
        '.job-item a',
        '.job-listing a',
        '.job-title a',
        '.post-title a',
        '.entry-title a'
      ]
    },
    {
      name: 'newtimes',
      baseUrl: 'https://jobs.newtimes.co.rw',
      paths: ['/', '/jobs', '/vacancies', '/opportunities'],
      selectors: [
        '.job-item a',
        '.job-listing a',
        '.job-title a',
        'a[href*="/job"]',
        'a[href*="/vacancy"]',
        'a[href*="/opportunity"]',
        '.post-title a',
        'h2 a',
        'h3 a',
        '.entry-title a'
      ]
    },
    {
      name: 'unjobnet',
      baseUrl: 'https://www.unjobnet.org',
      paths: ['/vacancies', '/jobs', '/'],
      selectors: [
        'a[href*="/vacancy/"]',
        'a[href*="/job/"]',
        '.views-row a[href*="/vacancy/"]',
        '.field-content a[href*="/vacancy/"]',
        'h2 a[href*="/vacancy/"]',
        'h3 a[href*="/vacancy/"]',
        '.job-item a[href*="/vacancy/"]',
        '.job-listing a[href*="/vacancy/"]',
        '.job-title a[href*="/vacancy/"]',
        '.post-title a[href*="/vacancy/"]',
        '.entry-title a[href*="/vacancy/"]'
      ]
    }
  ];

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

      // Calculate jobs per source (distribute evenly)
      const jobsPerSource = Math.max(1, Math.floor(remainingQuota / this.JOB_SOURCES.length));
      console.log(`Will try to process up to ${jobsPerSource} jobs from each of ${this.JOB_SOURCES.length} sources`);

      // Scrape jobs from all configured sources
      for (const source of this.JOB_SOURCES) {
        try {
          console.log(`\n🔍 Scraping jobs from ${source.name} (${source.baseUrl})`);
          
          const sourceJobUrls = await this.scrapeJobUrlsFromSource(source, jobsPerSource);
          console.log(`Found ${sourceJobUrls.length} job URLs from ${source.name}`);

          // Process each job URL from this source
          for (let i = 0; i < sourceJobUrls.length; i++) {
            const jobUrl = sourceJobUrls[i];
            if (!jobUrl) {
              console.log(`Skipping empty job URL at index ${i}`);
              continue;
            }

            try {
              console.log(`Processing job ${i + 1}/${sourceJobUrls.length} from ${source.name}: ${jobUrl}`);
              
              // Check if job already exists
              const jobId = this.extractJobId(jobUrl);
              const existingJob = await Job.findOne({
                externalJobSource: source.name,
                externalJobId: jobId
              });

              if (existingJob) {
                console.log(`Job already exists, skipping: ${jobUrl}`);
                continue;
              }

              // Add delay before scraping to be respectful to the source
              console.log('Waiting before scraping to be respectful...');
              await this.delay(3000);

              const jobData = await this.scrapeAndParseJob(jobUrl, source.name);
              if (jobData && systemUser) {
                await this.saveJobToDatabase(jobData, String(systemUser._id), jobUrl, source.name);
                results.processedJobs++;
                console.log(`✅ Successfully processed job ${i + 1}/${sourceJobUrls.length} from ${source.name}: ${jobData.title} at ${jobData.company}`);
                
                // Additional delay after successful processing
                await this.delay(2000);
              } else {
                console.log(`❌ Failed to extract job data from: ${jobUrl}`);
              }
            } catch (error) {
              const errorMsg = `Error processing job ${jobUrl} from ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error(`❌ ${errorMsg}`);
              results.errors.push(errorMsg);
              
              // Delay even after errors to prevent overwhelming the server
              await this.delay(1000);
            }
          }
        } catch (error) {
          const errorMsg = `Error scraping from ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
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
   * Scrape job URLs from a specific source
   */
  private static async scrapeJobUrlsFromSource(source: typeof JobScrapingService.JOB_SOURCES[0], limit: number): Promise<string[]> {
    const urlsToTry = source.paths.map(path => `${source.baseUrl}${path}`);

    for (const url of urlsToTry) {
      try {
        console.log(`Attempting to fetch job listings from ${source.name}: ${url}`);
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"'
          },
          timeout: 30000,
          maxRedirects: 5,
          validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
          }
        });

        // Handle different HTTP status codes
        if (response.status === 403) {
          console.log(`❌ Access forbidden (403) from ${source.name}: ${url}`);
          continue; // Try next URL
        }
        
        if (response.status === 404) {
          console.log(`❌ Page not found (404) from ${source.name}: ${url}`);
          continue; // Try next URL
        }
        
        if (response.status >= 400) {
          console.log(`❌ HTTP error ${response.status} from ${source.name}: ${url}`);
          continue; // Try next URL
        }

        console.log(`✅ Successfully fetched from ${source.name}: ${url}`);
        console.log(`Response status: ${response.status}`);
        console.log(`Response content length: ${response.data.length}`);

        // Add error handling for cheerio.load
        let $: cheerio.CheerioAPI;
        try {
          if (!response.data) {
            throw new Error('Response data is empty');
          }
          
          $ = cheerio.load(response.data);
          console.log(`✅ Successfully loaded HTML with cheerio for ${source.name}`);
        } catch (cheerioError) {
          console.error(`❌ Error loading HTML with cheerio for ${source.name}:`, cheerioError);
          console.log('Response data sample:', String(response.data).substring(0, 200));
          continue; // Try next URL
        }
        
        const jobUrls: string[] = [];

        // Use source-specific selectors
        for (const selector of source.selectors) {
          $(selector).each((index, element) => {
            if (jobUrls.length >= limit) return false;

            const href = $(element).attr('href');
            if (href && (href.includes('/job') || href.includes('/node/') || href.includes('/vacancy') || href.includes('/opportunity'))) {
              const fullUrl = href.startsWith('http') ? href : `${source.baseUrl}${href}`;
              
              // Avoid duplicates, search pages, and generic URLs
              const isValidJobUrl = !jobUrls.includes(fullUrl) && 
                                   !fullUrl.includes('#') && 
                                   !fullUrl.endsWith('/jobs') && 
                                   !fullUrl.endsWith('/vacancies') && 
                                   !fullUrl.endsWith('/opportunities') && 
                                   !fullUrl.includes('search') && 
                                   !fullUrl.includes('filter') &&
                                   (href.includes('/job/') || href.includes('/node/') || href.includes('/vacancy/') || href.includes('/opportunity/'));
              
              if (isValidJobUrl) {
                jobUrls.push(fullUrl);
                console.log(`Found job URL from ${source.name}: ${fullUrl}`);
              }
            }
          });

          if (jobUrls.length >= limit) break;
        }

        // If no jobs found with standard selectors, try to find any content links
        if (jobUrls.length === 0) {
          console.log(`No job URLs found with standard selectors from ${source.name}, trying alternative approach...`);
          
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
              const fullUrl = href.startsWith('http') ? href : `${source.baseUrl}${href}`;
              if (!jobUrls.includes(fullUrl) && fullUrl.includes(source.baseUrl)) {
                jobUrls.push(fullUrl);
                console.log(`Found job URL from ${source.name} (by content): ${fullUrl} - "${linkText}"`);
              }
            }
          });
        }

        console.log(`Total job URLs found from ${source.name}: ${jobUrls.length}`);
        if (jobUrls.length > 0) {
          return jobUrls.slice(0, limit);
        }

      } catch (error) {
        console.log(`❌ Failed to fetch from ${source.name}: ${url}`);
        console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue; // Try next URL
      }
    }

    // If we get here, all URLs failed for this source
    console.error(`❌ All job listing URLs failed to load for ${source.name}`);
    return [];
  }

  /**
   * Legacy method - now redirects to scrape from first source
   * @deprecated Use scrapeJobUrlsFromSource instead
   */
  private static async scrapeJobUrls(limit: number): Promise<string[]> {
    // Legacy method - use first source for backward compatibility
    const firstSource = this.JOB_SOURCES[0];
    return this.scrapeJobUrlsFromSource(firstSource, limit);
  }

  /**
   * Scrape individual job page and use AI to parse the content
   */
  private static async scrapeAndParseJob(jobUrl: string, sourceName: string = 'unknown'): Promise<ScrapedJobData | null> {
    try {
      const response = await axios.get(jobUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
          'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"'
        },
        timeout: 30000,
        validateStatus: function (status) {
          return status < 500; // Resolve only if the status code is less than 500
        }
      });

      // Handle different HTTP status codes
      if (response.status >= 400) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

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
  private static async saveJobToDatabase(jobData: ScrapedJobData, employerId: string, originalUrl: string, sourceName: string = 'jobinrwanda'): Promise<IJobDocument> {
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
      externalJobSource: sourceName,
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
   * Test connection and find working URLs for job scraping from all sources
   */
  static async testScrapingConnection(): Promise<{
    success: boolean;
    workingUrls: string[];
    failedUrls: string[];
    details: any[];
  }> {
    // Generate URLs to test from all job sources
    const urlsToTest: string[] = [];
    
    for (const source of this.JOB_SOURCES) {
      for (const path of source.paths.slice(0, 2)) { // Test first 2 paths per source to avoid too many requests
        urlsToTest.push(`${source.baseUrl}${path}`);
      }
    }

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