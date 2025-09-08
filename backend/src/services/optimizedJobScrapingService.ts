import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Job, IJobDocument } from '../models/Job';
import { User } from '../models/User';
import { JobStatus, JobType, ExperienceLevel, EducationLevel, JobCategory } from '../types';
import { aiService } from './aiService';
import { centralAIManager } from './centralAIManager';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

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
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    contactPerson?: string;
    applicationInstructions?: string;
  };
}

export interface JobSourceConfig {
  name: string;
  baseUrl: string;
  paths: string[];
  priority: number;
  selectors: {
    jobLink: string[];
    title: string[];
    company: string[];
    location: string[];
    description: string[];
    requirements: string[];
    responsibilities: string[];
    benefits?: string[];
    salary?: string[];
    deadline?: string[];
    postedDate?: string[];
  };
  pagination?: {
    type: 'query' | 'selector' | 'none';
    pattern?: string;
    nextSelector?: string;
    maxPages?: number;
  };
  headers: Record<string, string>;
  urlFilter: (url: string) => boolean;
  requiresJS?: boolean;
  rateLimit: {
    delayMs: number;
    maxConcurrent: number;
  };
}

export class OptimizedJobScrapingService {
  private static readonly MAX_JOBS_PER_LINK_PER_DAY = 10;
  private static readonly DEFAULT_EMPLOYER_EMAIL = 'info@excellencecoachinghub.com';
  private static lastVersionCheck: string = '';
  
  // Optimized job sources based on website analysis
  private static readonly JOB_SOURCES: JobSourceConfig[] = [
    {
      name: 'unjobnet',
      baseUrl: 'https://www.unjobnet.org',
      paths: ['/jobs', '/organizations'],
      priority: 1,
      selectors: {
        jobLink: [
          'a[href*="/jobs/detail/"]',          // Direct job detail links
          'a[href*="/jobs?organizations"]',     // Organization-filtered job links from organizations page  
          'a[href*="/organizations/"] + a[href*="/jobs/"]', // Jobs linked from organization pages
          'a[href*="/jobs/"][href*="?"]',       // Parameterized job links
          '.job-item a',
          '.job-card a', 
          'h3 a',
          'h4 a',
          '.job-title a',
          '.title a',
          '.organization-jobs a',              // Organization-specific job links
          '.org-vacancies a',                  // Organization vacancy links
          '.org-profile a[href*="/jobs"]',     // Jobs from organization profiles
          '.company-jobs a',                   // Company job listings
          'a[title*="job"][href*="/jobs"]'     // Links with job in title attribute
        ],
        title: ['h1', '.job-title', '.vacancy-title', 'h3', 'h4', '.title', 'title'],
        company: ['.company', '.employer', '.organization', '.agency', '.job-org', '[data-org]'],
        location: ['.location', '.job-location', '.duty-station', '.place', '.job-location-text'],
        description: ['.job-description', '.vacancy-description', '.description', '.content', '.summary', 'main', 'article', 'body'],
        requirements: ['.requirements', '.qualifications', '.eligibility', '.skills'],
        responsibilities: ['.responsibilities', '.duties', '.functions', '.tasks'],
        benefits: ['.benefits', '.compensation', '.package'],
        salary: ['.salary', '.remuneration', '.pay'],
        deadline: ['.deadline', '.closing-date', '.application-deadline', '.expires'],
        postedDate: ['.posted-date', '.published', '.date', '.opening-date']
      },
      pagination: {
        type: 'query',
        pattern: '?page=',
        maxPages: 3
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Connection': 'keep-alive'
      },
      urlFilter: (url: string) => {
        const patterns = [
          /\/jobs\/detail\/\d+$/,           // Direct job detail pages
          /\/jobs\?organizations\[\]=/,      // Organization-filtered job pages
          /\/jobs\?.*organization/,          // Various organization query formats
          /\/jobs$/,                         // General jobs page
          /\/organizations\/\d+$/            // Organization detail pages that might contain jobs
        ];
        const excludes = ['/search', '/filter', '/apply', '/login', '/category', '/page'];
        return patterns.some(p => p.test(url)) && !excludes.some(e => url.includes(e)) && url.length > 25;
      },
      requiresJS: true, // Enable JS rendering for better compatibility  
      rateLimit: { delayMs: 5000, maxConcurrent: 1 }
    },
    {
      name: 'workingnomads',
      baseUrl: 'https://www.workingnomads.com',
      paths: ['/jobs'],
      priority: 2,
      selectors: {
        jobLink: [
          'a[href^="/jobs/"]:not([href="/jobs"])', // Primary selector - works perfectly
          '.jobs-list a[href*="/jobs/"]', // Secondary fallback
          'a.job-link', // Common class name
          '.card a[href*="/jobs/"]', // Card-based layouts
          'article a[href*="/jobs/"]' // Article-based layouts
        ],
        title: ['h1', 'h4', '.job-title', '.title', '.post-title'],
        company: ['.company-name', '.company', '.employer', 'a[href*="/remote-company/"]'],
        location: ['.location', '.job-location', '.remote-tag', '.work-location'],
        description: ['.posting-content', '.job-description', '.description', '.content', '.job-detail', '.job-summary', '.post-content', 'main .content', 'article .content'],
        requirements: ['.requirements', '.qualifications', '.skills', '.skills-required'],
        responsibilities: ['.responsibilities', '.duties', '.job-duties'],
        benefits: ['.benefits', '.perks'],
        salary: ['.salary', '.compensation', '.pay'],
        deadline: ['.deadline', '.closing-date', '.application-deadline'],
        postedDate: ['.posted-date', '.date-posted', '.publish-date', '.job-date', 'time', '.time-ago']
      },
      pagination: {
        type: 'query',
        pattern: '?page=',
        maxPages: 3
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Referer': 'https://www.workingnomads.com/',
        'Connection': 'keep-alive'
      },
      urlFilter: (url: string) => {
        // Temporarily disable filter for debugging
        const jobPattern = /\/jobs\/[a-z0-9-]+/; // less strict
        const excludes = ['/remote', '/category', '/search', '/filter', '/login', '/company'];
        const passes = jobPattern.test(url.toLowerCase()) && !excludes.some(e => url.includes(e));
        
        // Only apply filtering to workingnomads, let others through
        if (!url.includes('workingnomads.com')) {
          return true;
        }
        
        // For WorkingNomads, use a refined filter
        const refined = jobPattern.test(url.toLowerCase()) && 
                       !excludes.some(e => url.includes(e)) &&
                       url.length > 35; // Reasonable minimum length
        
        // Debug logging for WorkingNomads (reduced)
        if (!refined && url.includes('workingnomads.com')) {
          console.log(`🚫 Filtered out: ${url}`);
        }
        
        return refined;
      },
      requiresJS: true, // Enable JS rendering for WorkingNomads
      rateLimit: { delayMs: 4000, maxConcurrent: 1 }
    },
    {
      name: 'jobinrwanda',
      baseUrl: 'https://www.jobinrwanda.com',
      paths: ['/'],
      priority: 3,
      selectors: {
        jobLink: [
          'a[href*="/node/"]',
          '.view-content a',
          '.views-row a',
          'article a',
          'h2 a',
          '.job-title a'
        ],
        title: ['h1', '.page-title', 'h2', '.node-title', '.title'],
        company: ['.field-name-field-employer', '.company', '.employer', '.organization'],
        location: ['.field-name-field-location', '.location', '.job-location'],
        description: ['.field-name-body', '.node-content', '.description', '.content', '.job-description'],
        requirements: ['.field-name-field-requirements', '.requirements', '.qualifications'],
        responsibilities: ['.field-name-field-duties', '.responsibilities', '.duties'],
        benefits: ['.field-name-field-benefits', '.benefits'],
        salary: ['.field-name-field-salary', '.salary'],
        deadline: ['.field-name-field-deadline', '.deadline'],
        postedDate: ['.field-name-field-posted-date', '.posted-date', '.date']
      },
      pagination: {
        type: 'query',
        pattern: '?page=',
        maxPages: 2
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      urlFilter: (url: string) => {
        const patterns = [/\/node\/\d+$/, /\/job\/[a-z0-9-]+/, /\/vacancy\/[a-z0-9-]+/];
        const excludes = ['/category', '/page', '/search', '/filter', '/login', '/user', '/admin'];
        return patterns.some(p => p.test(url)) && !excludes.some(e => url.includes(e)) && url.length > 25;
      },
      requiresJS: false,
      rateLimit: { delayMs: 5000, maxConcurrent: 1 }
    },

    {
      name: 'mucuruzi',
      baseUrl: 'https://mucuruzi.com',
      paths: ['/all-jobs/', '/jobs'],
      priority: 5,
      selectors: {
        jobLink: [
          'a[href*="vacancy-title"]',
          'a[href*="job-title"]',
          '.job-title a',
          'h2 a'
        ],
        title: ['h1', '.job-title', '.post-title', '.entry-title'],
        company: ['.company', '.employer', '.organization'],
        location: ['.location', '.job-location'],
        description: ['.job-description', '.content', '.description', '.post-content'],
        requirements: ['.requirements', '.qualifications'],
        responsibilities: ['.responsibilities', '.duties'],
        benefits: ['.benefits', '.perks'],
        salary: ['.salary', '.compensation'],
        deadline: ['.deadline', '.closing-date'],
        postedDate: ['.posted-date', '.date-posted']
      },
      pagination: {
        type: 'query',
        pattern: '/page/',
        maxPages: 3
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://mucuruzi.com'
      },
      urlFilter: (url: string) => {
        const includes = ['vacancy-title', 'job-title', '/vacancy/', '/job/', '/opportunity/'];
        const excludes = ['tender-notice', 'invitation-to-bid', 'procurement', 'contract-award', '/category/', '/page/', '/search'];
        return includes.some(i => url.toLowerCase().includes(i)) && 
               !excludes.some(e => url.toLowerCase().includes(e)) && 
               url.length > 40;
      },
      requiresJS: false,
      rateLimit: { delayMs: 3000, maxConcurrent: 1 }
    },
    {
      name: 'brightermonday',
      baseUrl: 'https://www.brightermonday.com',
      paths: ['/jobs-in-rwanda'],
      priority: 6,
      selectors: {
        jobLink: [
          'a[href*="/job/"]',
          '.job-item a',
          '.job-title a',
          'h3 a'
        ],
        title: ['h1', '.job-title', 'h3', '.title'],
        company: ['.company', '.employer', '.company-name'],
        location: ['.location', '.job-location'],
        description: ['.job-description', '.description', '.content'],
        requirements: ['.requirements', '.qualifications'],
        responsibilities: ['.responsibilities', '.duties'],
        benefits: ['.benefits'],
        salary: ['.salary'],
        deadline: ['.deadline'],
        postedDate: ['.posted-date', '.date']
      },
      pagination: {
        type: 'query',
        pattern: '?page=',
        maxPages: 2
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      urlFilter: (url: string) => {
        const patterns = [/\/job\/[a-z0-9-]+/, /\/jobs\/[a-z0-9-]+/];
        const excludes = ['/search', '/filter', '/apply', '/login'];
        return patterns.some(p => p.test(url)) && !excludes.some(e => url.includes(e)) && url.length > 25;
      },
      requiresJS: false,
      rateLimit: { delayMs: 4000, maxConcurrent: 1 }
    }
  ];

  /**
   * Check if a job was posted within 72 hours
   */
  private static isJobWithin72Hours(postedDate: Date | undefined): boolean {
    if (!postedDate) {
      // If no posted date, assume it's recent for workingnomads
      return true;
    }
    
    const now = new Date();
    const hoursAgo72 = new Date(now.getTime() - (72 * 60 * 60 * 1000));
    
    return postedDate >= hoursAgo72;
  }

  /**
   * Extract and parse date from various formats
   */
  private static parseJobDate(dateText: string): Date | undefined {
    if (!dateText) return undefined;
    
    const cleanText = dateText.trim().toLowerCase();
    const now = new Date();
    
    // Handle relative dates
    if (cleanText.includes('today') || cleanText.includes('0 day')) {
      return now;
    }
    
    if (cleanText.includes('yesterday') || cleanText.includes('1 day')) {
      return new Date(now.getTime() - (24 * 60 * 60 * 1000));
    }
    
    // Handle "X days ago" or "X day ago"
    const daysMatch = cleanText.match(/(\d+)\s+days?\s+ago/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    }
    
    // Handle "X hours ago" or "X hour ago"
    const hoursMatch = cleanText.match(/(\d+)\s+hours?\s+ago/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      return new Date(now.getTime() - (hours * 60 * 60 * 1000));
    }
    
    // Handle workingnomads specific format patterns
    if (cleanText.includes('featured')) {
      // Remove "featured" and try to parse again
      const withoutFeatured = cleanText.replace('featured', '').trim();
      return this.parseJobDate(withoutFeatured);
    }
    
    // Handle datetime attribute if present (ISO format)
    if (dateText.includes('T') && dateText.includes(':')) {
      try {
        const parsed = new Date(dateText);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    
    // Try to parse standard date formats
    try {
      const parsed = new Date(dateText);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (error) {
      // Ignore parsing errors
    }
    
    return undefined;
  }

  /**
   * Helper function to extract JSON from AI responses
   */
  private static extractJsonFromResponse(text: string): any {
    let jsonText = text.trim();
    
    if (jsonText.startsWith('```json') && jsonText.endsWith('```')) {
      jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith('```') && jsonText.endsWith('```')) {
      jsonText = jsonText.slice(3, -3).trim();
    }
    
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }
    
    try {
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Failed to parse JSON from AI response:', error);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
    }
  }

  /**
   * Check for AI model updates
   */
  private static async checkAIModelUpdates(): Promise<void> {
    const now = new Date().toISOString().split('T')[0];
    
    if (this.lastVersionCheck === now) {
      return;
    }
    
    try {
      console.log('🔍 Checking AI model updates...');
      const stats = aiManager.getModelStats();
      console.log(`📊 Current AI model: ${stats.currentModel.name} - Requests: ${stats.requestCount}/${stats.dailyLimit}`);
      
      if (!stats.isLatest) {
        const migrated = await aiManager.checkForNewerVersions();
        if (migrated) {
          console.log('✅ Successfully upgraded AI model');
        }
      }
      
      this.lastVersionCheck = now;
    } catch (error) {
      console.warn('⚠️ AI model check failed:', error);
    }
  }

  /**
   * Create delay for rate limiting
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean and fix common URL issues
   */
  private static cleanUrl(url: string): string {
    const original = url;
    
    // Fix double slashes in paths (but keep protocol double slashes)
    let cleaned = url.replace(/([^:])\/\/+/g, '$1/');
    
    // Fix specific issues like /jobss/ -> /jobs/
    cleaned = cleaned.replace(/\/jobss\//g, '/jobs/');
    
    // Fix other common duplications
    cleaned = cleaned.replace(/\/organizationss\//g, '/organizations/');
    cleaned = cleaned.replace(/\/vacanciess\//g, '/vacancies/');
    
    // Debug logging for URL changes
    if (original !== cleaned) {
      console.log(`🔧 URL cleaned: ${original} -> ${cleaned}`);
    }
    
    return cleaned;
  }

  /**
   * Extract job ID from URL
   */
  private static extractJobId(url: string): string {
    // Handle unjobnet specific pattern: /jobs/detail/JOBID
    if (url.includes('unjobnet.org') && url.includes('/jobs/detail/')) {
      const detailMatch = url.match(/\/jobs\/detail\/(\d+)/);
      if (detailMatch && detailMatch[1]) {
        return detailMatch[1];
      }
    }
    
    // Handle other common patterns
    const matches = url.match(/\/(?:jobs?|vacancies?|node)\/(\d+)/);
    if (matches && matches[1]) {
      return matches[1];
    }
    
    // Fallback to last segment
    const lastSegment = url.split('/').pop() || 'unknown';
    return lastSegment.split('?')[0] || 'unknown'; // Remove query parameters
  }

  /**
   * Create system user for external jobs
   */
  private static async createSystemUser(): Promise<any> {
    const systemUser = new User({
      firstName: 'Excellence',
      lastName: 'Coaching Hub',
      email: this.DEFAULT_EMPLOYER_EMAIL,
      isEmailVerified: true,
      role: 'employer',
      companyName: 'Excellence Coaching Hub',
      companyDescription: 'Professional coaching and job placement services',
      companyWebsite: 'https://excellencecoachinghub.com',
      location: 'Kigali, Rwanda'
    });

    return await systemUser.save();
  }

  /**
   * Fetch webpage content with proper error handling, retry logic and rate limiting
   */
  private static async fetchWebpage(url: string, config: JobSourceConfig, retryCount: number = 0): Promise<string> {
    const maxRetries = 3;
    
    try {
      // Apply rate limiting with some randomization to appear more human-like
      const baseDelay = config.rateLimit.delayMs;
      const randomDelay = baseDelay + Math.random() * 3000; // Add 0-3 seconds random delay
      await this.delay(randomDelay);

      // Use Puppeteer for JavaScript-rendered content
      if (config.requiresJS) {
        console.log(`🚀 Using Puppeteer for JS-rendered content: ${url}`);
        
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        });
        
        try {
          const page = await browser.newPage();
          
          // Set user agent and viewport
          await page.setUserAgent(config.headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
          await page.setViewport({ width: 1920, height: 1080 });
          
          // Set extra headers
          const headersToSet: Record<string, string> = {};
          Object.keys(config.headers).forEach(key => {
            if (key.toLowerCase() !== 'user-agent') {
              headersToSet[key] = config.headers[key];
            }
          });
          if (Object.keys(headersToSet).length > 0) {
            await page.setExtraHTTPHeaders(headersToSet);
          }
          
          // Navigate and wait for content
          await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
          });
          
          // Wait a bit more for dynamic content to load, longer for unjobs.org
          const waitTime = url.includes('unjobs.org') ? 5000 : 3000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          const html = await page.content();
          await browser.close();
          
          console.log(`✅ Puppeteer successfully loaded ${url}`);
          return html;
          
        } catch (error) {
          await browser.close();
          console.error(`❌ Puppeteer error for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
          
          // If Puppeteer fails, try fallback to axios
          if (retryCount < maxRetries) {
            console.log(`🔄 Falling back to axios for ${url}...`);
            config.requiresJS = false; // Temporarily disable JS for this request
            return this.fetchWebpage(url, config, retryCount + 1);
          }
          
          throw error;
        }
      }

      // Fallback to axios for non-JS content
      const response = await axios.get(url, {
        headers: config.headers,
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500 // Allow 4xx errors but retry on 5xx
      });

      // Handle specific status codes
      if (response.status === 403) {
        if (retryCount < maxRetries) {
          // More aggressive delay for unjobs.org specifically
          const baseDelay = url.includes('unjobs.org') ? 15000 : 8000;
          const exponentialDelay = baseDelay + (retryCount * 5000);
          console.log(`⚠️ Access forbidden for ${url}, retrying with longer delay... (${retryCount + 1}/${maxRetries})`);
          await this.delay(exponentialDelay);
          return this.fetchWebpage(url, config, retryCount + 1);
        }
        throw new Error('Access forbidden after retries');
      }

      if (response.status === 404) {
        throw new Error('Page not found');
      }

      if (response.status === 429) {
        if (retryCount < maxRetries) {
          const waitTime = 15000 + (retryCount * 5000);
          console.log(`⏳ Rate limited for ${url}, waiting ${waitTime/1000} seconds... (${retryCount + 1}/${maxRetries})`);
          await this.delay(waitTime);
          return this.fetchWebpage(url, config, retryCount + 1);
        }
        throw new Error('Rate limited after retries');
      }

      if (!response.data) {
        throw new Error('Empty response received');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          if (retryCount < maxRetries) {
            console.log(`🔄 Connection error for ${url}, retrying... (${retryCount + 1}/${maxRetries})`);
            await this.delay(5000);
            return this.fetchWebpage(url, config, retryCount + 1);
          }
        }
      }
      
      throw new Error(`Failed to fetch ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract job URLs from a source page
   */
  private static async scrapeJobUrlsFromSource(source: JobSourceConfig, limit: number): Promise<string[]> {
    const allJobUrls: string[] = [];
    
    for (const path of source.paths) {
      if (allJobUrls.length >= limit) {
        console.log(`⏹️ Reached URL limit ${limit}, stopping path processing`);
        break;
      }
      
      try {
        console.log(`🔍 Scraping job URLs from ${source.baseUrl}${path} (Path: ${path})`);
        
        // Handle pagination if configured
        let pageNum = 1;
        const maxPages = source.pagination?.maxPages || 1;
        
        while (pageNum <= maxPages && allJobUrls.length < limit) {
          let pageUrl = `${source.baseUrl}${path}`;
          
          if (source.pagination && pageNum > 1) {
            if (source.pagination.type === 'query') {
              pageUrl += `${source.pagination.pattern}${pageNum}`;
            } else if (source.pagination.type === 'selector') {
              // For selector-based pagination, we'd need to navigate differently
              break;
            }
          }
          
          const html = await this.fetchWebpage(pageUrl, source);
          
          // Debug HTML content for workingnomads (minimal)
          if (source.name === 'workingnomads') {
            console.log(`� HTML length: ${html.length}, Contains jobs: ${html.includes('/jobs/')}`);
          }
          if (source.name === 'unjobnet') {
            console.log(`📄 HTML length: ${html.length}, Contains jobs/detail: ${html.includes('/jobs/detail/')}, Contains organizations: ${html.includes('/organizations')}`);
          }
          
          const $ = cheerio.load(html);
          
          const pageJobUrls: string[] = [];
          
          // Collect URLs from ALL selectors, don't break on first success
          let foundUrls: string[] = [];
          let selectorResults: { [selector: string]: number } = {};
          
          for (const selector of source.selectors.jobLink) {
            let selectorUrlCount = 0;
            
            $(selector).each((_, element) => {
              const $el = $(element);
              const href = $el.attr('href');
              
              if (href) {
                let fullUrl = href;
                if (href.startsWith('http')) {
                  // Already a full URL
                  fullUrl = href;
                } else if (href.startsWith('/')) {
                  // Relative URL starting with /
                  fullUrl = source.baseUrl + href;
                } else {
                  // Relative URL not starting with /
                  fullUrl = source.baseUrl + '/' + href;
                }
                
                // Fix common URL issues
                fullUrl = this.cleanUrl(fullUrl);
                
                if (!foundUrls.includes(fullUrl)) {
                  foundUrls.push(fullUrl);
                  selectorUrlCount++;
                  
                  if (source.urlFilter(fullUrl) && !pageJobUrls.includes(fullUrl)) {
                    pageJobUrls.push(fullUrl);
                  }
                }
              }
            });
            
            selectorResults[selector] = selectorUrlCount;
          }
          
          // Debug selector performance for workingnomads and unjobnet
          if (source.name === 'workingnomads' || source.name === 'unjobnet') {
            console.log(`🔍 Selector Results for ${source.name} on path ${path}:`);
            Object.entries(selectorResults).forEach(([selector, count]) => {
              if (count > 0) {
                console.log(`   ✅ ${selector}: ${count} URLs`);
              } else {
                console.log(`   ❌ ${selector}: ${count} URLs`);
              }
            });
          }
          
          // Debug logging for workingnomads and unjobnet
          if (source.name === 'workingnomads' || source.name === 'unjobnet') {
            console.log(`🔍 Found ${foundUrls.length} total URLs on page ${pageNum} of ${path}`);
            if (foundUrls.length > 0) {
              console.log(`📋 Sample URLs found:`, foundUrls.slice(0, 3));
            }
            console.log(`✅ Filtered to ${pageJobUrls.length} valid job URLs`);
            if (pageJobUrls.length > 0) {
              console.log(`📋 Sample valid URLs:`, pageJobUrls.slice(0, 2));
            }
          }
          
          if (pageJobUrls.length === 0) {
            console.log(`No job URLs found on page ${pageNum} of ${path}`);
            break; // No more jobs on this path
          }
          
          allJobUrls.push(...pageJobUrls.slice(0, limit - allJobUrls.length));
          console.log(`Found ${pageJobUrls.length} job URLs on page ${pageNum}`);
          
          pageNum++;
          
          // Add delay between pages
          if (pageNum <= maxPages) {
            await this.delay(source.rateLimit.delayMs / 2);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error scraping ${source.baseUrl}${path}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // Remove duplicates and limit results
    const uniqueUrls = [...new Set(allJobUrls)].slice(0, limit);
    console.log(`📋 Total unique job URLs found from ${source.name}: ${uniqueUrls.length}`);
    
    // Debug: Show sample URLs being returned
    if (uniqueUrls.length > 0 && source.name === 'unjobnet') {
      console.log(`🔍 Sample URLs being returned:`, uniqueUrls.slice(0, 3));
    }
    
    return uniqueUrls;
  }

  /**
   * Extract text content from elements using multiple selectors
   */
  private static extractTextContent($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        // Try to get datetime attribute first (for time elements)
        const datetime = element.attr('datetime');
        if (datetime) return datetime;
        
        // Try to get title attribute
        const title = element.attr('title');
        if (title && title.trim()) return title.trim();
        
        // Get text content and clean it up
        let text = element.text().trim();
        
        // Clean up common unwanted content
        text = text.replace(/Toggle navigation\s*/gi, '');
        text = text.replace(/\s+/g, ' '); // Normalize whitespace
        text = text.replace(/^[\s\n\t]+|[\s\n\t]+$/g, ''); // Trim whitespace and newlines
        
        // Skip if text is too short or just navigation elements
        if (text && text.length > 10 && !text.match(/^(navigation|menu|toggle|login|sign up)$/i)) {
          return text;
        }
      }
    }
    return '';
  }

  /**
   * Extract array content (for skills, requirements, etc.)
   */
  private static extractArrayContent($: cheerio.CheerioAPI, selectors: string[]): string[] {
    const items: string[] = [];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length) {
        elements.each((_, el) => {
          const text = $(el).text().trim();
          if (text) {
            // Split by common delimiters and add to items
            const splitItems = text.split(/[,;•\n]/).map(item => item.trim()).filter(item => item);
            items.push(...splitItems);
          }
        });
        
        if (items.length > 0) break; // Found content with this selector
      }
    }
    
    return [...new Set(items)]; // Remove duplicates
  }

  /**
   * Scrape and parse individual job page
   */
  private static async scrapeAndParseJob(jobUrl: string, sourceName: string): Promise<ScrapedJobData | null> {
    try {
      const source = this.JOB_SOURCES.find(s => s.name === sourceName);
      if (!source) {
        throw new Error(`Source configuration not found for ${sourceName}`);
      }

      console.log(`🔍 Scraping job details from: ${jobUrl}`);
      
      const html = await this.fetchWebpage(jobUrl, source);
      const $ = cheerio.load(html);
      
      // Extract basic job information
      let title = this.extractTextContent($, source.selectors.title);
      let company = this.extractTextContent($, source.selectors.company);
      let location = this.extractTextContent($, source.selectors.location);
      let description = this.extractTextContent($, source.selectors.description);
      
      // Special handling for unjobnet.org
      if (sourceName === 'unjobnet') {
        // Extract title from page title if not found
        if (!title || title.length < 10) {
          title = $('title').text().trim();
          console.log(`📝 Extracted title from page title: ${title}`);
        }
        
        // Extract company from title (common pattern: "ORGANIZATION JobTitle...")
        if (!company && title) {
          const orgMatch = title.match(/^([A-Z]{2,10})\s/); // Look for uppercase org abbreviations
          if (orgMatch && orgMatch[1]) {
            company = orgMatch[1];
            console.log(`📝 Extracted company from title: ${company}`);
          }
        }
        
        // Try to extract location from content if not found in standard selectors
        if (!location) {
          const bodyText = $('body').text();
          const locationMatch = bodyText.match(/([A-Z][a-z]+ \([A-Z][a-z]+\))/); // e.g., "Vienna (Austria)"
          if (locationMatch && locationMatch[1]) {
            location = locationMatch[1];
            console.log(`📝 Extracted location from content: ${location}`);
          }
        }
      }
      
      // Fallback: if description is poor, try to extract from main content areas
      if (!description || description.length < 100 || description.includes('Toggle navigation')) {
        console.log('🔄 Using fallback description extraction...');
        const fallbackSelectors = ['main', 'article', '.main-content', '.post', '.job-posting', '.content-wrapper'];
        description = this.extractTextContent($, fallbackSelectors);
        
        // Clean up fallback description more aggressively
        if (description) {
          description = description.replace(/Toggle navigation.*?(?=\n|\r|$)/gi, '');
          description = description.replace(/Navigation.*?(?=\n|\r|$)/gi, '');
          description = description.trim();
        }
      }
      
      // Extract posted date
      const postedDateText = source.selectors.postedDate ? this.extractTextContent($, source.selectors.postedDate) : '';
      const postedDate = this.parseJobDate(postedDateText);
      
      if (!title || !description) {
        console.log(`❌ Missing essential data (title: ${!!title}, description: ${!!description})`);
        return null;
      }

      // Extract additional details
      const requirements = this.extractArrayContent($, source.selectors.requirements);
      const responsibilities = this.extractArrayContent($, source.selectors.responsibilities);
      const benefits = source.selectors.benefits ? this.extractArrayContent($, source.selectors.benefits) : [];
      
      // Debug extracted data
      console.log(`📋 Extracted data - Requirements: ${requirements.length}, Responsibilities: ${responsibilities.length}, Benefits: ${benefits.length}`);
      
      console.log(`📅 Posted date found: "${postedDateText}" -> ${postedDate?.toDateString() || 'not parsed'}`);
      
      // Use AI to enhance and standardize the job data
      const enhancedJobData = await this.enhanceJobDataWithAI({
        title,
        company: company || 'Not specified',
        location: location || 'Remote/Not specified',
        description,
        requirements,
        responsibilities,
        benefits,
        sourceUrl: jobUrl,
        postedDate: postedDate
      });

      if (!enhancedJobData) {
        console.log(`❌ AI processing failed for job: ${title}`);
        return null;
      }

      return {
        ...enhancedJobData,
        postedDate: postedDate || enhancedJobData.postedDate, // Prefer extracted date
        externalApplicationUrl: jobUrl,
        externalJobId: this.extractJobId(jobUrl)
      };

    } catch (error) {
      console.error(`❌ Error scraping job ${jobUrl}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Enhance job data using AI
   */
  private static async enhanceJobDataWithAI(rawJobData: any): Promise<ScrapedJobData | null> {
    try {
      // Debug: Log the raw job data structure
      console.log('🔍 Raw job data for AI processing:', {
        title: rawJobData.title,
        company: rawJobData.company,
        location: rawJobData.location,
        description: rawJobData.description ? `${rawJobData.description.substring(0, 100)}...` : 'No description',
        requirements: Array.isArray(rawJobData.requirements) ? `Array[${rawJobData.requirements.length}]` : typeof rawJobData.requirements,
        responsibilities: Array.isArray(rawJobData.responsibilities) ? `Array[${rawJobData.responsibilities.length}]` : typeof rawJobData.responsibilities,
        benefits: Array.isArray(rawJobData.benefits) ? `Array[${rawJobData.benefits.length}]` : typeof rawJobData.benefits
      });
      
      const prompt = `
        Analyze this job posting and extract structured information. Return ONLY a valid JSON object.

        Raw job data:
        Title: ${rawJobData.title}
        Company: ${rawJobData.company}
        Location: ${rawJobData.location}
        Description: ${rawJobData.description}
        Requirements: ${Array.isArray(rawJobData.requirements) ? rawJobData.requirements.join(', ') : rawJobData.requirements || 'Not specified'}
        Responsibilities: ${Array.isArray(rawJobData.responsibilities) ? rawJobData.responsibilities.join(', ') : rawJobData.responsibilities || 'Not specified'}
        Benefits: ${Array.isArray(rawJobData.benefits) ? rawJobData.benefits.join(', ') : rawJobData.benefits || 'Not specified'}

        Extract and return this exact JSON structure:
        {
          "title": "cleaned job title",
          "description": "comprehensive job description",
          "company": "company name",
          "location": "job location",
          "jobType": "full_time|part_time|contract|freelance|internship",
          "category": "jobs",
          "experienceLevel": "entry_level|mid_level|senior_level|executive",
          "educationLevel": "high_school|associate|bachelor|master|doctorate|professional",
          "skills": ["skill1", "skill2", "skill3"],
          "requirements": ["requirement1", "requirement2"],
          "responsibilities": ["responsibility1", "responsibility2"],
          "benefits": ["benefit1", "benefit2"],
          "salary": null,
          "applicationDeadline": null,
          "postedDate": null,
          "contactInfo": null
        }

        Rules:
        - Keep original job title but clean it up
        - For jobType: Use exact values - "full_time", "part_time", "contract", "freelance", or "internship" (default: "full_time")
        - For category: Always use "jobs"
        - For experienceLevel: Use exact values - "entry_level", "mid_level", "senior_level", or "executive" (default: "mid_level")
        - For educationLevel: Use exact values - "high_school", "associate", "bachelor", "master", "doctorate", or "professional" (default: "bachelor")
        - Extract 3-8 relevant skills
        - Include 3-6 key requirements
        - Include 3-6 main responsibilities
        - Include benefits if mentioned
        - Return null for unknown fields
      `;

      const aiResponse = await aiManager.generateContent(prompt);
      
      if (!aiResponse || typeof aiResponse !== 'string' || aiResponse.trim().length === 0) {
        console.error('❌ AI response failed:', { type: typeof aiResponse, length: aiResponse?.length || 0 });
        throw new Error('AI processing failed');
      }

      console.log('🤖 AI Response received:', aiResponse.substring(0, 200) + '...');
      const jobData = this.extractJsonFromResponse(aiResponse);
      
      // Validate required fields
      if (!jobData.title || !jobData.description || !jobData.company) {
        throw new Error('Missing required fields in AI response');
      }

      return jobData;

    } catch (error) {
      console.error('❌ AI enhancement failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Save job to database
   */
  private static async saveJobToDatabase(
    jobData: ScrapedJobData, 
    employerId: string, 
    sourceUrl: string, 
    sourceName: string
  ): Promise<void> {
    try {
      const job = new Job({
        title: jobData.title,
        description: jobData.description,
        company: jobData.company,
        location: jobData.location,
        jobType: jobData.jobType,
        category: jobData.category,
        experienceLevel: jobData.experienceLevel,
        educationLevel: jobData.educationLevel,
        skills: jobData.skills,
        requirements: jobData.requirements,
        responsibilities: jobData.responsibilities,
        benefits: jobData.benefits,
        salary: jobData.salary,
        applicationDeadline: jobData.applicationDeadline,
        postedDate: jobData.postedDate,
        status: JobStatus.ACTIVE,
        employer: employerId,
        isExternalJob: true,
        externalJobSource: sourceName,
        externalJobId: jobData.externalJobId,
        externalApplicationUrl: jobData.externalApplicationUrl,
        contactInfo: jobData.contactInfo,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await job.save();
      console.log(`💾 Saved job to database: ${jobData.title} at ${jobData.company}`);

    } catch (error) {
      console.error('❌ Error saving job to database:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Main scraping function
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
      console.log('🚀 Starting optimized job scraping process...');
      
      // Check for AI model updates
      await this.checkAIModelUpdates();

      // Check today's job count per source
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log(`🎯 Target: ${this.MAX_JOBS_PER_LINK_PER_DAY} jobs per source per day`);

      // Get system user
      let systemUser = await User.findOne({ email: this.DEFAULT_EMPLOYER_EMAIL });
      if (!systemUser) {
        systemUser = await this.createSystemUser();
      }

      // Process each source in priority order
      const sortedSources = this.JOB_SOURCES.sort((a, b) => a.priority - b.priority);
      
      for (const source of sortedSources) {
        // Check how many jobs were already scraped today for this source
        const sourceJobsToday = await Job.countDocuments({
          isExternalJob: true,
          externalJobSource: source.name,
          createdAt: { $gte: today, $lt: tomorrow }
        });
        
        if (sourceJobsToday >= this.MAX_JOBS_PER_LINK_PER_DAY) {
          console.log(`✅ Source ${source.name} already reached daily limit of ${this.MAX_JOBS_PER_LINK_PER_DAY} jobs`);
          continue;
        }
        
        const remainingJobsForSource = this.MAX_JOBS_PER_LINK_PER_DAY - sourceJobsToday;
        
        // For unjobnet, allow processing more URLs to cover both /jobs and /organizations paths
        const scrapeLimit = source.name === 'unjobnet' ? Math.max(remainingJobsForSource, 15) : remainingJobsForSource;
        
        try {
          console.log(`\n🔍 Processing ${source.name} (Priority ${source.priority}) - Target: ${remainingJobsForSource} jobs remaining`);
          
          const jobUrls = await this.scrapeJobUrlsFromSource(source, scrapeLimit);
          
          if (jobUrls.length === 0) {
            console.log(`⚠️ No job URLs found for ${source.name}`);
            continue;
          }

          // Debug: Show URLs received from scraping
          if (source.name === 'unjobnet' && jobUrls.length > 0) {
            console.log(`🔍 URLs received from scraping:`, jobUrls.slice(0, 3));
          }

          // Process each job URL up to the remaining limit for this source
          let processedJobsForSource = 0;
          for (let i = 0; i < jobUrls.length && processedJobsForSource < remainingJobsForSource; i++) {
            const jobUrl = jobUrls[i];
            
            if (!jobUrl) {
              console.log(`⚠️ Skipping undefined URL at index ${i}`);
              continue;
            }
            
            // Debug: Show each URL being processed
            if (source.name === 'unjobnet') {
              console.log(`🔍 Processing URL ${i + 1}: ${jobUrl}`);
            }
            
            try {
              // Check if job already exists
              const jobId = this.extractJobId(jobUrl);
              
              // Debug: Show extracted job ID for unjobnet
              if (source.name === 'unjobnet') {
                console.log(`🔍 Extracted JobID: "${jobId}" from URL: ${jobUrl}`);
              }
              
              const existingJob = await Job.findOne({
                externalJobSource: source.name,
                externalJobId: jobId
              });

              if (existingJob) {
                // Debug: Show both the current URL and the existing job's URL
                if (source.name === 'unjobnet') {
                  console.log(`⏭️ Job already exists - Current URL: ${jobUrl}, Existing URL: ${existingJob.externalApplicationUrl}, JobID: ${jobId}`);
                } else {
                  console.log(`⏭️ Job already exists, skipping: ${jobUrl}`);
                }
                continue;
              }

              console.log(`📄 Processing job ${i + 1}/${jobUrls.length}: ${jobUrl}`);
              
              const jobData = await this.scrapeAndParseJob(jobUrl, source.name);
              
              if (jobData && systemUser) {
                // For workingnomads, check if job is within 72 hours
                if (source.name === 'workingnomads') {
                  const isRecent = this.isJobWithin72Hours(jobData.postedDate);
                  if (!isRecent) {
                    console.log(`⏰ Job older than 72 hours, skipping: ${jobData.title}`);
                    continue;
                  }
                  console.log(`🕒 Job within 72 hours: ${jobData.title} (posted: ${jobData.postedDate?.toDateString() || 'unknown'})`);
                }
                
                await this.saveJobToDatabase(jobData, String(systemUser._id), jobUrl, source.name);
                results.processedJobs++;
                processedJobsForSource++;
                console.log(`✅ Successfully processed: ${jobData.title} at ${jobData.company}`);
                
                // Success delay
                await this.delay(1000);
              } else {
                console.log(`❌ Failed to process job: ${jobUrl}`);
              }

            } catch (error) {
              const errorMsg = `Error processing ${jobUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error(`❌ ${errorMsg}`);
              results.errors.push(errorMsg);
              
              // Error delay
              await this.delay(2000);
            }
          }

        } catch (error) {
          const errorMsg = `Error with source ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }

      console.log(`\n🎉 Job scraping completed! Processed ${results.processedJobs} jobs total`);
      
      // Log jobs per source summary
      for (const source of sortedSources) {
        const sourceJobs = await Job.countDocuments({
          isExternalJob: true,
          externalJobSource: source.name,
          createdAt: { $gte: today, $lt: tomorrow }
        });
        console.log(`📊 ${source.name}: ${sourceJobs}/${this.MAX_JOBS_PER_LINK_PER_DAY} jobs today`);
      }

    } catch (error) {
      console.error('❌ Critical error in job scraping:', error instanceof Error ? error.message : 'Unknown error');
      results.success = false;
      results.errors.push(error instanceof Error ? error.message : 'Unknown critical error');
    }

    return results;
  }

  /**
   * Get scraping statistics
   */
  static async getScrapingStats(): Promise<{
    todayJobs: number;
    totalExternalJobs: number;
    sourceBreakdown: Record<string, number>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayJobs = await Job.countDocuments({
      isExternalJob: true,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const totalExternalJobs = await Job.countDocuments({
      isExternalJob: true
    });

    const sourceBreakdown: Record<string, number> = {};
    
    for (const source of this.JOB_SOURCES) {
      const count = await Job.countDocuments({
        isExternalJob: true,
        externalJobSource: source.name
      });
      sourceBreakdown[source.name] = count;
    }

    return {
      todayJobs,
      totalExternalJobs,
      sourceBreakdown
    };
  }
}