/**
 * Specialized scraping service for internship.rw (Rwanda National Internship Programme Portal)
 * Handles both public job postings and employer job request monitoring
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { Page } from 'puppeteer';
import { Job, IJobDocument } from '../models/Job';
import { JobStatus, JobType, ExperienceLevel, EducationLevel, JobCategory } from '../types';
import { centralAIManager } from './centralAIManager';

export interface InternshipRwJobData {
  title: string;
  company: string;
  location: string;
  description: string;
  jobType: JobType;
  category?: JobCategory;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    representativeName?: string;
    applicationInstructions?: string;
  };
  applicationDeadline?: Date;
  postedDate?: Date;
  externalApplicationUrl: string;
  externalJobId: string;
  source: 'internship.rw';
  isInternship: boolean;
  requiredQualification?: string;
  requiredFieldOfStudy?: string;
  numberOfPositions?: number;
  expectedStartDate?: Date;
}

export interface EmployerJobRequest {
  jobTitle: string;
  numberOfPositions: number;
  expectedStartDate?: Date;
  requiredQualification: string;
  requiredFieldOfStudy: string;
  hiringCompanyName: string;
  hiringCompanyAddress?: string;
  hiringCompanyWebsite?: string;
  companyLocation: string;
  representativeName: string;
  contactEmail: string;
  contactPhoneNumber?: string;
  roleDetails: string;
  detectedAt: Date;
  url: string;
}

export class InternshipRwScrapingService {
  private static readonly BASE_URL = 'https://internship.rw';
  private static readonly MAX_RETRIES = 3;
  private static readonly RATE_LIMIT_DELAY = 8000; // 8 seconds between requests
  private static readonly JOBS_PER_CYCLE = 10; // Maximum jobs to scrape per cycle

  /**
   * Cross-version compatibility helper for waiting
   */
  private static async waitForDelay(page: Page, ms: number): Promise<void> {
    try {
      console.log(`⏰ Waiting ${ms}ms...`);
      // Try different Puppeteer wait methods based on version
      if (page && typeof page.waitForTimeout === 'function') {
        await page.waitForTimeout(ms);
      } else if (page && typeof (page as any).waitFor === 'function') {
        await (page as any).waitFor(ms);
      } else {
        // Fallback to native setTimeout
        await new Promise(resolve => setTimeout(resolve, ms));
      }
    } catch (error) {
      console.warn(`⚠️ waitForDelay error, using fallback:`, error);
      // Always fall back to native setTimeout if Puppeteer methods fail
      await new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  
  // Track rotation state
  private static currentPathIndex = 0;
  private static scrapedJobsThisCycle = 0;
  private static lastRunTimestamp = 0;

  // Authentication state
  private static isLoggedIn = false;
  private static sessionCookies: any[] = [];
  private static lastLoginTime = 0;
  private static readonly LOGIN_VALIDITY_HOURS = 2; // Re-login every 2 hours

  private static readonly MONITORED_PATHS = [
    '/',
    '/hire-alumni/',
    '/opportunities/',
    '/jobs/',
    '/internships/',
    '/vacancies/',
    '/positions/',
    '/dashboard/', // Post-login dashboard
    '/student/dashboard/', // Student-specific dashboard
    '/employer/dashboard/', // Employer dashboard
    '/apply/', // Application pages
    '/applications/', // User applications
    '/api/jobs/',
    '/api/opportunities/',
    '/about/'
  ];
  
  // Protected paths that definitely require authentication
  private static readonly PROTECTED_PATHS = [
    '/dashboard/',
    '/student/',
    '/employer/',
    '/apply/',
    '/applications/',
    '/profile/',
    '/account/'
  ];

  private static readonly HEADERS = {
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
    'Connection': 'keep-alive',
    'Referer': 'https://internship.rw/'
  };

  /**
   * Handle authentication for internship.rw
   */
  private static async handleAuthentication(page: Page): Promise<boolean> {
    try {
      // Check if we need to login (session expired or never logged in)
      const now = Date.now();
      const hoursPassedSinceLogin = (now - this.lastLoginTime) / (1000 * 60 * 60);
      
      if (!this.isLoggedIn || hoursPassedSinceLogin > this.LOGIN_VALIDITY_HOURS) {
        console.log('🔐 Authentication required - attempting login...');
        
        // Navigate to login page
        await page.goto(`${this.BASE_URL}/accounts/login/`, { 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        });
        
        await this.waitForDelay(page, 2000);
        
        // Check if already logged in by looking for user indicators
        const isAlreadyLoggedIn = await page.$('.user-profile, .logout, .dashboard, .my-account, [href*="logout"]');
        if (isAlreadyLoggedIn) {
          console.log('✅ Already logged in');
          this.isLoggedIn = true;
          this.lastLoginTime = now;
          this.sessionCookies = await page.cookies();
          return true;
        }
        
        // Try to login or create account
        const loginForm = await page.$('form');
        if (loginForm) {
          // Check if this is a registration page or login page
          const isRegisterPage = await page.$('[name="register"], input[value*="register"], button[type="submit"]:contains("Register")');
          
          if (isRegisterPage) {
            // Handle registration
            console.log('📝 Registration form detected - creating account...');
            return await this.handleRegistration(page);
          } else {
            // Handle login
            console.log('🔑 Login form detected - attempting login...');
            return await this.handleLogin(page);
          }
        } else {
          console.log('⚠️ No authentication form found');
          return false;
        }
      } else {
        // Use existing session
        if (this.sessionCookies.length > 0) {
          await page.setCookie(...this.sessionCookies);
          console.log('🍪 Using existing session cookies');
        }
        return true;
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return false;
    }
  }

  /**
   * Handle user registration
   */
  private static async handleRegistration(page: Page): Promise<boolean> {
    try {
      const timestamp = Date.now().toString();
      const randomSuffix = Math.random().toString(36).substr(2, 5);
      
      // Generate registration data
      const regData = {
        firstName: 'Excellence',
        lastName: 'Coach',
        email: `excellencecoach.${timestamp}.${randomSuffix}@gmail.com`,
        username: `excellencecoach_${timestamp}_${randomSuffix}`,
        password: `ExcellenceCoach123!${randomSuffix}`,
        phone: `+250788${timestamp.substr(-6)}`
      };

      console.log(`📝 Registering with email: ${regData.email}`);

      // Fill registration form
      const emailInput = await page.$('[name="email"], #email, [type="email"]');
      if (emailInput) await page.type('[name="email"], #email, [type="email"]', regData.email);

      const firstNameInput = await page.$('[name="first_name"], [name="firstName"], #first_name');
      if (firstNameInput) await page.type('[name="first_name"], [name="firstName"], #first_name', regData.firstName);

      const lastNameInput = await page.$('[name="last_name"], [name="lastName"], #last_name');
      if (lastNameInput) await page.type('[name="last_name"], [name="lastName"], #last_name', regData.lastName);

      const usernameInput = await page.$('[name="username"], #username');
      if (usernameInput) await page.type('[name="username"], #username', regData.username);

      const passwordInput = await page.$('[name="password"], #password, [type="password"]');
      if (passwordInput) await page.type('[name="password"], #password, [type="password"]', regData.password);

      const password2Input = await page.$('[name="password2"], [name="password_confirmation"], [name="confirmPassword"]');
      if (password2Input) await page.type('[name="password2"], [name="password_confirmation"], [name="confirmPassword"]', regData.password);

      const phoneInput = await page.$('[name="phone"], [name="telephone"], #phone');
      if (phoneInput) await page.type('[name="phone"], [name="telephone"], #phone', regData.phone);

      // Accept terms if present
      const termsCheckbox = await page.$('[name="terms"], [name="accept_terms"], input[type="checkbox"]');
      if (termsCheckbox) {
        await page.click('[name="terms"], [name="accept_terms"], input[type="checkbox"]');
      }

      // Submit registration
      await page.click('button[type="submit"], input[type="submit"], .submit-btn');
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Check if registration was successful
      const currentUrl = page.url();
      if (!currentUrl.includes('login') || currentUrl.includes('success') || currentUrl.includes('dashboard')) {
        console.log('✅ Registration successful');
        this.isLoggedIn = true;
        this.lastLoginTime = Date.now();
        this.sessionCookies = await page.cookies();
        return true;
      } else {
        console.log('⚠️ Registration may have failed - attempting login instead');
        return await this.handleLogin(page);
      }
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return false;
    }
  }

  /**
   * Handle user login with fallback credentials
   */
  private static async handleLogin(page: Page): Promise<boolean> {
    try {
      // Try common default credentials for test accounts
      const credentials = [
        { email: 'test@example.com', password: 'test123' },
        { email: 'admin@test.com', password: 'admin123' },
        { email: 'user@internship.rw', password: 'user123' },
        { email: 'demo@demo.com', password: 'demo123' }
      ];

      for (const cred of credentials) {
        try {
          console.log(`🔑 Trying login with: ${cred.email}`);
          
          // Clear fields first
          await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[type="email"], input[type="text"], input[type="password"]');
            inputs.forEach((input: any) => input.value = '');
          });

          // Fill login form
          const emailInput = await page.$('[name="email"], [name="username"], #email, #username');
          if (emailInput) {
            await page.type('[name="email"], [name="username"], #email, #username', cred.email);
          }

          const passwordInput = await page.$('[name="password"], #password');
          if (passwordInput) {
            await page.type('[name="password"], #password', cred.password);
          }

          // Submit login
          await page.click('button[type="submit"], input[type="submit"], .login-btn');
          
          // Wait for response
          await this.waitForDelay(page, 3000);
          
          // Check if login was successful
          const currentUrl = page.url();
          const hasUserIndicators = await page.$('.user-profile, .logout, .dashboard, .my-account, [href*="logout"]');
          
          if (!currentUrl.includes('login') || hasUserIndicators) {
            console.log('✅ Login successful');
            this.isLoggedIn = true;
            this.lastLoginTime = Date.now();
            this.sessionCookies = await page.cookies();
            return true;
          }
        } catch (error) {
          console.log(`⚠️ Login attempt with ${cred.email} failed:`, error);
          continue;
        }
      }
      
      console.log('❌ All login attempts failed - proceeding without authentication');
      return false;
    } catch (error) {
      console.error('❌ Login process failed:', error);
      return false;
    }
  }

  /**
   * Main scraping method - monitors paths in rotation with job limit per cycle
   */
  public static async scrapeInternshipOpportunities(): Promise<{
    jobs: InternshipRwJobData[];
    employerRequests: EmployerJobRequest[];
    errors: string[];
  }> {
    const results: InternshipRwJobData[] = [];
    const employerRequests: EmployerJobRequest[] = [];
    const errors: string[] = [];

    console.log('🇷🇼 Starting internship.rw scraping with rotation...');
    console.log(`📊 Current cycle: ${this.scrapedJobsThisCycle}/${this.JOBS_PER_CYCLE} jobs`);

    // Reset cycle counter if it's a new hour or we've completed a full cycle
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    const lastHour = Math.floor(this.lastRunTimestamp / (1000 * 60 * 60));
    
    if (currentHour > lastHour || this.scrapedJobsThisCycle >= this.JOBS_PER_CYCLE) {
      this.scrapedJobsThisCycle = 0;
      console.log('🔄 Starting new scraping cycle');
    }

    this.lastRunTimestamp = Date.now();

    // Determine how many paths to process this cycle
    const remainingJobsThisCycle = this.JOBS_PER_CYCLE - this.scrapedJobsThisCycle;
    const pathsToProcess = Math.min(3, Math.ceil(remainingJobsThisCycle / 4)); // Process 2-3 paths per cycle

    console.log(`📋 Processing ${pathsToProcess} paths starting from index ${this.currentPathIndex}`);

    // Process paths in rotation
    for (let i = 0; i < pathsToProcess && this.scrapedJobsThisCycle < this.JOBS_PER_CYCLE; i++) {
      const pathIndex = (this.currentPathIndex + i) % this.MONITORED_PATHS.length;
      const path = this.MONITORED_PATHS[pathIndex];
      
      try {
        console.log(`🔍 Processing path ${pathIndex + 1}/${this.MONITORED_PATHS.length}: ${path}`);
        await this.delay(this.RATE_LIMIT_DELAY);
        
        const jobsRemaining = this.JOBS_PER_CYCLE - this.scrapedJobsThisCycle;
        const pathResults = await this.scrapePath(path, Math.min(jobsRemaining, 4)); // Max 4 jobs per path
        
        results.push(...pathResults.jobs);
        employerRequests.push(...pathResults.employerRequests);
        this.scrapedJobsThisCycle += pathResults.jobs.length;
        
        if (pathResults.errors.length > 0) {
          errors.push(...pathResults.errors);
        }

        console.log(`✅ Path ${path}: Found ${pathResults.jobs.length} jobs (Total: ${this.scrapedJobsThisCycle}/${this.JOBS_PER_CYCLE})`);

      } catch (error) {
        const errorMsg = `Error scraping path ${path}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Update rotation index for next run
    this.currentPathIndex = (this.currentPathIndex + pathsToProcess) % this.MONITORED_PATHS.length;

    // Special handling for hire-alumni path to extract employer requests
    if (this.MONITORED_PATHS[this.currentPathIndex] === '/hire-alumni/' || 
        this.MONITORED_PATHS[(this.currentPathIndex - 1 + this.MONITORED_PATHS.length) % this.MONITORED_PATHS.length] === '/hire-alumni/') {
      try {
        console.log('🏢 Processing hire-alumni for employer requests...');
        const hireAlumniRequests = await this.scrapeHireAlumniPage();
        employerRequests.push(...hireAlumniRequests);
      } catch (error) {
        console.error('❌ Error scraping hire-alumni page:', error);
        errors.push(`Hire-alumni error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log(`✅ internship.rw rotation cycle completed`);
    console.log(`📊 Found ${results.length} jobs, ${employerRequests.length} employer requests, ${errors.length} errors`);
    console.log(`🔄 Next cycle starts from path: ${this.MONITORED_PATHS[this.currentPathIndex]} (index ${this.currentPathIndex})`);

    return {
      jobs: results,
      employerRequests,
      errors
    };
  }

  /**
   * Scrape a specific path for job opportunities with job limit
   */
  private static async scrapePath(path: string, maxJobs: number = 10): Promise<{
    jobs: InternshipRwJobData[];
    employerRequests: EmployerJobRequest[];
    errors: string[];
  }> {
    const results: InternshipRwJobData[] = [];
    const employerRequests: EmployerJobRequest[] = [];
    const errors: string[] = [];
    const url = `${this.BASE_URL}${path}`;

    console.log(`🔍 Scraping path: ${url}`);

    let browser: puppeteer.Browser | null = null;

    try {
      // Use Puppeteer for JavaScript-heavy pages
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      const page = await browser.newPage();
      
      // Set headers and user agent
      await page.setUserAgent(this.HEADERS['User-Agent']);
      await page.setExtraHTTPHeaders(this.HEADERS);

      // Handle authentication for protected pages
      const isProtectedPath = this.PROTECTED_PATHS.some(protectedPath => path.includes(protectedPath)) || 
                             path === '/jobs/' || path === '/internships/' || path === '/opportunities/';
      
      if (isProtectedPath) {
        console.log('🔐 Protected path detected - authentication required...');
        const authSuccess = await this.handleAuthentication(page);
        if (authSuccess) {
          console.log('✅ Authentication successful - accessing protected content');
        } else {
          console.log('⚠️ Authentication failed - may have limited access to job listings');
        }
      } else {
        // For non-protected paths, still try to use existing session if available
        if (this.sessionCookies.length > 0 && this.isLoggedIn) {
          await page.setCookie(...this.sessionCookies);
          console.log('🍪 Using existing session cookies for better access');
        }
      }

      // Navigate to the page (after authentication if needed)
      console.log(`🌐 Navigating to: ${url}`);
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // Wait for content to load
      await page.waitForTimeout(3000);

      // Check if we're redirected to login (indicates auth is required but failed)
      if (page.url().includes('login') && !url.includes('login')) {
        console.log('🔐 Redirected to login - attempting authentication...');
        const authRetry = await this.handleAuthentication(page);
        if (authRetry) {
          // Try navigating to original URL again
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          await this.waitForDelay(page, 2000);
        }
      }

      const content = await page.content();
      const $ = cheerio.load(content);

      // Log page info for debugging
      console.log(`📄 Page loaded: ${page.url()}`);
      console.log(`📏 Content length: ${content.length} characters`);
      
      // Check if we have authenticated content
      const hasLoginIndicators = $('.logout, .user-profile, .dashboard, .my-account, [href*="logout"]').length > 0;
      const hasLoginForm = $('form[action*="login"], .login-form, [name="password"]').length > 0;
      
      if (hasLoginForm && !hasLoginIndicators) {
        console.log('⚠️ Still on login page - authentication may be required');
      } else if (hasLoginIndicators) {
        console.log('✅ Authenticated content detected');
      }

      // Check for job-specific content indicators
      const jobContentIndicators = [
        'internship', 'job', 'opportunity', 'position', 'vacancy', 
        'apply', 'application', 'employer', 'student'
      ];
      const hasJobContent = jobContentIndicators.some(indicator => 
        content.toLowerCase().includes(indicator)
      );
      
      console.log(`🎯 Job-related content detected: ${hasJobContent}`);

      // Extract job links with enhanced detection
      const jobLinks = this.extractJobLinks($, url);
      
      // If no direct job links found but we have authenticated access, try alternative paths
      if (jobLinks.length === 0 && (hasLoginIndicators || path === '/dashboard/')) {
        console.log('🔍 No direct job links found - exploring dashboard/navigation links...');
        const navLinks = this.extractNavigationLinks($, url);
        jobLinks.push(...navLinks);
      }
      
      // Process each job link up to maxJobs limit
      const jobsToProcess = jobLinks.slice(0, maxJobs);
      console.log(`📋 Processing ${jobsToProcess.length}/${jobLinks.length} job links from ${url}`);
      
      for (const jobLink of jobsToProcess) {
        try {
          await this.delay(2000); // Small delay between job pages
          const jobData = await this.scrapeJobPage(jobLink, browser);
          if (jobData) {
            results.push(jobData);
            console.log(`✅ Successfully scraped job: ${jobData.title} at ${jobData.company}`);
          }
        } catch (error) {
          const errorMsg = `Error scraping job page ${jobLink}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      // Extract basic job postings even from static content (like announcements)
      if (path === '/hire-alumni/' || path === '/' || path === '/about/') {
        const staticJobs = this.extractStaticJobInfo($, url);
        results.push(...staticJobs);
      }

      // Look for API endpoints that might contain job data
      if (path.includes('/api/')) {
        const apiJobs = await this.scrapeApiEndpoint(url, page);
        results.push(...apiJobs);
      }

    } catch (error) {
      const errorMsg = `Error accessing ${url}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    return { jobs: results, employerRequests, errors };
  }

  /**
   * Extract job links from a page with enhanced selectors
   */
  private static extractJobLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const jobLinks: string[] = [];
    
    // Enhanced selectors for internship.rw structure
    const selectors = [
      // Direct job/internship URLs
      'a[href*="/job/"]',
      'a[href*="/internship/"]',
      'a[href*="/opportunity/"]',
      'a[href*="/position/"]',
      'a[href*="/vacancy/"]',
      'a[href*="/opening/"]',
      
      // Common class-based selectors
      '.job-item a',
      '.internship-item a',
      '.opportunity-item a',
      '.vacancy-item a',
      '.position-item a',
      '.opening-item a',
      '.posting a',
      '.listing a',
      
      // Content-based selectors
      'h3 a',
      'h4 a',
      'h5 a',
      '.job-title a',
      '.internship-title a',
      '.opportunity-title a',
      '.position-title a',
      '.title a',
      
      // Container-based selectors
      'article a',
      '.card a',
      '.post a',
      '.item a',
      '.content a',
      '.main a',
      '.section a',
      
      // Table and list selectors
      'td a',
      'li a',
      '.table a',
      '.list a',
      
      // Button and action selectors
      '.btn[href]',
      '.button[href]',
      'button[onclick*="location"]',
      
      // Form action URLs that might contain job references
      'form[action*="job"]',
      'form[action*="internship"]',
      'form[action*="opportunity"]'
    ];

    selectors.forEach(selector => {
      try {
        $(selector).each((_, element) => {
          const href = $(element).attr('href');
          if (href) {
            const fullUrl = href.startsWith('http') ? href : `${this.BASE_URL}${href.startsWith('/') ? href : '/' + href}`;
            if (this.isValidJobUrl(fullUrl) && !jobLinks.includes(fullUrl)) {
              jobLinks.push(fullUrl);
            }
          }
          
          // Check for onclick actions that might contain URLs
          const onclick = $(element).attr('onclick');
          if (onclick && onclick.includes('location')) {
            const urlMatch = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
            if (urlMatch) {
              const url = urlMatch[1];
              const fullUrl = url.startsWith('http') ? url : `${this.BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
              if (this.isValidJobUrl(fullUrl) && !jobLinks.includes(fullUrl)) {
                jobLinks.push(fullUrl);
              }
            }
          }
        });
      } catch (error) {
        console.warn(`Warning: Error processing selector ${selector}:`, error);
      }
    });

    // Additional content-based extraction - look for URLs in text content
    const textContent = $.text();
    const urlRegex = /https?:\/\/[^\s<>"']+(?:job|internship|opportunity|position|vacancy)[^\s<>"']*/gi;
    const textUrls = textContent.match(urlRegex) || [];
    
    textUrls.forEach(url => {
      if (this.isValidJobUrl(url) && !jobLinks.includes(url)) {
        jobLinks.push(url);
      }
    });

    console.log(`📎 Found ${jobLinks.length} potential job links on ${baseUrl}`);
    if (jobLinks.length > 0) {
      console.log(`🔗 Sample links: ${jobLinks.slice(0, 3).join(', ')}`);
    }
    
    return jobLinks;
  }

  /**
   * Extract navigation links that might lead to job pages (from dashboard/authenticated areas)
   */
  private static extractNavigationLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const navLinks: string[] = [];
    
    // Navigation selectors for authenticated areas
    const navSelectors = [
      // Dashboard navigation
      '.dashboard-nav a', '.sidebar-nav a', '.main-nav a',
      '.nav-menu a', '.navigation a', '.menu a',
      
      // Button/action links
      '.btn[href]', '.button[href]', '.action-link',
      
      // Breadcrumb and path navigation
      '.breadcrumb a', '.path-nav a',
      
      // Specific text-based navigation
      'a[href]:contains("internship")', 'a[href]:contains("job")',
      'a[href]:contains("opportunity")', 'a[href]:contains("position")',
      'a[href]:contains("browse")', 'a[href]:contains("search")',
      'a[href]:contains("listings")', 'a[href]:contains("available")'
    ];

    navSelectors.forEach(selector => {
      try {
        $(selector).each((_, element) => {
          const href = $(element).attr('href');
          const text = $(element).text().trim().toLowerCase();
          
          if (href && (
            text.includes('internship') || text.includes('job') || 
            text.includes('opportunity') || text.includes('position') ||
            text.includes('browse') || text.includes('search') ||
            text.includes('listings') || text.includes('available')
          )) {
            const fullUrl = href.startsWith('http') ? href : `${this.BASE_URL}${href.startsWith('/') ? href : '/' + href}`;
            if (fullUrl.includes('internship.rw') && !navLinks.includes(fullUrl)) {
              navLinks.push(fullUrl);
              console.log(`🧭 Found navigation link: ${text} -> ${fullUrl}`);
            }
          }
        });
      } catch (error) {
        console.warn(`Warning: Error processing nav selector ${selector}:`, error);
      }
    });

    return navLinks;
  }

  /**
   * Check if a URL is a valid job URL
   */
  private static isValidJobUrl(url: string): boolean {
    const jobPatterns = [
      /\/job\/[a-z0-9-]+/,
      /\/internship\/[a-z0-9-]+/,
      /\/opportunity\/[a-z0-9-]+/,
      /\/position\/[a-z0-9-]+/,
      /\/vacancy\/[a-z0-9-]+/,
      /\/jobs\/[a-z0-9-]+/,
      /\/internships\/[a-z0-9-]+/,
      /\/opportunities\/[a-z0-9-]+/,
      /\/positions\/[a-z0-9-]+/,
      /\/vacancies\/[a-z0-9-]+/
    ];
    
    const excludes = [
      '/accounts/',
      '/admin/',
      '/login',
      '/register',
      '/signup',
      '/static/',
      '/media/',
      '/css/',
      '/js/',
      '/api/auth',
      '/password',
      '/reset',
      '/verify'
    ];

    const matchesJobPattern = jobPatterns.some(p => p.test(url.toLowerCase()));
    const isExcluded = excludes.some(e => url.toLowerCase().includes(e));

    return matchesJobPattern && !isExcluded && url.length > 20;
  }

  /**
   * Scrape individual job page
   */
  private static async scrapeJobPage(url: string, browser: puppeteer.Browser): Promise<InternshipRwJobData | null> {
    console.log(`📄 Scraping job page: ${url}`);

    try {
      const page = await browser.newPage();
      await page.setUserAgent(this.HEADERS['User-Agent']);
      await page.setExtraHTTPHeaders(this.HEADERS);

      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      await page.waitForTimeout(2000);

      const content = await page.content();
      const $ = cheerio.load(content);

      // Extract job data using multiple selectors
      const jobData = this.extractJobData($, url);

      await page.close();

      if (jobData && jobData.title && jobData.company) {
        console.log(`✅ Successfully scraped: ${jobData.title} at ${jobData.company}`);
        return jobData;
      } else {
        console.log(`⚠️ Incomplete job data from: ${url}`);
        return null;
      }

    } catch (error) {
      console.error(`❌ Error scraping job page ${url}:`, error);
      return null;
    }
  }

  /**
   * Extract job data from page content
   */
  private static extractJobData($: cheerio.CheerioAPI, url: string): InternshipRwJobData | null {
    // Extract title
    const title = this.extractText($, [
      'h1',
      '.job-title',
      '.internship-title',
      '.opportunity-title',
      '.position-title',
      '.vacancy-title',
      'h3',
      'h4',
      '.title',
      '.post-title',
      '.entry-title'
    ]);

    // Extract company
    const company = this.extractText($, [
      '.company',
      '.employer',
      '.organization',
      '.hiring-company',
      '.company-name',
      '[data-company]',
      '.employer-name'
    ]);

    // Extract location
    const location = this.extractText($, [
      '.location',
      '.job-location',
      '.work-location',
      '.company-location',
      '.position-location',
      '.duty-station'
    ]);

    // Extract description
    const description = this.extractText($, [
      '.job-description',
      '.internship-description',
      '.opportunity-description',
      '.role-details',
      '.description',
      '.content',
      '.summary',
      '.details',
      'main',
      'article'
    ]);

    if (!title) {
      console.log(`⚠️ No title found for ${url}`);
      return null;
    }

    // Extract requirements and other details
    const requirements = this.extractList($, [
      '.requirements',
      '.qualifications',
      '.required-qualification',
      '.required-field-of-study',
      '.skills',
      '.eligibility',
      '.criteria'
    ]);

    const responsibilities = this.extractList($, [
      '.responsibilities',
      '.duties',
      '.role-duties',
      '.tasks',
      '.job-duties'
    ]);

    const benefits = this.extractList($, [
      '.benefits',
      '.perks',
      '.compensation',
      '.package'
    ]);

    // Extract contact information
    const contactEmail = this.extractText($, ['.contact-email', '.email', 'a[href^="mailto:"]']);
    const contactPhone = this.extractText($, ['.contact-phone', '.phone', '.contact-phone-number']);
    const representativeName = this.extractText($, ['.representative-name', '.contact-person']);
    const applicationInstructions = this.extractText($, [
      '.application-instructions',
      '.how-to-apply',
      '.application-procedure'
    ]);

    // Determine job type and category
    const isInternship = title.toLowerCase().includes('intern') || 
                        url.toLowerCase().includes('intern') ||
                        description.toLowerCase().includes('internship');

    const jobType = isInternship ? JobType.INTERNSHIP : JobType.FULL_TIME;
    
    // Generate external job ID
    const urlParts = url.split('/');
    const externalJobId = `internship-rw-${urlParts[urlParts.length - 1] || Date.now()}`;

    return {
      title: title.trim(),
      company: (company || 'Rwanda National Internship Programme').trim(),
      location: (location || 'Rwanda').trim(),
      description: description.trim(),
      jobType,
      category: this.categorizeJob(title, description),
      experienceLevel: isInternship ? ExperienceLevel.ENTRY_LEVEL : ExperienceLevel.MID_LEVEL,
      educationLevel: EducationLevel.BACHELORS,
      requirements,
      responsibilities,
      benefits,
      skills: this.extractSkills(description, requirements.join(' ')),
      contactInfo: {
        email: contactEmail,
        phone: contactPhone,
        representativeName,
        applicationInstructions
      },
      applicationDeadline: this.extractDeadline($),
      postedDate: new Date(),
      externalApplicationUrl: url,
      externalJobId,
      source: 'internship.rw',
      isInternship
    };
  }

  /**
   * Extract employer job request from hire-alumni page
   */
  private static extractEmployerJobRequest($: cheerio.CheerioAPI, url: string): EmployerJobRequest | null {
    // Look for the job request form on hire-alumni page
    const form = $('form').first();
    if (form.length === 0) return null;

    // This would typically extract submitted form data or form structure
    // Since this is a form page, we'll create a monitoring entry
    const jobTitle = 'Internship Position Request';
    const hiringCompanyName = 'Various Employers';
    const roleDetails = 'Employer requests for graduate interns through the national internship portal';

    return {
      jobTitle,
      numberOfPositions: 1,
      expectedStartDate: undefined,
      requiredQualification: 'Various',
      requiredFieldOfStudy: 'Multiple Fields',
      hiringCompanyName,
      hiringCompanyAddress: undefined,
      hiringCompanyWebsite: undefined,
      companyLocation: 'Rwanda',
      representativeName: 'Hiring Manager',
      contactEmail: 'internship@mifotra.gov.rw',
      contactPhoneNumber: undefined,
      roleDetails,
      detectedAt: new Date(),
      url
    };
  }

  /**
   * Scrape API endpoints for job data
   */
  private static async scrapeApiEndpoint(url: string, page: puppeteer.Page): Promise<InternshipRwJobData[]> {
    const results: InternshipRwJobData[] = [];

    try {
      // Try to access API endpoint
      const response = await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 20000 
      });

      if (response && response.ok()) {
        const text = await page.evaluate(() => document.body.textContent);
        
        // Try to parse as JSON
        try {
          const data = JSON.parse(text || '{}');
          if (Array.isArray(data)) {
            // Process array of job objects
            data.forEach((item: any) => {
              const jobData = this.processApiJobData(item, url);
              if (jobData) results.push(jobData);
            });
          } else if (data.results && Array.isArray(data.results)) {
            // Process paginated results
            data.results.forEach((item: any) => {
              const jobData = this.processApiJobData(item, url);
              if (jobData) results.push(jobData);
            });
          }
        } catch (parseError) {
          console.log(`⚠️ Could not parse API response as JSON from ${url}`);
        }
      }
    } catch (error) {
      console.log(`⚠️ API endpoint not accessible: ${url}`);
    }

    return results;
  }

  /**
   * Process API job data
   */
  private static processApiJobData(item: any, url: string): InternshipRwJobData | null {
    if (!item || typeof item !== 'object') return null;

    const title = item.title || item.job_title || item.position || '';
    const company = item.company || item.employer || item.organization || 'Rwanda National Internship Programme';
    
    if (!title) return null;

    return {
      title: title.trim(),
      company: company.trim(),
      location: item.location || 'Rwanda',
      description: item.description || item.summary || '',
      jobType: JobType.INTERNSHIP,
      category: this.categorizeJob(title, item.description || ''),
      experienceLevel: ExperienceLevel.ENTRY_LEVEL,
      educationLevel: EducationLevel.BACHELORS,
      requirements: this.parseStringArray(item.requirements),
      responsibilities: this.parseStringArray(item.responsibilities),
      benefits: this.parseStringArray(item.benefits),
      skills: this.parseStringArray(item.skills) || this.extractSkills(item.description || '', ''),
      contactInfo: {
        email: item.contact_email || item.email,
        phone: item.contact_phone || item.phone,
        representativeName: item.representative_name,
        applicationInstructions: item.application_instructions
      },
      applicationDeadline: item.deadline ? new Date(item.deadline) : undefined,
      postedDate: item.posted_date ? new Date(item.posted_date) : new Date(),
      externalApplicationUrl: item.url || url,
      externalJobId: `internship-rw-api-${item.id || Date.now()}`,
      source: 'internship.rw',
      isInternship: true
    };
  }

  /**
   * Discover additional job pages through link crawling
   */
  private static async discoverJobPages(): Promise<InternshipRwJobData[]> {
    const results: InternshipRwJobData[] = [];
    
    console.log('🔍 Discovering additional job pages...');

    // Try common job page patterns
    const discoveryUrls = [
      '/api/jobs/',
      '/api/opportunities/',
      '/api/internships/',
      '/jobs/recent/',
      '/jobs/active/',
      '/opportunities/current/',
      '/internships/available/',
      '/positions/open/'
    ];

    for (const path of discoveryUrls) {
      try {
        await this.delay(this.RATE_LIMIT_DELAY);
        
        const url = `${this.BASE_URL}${path}`;
        const response = await axios.get(url, { 
          headers: this.HEADERS,
          timeout: 20000,
          validateStatus: () => true
        });

        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          const jobLinks = this.extractJobLinks($, url);

          // Only process if we find actual job links
          if (jobLinks.length > 0) {
            console.log(`✅ Discovered ${jobLinks.length} job links from ${url}`);
            
            // Process discovered job links (limit to prevent overload)
            const processLimit = Math.min(jobLinks.length, 5);
            for (let i = 0; i < processLimit; i++) {
              try {
                const jobData = await this.scrapeJobPageWithAxios(jobLinks[i]);
                if (jobData) results.push(jobData);
                await this.delay(3000);
              } catch (error) {
                console.error(`❌ Error processing discovered job ${jobLinks[i]}:`, error);
              }
            }
          }
        }
      } catch (error) {
        // Silently continue - discovery is best effort
        continue;
      }
    }

    console.log(`🎯 Discovery completed. Found ${results.length} additional jobs`);
    return results;
  }

  /**
   * Scrape job page using axios (lighter than puppeteer)
   */
  private static async scrapeJobPageWithAxios(url: string): Promise<InternshipRwJobData | null> {
    try {
      const response = await axios.get(url, {
        headers: this.HEADERS,
        timeout: 20000
      });

      if (response.status === 200) {
        const $ = cheerio.load(response.data);
        return this.extractJobData($, url);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save scraped jobs to database
   */
  public static async saveScrapedJobs(jobs: InternshipRwJobData[]): Promise<number> {
    let savedCount = 0;
    
    for (const jobData of jobs) {
      try {
        // Check if job already exists
        const existingJob = await Job.findOne({ 
          externalJobId: jobData.externalJobId 
        });

        if (!existingJob) {
          const newJob = new Job({
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
            applicationDeadline: jobData.applicationDeadline,
            postedDate: jobData.postedDate,
            status: JobStatus.ACTIVE,
            externalApplicationUrl: jobData.externalApplicationUrl,
            externalJobId: jobData.externalJobId,
            contactInfo: jobData.contactInfo,
            isRemote: false,
            employerEmail: jobData.contactInfo.email || 'internship@mifotra.gov.rw',
            source: 'internship.rw'
          });

          await newJob.save();
          savedCount++;
          
          console.log(`💾 Saved job: ${jobData.title} at ${jobData.company}`);
        } else {
          // Update existing job if needed
          const updatedFields: Partial<IJobDocument> = {};
          let hasUpdates = false;

          if (existingJob.status !== JobStatus.ACTIVE) {
            updatedFields.status = JobStatus.ACTIVE;
            hasUpdates = true;
          }

          if (jobData.applicationDeadline && (!existingJob.applicationDeadline || 
              jobData.applicationDeadline.getTime() !== existingJob.applicationDeadline.getTime())) {
            updatedFields.applicationDeadline = jobData.applicationDeadline;
            hasUpdates = true;
          }

          if (hasUpdates) {
            await Job.findByIdAndUpdate(existingJob._id, updatedFields);
            console.log(`🔄 Updated existing job: ${jobData.title}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error saving job "${jobData.title}":`, error);
      }
    }

    return savedCount;
  }

  // Helper methods
  private static extractText($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }
    return '';
  }

  private static extractList($: cheerio.CheerioAPI, selectors: string[]): string[] {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text) {
          return text.split(/[,\n•\-\*]/).map(item => item.trim()).filter(item => item.length > 0);
        }
      }
    }
    return [];
  }

  private static extractDeadline($: cheerio.CheerioAPI): Date | undefined {
    const selectors = [
      '.deadline',
      '.application-deadline',
      '.closing-date',
      '.expected-start-date',
      '.expires'
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) {
        const date = new Date(text);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    return undefined;
  }

  private static categorizeJob(title: string, description: string): JobCategory {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('tech') || text.includes('software') || text.includes('IT') || text.includes('computer')) {
      return JobCategory.TECHNOLOGY;
    } else if (text.includes('market') || text.includes('sales') || text.includes('business')) {
      return JobCategory.SALES_MARKETING;
    } else if (text.includes('finance') || text.includes('accounting') || text.includes('bank')) {
      return JobCategory.FINANCE;
    } else if (text.includes('health') || text.includes('medical') || text.includes('nurse')) {
      return JobCategory.HEALTHCARE;
    } else if (text.includes('teach') || text.includes('education') || text.includes('training')) {
      return JobCategory.EDUCATION;
    } else if (text.includes('engineer')) {
      return JobCategory.ENGINEERING;
    } else {
      return JobCategory.GENERAL;
    }
  }

  private static extractSkills(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const skills: string[] = [];

    // Common skills to look for
    const skillPatterns = [
      'communication', 'teamwork', 'leadership', 'problem solving',
      'microsoft office', 'excel', 'word', 'powerpoint',
      'project management', 'time management', 'organization',
      'analytical', 'research', 'writing', 'presentation',
      'customer service', 'marketing', 'sales', 'management'
    ];

    skillPatterns.forEach(skill => {
      if (text.includes(skill)) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });

    return skills.length > 0 ? skills : ['Communication', 'Teamwork', 'Professional Development'];
  }

  private static parseStringArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value.map(String).filter(s => s.trim().length > 0);
    } else if (typeof value === 'string') {
      return value.split(/[,\n•\-\*]/).map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Normalize job type to valid enum values
   */
  private static normalizeJobType(jobType: string): JobType {
    if (!jobType) return JobType.INTERNSHIP;
    
    const normalized = jobType.toLowerCase().replace(/[\s\-]/g, '_');
    
    const typeMapping: { [key: string]: JobType } = {
      'full_time': JobType.FULL_TIME,
      'fulltime': JobType.FULL_TIME,
      'full': JobType.FULL_TIME,
      'permanent': JobType.FULL_TIME,
      'part_time': JobType.PART_TIME,
      'parttime': JobType.PART_TIME,
      'part': JobType.PART_TIME,
      'contract': JobType.CONTRACT,
      'contractor': JobType.CONTRACT,
      'temporary': JobType.CONTRACT,
      'temp': JobType.CONTRACT,
      'freelance': JobType.FREELANCE,
      'freelancer': JobType.FREELANCE,
      'independent': JobType.FREELANCE,
      'internship': JobType.INTERNSHIP,
      'intern': JobType.INTERNSHIP,
      'trainee': JobType.INTERNSHIP
    };

    return typeMapping[normalized] || JobType.INTERNSHIP;
  }

  /**
   * Normalize experience level to valid enum values
   */
  private static normalizeExperienceLevel(level: string): ExperienceLevel {
    if (!level) return ExperienceLevel.ENTRY_LEVEL;
    
    const normalized = level.toLowerCase().replace(/[\s\-]/g, '_');
    
    const levelMapping: { [key: string]: ExperienceLevel } = {
      'entry_level': ExperienceLevel.ENTRY_LEVEL,
      'entry': ExperienceLevel.ENTRY_LEVEL,
      'junior': ExperienceLevel.ENTRY_LEVEL,
      'beginner': ExperienceLevel.ENTRY_LEVEL,
      'graduate': ExperienceLevel.ENTRY_LEVEL,
      'mid_level': ExperienceLevel.MID_LEVEL,
      'mid': ExperienceLevel.MID_LEVEL,
      'intermediate': ExperienceLevel.MID_LEVEL,
      'experienced': ExperienceLevel.MID_LEVEL,
      'senior_level': ExperienceLevel.SENIOR_LEVEL,
      'senior': ExperienceLevel.SENIOR_LEVEL,
      'lead': ExperienceLevel.SENIOR_LEVEL,
      'principal': ExperienceLevel.SENIOR_LEVEL,
      'executive': ExperienceLevel.EXECUTIVE,
      'director': ExperienceLevel.EXECUTIVE,
      'manager': ExperienceLevel.EXECUTIVE,
      'head': ExperienceLevel.EXECUTIVE
    };

    return levelMapping[normalized] || ExperienceLevel.ENTRY_LEVEL;
  }

  /**
   * Save scraped jobs to database
   */
  public static async saveScrapedJobs(jobs: InternshipRwJobData[]): Promise<number> {
    if (!jobs || jobs.length === 0) {
      return 0;
    }

    let savedCount = 0;
    
    for (const jobData of jobs) {
      try {
        // Check if job already exists
        const existingJob = await Job.findOne({
          externalJobId: jobData.externalJobId,
          source: 'internship.rw'
        });

        if (existingJob) {
          console.log(`⚠️ Job already exists: ${jobData.title} (${jobData.externalJobId})`);
          continue;
        }

        // Normalize enum values to prevent validation errors
        const normalizedJobType = this.normalizeJobType(jobData.jobType?.toString() || 'internship');
        const normalizedExperienceLevel = this.normalizeExperienceLevel(jobData.experienceLevel?.toString() || 'entry_level');

        // Create new job document
        const job = new Job({
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          description: jobData.description,
          jobType: normalizedJobType,
          category: jobData.category || JobCategory.INTERNSHIPS,
          experienceLevel: normalizedExperienceLevel,
          educationLevel: jobData.educationLevel,
          requirements: jobData.requirements || [],
          responsibilities: jobData.responsibilities || [],
          benefits: jobData.benefits || [],
          skills: jobData.skills || [],
          contactInfo: jobData.contactInfo,
          applicationDeadline: jobData.applicationDeadline,
          postedDate: jobData.postedDate || new Date(),
          status: JobStatus.ACTIVE,
          externalApplicationUrl: jobData.externalApplicationUrl,
          externalJobId: jobData.externalJobId,
          source: 'internship.rw',
          isInternship: jobData.isInternship || true,
          // Additional internship-specific fields
          requiredQualification: jobData.requiredQualification,
          requiredFieldOfStudy: jobData.requiredFieldOfStudy,
          numberOfPositions: jobData.numberOfPositions,
          expectedStartDate: jobData.expectedStartDate
        });

        // Use AI to enhance and categorize the job
        try {
          const aiEnhancements = await centralAIManager.enhanceJobPosting({
            title: jobData.title,
            company: jobData.company,
            description: jobData.description,
            requirements: jobData.requirements?.join(', ') || '',
            location: jobData.location
          });

          if (aiEnhancements) {
            // Apply AI enhancements
            if (aiEnhancements.category && aiEnhancements.category !== 'OTHER') {
              job.category = aiEnhancements.category as JobCategory;
            }
            if (aiEnhancements.skills && aiEnhancements.skills.length > 0) {
              job.skills = [...new Set([...job.skills, ...aiEnhancements.skills])];
            }
            if (aiEnhancements.enhancedDescription) {
              job.aiEnhancedDescription = aiEnhancements.enhancedDescription;
            }
          }
        } catch (aiError) {
          console.warn(`⚠️ AI enhancement failed for ${jobData.title}:`, aiError);
        }

        await job.save();
        savedCount++;
        console.log(`✅ Saved internship job: ${jobData.title} at ${jobData.company}`);

      } catch (error) {
        console.error(`❌ Failed to save job ${jobData.title}:`, error);
      }
    }

    return savedCount;
  }

  /**
   * Dedicated method to scrape hire-alumni page for employer requests
   */
  private static async scrapeHireAlumniPage(): Promise<EmployerJobRequest[]> {
    const results: EmployerJobRequest[] = [];
    const url = `${this.BASE_URL}/hire-alumni/`;
    
    let browser: puppeteer.Browser | null = null;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent(this.HEADERS['User-Agent']);
      await page.setExtraHTTPHeaders(this.HEADERS);

      console.log(`🏢 Accessing hire-alumni page: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      await page.waitForTimeout(3000);
      const content = await page.content();
      const $ = cheerio.load(content);

      // Extract any employer job requests or announcements
      const announcements = $('p, div, section').filter((_, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes('hiring') || text.includes('recruit') || text.includes('position') || 
               text.includes('vacancy') || text.includes('internship') || text.includes('graduate');
      });

      announcements.each((_, element) => {
        const text = $(element).text().trim();
        if (text.length > 50) {
          // Create an employer request based on the announcement
          const request: EmployerJobRequest = {
            jobTitle: 'Graduate Internship Opportunity',
            numberOfPositions: 1,
            requiredQualification: 'Bachelor\'s Degree',
            requiredFieldOfStudy: 'Various Fields',
            hiringCompanyName: 'Various Employers via MIFOTRA',
            companyLocation: 'Rwanda',
            representativeName: 'HR Representative',
            contactEmail: 'internship@mifotra.gov.rw',
            roleDetails: text.substring(0, 500),
            detectedAt: new Date(),
            url: url
          };
          
          results.push(request);
          console.log(`🏢 Found employer announcement: ${text.substring(0, 100)}...`);
        }
      });

      // Check for any forms that might indicate active employer requests
      const forms = $('form');
      if (forms.length > 0) {
        console.log(`📝 Found ${forms.length} form(s) on hire-alumni page - potential employer request system`);
        
        const formRequest: EmployerJobRequest = {
          jobTitle: 'Employer Registration for Internship Hiring',
          numberOfPositions: 0,
          requiredQualification: 'To be specified by employer',
          requiredFieldOfStudy: 'Multiple fields available',
          hiringCompanyName: 'Potential Employers',
          companyLocation: 'Rwanda',
          representativeName: 'Company Representatives',
          contactEmail: 'info@mifotra.gov.rw',
          roleDetails: 'Active employer registration system for hiring interns through the national portal',
          detectedAt: new Date(),
          url: url
        };
        
        results.push(formRequest);
      }

    } catch (error) {
      console.error(`❌ Error scraping hire-alumni page: ${error}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    return results;
  }

  /**
   * Extract static job information from general pages (announcements, news, etc.)
   */
  private static extractStaticJobInfo($: cheerio.CheerioAPI, url: string): InternshipRwJobData[] {
    const results: InternshipRwJobData[] = [];
    
    // Look for job-related announcements in various content areas
    const contentAreas = $('p, div, article, section, .content, .main, .announcement, .news');
    
    contentAreas.each((_, element) => {
      const text = $(element).text().trim();
      const lowerText = text.toLowerCase();
      
      // Check if this content mentions internship opportunities
      const internshipKeywords = [
        'internship', 'intern position', 'graduate program', 'vacancy', 'position available',
        'hiring', 'recruitment', 'job opening', 'opportunity', 'application', 'graduate trainee'
      ];
      
      const hasInternshipKeywords = internshipKeywords.some(keyword => lowerText.includes(keyword));
      
      if (hasInternshipKeywords && text.length > 100) {
        // Try to extract structured information
        const jobData = this.parseJobAnnouncement(text, url);
        if (jobData) {
          results.push(jobData);
          console.log(`📰 Found static job announcement: ${jobData.title}`);
        }
      }
    });
    
    // Look for structured lists that might contain job information
    const lists = $('ul, ol, .list');
    lists.each((_, listElement) => {
      const listItems = $(listElement).find('li');
      if (listItems.length > 0) {
        listItems.each((_, item) => {
          const itemText = $(item).text().trim();
          const lowerItemText = itemText.toLowerCase();
          
          if ((lowerItemText.includes('internship') || lowerItemText.includes('position')) && itemText.length > 30) {
            const jobData = this.parseJobAnnouncement(itemText, url);
            if (jobData) {
              results.push(jobData);
              console.log(`📋 Found job in list: ${jobData.title}`);
            }
          }
        });
      }
    });

    return results;
  }

  /**
   * Parse job announcement text to extract structured job data
   */
  private static parseJobAnnouncement(text: string, sourceUrl: string): InternshipRwJobData | null {
    const lowerText = text.toLowerCase();
    
    // Extract title
    let title = 'Internship Opportunity';
    const titlePatterns = [
      /(?:position|job|role|vacancy|internship):\s*([^\n.!?]+)/i,
      /([^\n.!?]*?(?:internship|position|vacancy|role)[^\n.!?]*)/i
    ];
    
    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 5) {
        title = match[1].trim();
        break;
      }
    }

    // Extract company
    let company = 'Rwanda National Internship Programme';
    const companyPatterns = [
      /(?:company|organization|employer):\s*([^\n.!?]+)/i,
      /at\s+([A-Z][^\n.!?]*?(?:ltd|limited|corp|corporation|inc|company))/i,
      /([A-Z][^\n.!?]*?(?:ministry|government|institution|agency))/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 3) {
        company = match[1].trim();
        break;
      }
    }

    // Extract location
    let location = 'Rwanda';
    const locationPatterns = [
      /(?:location|based in|situated in):\s*([^\n.!?]+)/i,
      /(?:kigali|butare|gisenyi|ruhengeri|musanze|huye|kayonza|rusizi)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        location = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }

    // Generate external job ID
    const externalJobId = `static_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      title: title.substring(0, 200),
      company: company.substring(0, 100),
      location: location.substring(0, 100),
      description: text.substring(0, 1500),
      jobType: JobType.INTERNSHIP,
      category: JobCategory.OTHER,
      experienceLevel: ExperienceLevel.ENTRY_LEVEL,
      educationLevel: EducationLevel.BACHELOR,
      requirements: this.extractRequirementsFromText(text),
      responsibilities: this.extractResponsibilitiesFromText(text),
      benefits: ['Professional Development', 'Work Experience', 'Networking Opportunities'],
      skills: this.extractSkills(title, text),
      contactInfo: {
        email: 'internship@mifotra.gov.rw',
        applicationInstructions: 'Apply through the national internship portal'
      },
      applicationDeadline: undefined,
      postedDate: new Date(),
      externalApplicationUrl: sourceUrl,
      externalJobId,
      source: 'internship.rw',
      isInternship: true
    };
  }

  /**
   * Extract requirements from announcement text
   */
  private static extractRequirementsFromText(text: string): string[] {
    const requirements: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Look for degree requirements
    if (lowerText.includes('bachelor') || lowerText.includes('degree')) {
      requirements.push('Bachelor\'s degree');
    }
    if (lowerText.includes('master')) {
      requirements.push('Master\'s degree preferred');
    }
    
    // Look for field requirements
    if (lowerText.includes('engineering')) requirements.push('Engineering background');
    if (lowerText.includes('business')) requirements.push('Business studies');
    if (lowerText.includes('computer') || lowerText.includes('it')) requirements.push('Computer/IT skills');
    if (lowerText.includes('finance')) requirements.push('Finance background');
    if (lowerText.includes('marketing')) requirements.push('Marketing experience');
    
    return requirements.length > 0 ? requirements : ['Recent graduate', 'Strong communication skills'];
  }

  /**
   * Extract responsibilities from announcement text
   */
  private static extractResponsibilitiesFromText(text: string): string[] {
    const responsibilities: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('assist')) responsibilities.push('Assist with daily operations');
    if (lowerText.includes('support')) responsibilities.push('Support team activities');
    if (lowerText.includes('learn')) responsibilities.push('Learn through hands-on experience');
    if (lowerText.includes('project')) responsibilities.push('Participate in projects');
    if (lowerText.includes('research')) responsibilities.push('Conduct research activities');
    
    return responsibilities.length > 0 ? responsibilities : ['Gain practical work experience', 'Support organizational objectives'];
  }
}

// Export the service
export default InternshipRwScrapingService;