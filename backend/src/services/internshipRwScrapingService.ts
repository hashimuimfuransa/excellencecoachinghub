/**
 * Specialized scraping service for internship.rw (Rwanda National Internship Programme Portal)
 * Handles both public job postings and employer job request monitoring
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { Page } from 'puppeteer';
import { Job, IJobDocument } from '../models/Job';
import { JobStatus, JobType, ExperienceLevel, EducationLevel, JobCategory } from '../types';

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
  applicationDeadline?: Date | undefined;
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
  expectedStartDate?: Date | undefined;
  requiredQualification: string;
  requiredFieldOfStudy: string;
  hiringCompanyName: string;
  hiringCompanyAddress?: string | undefined;
  hiringCompanyWebsite?: string | undefined;
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
  private static readonly RATE_LIMIT_DELAY = 8000; // 8 seconds between requests
  private static readonly JOBS_PER_CYCLE = 10; // Maximum jobs to scrape per cycle

  /**
   * Cross-version compatibility helper for waiting
   */
  private static async waitForDelay(ms: number): Promise<void> {
    try {
      console.log(`⏰ Waiting ${ms}ms...`);
      // Use native setTimeout for better compatibility across Puppeteer versions
      await new Promise(resolve => setTimeout(resolve, ms));
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
        
        await this.waitForDelay(2000);
        
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
          // Use evaluate to check for register-related elements since :contains() is not valid CSS
          const isRegisterPage = await page.evaluate(() => {
            const registerElements = document.querySelectorAll('[name="register"], input[value*="register"]');
            const registerButtons = Array.from(document.querySelectorAll('button[type="submit"]')).filter((btn: any) => 
              btn.textContent && btn.textContent.toLowerCase().includes('register')
            );
            return registerElements.length > 0 || registerButtons.length > 0;
          });
          
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
      await this.waitForDelay(3000);
      
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
          await this.waitForDelay(3000);
          
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
      await this.waitForDelay(3000);

      // Check if we're redirected to login (indicates auth is required but failed)
      if (page.url().includes('login') && !url.includes('login')) {
        console.log('🔐 Redirected to login - attempting authentication...');
        const authRetry = await this.handleAuthentication(page);
        if (authRetry) {
          // Try navigating to original URL again
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          await this.waitForDelay(2000);
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
      console.log(`📋 Found ${jobLinks.length} job links on ${path}`);
      
      if (jobLinks.length === 0) {
        // Debug: log some page content to understand structure
        const pageText = $.text().substring(0, 500);
        console.log(`🔍 Page text sample: ${pageText}`);
        
        // Check for common elements that might indicate job listings
        const hasJobKeywords = content.toLowerCase().includes('job') || 
                              content.toLowerCase().includes('internship') ||
                              content.toLowerCase().includes('opportunity') ||
                              content.toLowerCase().includes('vacancy');
        console.log(`🔍 Contains job keywords: ${hasJobKeywords}`);
        
        // Check for common HTML patterns
        const hasJobElements = $('a[href*="job"], a[href*="internship"], a[href*="opportunity"]').length > 0;
        console.log(`🔍 Has job-related links: ${hasJobElements}`);
      }
      
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
      /\/vacancies\/[a-z0-9-]+/,
      // More specific patterns for actual job postings
      /\/recruitment\/[a-z0-9-]+/,
      /\/career\/[a-z0-9-]+/,
      /\/employment\/[a-z0-9-]+/,
      /\/hiring\/[a-z0-9-]+/
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
      '/verify',
      // Exclude generic portal pages
      '/about',
      '/contact',
      '/help',
      '/faq',
      '/terms',
      '/privacy',
      '/policy',
      '/program',
      '/programs',
      '/portal',
      '/home',
      '/index',
      '/main',
      '/overview',
      '/introduction',
      '/welcome',
      '/getting-started',
      '/how-it-works',
      '/benefits',
      '/features',
      '/services',
      '/information',
      '/guidelines',
      '/instructions',
      '/tutorial',
      '/guide'
    ];

    const matchesJobPattern = jobPatterns.some(p => p.test(url.toLowerCase()));
    const isExcluded = excludes.some(e => url.toLowerCase().includes(e));
    
    // Additional validation: URL should have meaningful segments
    const urlSegments = url.split('/').filter(segment => segment.length > 0);
    const hasMeaningfulSegments = urlSegments.length >= 3; // Should have domain/path/identifier
    
    // Check for specific job identifiers in URL
    const hasJobIdentifier = /\/[a-z0-9-]{3,}\/[a-z0-9-]{3,}/.test(url.toLowerCase());

    return matchesJobPattern && !isExcluded && url.length > 20 && hasMeaningfulSegments && hasJobIdentifier;
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

      await this.waitForDelay(2000);

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
   * Extract job data from page content with enhanced validation
   */
  private static extractJobData($: any, url: string): InternshipRwJobData | null {
    // Extract title with validation
    const rawTitle = this.extractText($, [
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

    // Extract company with validation
    const rawCompany = this.extractText($, [
      '.company',
      '.employer',
      '.organization',
      '.hiring-company',
      '.company-name',
      '[data-company]',
      '.employer-name'
    ]);

    // Extract location with validation
    const rawLocation = this.extractText($, [
      '.location',
      '.job-location',
      '.work-location',
      '.company-location',
      '.position-location',
      '.duty-station'
    ]);

    // Extract description with validation
    const rawDescription = this.extractText($, [
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

    // Clean and validate extracted data
    const title = this.cleanText(rawTitle);
    const company = this.cleanText(rawCompany);
    const location = this.cleanText(rawLocation);
    const description = this.cleanText(rawDescription);

    // Validate extracted data
    if (!title || title.length < 5) {
      console.log(`⚠️ Invalid title found for ${url}: "${title}"`);
      return null;
    }

    if (!company || company.length < 2) {
      console.log(`⚠️ Invalid company found for ${url}: "${company}"`);
      return null;
    }

    if (!description || description.length < 20) {
      console.log(`⚠️ Invalid description found for ${url}: "${description}"`);
      return null;
    }

    // Check for JavaScript code fragments in extracted data
    const invalidPatterns = [
      /getFullYear\(\)/i,
      /javascript:/i,
      /function\s*\(/i,
      /console\.log/i,
      /document\./i,
      /window\./i,
      /\.innerHTML/i,
      /\.textContent/i,
      /undefined/i,
      /null/i,
      /NaN/i,
      /\[object\s+Object\]/i
    ];

    const contentToCheck = `${title} ${company} ${description}`;
    for (const pattern of invalidPatterns) {
      if (pattern.test(contentToCheck)) {
        console.log(`⚠️ JavaScript code detected in scraped content for ${url}: ${pattern.source}`);
        return null;
      }
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
        educationLevel: EducationLevel.BACHELOR,
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
  private static extractEmployerJobRequest($: any, url: string): EmployerJobRequest | null {
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
        const text = await page.evaluate(() => document.body?.textContent || '');
        
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
        educationLevel: EducationLevel.BACHELOR,
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
   * Save scraped jobs to database with enhanced validation and duplicate prevention
   */
  public static async saveScrapedJobs(jobs: InternshipRwJobData[]): Promise<number> {
    let savedCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;
    
    // Get or create system employer user for internship.rw jobs
    const { User } = await import('../models/User');
    let systemEmployer = await User.findOne({ email: 'system@internship.rw' });
    
    if (!systemEmployer) {
      systemEmployer = new User({
        firstName: 'Internship',
        lastName: 'Portal',
        email: 'system@internship.rw',
        password: 'system-generated',
        role: 'employer',
        company: 'Rwanda National Internship Programme',
        isVerified: true
      });
      await systemEmployer.save();
    }
    
    // Filter out invalid jobs first
    const validJobs = jobs.filter(jobData => this.isValidJobData(jobData));
    invalidCount = jobs.length - validJobs.length;
    
    if (invalidCount > 0) {
      console.log(`⚠️ Filtered out ${invalidCount} invalid job entries`);
    }
    
    for (const jobData of validJobs) {
      try {
        // Enhanced duplicate detection - check multiple criteria
        const existingJob = await this.findDuplicateJob(jobData);

        if (!existingJob) {
          // Additional validation before saving
          const cleanedJobData = this.cleanJobData(jobData);
          
          const newJob = new Job({
            title: cleanedJobData.title,
            description: cleanedJobData.description,
            company: cleanedJobData.company,
            location: cleanedJobData.location,
            jobType: cleanedJobData.jobType,
            category: cleanedJobData.category,
            experienceLevel: cleanedJobData.experienceLevel,
            educationLevel: cleanedJobData.educationLevel,
            skills: cleanedJobData.skills,
            requirements: cleanedJobData.requirements,
            responsibilities: cleanedJobData.responsibilities,
            benefits: cleanedJobData.benefits,
            applicationDeadline: cleanedJobData.applicationDeadline,
            postedDate: cleanedJobData.postedDate,
            status: JobStatus.ACTIVE,
            externalApplicationUrl: cleanedJobData.externalApplicationUrl,
            externalJobId: cleanedJobData.externalJobId,
            contactInfo: cleanedJobData.contactInfo,
            isRemote: false,
            employerEmail: cleanedJobData.contactInfo.email || 'internship@mifotra.gov.rw',
            source: 'internship.rw',
            employer: systemEmployer._id,
            isExternalJob: true,
            externalJobSource: 'internship.rw'
          });

          await newJob.save();
          savedCount++;
          
          console.log(`💾 Saved job: ${cleanedJobData.title} at ${cleanedJobData.company}`);
        } else {
          skippedCount++;
          console.log(`⚠️ Skipped duplicate job: ${jobData.title} (already exists)`);
          
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

    console.log(`📊 Scraping results: ${savedCount} saved, ${skippedCount} duplicates skipped, ${invalidCount} invalid entries filtered`);
    return savedCount;
  }

  /**
   * Enhanced duplicate detection using multiple criteria
   */
  private static async findDuplicateJob(jobData: InternshipRwJobData): Promise<IJobDocument | null> {
    // First check by externalJobId (most reliable)
    let existingJob = await Job.findOne({ 
      externalJobId: jobData.externalJobId 
    });
    
    if (existingJob) {
      return existingJob;
    }
    
    // Check by title + company combination (for cases where externalJobId changes)
    existingJob = await Job.findOne({
      title: { $regex: new RegExp(jobData.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      company: { $regex: new RegExp(jobData.company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      externalJobSource: 'internship.rw'
    });
    
    if (existingJob) {
      return existingJob;
    }
    
    // Check by description similarity (for very similar content)
    const descriptionHash = this.generateContentHash(jobData.description);
    const existingJobs = await Job.find({
      externalJobSource: 'internship.rw',
      $or: [
        { description: { $regex: new RegExp(jobData.description.substring(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
        { title: { $regex: new RegExp(jobData.title.substring(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
      ]
    });
    
    // Check for high similarity
    for (const job of existingJobs) {
      const similarity = this.calculateSimilarity(jobData.description, job.description);
      if (similarity > 0.85) { // 85% similarity threshold
        return job;
      }
    }
    
    return null;
  }

  /**
   * Validate job data before saving
   */
  private static isValidJobData(jobData: InternshipRwJobData): boolean {
    // Check for required fields
    if (!jobData.title || !jobData.company || !jobData.description) {
      return false;
    }
    
    // Check for invalid content patterns
    const invalidPatterns = [
      /getFullYear\(\)/i,
      /javascript:/i,
      /function\s*\(/i,
      /console\.log/i,
      /document\./i,
      /window\./i,
      /\.innerHTML/i,
      /\.textContent/i,
      /undefined/i,
      /null/i,
      /NaN/i,
      /\[object\s+Object\]/i,
      /<script/i,
      /<iframe/i,
      /eval\(/i,
      /setTimeout\(/i,
      /setInterval\(/i
    ];
    
    const contentToCheck = `${jobData.title} ${jobData.company} ${jobData.description}`;
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(contentToCheck)) {
        console.log(`⚠️ Invalid content detected: ${pattern.source} in "${jobData.title}"`);
        return false;
      }
    }
    
    // Check for minimum content length
    if (jobData.title.length < 5 || jobData.description.length < 20) {
      return false;
    }
    
    // Check for repetitive content (like the duplicate entries you showed)
    const titleWords = jobData.title.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(titleWords);
    if (titleWords.length > 3 && uniqueWords.size < titleWords.length * 0.6) {
      console.log(`⚠️ Repetitive title detected: "${jobData.title}"`);
      return false;
    }
    
    // ENHANCED VALIDATION: Filter out generic portal content
    const genericPortalPatterns = [
      // Generic portal titles
      /now hiring.*apply.*gain.*hands.*on.*experience/i,
      /internship.*program.*objectives/i,
      /national.*internship.*portal/i,
      /internship.*portal/i,
      /rwanda.*national.*internship.*programme/i,
      /collaborative.*dynamic.*platform/i,
      /career.*development.*success/i,
      /unique.*opportunity.*students.*employers/i,
      /connect.*collaborate/i,
      
      // Generic descriptions
      /with.*national.*internship.*portal.*students.*employers.*alike/i,
      /benefit.*collaborative.*dynamic.*platform/i,
      /supports.*career.*development.*success/i,
      /provides.*unique.*opportunity.*students.*employers/i,
      /connect.*collaborate/i,
      
      // Portal navigation content
      /internship.*entry.*level/i,
      /rwanda.*national.*internship.*programme/i,
      /internship.*portal/i,
      /active.*0.*0.*views/i,
      /sep.*23.*2025/i
    ];
    
    const titleLower = jobData.title.toLowerCase();
    const descLower = jobData.description.toLowerCase();
    const companyLower = jobData.company.toLowerCase();
    
    for (const pattern of genericPortalPatterns) {
      if (pattern.test(titleLower) || pattern.test(descLower) || pattern.test(companyLower)) {
        console.log(`⚠️ Generic portal content detected: "${jobData.title}"`);
        return false;
      }
    }
    
    // Check for specific job posting indicators
    const jobPostingIndicators = [
      /position.*title/i,
      /job.*title/i,
      /vacancy.*title/i,
      /internship.*title/i,
      /specific.*role/i,
      /specific.*position/i,
      /specific.*job/i,
      /specific.*internship/i,
      /department.*of/i,
      /ministry.*of/i,
      /organization.*seeks/i,
      /looking.*for/i,
      /seeking.*candidate/i,
      /applications.*invited/i,
      /deadline.*application/i,
      /application.*deadline/i,
      /submit.*application/i,
      /send.*cv/i,
      /email.*cv/i,
      /contact.*person/i,
      /hr.*department/i,
      /recruitment.*team/i
    ];
    
    const hasJobIndicators = jobPostingIndicators.some(indicator => 
      indicator.test(titleLower) || indicator.test(descLower)
    );
    
    if (!hasJobIndicators) {
      console.log(`⚠️ No specific job posting indicators found: "${jobData.title}"`);
      return false;
    }
    
    // Check for meaningful company names (not generic portal names)
    const genericCompanyNames = [
      'internship portal',
      'rwanda national internship programme',
      'national internship portal',
      'internship programme',
      'portal',
      'programme'
    ];
    
    const isGenericCompany = genericCompanyNames.some(name => 
      companyLower.includes(name.toLowerCase())
    );
    
    if (isGenericCompany) {
      console.log(`⚠️ Generic company name detected: "${jobData.company}"`);
      return false;
    }
    
    return true;
  }

  /**
   * Clean and normalize job data
   */
  private static cleanJobData(jobData: InternshipRwJobData): InternshipRwJobData {
    return {
      ...jobData,
      title: this.cleanText(jobData.title),
      company: this.cleanText(jobData.company),
      location: this.cleanText(jobData.location),
      description: this.cleanText(jobData.description),
      requirements: jobData.requirements.map(req => this.cleanText(req)).filter(req => req.length > 0),
      responsibilities: jobData.responsibilities.map(resp => this.cleanText(resp)).filter(resp => resp.length > 0),
      benefits: jobData.benefits.map(benefit => this.cleanText(benefit)).filter(benefit => benefit.length > 0),
      skills: jobData.skills.map(skill => this.cleanText(skill)).filter(skill => skill.length > 0),
      contactInfo: {
        email: jobData.contactInfo.email ? this.cleanText(jobData.contactInfo.email) : undefined,
        phone: jobData.contactInfo.phone ? this.cleanText(jobData.contactInfo.phone) : undefined,
        website: jobData.contactInfo.website,
        address: jobData.contactInfo.address,
        representativeName: jobData.contactInfo.representativeName ? this.cleanText(jobData.contactInfo.representativeName) : undefined,
        applicationInstructions: jobData.contactInfo.applicationInstructions ? this.cleanText(jobData.contactInfo.applicationInstructions) : undefined
      }
    };
  }

  /**
   * Clean text content by removing invalid characters and patterns
   */
  private static cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/getFullYear\(\)/gi, '') // Remove JavaScript code fragments
      .replace(/javascript:/gi, '')
      .replace(/function\s*\(/gi, '')
      .replace(/console\.log/gi, '')
      .replace(/document\./gi, '')
      .replace(/window\./gi, '')
      .replace(/\.innerHTML/gi, '')
      .replace(/\.textContent/gi, '')
      .replace(/undefined/gi, '')
      .replace(/null/gi, '')
      .replace(/NaN/gi, '')
      .replace(/\[object\s+Object\]/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/eval\(/gi, '')
      .replace(/setTimeout\(/gi, '')
      .replace(/setInterval\(/gi, '')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^\s+|\s+$/g, '') // Trim
      .substring(0, 5000); // Limit length
  }

  /**
   * Generate content hash for similarity comparison
   */
  private static generateContentHash(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content.toLowerCase().trim()).digest('hex');
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Helper methods
  private static extractText($: any, selectors: string[]): string {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }
    return '';
  }

  private static extractList($: any, selectors: string[]): string[] {
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

  private static extractDeadline($: any): Date | undefined {
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
      return JobCategory.JOBS;
    } else if (text.includes('market') || text.includes('sales') || text.includes('business')) {
      return JobCategory.JOBS;
    } else if (text.includes('finance') || text.includes('accounting') || text.includes('bank')) {
      return JobCategory.JOBS;
    } else if (text.includes('health') || text.includes('medical') || text.includes('nurse')) {
      return JobCategory.JOBS;
    } else if (text.includes('teach') || text.includes('education') || text.includes('training')) {
      return JobCategory.JOBS;
    } else if (text.includes('engineer')) {
      return JobCategory.JOBS;
    } else {
      return JobCategory.JOBS;
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

      await this.waitForDelay(3000);
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
  private static extractStaticJobInfo($: any, url: string): InternshipRwJobData[] {
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
   * Parse job announcement text to extract structured job data with enhanced validation
   */
  private static parseJobAnnouncement(text: string, sourceUrl: string): InternshipRwJobData | null {
    // Clean the text first
    const cleanedText = this.cleanText(text);
    const lowerText = cleanedText.toLowerCase();
    
    // Skip if text is too short or contains invalid patterns
    if (cleanedText.length < 50) {
      return null;
    }
    
    // Check for repetitive content patterns (like the duplicates you showed)
    const words = cleanedText.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    
    if (words.length > 10 && repetitionRatio < 0.4) {
      console.log(`⚠️ Skipping repetitive content: repetition ratio ${repetitionRatio.toFixed(2)}`);
      return null;
    }
    
    // Extract title with better validation
    let title = 'Internship Opportunity';
    const titlePatterns = [
      /(?:position|job|role|vacancy|internship):\s*([^\n.!?]+)/i,
      /([^\n.!?]*?(?:internship|position|vacancy|role)[^\n.!?]*)/i,
      /([A-Z][^\n.!?]*?(?:internship|position|vacancy|role)[^\n.!?]*)/i
    ];
    
    for (const pattern of titlePatterns) {
      const match = cleanedText.match(pattern);
      if (match && match[1] && match[1].trim().length > 5 && match[1].trim().length < 100) {
        const candidateTitle = match[1].trim();
        // Validate title doesn't contain JavaScript code
        if (!this.containsInvalidPatterns(candidateTitle)) {
          title = candidateTitle;
          break;
        }
      }
    }

    // Extract company with validation
    let company = 'Rwanda National Internship Programme';
    const companyPatterns = [
      /(?:company|organization|employer):\s*([^\n.!?]+)/i,
      /at\s+([A-Z][^\n.!?]*?(?:ltd|limited|corp|corporation|inc|company))/i,
      /([A-Z][^\n.!?]*?(?:ministry|government|institution|agency))/i,
      /([A-Z][^\n.!?]*?(?:programme|program|portal))/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = cleanedText.match(pattern);
      if (match && match[1] && match[1].trim().length > 3 && match[1].trim().length < 100) {
        const candidateCompany = match[1].trim();
        if (!this.containsInvalidPatterns(candidateCompany)) {
          company = candidateCompany;
          break;
        }
      }
    }

    // Extract location with validation
    let location = 'Rwanda';
    const locationPatterns = [
      /(?:location|based in|situated in):\s*([^\n.!?]+)/i,
      /(?:kigali|butare|gisenyi|ruhengeri|musanze|huye|kayonza|rusizi)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = cleanedText.match(pattern);
      if (match) {
        const candidateLocation = match[1] ? match[1].trim() : match[0].trim();
        if (!this.containsInvalidPatterns(candidateLocation)) {
          location = candidateLocation;
          break;
        }
      }
    }

    // Generate unique external job ID based on content hash
    const contentHash = this.generateContentHash(cleanedText);
    const externalJobId = `static_${contentHash.substring(0, 8)}_${Date.now()}`;

    // Final validation before returning
    if (this.containsInvalidPatterns(`${title} ${company} ${cleanedText}`)) {
      console.log(`⚠️ Invalid patterns detected in parsed announcement`);
      return null;
    }

    return {
      title: title.substring(0, 200),
      company: company.substring(0, 100),
      location: location.substring(0, 100),
      description: cleanedText.substring(0, 1500),
      jobType: JobType.INTERNSHIP,
      category: JobCategory.JOBS,
      experienceLevel: ExperienceLevel.ENTRY_LEVEL,
      educationLevel: EducationLevel.BACHELOR,
      requirements: this.extractRequirementsFromText(cleanedText),
      responsibilities: this.extractResponsibilitiesFromText(cleanedText),
      benefits: ['Professional Development', 'Work Experience', 'Networking Opportunities'],
      skills: this.extractSkills(title, cleanedText),
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
   * Check if text contains invalid patterns
   */
  private static containsInvalidPatterns(text: string): boolean {
    const invalidPatterns = [
      /getFullYear\(\)/i,
      /javascript:/i,
      /function\s*\(/i,
      /console\.log/i,
      /document\./i,
      /window\./i,
      /\.innerHTML/i,
      /\.textContent/i,
      /undefined/i,
      /null/i,
      /NaN/i,
      /\[object\s+Object\]/i,
      /<script/i,
      /<iframe/i,
      /eval\(/i,
      /setTimeout\(/i,
      /setInterval\(/i
    ];

    return invalidPatterns.some(pattern => pattern.test(text));
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

  /**
   * Clean up existing invalid internship data from database
   */
  public static async cleanupInvalidInternshipData(): Promise<number> {
    try {
      console.log('🧹 Starting cleanup of invalid internship data...');
      
      const { Job } = await import('../models/Job');
      
      // Find all internship.rw jobs
      const allInternshipJobs = await Job.find({ 
        externalJobSource: 'internship.rw' 
      });
      
      console.log(`📊 Found ${allInternshipJobs.length} internship.rw jobs to check`);
      
      let deletedCount = 0;
      const invalidJobIds: string[] = [];
      
      for (const job of allInternshipJobs) {
        // Check if this job matches the invalid patterns
        const jobData = {
          title: job.title,
          company: job.company,
          description: job.description
        };
        
        if (!this.isValidJobData(jobData)) {
          invalidJobIds.push(job._id.toString());
          console.log(`🗑️ Marking for deletion: "${job.title}"`);
        }
      }
      
      if (invalidJobIds.length > 0) {
        const deleteResult = await Job.deleteMany({ 
          _id: { $in: invalidJobIds } 
        });
        deletedCount = deleteResult.deletedCount;
        console.log(`✅ Deleted ${deletedCount} invalid internship jobs`);
      } else {
        console.log('✅ No invalid internship jobs found');
      }
      
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up invalid internship data:', error);
      throw error;
    }
  }
}

// Export the service
export default InternshipRwScrapingService;