import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Job, IJobDocument } from '../models/Job';
import { User } from '../models/User';
import { JobStatus, JobType, ExperienceLevel, EducationLevel, JobCategory } from '../types';
import { aiService } from './aiService';
import { centralAIManager } from './centralAIManager';
import * as cheerio from 'cheerio';

// Use the centralized AI manager for all job scraping operations
const aiManager = centralAIManager;

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
  private static readonly MAX_JOBS_PER_DAY = 30; // Increased from 24 to 30
  private static readonly MIN_JOBS_PER_DAY = 20; // Minimum threshold
  private static readonly DEFAULT_EMPLOYER_EMAIL = 'info@excellencecoachinghub.com';
  
  // AI model version checking
  private static lastVersionCheck: string = '';
  private static readonly VERSION_CHECK_INTERVAL_HOURS = 24; // Check for newer versions daily
  
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
      paths: ['/jobs', '/remote-jobs', '/latest-jobs', '/job-board'],
      selectors: [
        'a[href*="/jobs/"]',
        'a[href*="/job-"]',
        '.job-item a',
        '.job-listing a',
        '.job-title a',
        '.entry-title a',
        'h2 a',
        'h3 a',
        '.job-card a',
        '.post-title a',
        'article a[href*="/job"]',
        '.content a[href*="/job"]'
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
    },
    {
      name: 'jobsportal',
      baseUrl: 'https://www.jobsportal.co.tz',
      paths: ['/jobs/rwanda', '/jobs', '/'],
      selectors: [
        '.job-item a',
        '.job-listing a',
        '.job-title a',
        'a[href*="/job/"]',
        'a[href*="/jobs/"]',
        '.post-title a',
        'h2 a',
        'h3 a',
        '.entry-title a'
      ]
    },
    {
      name: 'eastafricanjobs',
      baseUrl: 'https://www.eastafricanjobs.org',
      paths: ['/rwanda-jobs', '/jobs', '/'],
      selectors: [
        '.job-item a',
        '.job-listing a',
        '.job-title a',
        'a[href*="/job"]',
        'a[href*="/vacancy"]',
        '.post-title a',
        'h2 a',
        'h3 a',
        '.entry-title a'
      ]
    },
    {
      name: 'brightermonday',
      baseUrl: 'https://www.brightermonday.com',
      paths: ['/jobs/rwanda', '/jobs', '/'],
      selectors: [
        '.job-item a',
        '.job-listing a',
        '.job-title a',
        'a[href*="/job"]',
        'a[href*="/vacancy"]',
        '.post-title a',
        'h2 a',
        'h3 a',
        '.entry-title a'
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
   * Check for AI model updates periodically using Central AI Manager
   */
  private static async checkAIModelUpdates(): Promise<void> {
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if we need to check for updates (daily)
    if (this.lastVersionCheck === now) {
      return; // Already checked today
    }
    
    try {
      console.log('🔍 Performing daily AI model version check using Central AI Manager...');
      
      // Get current model stats from central manager
      const stats = aiManager.getModelStats();
      console.log(`📊 Current AI model: ${stats.currentModel.name} (Latest: ${stats.isLatest}) - Requests: ${stats.requestCount}/${stats.dailyLimit}`);
      
      if (!stats.isLatest) {
        console.log('🔄 Attempting to migrate to newer AI model...');
        const migrated = await aiManager.checkForNewerVersions();
        
        if (migrated) {
          const newStats = aiManager.getModelStats();
          console.log(`✅ Job Scraper: Successfully upgraded to ${newStats.currentModel.name}`);
        } else {
          console.log('ℹ️ No migration needed or newer models unavailable');
        }
      } else {
        console.log('✅ Already using the latest AI model');
      }
      
      this.lastVersionCheck = now;
      
    } catch (error) {
      console.warn('⚠️ AI model version check failed:', error);
      // Don't fail the scraping process due to version check issues
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
      
      // Check for AI model updates before starting
      await this.checkAIModelUpdates();

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

      // Calculate jobs per source (distribute evenly with minimum guarantee)
      const jobsPerSource = Math.max(3, Math.floor(remainingQuota / this.JOB_SOURCES.length));
      const prioritySources = ['jobinrwanda', 'mucuruzi', 'unjobs', 'mifotra']; // High-yield sources
      console.log(`Will try to process up to ${jobsPerSource} jobs from each of ${this.JOB_SOURCES.length} sources`);
      console.log(`Priority sources: ${prioritySources.join(', ')}`);

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

              // Add smart delay before scraping to be respectful to the source
              const baseDelay = source.name === 'jobinrwanda' ? 4000 : 3000;
              const randomDelay = Math.random() * 1000; // 0-1s randomness
              const respectfulDelay = baseDelay + randomDelay;
              
              console.log(`⏳ Waiting ${Math.round(respectfulDelay/1000)}s before scraping to be respectful...`);
              await this.delay(respectfulDelay);

              const jobData = await this.scrapeAndParseJob(jobUrl, source.name);
              if (jobData && systemUser) {
                await this.saveJobToDatabase(jobData, String(systemUser._id), jobUrl, source.name);
                results.processedJobs++;
                console.log(`✅ Successfully processed job ${i + 1}/${sourceJobUrls.length} from ${source.name}: ${jobData.title} at ${jobData.company}`);
                
                // Additional delay after successful processing
                await this.delay(1500);
              } else {
                console.log(`❌ Failed to extract job data from: ${jobUrl}`);
              }
            } catch (error) {
              const errorMsg = `Error processing job ${jobUrl} from ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error(`❌ ${errorMsg}`);
              results.errors.push(errorMsg);
              
              // Longer delay after errors to prevent overwhelming the server
              await this.delay(2000);
            }
          }
        } catch (error) {
          const errorMsg = `Error scraping from ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }

      console.log(`Job scraping completed. Processed ${results.processedJobs} jobs`);
      
      // If we didn't meet the minimum threshold, try a second pass with more aggressive scraping
      if (results.processedJobs < this.MIN_JOBS_PER_DAY) {
        console.log(`⚠️ Only ${results.processedJobs} jobs processed, below minimum of ${this.MIN_JOBS_PER_DAY}. Starting aggressive second pass...`);
        
        const secondPassResults = await this.performAggressiveSecondPass(systemUser!, this.MIN_JOBS_PER_DAY - results.processedJobs);
        results.processedJobs += secondPassResults.processedJobs;
        results.errors.push(...secondPassResults.errors);
        
        console.log(`Second pass completed. Total jobs processed: ${results.processedJobs}`);
      }
      
    } catch (error) {
      console.error('Job scraping process failed:', error);
      results.success = false;
      results.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  /**
   * Get website-specific scraping configuration
   */
  private static getWebsiteSpecificConfig(sourceName: string): { 
    headers: any; 
    selectors: string[]; 
    urlFilter: (url: string) => boolean;
  } {
    const configs: { [key: string]: any } = {
      'workingnomads': {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        selectors: [
          'a[href*="/jobs/"]',
          'a[href*="/job-"]',
          '.job-listing a',
          '.job-title a',
          'h2 a',
          'h3 a'
        ],
        urlFilter: (url: string) => url.includes('/job') && !url.includes('#') && !url.includes('mailto:')
      },
      'mucuruzi': {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://mucuruzi.com'
        },
        selectors: [
          'a[href*="/job"]',
          'a[href*="/vacancy"]',
          '.entry-title a',
          '.post-title a',
          'h2 a',
          'h3 a',
          'article a'
        ],
        urlFilter: (url: string) => (url.includes('/job') || url.includes('/vacancy')) && !url.includes('#')
      },
      'unjobs': {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        selectors: [
          'a[href*="/vacancy"]',
          'a[href*="/job"]',
          '.views-row a',
          '.field-content a',
          'h2 a',
          'h3 a'
        ],
        urlFilter: (url: string) => url.includes('/vacancy') || url.includes('/job')
      },
      'brightermonday': {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        selectors: [
          'a[href*="/job"]',
          'a[href*="/vacancy"]',
          '.job-item a',
          '.job-card a',
          '.job-title a',
          'h2 a',
          'h3 a'
        ],
        urlFilter: (url: string) => url.includes('/job') || url.includes('/vacancy')
      }
    };

    return configs[sourceName] || {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      selectors: [
        'a[href*="/job"]',
        'a[href*="/vacancy"]',
        '.job-item a',
        '.job-listing a',
        '.job-title a',
        'h2 a',
        'h3 a'
      ],
      urlFilter: (url: string) => (url.includes('/job') || url.includes('/vacancy')) && !url.includes('#')
    };
  }

  /**
   * Scrape job URLs from a specific source
   */
  private static async scrapeJobUrlsFromSource(source: typeof JobScrapingService.JOB_SOURCES[0], limit: number): Promise<string[]> {
    const urlsToTry = source.paths.map(path => `${source.baseUrl}${path}`);

    for (const url of urlsToTry) {
      try {
        console.log(`Attempting to fetch job listings from ${source.name}: ${url}`);
        
        // Get website-specific configuration
        const config = this.getWebsiteSpecificConfig(source.name);
        
        const response = await axios.get(url, {
          headers: config.headers,
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
        
        // Log page content analysis
        const totalLinks = $('a').length;
        const totalText = $.text().toLowerCase();
        const jobKeywords = (totalText.match(/job|vacancy|position|career|opportunity|employment/g) || []).length;
        console.log(`📊 Page analysis for ${source.name}: ${totalLinks} total links, ${jobKeywords} job-related keywords`);
        
        const jobUrls: string[] = [];

        // Use website-specific selectors and filters
        const specificConfig = this.getWebsiteSpecificConfig(source.name);
        const selectorsToUse = specificConfig.selectors.length > 0 ? specificConfig.selectors : source.selectors;
        
        for (const selector of selectorsToUse) {
          const matchingElements = $(selector);
          console.log(`🔍 Trying selector '${selector}' on ${source.name}: found ${matchingElements.length} matching elements`);
          
          $(selector).each((index, element) => {
            if (jobUrls.length >= limit) return false;

            const href = $(element).attr('href');
            if (href) {
              const fullUrl = href.startsWith('http') ? href : `${source.baseUrl}${href}`;
              
              // Use website-specific URL filter
              const isValidJobUrl = !jobUrls.includes(fullUrl) && 
                specificConfig.urlFilter(fullUrl) && 
                !fullUrl.includes('search') && 
                !fullUrl.includes('filter') &&
                !fullUrl.includes('mailto:') &&
                !fullUrl.includes('javascript:') &&
                fullUrl.length > source.baseUrl.length + 5; // Must be more than just the base URL
              
              if (isValidJobUrl) {
                jobUrls.push(fullUrl);
                console.log(`✅ Found job URL from ${source.name} with selector '${selector}': ${fullUrl}`);
              } else if (index < 3) {
                // Only log first few rejections to avoid spam
                console.log(`❌ Rejected URL from ${source.name}: ${fullUrl} (filter failed)`);
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
        
        // Filter out invalid URLs (category pages, etc.)
        const validJobUrls = this.filterValidJobUrls(jobUrls);
        console.log(`Valid job URLs after filtering: ${validJobUrls.length}`);
        
        if (validJobUrls.length > 0) {
          return validJobUrls.slice(0, limit);
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

  // Track AI usage to avoid quota exceeded
  private static aiRequestCount = 0;
  private static readonly MAX_AI_REQUESTS_PER_DAY = 40; // Leave some buffer for other AI operations
  private static lastResetDate = new Date().toDateString();

  /**
   * Check if we can make AI requests
   */
  private static canUseAI(): boolean {
    const currentDate = new Date().toDateString();
    
    // Reset counter if it's a new day
    if (currentDate !== this.lastResetDate) {
      this.aiRequestCount = 0;
      this.lastResetDate = currentDate;
    }
    
    return this.aiRequestCount < this.MAX_AI_REQUESTS_PER_DAY;
  }

  /**
   * Increment AI request counter
   */
  private static incrementAIUsage(): void {
    this.aiRequestCount++;
    console.log(`🤖 AI requests used today: ${this.aiRequestCount}/${this.MAX_AI_REQUESTS_PER_DAY}`);
  }

  /**
   * Parse job content without AI (fallback method)
   */
  private static parseJobWithoutAI(html: string, jobUrl: string, sourceName: string): ScrapedJobData {
    const $ = cheerio.load(html);
    
    // Extract basic information using HTML parsing
    const title = $('h1').first().text().trim() || 
                  $('.job-title').first().text().trim() || 
                  $('title').text().trim() || 'Job Opportunity';
    
    const company = $('.company').first().text().trim() || 
                    $('.employer').first().text().trim() || 
                    'Company Not Specified';
    
    const location = $('.location').first().text().trim() || 
                     $('.address').first().text().trim() || 
                     'Location Not Specified';
    
    // Get full text content for description
    let description = $('body').text().trim();
    
    // Clean up description - remove navigation and footer content
    description = description.replace(/\s+/g, ' ').substring(0, 1000) + '...';
    
    return {
      title,
      company,
      location,
      description,
      requirements: 'Please check the original job posting for requirements',
      salary: 'Not specified',
      employmentType: 'Not specified',
      postedDate: new Date().toISOString(),
      sourceUrl: jobUrl,
      sourceName: sourceName,
      extractedWithAI: false
    };
  }

  /**
   * Scrape individual job page and use AI to parse the content (with fallback)
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
      
      // Try to parse with AI first
      let jobData: ScrapedJobData | null = await this.parseJobWithAI(bodyText, jobUrl);
      
      if (jobData) {
        console.log(`✅ AI parsing successful for: ${jobData.title}`);
      } else {
        // Fallback to basic parsing when AI is unavailable or fails
        console.log('🔄 AI unavailable, using basic parsing...');
        jobData = this.parseJobWithoutAI($.html(), jobUrl, sourceName);
      }
      
      // Ensure required fields are present
      if (jobData) {
        jobData = this.ensureRequiredFields(jobData);
        
        // Validate the final job data
        if (!this.validateJobData(jobData)) {
          console.log('❌ Job data failed validation after processing');
          return null;
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
   * Perform aggressive second pass to meet minimum job requirements
   */
  private static async performAggressiveSecondPass(systemUser: any, targetJobs: number): Promise<{
    processedJobs: number;
    errors: string[];
  }> {
    const results = {
      processedJobs: 0,
      errors: [] as string[]
    };

    try {
      // Try priority sources with more paths and higher limits
      const prioritySources = this.JOB_SOURCES.filter(source => 
        ['jobinrwanda', 'mucuruzi', 'unjobs', 'mifotra', 'workingnomads'].includes(source.name)
      );

      for (const source of prioritySources) {
        if (results.processedJobs >= targetJobs) break;

        try {
          console.log(`🔄 Second pass: Aggressive scraping from ${source.name}`);
          
          // Try all paths for this source
          const sourceJobUrls = await this.scrapeJobUrlsFromSource(source, targetJobs * 2); // Higher limit
          console.log(`Second pass: Found ${sourceJobUrls.length} URLs from ${source.name}`);

          for (let i = 0; i < sourceJobUrls.length && results.processedJobs < targetJobs; i++) {
            const jobUrl = sourceJobUrls[i];
            if (!jobUrl) continue;

            try {
              // Check if job already exists (less strict check)
              const jobId = this.extractJobId(jobUrl);
              const existingJob = await Job.findOne({
                $or: [
                  { externalJobSource: source.name, externalJobId: jobId },
                  { externalApplicationUrl: jobUrl }
                ]
              });

              if (existingJob) {
                console.log(`Second pass: Job exists, skipping: ${jobUrl}`);
                continue;
              }

              // Shorter delay for second pass
              await this.delay(1500);

              const jobData = await this.scrapeAndParseJob(jobUrl, source.name);
              if (jobData && systemUser) {
                await this.saveJobToDatabase(jobData, String(systemUser._id), jobUrl, source.name);
                results.processedJobs++;
                console.log(`✅ Second pass: Processed job ${results.processedJobs}/${targetJobs}: ${jobData.title}`);
              }
            } catch (error) {
              const errorMsg = `Second pass error processing ${jobUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error(`❌ ${errorMsg}`);
              results.errors.push(errorMsg);
              await this.delay(500); // Short delay after errors
            }
          }
        } catch (error) {
          const errorMsg = `Second pass error with ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Second pass general error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ Second pass failed:', errorMsg);
      results.errors.push(errorMsg);
    }

    return results;
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

  /**
   * Filter out invalid job URLs (category pages, etc.)
   */
  private static filterValidJobUrls(urls: string[]): string[] {
    const invalidPatterns = [
      '/jobs/featured',
      '/jobs/all',
      '/jobs$',
      '/vacancies$',
      '/job-skills',
      '/categories',
      '/search',
      '/filter'
    ];

    return urls.filter(url => {
      // Must contain specific job identifiers
      const hasJobId = /\/(node|job|vacancy)\/[\w-]+/.test(url) || /\/jobs\/[\w-]+/.test(url);
      
      // Must not match invalid patterns
      const isInvalid = invalidPatterns.some(pattern => new RegExp(pattern).test(url));
      
      return hasJobId && !isInvalid;
    });
  }

  /**
   * Ensure required fields are present with defaults
   */
  private static ensureRequiredFields(jobData: any): ScrapedJobData {
    return {
      title: jobData.title || 'Untitled Position',
      description: jobData.description || 'No description available',
      company: jobData.company || 'Company Name Not Available',
      location: jobData.location || 'Location Not Specified',
      jobType: jobData.jobType || JobType.FULL_TIME,
      category: jobData.category || JobCategory.OTHER,
      experienceLevel: jobData.experienceLevel || ExperienceLevel.ENTRY_LEVEL,
      educationLevel: jobData.educationLevel || EducationLevel.HIGH_SCHOOL,
      salary: jobData.salary,
      skills: Array.isArray(jobData.skills) ? jobData.skills : [],
      requirements: Array.isArray(jobData.requirements) ? jobData.requirements : [],
      responsibilities: Array.isArray(jobData.responsibilities) ? jobData.responsibilities : [],
      benefits: Array.isArray(jobData.benefits) ? jobData.benefits : [],
      applicationDeadline: jobData.applicationDeadline,
      postedDate: jobData.postedDate,
      externalApplicationUrl: jobData.externalApplicationUrl || '',
      externalJobId: jobData.externalJobId || '',
      contactInfo: jobData.contactInfo
    };
  }

  /**
   * Validate job data before saving
   */
  private static validateJobData(jobData: any): boolean {
    const requiredFields = ['title', 'description', 'company', 'location'];
    const hasRequiredFields = requiredFields.every(field => 
      jobData[field] && typeof jobData[field] === 'string' && jobData[field].trim().length > 0
    );

    const validJobType = Object.values(JobType).includes(jobData.jobType);
    const validExperienceLevel = Object.values(ExperienceLevel).includes(jobData.experienceLevel);
    const validEducationLevel = Object.values(EducationLevel).includes(jobData.educationLevel);

    return hasRequiredFields && validJobType && validExperienceLevel && validEducationLevel;
  }

  /**
   * Check if AI can be used (within rate limits)
   */
  private static canUseAI(): boolean {
    this.checkAndResetAICounter();
    return this.aiRequestCount < this.MAX_AI_REQUESTS_PER_DAY;
  }

  /**
   * Check and reset AI counter if new day
   */
  private static checkAndResetAICounter(): void {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.aiRequestCount = 0;
      this.lastResetDate = today;
    }
  }

  /**
   * Parse job with AI (with rate limiting and version management)
   */
  private static async parseJobWithAI(content: string, url: string): Promise<ScrapedJobData | null> {
    if (!this.canUseAI()) {
      console.log('AI rate limit exceeded, skipping AI parsing');
      return null;
    }

    try {
      this.aiRequestCount++;
      console.log(`💡 Using AI to extract job data (quota: ${this.aiRequestCount}/${this.MAX_AI_REQUESTS_PER_DAY})`);
      
      // Get current model info for logging
      const currentModel = aiManager.getCurrentModel();
      console.log(`🤖 Using model: ${currentModel.name} (${currentModel.version})`);
      
      // Create enhanced prompt for job parsing with improved extraction
      const jobParsingPrompt = `
        You are an expert job data extractor with advanced parsing capabilities. Analyze the following job posting content and extract structured information with high accuracy.
        
        **CRITICAL**: Return ONLY a valid JSON object with these exact fields and data types:

        {
          "title": "Job title as stated in the posting",
          "description": "Comprehensive job description including key details and context (max 3500 chars)",
          "company": "Company or organization name",
          "location": "Job location (prefer specific city/country, e.g., 'Kigali, Rwanda')",
          "jobType": "FULL_TIME|PART_TIME|CONTRACT|INTERNSHIP|FREELANCE",
          "category": "TECHNOLOGY|MARKETING_SALES|HUMAN_RESOURCES|FINANCE_ACCOUNTING|HEALTHCARE|EDUCATION|DESIGN_CREATIVE|ENGINEERING|LEGAL|CONSULTING|OTHER",
          "experienceLevel": "ENTRY_LEVEL|MID_LEVEL|SENIOR_LEVEL|EXECUTIVE",
          "educationLevel": "HIGH_SCHOOL|ASSOCIATE|BACHELOR|MASTER|DOCTORATE|PROFESSIONAL",
          "salary": {
            "min": number or null,
            "max": number or null,
            "currency": "RWF|USD|EUR"
          },
          "skills": ["skill1", "skill2", "skill3"],
          "requirements": ["requirement1", "requirement2"],
          "responsibilities": ["responsibility1", "responsibility2"],
          "benefits": ["benefit1", "benefit2"],
          "applicationDeadline": "YYYY-MM-DD" or null,
          "postedDate": "YYYY-MM-DD" or null,
          "externalApplicationUrl": "${url}",
          "externalJobId": "${this.extractJobId(url)}",
          "contactInfo": {
            "email": "contact email if found" or null,
            "phone": "contact phone number if found" or null,
            "website": "company website if found" or null,
            "address": "physical address if found" or null,
            "contactPerson": "contact person name if found" or null,
            "applicationInstructions": "how to apply instructions if found" or null
          }
        }

        **ENHANCED EXTRACTION RULES:**
        1. **Field Validation**: All enum fields MUST use EXACT values listed above
        2. **Content Analysis**: Extract information from headers, bullet points, tables, and formatted text
        3. **Date Parsing**: Handle various date formats (DD/MM/YYYY, MM-DD-YYYY, "Month Day, Year", relative dates)
        4. **Salary Detection**: Look for salary ranges, annual/monthly indicators, currency symbols
        5. **Skills Extraction**: Identify technical skills, soft skills, tools, technologies mentioned
        6. **Location Intelligence**: Prioritize specific locations over generic ones
        7. **Category Classification**: Classify job into the most appropriate category based on title and description
        8. **Quality Assurance**: Ensure extracted content is meaningful and relevant

        **CONTENT TO ANALYZE:**
        SOURCE URL: ${url}
        
        CONTENT:
        ${content.substring(0, 6000)}

        **OUTPUT REQUIREMENTS:**
        - Return ONLY the JSON object, no markdown blocks, no explanatory text
        - Ensure all required string fields have meaningful content (not "N/A" or empty)
        - Arrays should contain relevant items or be empty (not null)
        - Use null for optional fields when information is not available
        - Validate that all enum values match exactly the specified options
      `;

      // Use the centralized AI manager with enhanced capabilities
      const response_text = await aiManager.generateContent(jobParsingPrompt, {
        retries: 3,
        timeout: 45000,
        priority: 'high',
        temperature: 0.3 // Lower temperature for more consistent parsing
      });
      
      if (response_text) {
        const parsedData = this.extractJsonFromResponse(response_text);
        const validatedData = this.validateAndNormalizeJobData(parsedData, url);
        
        if (validatedData) {
          console.log(`✅ AI successfully extracted: ${validatedData.title} at ${validatedData.company}`);
          console.log(`📊 Model performance: ${currentModel.name} processed ${response_text.length} chars`);
          return validatedData;
        } else {
          console.warn('⚠️ AI extracted data but validation failed');
        }
      } else {
        console.warn('⚠️ AI returned empty response');
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ AI parsing failed:', error.message);
      
      // Log model information for debugging
      const currentModel = aiManager.getCurrentModel();
      console.error(`🤖 Failed model: ${currentModel.name} (${currentModel.version})`);
      
      // Check if this is a model-specific error that might be resolved with fallback
      if (error.message.includes('quota') || error.message.includes('429')) {
        console.log('🚫 Quota exceeded, AI manager will handle fallback automatically on next request');
      }
      
      return null;
    }
  }

  /**
   * Clean HTML content for processing
   */
  private static cleanHtmlContent(html: string): string {
    const $ = cheerio.load(html);
    
    // Remove scripts, styles, and other non-content elements
    $('script, style, noscript, .debug, .theme-debug').remove();
    
    // Get text content
    return $('body').text().replace(/\s+/g, ' ').trim();
  }

  /**
   * Normalize job category from string
   */
  private static normalizeJobCategory(categoryString: string): JobCategory {
    const normalizedString = categoryString.toLowerCase().trim();
    
    if (normalizedString.includes('technology') || normalizedString.includes('software') || normalizedString.includes('it')) {
      return JobCategory.TECHNOLOGY;
    } else if (normalizedString.includes('marketing') || normalizedString.includes('sales')) {
      return JobCategory.MARKETING_SALES;
    } else if (normalizedString.includes('human') || normalizedString.includes('hr')) {
      return JobCategory.HUMAN_RESOURCES;
    } else if (normalizedString.includes('finance') || normalizedString.includes('accounting')) {
      return JobCategory.FINANCE_ACCOUNTING;
    } else if (normalizedString.includes('healthcare') || normalizedString.includes('medical')) {
      return JobCategory.HEALTHCARE;
    } else if (normalizedString.includes('education') || normalizedString.includes('teaching')) {
      return JobCategory.EDUCATION;
    } else if (normalizedString.includes('design') || normalizedString.includes('creative')) {
      return JobCategory.DESIGN_CREATIVE;
    } else if (normalizedString.includes('engineering')) {
      return JobCategory.ENGINEERING;
    } else if (normalizedString.includes('legal')) {
      return JobCategory.LEGAL;
    } else if (normalizedString.includes('consulting')) {
      return JobCategory.CONSULTING;
    }
    
    return JobCategory.OTHER;
  }

  /**
   * Test AI integration and model performance using Central AI Manager
   */
  static async testAIIntegration(): Promise<{
    success: boolean;
    currentModel: string;
    modelStats: any;
    systemStatus: any;
    testResults: {
      basicGeneration: boolean;
      jobParsing: boolean;
      fallbackTesting: boolean;
      versionMigration: boolean;
      serviceAvailability: boolean;
    };
    errors: string[];
  }> {
    const results = {
      success: false,
      currentModel: '',
      modelStats: {},
      systemStatus: {},
      testResults: {
        basicGeneration: false,
        jobParsing: false,
        fallbackTesting: false,
        versionMigration: false,
        serviceAvailability: false
      },
      errors: [] as string[]
    };

    try {
      console.log('🧪 Starting comprehensive AI integration test with Central AI Manager...');
      
      // Get model information and system status
      const stats = aiManager.getModelStats();
      const systemStatus = aiManager.getSystemStatus();
      results.currentModel = stats.currentModel.name;
      results.modelStats = stats;
      results.systemStatus = systemStatus;
      
      console.log(`📊 Testing with model: ${stats.currentModel.name} (${stats.currentModel.version})`);
      console.log(`📊 System status: Initialized=${systemStatus.isInitialized}, Requests=${systemStatus.requestCount}/${systemStatus.dailyLimit}`);
      
      // Test 1: Service Availability
      try {
        console.log('🔬 Test 1: Service availability check...');
        const isAvailable = await aiManager.isAvailable();
        results.testResults.serviceAvailability = isAvailable;
        console.log(`✅ Service availability: ${results.testResults.serviceAvailability ? 'PASS' : 'FAIL'}`);
      } catch (error: any) {
        results.errors.push(`Service availability check failed: ${error.message}`);
        console.error('❌ Service availability: FAIL', error.message);
      }

      // Test 2: Basic content generation
      try {
        console.log('🔬 Test 2: Basic content generation...');
        const basicResponse = await aiManager.generateContent('Generate a simple greeting message.', {
          retries: 1,
          timeout: 10000,
          priority: 'low'
        });
        results.testResults.basicGeneration = basicResponse.length > 0;
        console.log(`✅ Basic generation: ${results.testResults.basicGeneration ? 'PASS' : 'FAIL'}`);
      } catch (error: any) {
        results.errors.push(`Basic generation failed: ${error.message}`);
        console.error('❌ Basic generation: FAIL', error.message);
      }

      // Test 3: Job parsing with sample data
      try {
        console.log('🔬 Test 3: Job parsing capabilities...');
        const sampleJobContent = `
          Software Developer - Tech Company Ltd
          Location: Kigali, Rwanda
          We are looking for a skilled software developer to join our team.
          Requirements: Bachelor's degree in Computer Science, 2+ years experience
          Responsibilities: Develop web applications, work with databases
          Salary: 800,000 - 1,200,000 RWF per year
        `;
        
        const jobData = await this.parseJobWithAI(sampleJobContent, 'https://example.com/job/123');
        results.testResults.jobParsing = jobData !== null && jobData.title && jobData.company;
        console.log(`✅ Job parsing: ${results.testResults.jobParsing ? 'PASS' : 'FAIL'}`);
        
        if (jobData) {
          console.log(`📋 Parsed job: "${jobData.title}" at "${jobData.company}"`);
        }
      } catch (error: any) {
        results.errors.push(`Job parsing failed: ${error.message}`);
        console.error('❌ Job parsing: FAIL', error.message);
      }

      // Test 4: Model fallback testing
      try {
        console.log('🔬 Test 4: Model fallback mechanisms...');
        
        // Test if fallback models are available
        const availableModels = stats.availableModels.length;
        results.testResults.fallbackTesting = availableModels > 1;
        
        console.log(`✅ Fallback testing: ${results.testResults.fallbackTesting ? 'PASS' : 'FAIL'} (${availableModels} models available)`);
      } catch (error: any) {
        results.errors.push(`Fallback testing failed: ${error.message}`);
        console.error('❌ Fallback testing: FAIL', error.message);
      }

      // Test 5: Version migration capabilities
      try {
        console.log('🔬 Test 5: Version migration capabilities...');
        
        const canMigrate = await aiManager.checkForNewerVersions();
        results.testResults.versionMigration = true; // The function runs without error
        
        console.log(`✅ Version migration: PASS (Migration ${canMigrate ? 'performed' : 'not needed'})`);
      } catch (error: any) {
        results.errors.push(`Version migration failed: ${error.message}`);
        console.error('❌ Version migration: FAIL', error.message);
      }

      // Calculate overall success
      const passedTests = Object.values(results.testResults).filter(Boolean).length;
      const totalTests = Object.keys(results.testResults).length;
      results.success = passedTests >= 4; // At least 4 out of 5 tests should pass
      
      console.log(`🎯 AI Integration Test Summary: ${passedTests}/${totalTests} tests passed`);
      console.log(`📊 Overall result: ${results.success ? '✅ PASS' : '❌ FAIL'}`);
      
      if (results.errors.length > 0) {
        console.log('⚠️ Errors encountered:');
        results.errors.forEach(error => console.log(`   - ${error}`));
      }

    } catch (error: any) {
      results.errors.push(`Test setup failed: ${error.message}`);
      console.error('❌ AI integration test failed:', error.message);
    }

    return results;
  }

  /**
   * Get AI migration guide for future versions
   */
  static getAIMigrationGuide(): string {
    return `
🚀 AI MODEL MIGRATION GUIDE FOR GEMINI VERSIONS

📋 How to add new AI model versions:

1. UPDATE MODEL_CONFIGS Array:
   - Add new model configuration at the TOP of MODEL_CONFIGS array
   - Use this template:
   {
     name: 'gemini-2.0-pro',           // New model name
     version: '2.0-pro-latest',        // Version identifier  
     maxTokens: 16384,                 // Increased token limit
     temperature: 0.3,                 // Adjusted for better accuracy
     topP: 0.95,                       // Fine-tuned parameters
     topK: 64,                         // Enhanced context
     safetySettings: [...]             // Updated safety configs
   }

2. VERSION DETECTION:
   - System automatically detects newer models (lower array index = newer)
   - Daily checks ensure migration to latest available version
   - Fallback cascade handles unavailable models gracefully

3. TESTING NEW VERSIONS:
   - Run JobScrapingService.testAIIntegration() before deployment
   - Verify job parsing accuracy with sample data
   - Test fallback mechanisms work properly

4. GRADUAL ROLLOUT:
   - Models are tested before migration
   - Automatic reversion on failure
   - Logging tracks migration success/failure

5. PARAMETER OPTIMIZATION:
   - Newer models may need different temperature/topP values
   - Adjust based on observed performance
   - Higher token limits allow more complex prompts

6. SAFETY CONSIDERATIONS:
   - Update safety settings for new model versions
   - Test content filtering effectiveness
   - Ensure compliance with usage policies

🔧 Manual Migration Commands:
- Check current model: aiManager.getModelStats()
- Force migration: aiManager.migrateToModel('gemini-2.0-pro')
- Test availability: aiManager.testModelAvailability()

⚡ Benefits of Version Management System:
- ✅ Automatic detection of newer models
- ✅ Seamless migration with fallback protection  
- ✅ Performance monitoring and optimization
- ✅ Future-proof architecture for AI advances
- ✅ Zero-downtime upgrades

📈 Expected Improvements with Newer Versions:
- Better job data extraction accuracy
- Improved handling of complex job descriptions
- Enhanced multilingual support
- Faster processing times
- Reduced API costs through efficiency gains

🛡️ Failure Protection:
- Multiple fallback models prevent service interruption
- Automatic parameter adjustment for problematic requests
- Retry logic with exponential backoff
- Comprehensive error logging for debugging

Last Updated: ${new Date().toISOString().split('T')[0]}
    `.trim();
  }
}