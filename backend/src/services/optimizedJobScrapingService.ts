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
    applicationInstructions?: string[];
    contactInfo?: string[];
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
        deadline: [
          '.deadline', 
          '.closing-date', 
          '.application-deadline', 
          '.expires',
          '.application-deadline-date',
          '.deadline-date',
          '.closing-date-value',
          '.expiry-date',
          '.due-date',
          '.application-due-date',
          '.submission-deadline',
          '.last-date',
          '.final-date',
          '.cutoff-date',
          '.end-date',
          '.application-end-date',
          '[data-deadline]',
          '[data-closing-date]',
          '[data-expiry]',
          '.job-deadline',
          '.vacancy-deadline',
          '.position-deadline',
          '.posting-deadline'
        ],
        postedDate: ['.posted-date', '.published', '.date', '.opening-date'],
        applicationInstructions: ['.application-procedure', '.how-to-apply', '.application-instructions', '.apply-process', '.submission-process', '.contact-info'],
        contactInfo: ['.contact-information', '.contact-details', '.employer-contact', '.company-contact', '.hiring-contact']
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
        deadline: [
          '.deadline', 
          '.closing-date', 
          '.application-deadline',
          '.expires',
          '.application-deadline-date',
          '.deadline-date',
          '.closing-date-value',
          '.expiry-date',
          '.due-date',
          '.application-due-date',
          '.submission-deadline',
          '.last-date',
          '.final-date',
          '.cutoff-date',
          '.end-date',
          '.application-end-date',
          '[data-deadline]',
          '[data-closing-date]',
          '[data-expiry]',
          '.job-deadline',
          '.vacancy-deadline',
          '.position-deadline',
          '.posting-deadline'
        ],
        postedDate: ['.posted-date', '.date-posted', '.publish-date', '.job-date', 'time', '.time-ago'],
        applicationInstructions: ['.application-procedure', '.how-to-apply', '.application-instructions', '.apply-info', '.contact-details', '.hiring-info'],
        contactInfo: ['.contact-information', '.contact-details', '.employer-info', '.hiring-contact', '.company-contact']
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
        deadline: [
          '.field-name-field-deadline', 
          '.deadline',
          '.field-name-field-closing-date',
          '.closing-date',
          '.application-deadline',
          '.expires',
          '.application-deadline-date',
          '.deadline-date',
          '.closing-date-value',
          '.expiry-date',
          '.due-date',
          '.application-due-date',
          '.submission-deadline',
          '.last-date',
          '.final-date',
          '.cutoff-date',
          '.end-date',
          '.application-end-date',
          '[data-deadline]',
          '[data-closing-date]',
          '[data-expiry]',
          '.job-deadline',
          '.vacancy-deadline',
          '.position-deadline',
          '.posting-deadline'
        ],
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
          'a[href*="vacancy--title"]',
          'a[href*="job-title"]',
          'a[href*="/vacancy/"]',
          'a[href*="/job/"]',
          '.job-title a',
          'h2 a',
          'h3 a',
          '.entry-title a',
          '.post-title a',
          'article a'
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
      name: 'internship.rw',
      baseUrl: 'https://internship.rw',
      paths: ['/', '/hire-alumni/', '/accounts/login/', '/api/', '/opportunities/', '/jobs/'],
      priority: 4,
      selectors: {
        jobLink: [
          'a[href*="/job/"]',
          'a[href*="/internship/"]',
          'a[href*="/opportunity/"]',
          'a[href*="/position/"]',
          'a[href*="/vacancy/"]',
          '.job-item a',
          '.internship-item a',
          '.opportunity-item a',
          '.vacancy-item a',
          '.position-item a',
          'h3 a',
          'h4 a',
          '.job-title a',
          '.internship-title a',
          '.opportunity-title a',
          'article a',
          '.card a'
        ],
        title: [
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
        ],
        company: [
          '.company',
          '.employer',
          '.organization',
          '.hiring-company',
          '.company-name',
          '[data-company]',
          '.employer-name'
        ],
        location: [
          '.location',
          '.job-location',
          '.work-location',
          '.company-location',
          '.position-location',
          '.duty-station'
        ],
        description: [
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
        ],
        requirements: [
          '.requirements',
          '.qualifications',
          '.required-qualification',
          '.required-field-of-study',
          '.skills',
          '.eligibility',
          '.criteria'
        ],
        responsibilities: [
          '.responsibilities',
          '.duties',
          '.role-duties',
          '.tasks',
          '.job-duties'
        ],
        benefits: [
          '.benefits',
          '.perks',
          '.compensation',
          '.package'
        ],
        salary: [
          '.salary',
          '.compensation',
          '.pay',
          '.remuneration'
        ],
        deadline: [
          '.deadline',
          '.application-deadline',
          '.closing-date',
          '.expected-start-date',
          '.expires'
        ],
        postedDate: [
          '.posted-date',
          '.date-posted',
          '.publish-date',
          '.created-date',
          '.date'
        ],
        applicationInstructions: [
          '.application-instructions',
          '.how-to-apply',
          '.application-procedure',
          '.contact-info',
          '.contact-email',
          '.contact-phone-number',
          '.representative-name'
        ],
        contactInfo: [
          '.contact-information',
          '.contact-details',
          '.employer-contact',
          '.company-contact',
          '.hiring-contact',
          '.representative-contact'
        ]
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
        'Connection': 'keep-alive',
        'Referer': 'https://internship.rw/'
      },
      urlFilter: (url: string) => {
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
        
        // Allow internship.rw URLs that match job patterns or are basic paths we want to monitor
        const basicPaths = ['/', '/hire-alumni/', '/about/', '/guidelines'];
        const isBasicPath = basicPaths.some(path => url.endsWith(path));
        const matchesJobPattern = jobPatterns.some(p => p.test(url.toLowerCase()));
        const isExcluded = excludes.some(e => url.toLowerCase().includes(e));
        
        return (isBasicPath || matchesJobPattern) && !isExcluded && url.length > 20;
      },
      requiresJS: true, // Enable JS rendering for better compatibility with portal
      rateLimit: { delayMs: 8000, maxConcurrent: 1 } // Slower rate limit for government portal
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
    },
    {
      name: 'emiratesgroupcareers',
      baseUrl: 'https://www.emiratesgroupcareers.com',
      paths: ['/search-and-apply/'],
      priority: 7,
      selectors: {
        jobLink: [
          'a[href*="emiratesjobs.avature.net"]',
          '.job-card a',
          '[data-job-id] a',
          'a[href*="/job/"]',
          '.job-item a',
          'h3 a',
          'h4 a'
        ],
        title: ['h1', '.job-title', 'h3', 'h4', '.title', '.position-title'],
        company: ['.company-name', '.employer', '.brand', '.organization', '.division'],
        location: ['.location', '.job-location', '.city', '.country', '.duty-station'],
        description: ['.job-description', '.description', '.content', '.summary', '.job-detail', '.responsibilities'],
        requirements: ['.requirements', '.qualifications', '.skills', '.eligibility'],
        responsibilities: ['.responsibilities', '.duties', '.job-duties', '.key-responsibilities'],
        benefits: ['.benefits', '.perks', '.compensation-benefits'],
        salary: ['.salary', '.compensation', '.remuneration', '.pay'],
        deadline: ['.deadline', '.closing-date', '.application-deadline', '.expires'],
        postedDate: ['.posted-date', '.date-posted', '.publish-date', '.job-date']
      },
      pagination: {
        type: 'none',
        maxPages: 1
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
        'Connection': 'keep-alive',
        'Referer': 'https://www.emiratesgroupcareers.com/'
      },
      urlFilter: (url: string) => {
        const patterns = [
          /emiratesjobs\.avature\.net.*\/job\//,
          /\/job\/[a-zA-Z0-9-]+/,
          /\/jobs\/[a-zA-Z0-9-]+/,
          /\/position\/[a-zA-Z0-9-]+/
        ];
        const excludes = ['/search', '/filter', '/apply', '/login', '/sign-in', '/register'];
        return patterns.some(p => p.test(url)) && !excludes.some(e => url.includes(e)) && url.length > 30;
      },
      requiresJS: true, // Emirates Group uses dynamic loading
      rateLimit: { delayMs: 5000, maxConcurrent: 1 }
    },
    {
      name: 'landmark-oracle-hcm',
      baseUrl: 'https://efhi.fa.em3.oraclecloud.com',
      paths: ['/hcmUI/CandidateExperience/en/sites/CX_1/jobs'],
      priority: 8,
      selectors: {
        jobLink: [
          'a[href*="/job/"]',
          'a[href*="CandidateExperience"]',
          '[data-job-id] a',
          '.job-item a',
          '.job-card a',
          'li a[href*="/job/"]'
        ],
        title: ['h1', '.job-title', '.position-title', 'h3', 'h4', '.title'],
        company: ['.company-name', '.employer', '.organization', '.brand', '.division'],
        location: ['.location', '.job-location', '.city', '.country', '.work-location'],
        description: ['.job-description', '.description', '.content', '.summary', '.job-detail'],
        requirements: ['.requirements', '.qualifications', '.skills', '.minimum-qualifications'],
        responsibilities: ['.responsibilities', '.duties', '.job-duties', '.key-responsibilities'],
        benefits: ['.benefits', '.perks', '.compensation'],
        salary: ['.salary', '.compensation', '.pay', '.wage'],
        deadline: ['.deadline', '.closing-date', '.application-deadline', '.expires'],
        postedDate: ['.posted-date', '.date-posted', '.publish-date', '.job-date', '.posting-date']
      },
      pagination: {
        type: 'none',
        maxPages: 1
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
        'Connection': 'keep-alive',
        'Referer': 'https://efhi.fa.em3.oraclecloud.com/'
      },
      urlFilter: (url: string) => {
        const patterns = [
          /efhi\.fa\.em3\.oraclecloud\.com.*\/job\/[a-zA-Z0-9]+$/,
          /CandidateExperience.*\/job\/[a-zA-Z0-9]+$/
        ];
        const excludes = ['/search', '/filter', '/apply', '/login', '/sign-in', '/register', '/my-profile'];
        return patterns.some(p => p.test(url)) && !excludes.some(e => url.includes(e)) && url.length > 40;
      },
      requiresJS: true, // Oracle HCM uses heavy JavaScript
      rateLimit: { delayMs: 6000, maxConcurrent: 1 }
    },
    {
      name: 'rwandajob',
      baseUrl: 'https://www.rwandajob.com',
      paths: ['/job-vacancies-search-rwanda', '/jobs', '/vacancies', '/'],
      priority: 9,
      selectors: {
        jobLink: [
          'a[href*="/job/"]',
          'a[href*="/vacancy/"]',
          'a[href*="/position/"]',
          'a[href*="/jobs/"]',
          'a[href*="/vacancies/"]',
          'a[href*="/employment/"]',
          '.job-item a',
          '.job-card a',
          '.job-title a',
          '.vacancy-title a',
          '.job-listing a',
          '.post-title a',
          '.entry-title a',
          'h3 a',
          'h4 a',
          'article a',
          '.job a',
          '.vacancy a',
          'a[title*="job"]',
          'a[title*="vacancy"]',
          'a[title*="position"]',
          '.job-link',
          '.vacancy-link'
        ],
        title: [
          'h1',
          '.job-title',
          '.vacancy-title',
          '.position-title',
          '.post-title',
          '.entry-title',
          'h3',
          'h4',
          '.title'
        ],
        company: [
          '.company',
          '.employer',
          '.organization',
          '.company-name',
          '.hiring-company',
          '.job-company',
          '.employer-name'
        ],
        location: [
          '.location',
          '.job-location',
          '.work-location',
          '.position-location',
          '.duty-station',
          '.workplace'
        ],
        description: [
          '.job-description',
          '.vacancy-description',
          '.description',
          '.content',
          '.job-details',
          '.post-content',
          '.entry-content',
          'main',
          'article'
        ],
        requirements: [
          '.requirements',
          '.qualifications',
          '.required-qualifications',
          '.skills',
          '.criteria',
          '.minimum-requirements'
        ],
        responsibilities: [
          '.responsibilities',
          '.duties',
          '.job-duties',
          '.role-responsibilities',
          '.tasks'
        ],
        benefits: [
          '.benefits',
          '.perks',
          '.compensation-benefits',
          '.package'
        ],
        salary: [
          '.salary',
          '.compensation',
          '.pay',
          '.remuneration',
          '.wage'
        ],
        deadline: [
          '.deadline',
          '.application-deadline',
          '.closing-date',
          '.expires',
          '.due-date'
        ],
        postedDate: [
          '.posted-date',
          '.date-posted',
          '.publish-date',
          '.job-date',
          '.date',
          '.created-date'
        ],
        applicationInstructions: [
          '.application-instructions',
          '.how-to-apply',
          '.application-procedure',
          '.apply-process',
          '.contact-info'
        ],
        contactInfo: [
          '.contact-information',
          '.contact-details',
          '.employer-contact',
          '.company-contact',
          '.hiring-contact'
        ]
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
        'Connection': 'keep-alive',
        'Referer': 'https://www.rwandajob.com/'
      },
      urlFilter: (url: string) => {
        const patterns = [
          /\/job\/[a-z0-9-]+/,
          /\/vacancy\/[a-z0-9-]+/,
          /\/position\/[a-z0-9-]+/,
          /\/jobs\/[a-z0-9-]+/,
          /\/vacancies\/[a-z0-9-]+/,
          /\/employment\/[a-z0-9-]+/,
          /\/job-vacancies-[a-z]+\/[a-z0-9-]+/,
          /\/recruitment-[a-z]+\/[a-z0-9-]+/
        ];
        const excludes = [
          '/search', '/filter', '/category', '/page', '/login', '/register', '/admin',
          '/employments/jobs/', '/employments/by/', '/employments/types', '/employments/categories',
          '/jobs/by/', '/jobs/types', '/jobs/categories', '/jobs/search', '/jobs/filter',
          '/recruitment-rwanda-cv/', '/cv/', '/profile/', '/sign-in', '/my-profile'
        ];
        
        // Must match a job pattern and not be excluded
        const matchesPattern = patterns.some(p => p.test(url.toLowerCase()));
        const isExcluded = excludes.some(e => url.toLowerCase().includes(e));
        const hasMinLength = url.length > 30;
        
        // Additional validation: URL should contain specific job-related segments
        const hasJobSegment = url.includes('/job/') || url.includes('/vacancy/') || 
                             url.includes('/position/') || url.includes('/employment/') ||
                             url.includes('/job-vacancies-') || url.includes('/recruitment-');
        
        return matchesPattern && !isExcluded && hasMinLength && hasJobSegment;
      },
      requiresJS: false,
      rateLimit: { delayMs: 4000, maxConcurrent: 1 }
    },
    {
      name: 'mifotra-recruitment',
      baseUrl: 'https://recruitment.mifotra.gov.rw',
      paths: ['/', '/vacancies', '/jobs', '/recruitment', '/announcements'],
      priority: 10,
      selectors: {
        jobLink: [
          // Direct mifotra job links - more specific patterns
          'a[href*="/recruitment/"]',
          'a[href*="/vacancy/"]',
          'a[href*="/position/"]',
          'a[href*="/job/"]',
          'a[href*="/announcement/"]',
          'a[href*="/vacancies/"]',
          'a[href*="/jobs/"]',
          'a[href*="/positions/"]',
          'a[href*="/announcements/"]',
          'a[href*="/public-service/"]',
          'a[href*="/civil-service/"]',
          'a[href*="/government/"]',
          'a[href*="/ministry/"]',
          'a[href*="/department/"]',
          'a[href*="/agency/"]',
          
          // External job portal links (AU, ILO, etc.) - keep these
          'a[href*="jobs.au.int"]',
          'a[href*="jobs.ilo.org"]',
          'a[href*="jobs.un.org"]',
          'a[href*="jobs.undp.org"]',
          'a[href*="jobs.who.int"]',
          'a[href*="jobs.worldbank.org"]',
          'a[href*="jobs.fao.org"]',
          'a[href*="jobs.unicef.org"]',
          
          // Generic job portal patterns
          'a[href*="/career/"]',
          'a[href*="/employment/"]',
          'a[href*="recruitment"]',
          'a[href*="search"]',
          'a[href*="list"]',
          'a[href*="view"]',
          
          // Common class-based selectors
          '.recruitment-item a',
          '.vacancy-item a',
          '.job-item a',
          '.announcement-item a',
          '.position-item a',
          '.job-card a',
          '.vacancy-card a',
          '.recruitment-card a',
          '.announcement-card a',
          '.job-listing a',
          '.vacancy-listing a',
          '.position-listing a',
          
          // Generic link patterns
          'h3 a',
          'h4 a',
          'h2 a',
          'h1 a',
          'article a',
          '.job-title a',
          '.vacancy-title a',
          '.announcement-title a',
          '.position-title a',
          '.post-title a',
          '.entry-title a',
          '.title a',
          
          // Title-based patterns
          'a[title*="job"]',
          'a[title*="vacancy"]',
          'a[title*="position"]',
          'a[href*="recruitment"]',
          'a[title*="announcement"]',
          'a[title*="career"]',
          'a[title*="employment"]',
          
          // Class-based patterns
          '.job-link',
          '.vacancy-link',
          '.recruitment-link',
          '.announcement-link',
          '.position-link',
          '.career-link',
          '.employment-link',
          
          // Government-specific patterns
          'a[href*="/public-service/"]',
          'a[href*="/civil-service/"]',
          'a[href*="/government/"]',
          'a[href*="/ministry/"]',
          'a[href*="/department/"]',
          'a[href*="/agency/"]',
          '.public-service a',
          '.civil-service a',
          '.government-job a',
          '.ministry-job a',
          
          // List item patterns
          'li a',
          '.list-item a',
          '.menu-item a',
          '.nav-item a',
          
          // Generic patterns for any links that might be jobs
          'a[href*="search"]',
          'a[href*="list"]',
          'a[href*="view"]'
        ],
        title: [
          'h1',
          '.job-title',
          '.vacancy-title',
          '.position-title',
          '.recruitment-title',
          '.announcement-title',
          'h3',
          'h4',
          '.title',
          '.post-title'
        ],
        company: [
          '.company',
          '.employer',
          '.organization',
          '.ministry',
          '.department',
          '.agency',
          '.institution',
          '.government-entity'
        ],
        location: [
          '.location',
          '.work-location',
          '.duty-station',
          '.workplace',
          '.position-location',
          '.office-location'
        ],
        description: [
          '.job-description',
          '.vacancy-description',
          '.recruitment-description',
          '.announcement-description',
          '.description',
          '.content',
          '.details',
          '.job-details',
          'main',
          'article'
        ],
        requirements: [
          '.requirements',
          '.qualifications',
          '.required-qualifications',
          '.minimum-qualifications',
          '.eligibility-criteria',
          '.skills',
          '.competencies'
        ],
        responsibilities: [
          '.responsibilities',
          '.duties',
          '.job-duties',
          '.key-responsibilities',
          '.role-duties',
          '.functions'
        ],
        benefits: [
          '.benefits',
          '.compensation',
          '.package',
          '.remuneration-package',
          '.employment-terms'
        ],
        salary: [
          '.salary',
          '.compensation',
          '.pay',
          '.remuneration',
          '.salary-scale',
          '.grade'
        ],
        deadline: [
          '.deadline',
          '.application-deadline',
          '.closing-date',
          '.submission-deadline',
          '.due-date',
          '.expires'
        ],
        postedDate: [
          '.posted-date',
          '.publication-date',
          '.announcement-date',
          '.date-posted',
          '.publish-date',
          '.date'
        ],
        applicationInstructions: [
          '.application-instructions',
          '.application-procedure',
          '.how-to-apply',
          '.submission-process',
          '.application-process',
          '.contact-info'
        ],
        contactInfo: [
          '.contact-information',
          '.contact-details',
          '.ministry-contact',
          '.department-contact',
          '.hr-contact'
        ]
      },
      pagination: {
        type: 'query',
        pattern: '?page=',
        maxPages: 2
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
        'Connection': 'keep-alive',
        'Referer': 'https://recruitment.mifotra.gov.rw/'
      },
      urlFilter: (url: string) => {
        const patterns = [
          /\/recruitment\/[a-z0-9-]+/,
          /\/vacancy\/[a-z0-9-]+/,
          /\/position\/[a-z0-9-]+/,
          /\/job\/[a-z0-9-]+/,
          /\/announcement\/[a-z0-9-]+/,
          /mifotra\.gov\.rw.*\/[a-z0-9-]+$/,
          // External job portal patterns
          /jobs\.au\.int/,
          /jobs\.ilo\.org/,
          /jobs\.un\.org/,
          /jobs\.undp\.org/,
          /jobs\.who\.int/,
          /jobs\.worldbank\.org/,
          /jobs\.fao\.org/,
          /jobs\.unicef\.org/
        ];
        const excludes = [
          '/search',
          '/filter',
          '/login',
          '/register',
          '/admin',
          '/static',
          '/css',
          '/js',
          '/images',
          '/media',
          '#main-content', '#top', '#bottom', 'javascript:', 'mailto:', 'tel:'
        ];
        
        const matchesPattern = patterns.some(p => p.test(url.toLowerCase()));
        const isExcluded = excludes.some(e => url.toLowerCase().includes(e));
        const hasMinLength = url.length > 20;
        
        // Additional validation: URL should contain specific job-related segments
        const hasJobSegment = url.includes('/recruitment/') || url.includes('/vacancy/') || 
                             url.includes('/position/') || url.includes('/job/') ||
                             url.includes('/announcement/') || url.includes('jobs.au.int') ||
                             url.includes('jobs.ilo.org') || url.includes('jobs.un.org') ||
                             url.includes('jobs.undp.org') || url.includes('jobs.who.int') ||
                             url.includes('jobs.worldbank.org') || url.includes('jobs.fao.org') ||
                             url.includes('jobs.unicef.org');
        
        return matchesPattern && !isExcluded && hasMinLength && hasJobSegment;
      },
      requiresJS: true, // Government sites often use JavaScript
      rateLimit: { delayMs: 8000, maxConcurrent: 1 }
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
      const days = parseInt(daysMatch[1] || '0');
      return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    }
    
    // Handle "X hours ago" or "X hour ago"
    const hoursMatch = cleanText.match(/(\d+)\s+hours?\s+ago/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1] || '0');
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
   * Enhanced deadline extraction with comprehensive parsing
   */
  private static extractDeadline($: any, deadlineText?: string): Date | undefined {
    // First try the provided deadline text
    if (deadlineText) {
      const parsedDate = this.parseDeadlineText(deadlineText);
      if (parsedDate) {
        console.log(`✅ Parsed deadline from provided text: ${parsedDate.toISOString()}`);
        return parsedDate;
      }
    }

    // Try comprehensive selectors
    const selectors = [
      '.deadline',
      '.application-deadline',
      '.closing-date',
      '.expected-start-date',
      '.expires',
      '.application-deadline-date',
      '.deadline-date',
      '.closing-date-value',
      '.expiry-date',
      '.due-date',
      '.application-due-date',
      '.submission-deadline',
      '.last-date',
      '.final-date',
      '.cutoff-date',
      '.end-date',
      '.application-end-date',
      '[data-deadline]',
      '[data-closing-date]',
      '[data-expiry]',
      '.job-deadline',
      '.vacancy-deadline',
      '.position-deadline',
      '.posting-deadline'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        // Try text content first
        let text = element.text().trim();
        
        // If no text, try data attributes
        if (!text) {
          text = element.attr('data-deadline') || 
                 element.attr('data-closing-date') || 
                 element.attr('data-expiry') || 
                 element.attr('title') || '';
        }
        
        if (text) {
          console.log(`🔍 Found deadline text with selector "${selector}": "${text}"`);
          const parsedDate = this.parseDeadlineText(text);
          if (parsedDate) {
            console.log(`✅ Successfully parsed deadline: ${parsedDate.toISOString()}`);
            return parsedDate;
          }
        }
      }
    }
    
    // Fallback: search in common text patterns throughout the page
    const fallbackText = this.searchForDeadlineInText($);
    if (fallbackText) {
      console.log(`🔍 Found deadline in fallback search: "${fallbackText}"`);
      const parsedDate = this.parseDeadlineText(fallbackText);
      if (parsedDate) {
        console.log(`✅ Successfully parsed deadline from fallback: ${parsedDate.toISOString()}`);
        return parsedDate;
      }
    }
    
    return undefined;
  }

  /**
   * Enhanced deadline text parsing with support for various formats
   */
  private static parseDeadlineText(text: string): Date | null {
    if (!text || text.trim().length === 0) return null;
    
    // Clean the text
    const cleanText = text.trim().toLowerCase();
    
    // Skip if it's clearly not a date
    if (cleanText.includes('ongoing') || cleanText.includes('continuous') || 
        cleanText.includes('rolling') || cleanText.includes('until filled')) {
      return null;
    }
    
    // Common date patterns
    const datePatterns = [
      // ISO format: 2025-09-15, 2025/09/15
      /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
      // DD-MM-YYYY, DD/MM/YYYY
      /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/,
      // DD Month YYYY: 15 September 2025, 15 Sep 2025
      /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i,
      // Month DD, YYYY: September 15, 2025, Sep 15, 2025
      /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/i,
      // DD Month: 15 September (assume current year if not specified)
      /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      // Month DD: September 15 (assume current year if not specified)
      /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})/i
    ];
    
    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        try {
          let year: number, month: number, day: number;
          
          // Define month names mapping
          const monthNames: { [key: string]: number } = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
            'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'jun': 6,
            'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
          };
          
          if (pattern.source.includes('\\d{4}')) {
            // Pattern has year
            if (match[1] && match[1].length === 4) {
              // YYYY-MM-DD format
              year = parseInt(match[1], 10);
              month = parseInt(match[2] || '1', 10); // Add fallback
              day = parseInt(match[3] || '1', 10); // Add fallback
            } else {
              // DD-MM-YYYY format
              day = parseInt(match[1] || '1', 10);
              month = parseInt(match[2] || '1', 10); // Add fallback
              year = parseInt(match[3] || '2024', 10); // Add fallback
            }
          } else {
            // Month name pattern
            if (match[1] && match[1] in monthNames) {
              // Month DD, YYYY format
              month = monthNames[match[1]] || 1; // Add fallback
              day = parseInt(match[2] || '1', 10);
              year = parseInt(match[3] || '2024', 10);
            } else if (match[2] && match[2] in monthNames) {
              // DD Month YYYY format
              day = parseInt(match[1] || '1', 10);
              month = monthNames[match[2]] || 1; // Add fallback
              year = parseInt(match[3] || '2024', 10);
            } else {
              // No year specified, assume next year if month has passed, current year otherwise
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth() + 1;
              
              if (match[1] && match[1] in monthNames) {
                month = monthNames[match[1]] || 1; // Add fallback
                day = 1;
              } else if (match[2] && match[2] in monthNames) {
                month = monthNames[match[2]] || 1; // Add fallback
                day = parseInt(match[1] || '1', 10);
              } else {
                continue; // Skip this pattern
              }
              
              if (month < currentMonth) {
                year = currentYear + 1;
              } else {
                year = currentYear;
              }
            }
          }
          
          // Validate the date
          const date = new Date(year, month - 1, day, 23, 59, 59, 999);
          if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            return date;
          }
        } catch (error) {
          console.log(`⚠️ Error parsing date pattern "${pattern.source}":`, error);
          continue;
        }
      }
    }
    
    // Fallback to native Date parsing
    try {
      const date = new Date(text);
      if (!isNaN(date.getTime())) {
        // If the parsed year is in the past, assume it's next year
        const now = new Date();
        if (date.getFullYear() < now.getFullYear()) {
          date.setFullYear(now.getFullYear() + 1);
        }
        return date;
      }
    } catch (error) {
      console.log(`⚠️ Native Date parsing failed for: "${text}"`);
    }
    
    return null;
  }

  /**
   * Search for deadline information in page text when selectors fail
   */
  private static searchForDeadlineInText($: any): string | null {
    const deadlineKeywords = [
      'deadline', 'closing date', 'application deadline', 'due date', 'expires',
      'last date', 'final date', 'cutoff date', 'end date', 'submission deadline',
      'application due', 'closing', 'expiry', 'deadline:', 'closes on', 'ends on'
    ];
    
    const textContent = $('body').text().toLowerCase();
    
    for (const keyword of deadlineKeywords) {
      const regex = new RegExp(`${keyword}[\\s:]*([^\\n\\r]{10,50})`, 'gi');
      const matches = textContent.match(regex);
      
      if (matches) {
        for (const match of matches) {
          const extracted = match.replace(new RegExp(keyword, 'gi'), '').trim();
          if (extracted && extracted.length > 5 && extracted.length < 50) {
            // Check if it contains date-like content
            if (/\d/.test(extracted) && (/\d{4}/.test(extracted) || /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(extracted))) {
              return extracted;
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Normalize and validate deadline dates
   */
  private static normalizeDeadlineDate(deadline: any): Date | null {
    if (!deadline) return null;
    
    try {
      let date: Date;
      
      if (deadline instanceof Date) {
        date = deadline;
      } else if (typeof deadline === 'string') {
        // Try parsing the string
        date = new Date(deadline);
      } else {
        console.log(`⚠️ Invalid deadline type: ${typeof deadline}`);
        return null;
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.log(`⚠️ Invalid deadline date: ${deadline}`);
        return null;
      }
      
      // Check for reasonable date ranges
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 1, 0, 1); // 1 year ago
      const maxDate = new Date(now.getFullYear() + 2, 11, 31); // 2 years from now
      
      if (date < minDate || date > maxDate) {
        console.log(`⚠️ Deadline date out of reasonable range: ${date.toISOString()}`);
        return null;
      }
      
      // Set time to end of day for deadlines
      date.setHours(23, 59, 59, 999);
      
      return date;
    } catch (error) {
      console.log(`⚠️ Error normalizing deadline: ${error}`);
      return null;
    }
  }

  /**
   * Helper function to extract JSON from AI responses
   */
  private static extractJsonFromResponse(text: string): any {
    let jsonText = text.trim();
    
    // Remove markdown code blocks more aggressively
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    jsonText = jsonText.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    
    // Find JSON object boundaries
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }
    
    // Clean up common JSON issues
    jsonText = jsonText
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/\n/g, ' ')     // Replace newlines with spaces
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim();
    
    try {
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Failed to parse JSON from AI response:', error);
      console.error('Cleaned JSON text:', jsonText.substring(0, 200) + '...');
      
      // Try to extract partial data as fallback
      try {
        const partialMatch = jsonText.match(/"title"\s*:\s*"([^"]+)"/);
        if (partialMatch) {
          console.log('⚠️ Using partial JSON extraction as fallback');
          return {
            title: partialMatch[1],
            description: 'Partial data extracted',
            company: 'Company Not Specified',
            location: 'Location Not Specified',
            jobType: 'full_time',
            category: 'jobs',
            experienceLevel: 'mid_level',
            educationLevel: 'bachelor',
            skills: ['General Skills'],
            requirements: ['See job description for requirements'],
            responsibilities: ['See job description for responsibilities'],
            benefits: [],
            salary: null,
            applicationDeadline: null,
            postedDate: null,
            contactInfo: {
              email: null,
              phone: null,
              website: null,
              address: null,
              contactPerson: null,
              applicationInstructions: null
            }
          };
        }
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError);
      }
      
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
      
      this.lastVersionCheck = now!;
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
   * Extract content with iframe handling for job descriptions
   */
  private static async extractContentWithIframeHandling(page: any, url: string): Promise<string> {
    try {
      // First, get the main page content
      let html = await page.content();
      
      // Check if the page contains iframes that might have job content
      const iframes = await page.$$('iframe');
      console.log(`🔍 Found ${iframes.length} iframes on ${url}`);
      
      if (iframes.length > 0) {
        // Get all frames (including iframes)
        const frames = page.frames();
        console.log(`🔍 Found ${frames.length} total frames on ${url}`);
        
        // Look for frames that contain job-related content
        for (const frame of frames) {
          try {
            const frameUrl = frame.url();
            console.log(`🔍 Checking frame: ${frameUrl}`);
            
            // Skip external tracking frames
            if (frameUrl.includes('googletagmanager.com') || 
                frameUrl.includes('google-analytics.com') ||
                frameUrl.includes('doubleclick.net') ||
                frameUrl.includes('facebook.com') ||
                frameUrl.includes('twitter.com')) {
              continue;
            }
            
            // Try to extract content from this frame
            const frameContent = await frame.content();
            
            // Check if this frame has substantial content (likely job description)
            if (frameContent && frameContent.length > 500) {
              // Look for job-related selectors in the frame
              const jobSelectors = [
                '.job-description', '.vacancy-description', '.description', 
                '.content', '.summary', 'main', 'article', 'body',
                '.requirements', '.qualifications', '.responsibilities',
                '.duties', '.skills', '.benefits'
              ];
              
              let hasJobContent = false;
              for (const selector of jobSelectors) {
                try {
                  const element = await frame.$(selector);
                  if (element) {
                    const text = await frame.evaluate((el: any) => el.textContent, element);
                    if (text && text.length > 100) {
                      hasJobContent = true;
                      console.log(`✅ Found job content in frame with selector: ${selector}`);
                      break;
                    }
                  }
                } catch (selectorError) {
                  // Continue to next selector
                }
              }
              
              if (hasJobContent) {
                console.log(`✅ Using content from iframe: ${frameUrl}`);
                return frameContent;
              }
            }
          } catch (frameError: unknown) {
            console.log(`⚠️ Error accessing frame: ${(frameError as Error).message}`);
            continue;
          }
        }
      }
      
      // If no iframe content found, return main page content
      console.log(`📄 Using main page content for ${url}`);
      return html;
      
    } catch (error) {
      console.error(`❌ Error in iframe handling for ${url}:`, error);
      // Fallback to main page content
      return await page.content();
    }
  }

  /**
   * Create system user for external jobs
   */
  private static async createSystemUser(): Promise<any> {
    const systemUser = new User({
      firstName: 'Excellence',
      lastName: 'Coaching Hub',
      email: this.DEFAULT_EMPLOYER_EMAIL,
      password: 'system_user_password_123', // Add required password field
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
   * Fetch webpage with enhanced error handling and retry logic
   */
  private static async fetchWebpage(url: string, config: JobSourceConfig): Promise<string> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 Attempt ${attempt}/${maxRetries} to fetch: ${url}`);
        
        // Set up headers
        const headersToSet: Record<string, string> = {};
        for (const key in config.headers) {
          if (Object.prototype.hasOwnProperty.call(config.headers, key)) {
            headersToSet[key] = config.headers[key]!;
          }
        }
        
        // Special handling for specific sites
        if (url.includes('mifotra.gov.rw')) {
          console.log('🔄 Applying Mifotra-specific handling...');
          
          // Use Puppeteer for JavaScript-heavy sites
          const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
        } else if (url.includes('workingnomads.com')) {
          // Special handling for WorkingNomads with reduced timeout
          console.log('🔄 Applying WorkingNomads-specific handling...');
          
          // Use Puppeteer with reduced timeout for WorkingNomads
          const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          
          try {
            const page = await browser.newPage();
            
            // Apply configuration with reduced timeouts for WorkingNomads
            const puppeteerConfig = (config as any).puppeteerConfig || {};
            const timeout = 15000; // Reduced timeout for WorkingNomads specifically
            const waitUntil = 'domcontentloaded'; // Faster loading strategy
            const viewport = puppeteerConfig.viewport || { width: 1920, height: 1080 };
            const userAgent = puppeteerConfig.userAgent || config.headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            
            await page.setViewport(viewport);
            await page.setUserAgent(userAgent);
            await page.setExtraHTTPHeaders(headersToSet);
            
            // Navigate to page with multiple strategies and reduced timeouts
            let navigationSuccess = false;
            const strategies = [
              () => page.goto(url, { waitUntil, timeout }),
              () => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }),
              () => page.goto(url, { waitUntil: 'load', timeout: 20000 })
            ];
            
            for (const strategy of strategies) {
              try {
                await strategy();
                navigationSuccess = true;
                break;
              } catch (commitError: unknown) { // Add type annotation
                console.log(`⚠️ Navigation strategy failed: ${(commitError as Error).message}`);
                continue;
              }
            }
            
            if (!navigationSuccess) {
              throw new Error('All navigation strategies failed');
            }
            
            // Mifotra-specific enhancements
            if (url.includes('mifotra.gov.rw')) {
              try {
                // Wait for content to load
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Scroll to load dynamic content
                const linkCount = await page.evaluate(() => {
                  return document.querySelectorAll('a').length;
                });
                console.log(`🔗 Initial link count: ${linkCount}`);
                
                // Scroll to bottom to trigger lazy loading
                await page.evaluate(() => {
                  window.scrollTo(0, document.body.scrollHeight);
                });
                
                // Wait for new content
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const newLinkCount = await page.evaluate(() => {
                  // Type assertion to avoid TypeScript errors in Node.js environment
                  return (document as any).querySelectorAll('a').length;
                });
                console.log(`🔗 Link count after scroll: ${newLinkCount}`);
                
                // Click "Load More" buttons if present
                const loadMoreButtons = await page.$$('.load-more, .load-more-button, [data-load-more], button:contains("Load"), button:contains("More")');
                for (const button of loadMoreButtons) {
                  try {
                    await button.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  } catch (buttonError) {
                    console.log('⚠️ Could not click load more button');
                  }
                }
              } catch (evalError: unknown) { // Add type annotation
                console.log(`⚠️ Mifotra-specific checks failed: ${(evalError as Error).message}`);
              }
            }
            
            // Extract content with iframe handling
            const content = await this.extractContentWithIframeHandling(page, url);
            await browser.close();
            return content;
            
          } catch (pageError) {
            await browser.close();
            throw pageError;
          }
        } else if (config.requiresJS) {
          // Standard Puppeteer handling for JS-requiring sites
          const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          
          try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent(config.headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders(headersToSet);
            
            await page.goto(url, { 
              waitUntil: 'domcontentloaded', // Faster loading
              timeout: 15000 // Reduced timeout for better performance
            });
            
            const content = await page.content();
            await browser.close();
            return content;
            
          } catch (pageError) {
            await browser.close();
            throw pageError;
          }
        } else {
          // Standard HTTP request for static sites
          const response = await axios.get(url, {
            headers: headersToSet,
            timeout: 10000 // Reduced timeout for better performance
          });
          
          return response.data;
        }
        
      } catch (error) {
        lastError = error as Error;
        
        // Handle specific timeout errors
        if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('TIMEDOUT'))) {
          console.log(`⏱️ Attempt ${attempt} timed out for ${url}`);
        } else {
          console.log(`⚠️ Attempt ${attempt} failed:`, error);
        }
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Make sure we always return or throw
    if (lastError) {
      throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts: ${lastError?.message}`);
    }
    
    // This should never be reached, but TypeScript needs it for type safety
    throw new Error(`Failed to fetch ${url} - unknown error occurred`);
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
          
          let html: string;
          try {
            html = await this.fetchWebpage(pageUrl, source);
          } catch (error: any) {
            // Handle specific HTTP errors during pagination
            if (error.message?.includes('status code 500') || error.message?.includes('status code 404')) {
              console.log(`⚠️ Page ${pageNum} returned ${error.message.includes('500') ? '500' : '404'} error, stopping pagination for this path`);
              break; // Stop pagination for this path, but continue with next paths
            }
            throw error; // Re-throw other errors
          }
          
          // Debug HTML content for workingnomads (minimal)
          if (source.name === 'workingnomads') {
            console.log(`📄 HTML length: ${html.length}, Contains jobs: ${html.includes('/jobs/')}`);
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
                  console.log(`✅ Valid job URL found: ${fullUrl}`);
                } else if (!source.urlFilter(fullUrl)) {
                  console.log(`❌ URL filtered out: ${fullUrl}`);
                }
                }
              }
            });
            
            selectorResults[selector] = selectorUrlCount;
          }
          
          // Debug selector performance for workingnomads, unjobnet, and mifotra
          if (source.name === 'workingnomads' || source.name === 'unjobnet' || source.name === 'mifotra-recruitment') {
            console.log(`🔍 Selector Results for ${source.name} on path ${path}:`);
            Object.entries(selectorResults).forEach(([selector, count]) => {
              if (count > 0) {
                console.log(`   ✅ ${selector}: ${count} URLs`);
              } else {
                console.log(`   ❌ ${selector}: ${count} URLs`);
              }
            });
            
            // Enhanced debugging for mifotra
            if (source.name === 'mifotra-recruitment') {
              console.log(`🔍 Enhanced Mifotra debugging for path: ${path}`);
              console.log(`📄 HTML length: ${html.length}`);
              console.log(`🔗 Total links found: ${$('a').length}`);
              
              // Check for common job-related content
              const hasJobKeywords = html.toLowerCase().includes('vacancy') || 
                                   html.toLowerCase().includes('recruitment') || 
                                   html.toLowerCase().includes('position') ||
                                   html.toLowerCase().includes('job');
              console.log(`📋 Contains job keywords: ${hasJobKeywords}`);
              
              // Check for specific patterns
              const recruitmentLinks = $('a[href*="recruitment"]').length;
              const vacancyLinks = $('a[href*="vacancy"]').length;
              const jobLinks = $('a[href*="job"]').length;
              console.log(`🔗 Recruitment links: ${recruitmentLinks}, Vacancy links: ${vacancyLinks}, Job links: ${jobLinks}`);
              
              // Sample links for debugging
              const sampleLinks = $('a').slice(0, 15).map((i, el) => {
                const href = $(el).attr('href');
                const text = $(el).text().trim().substring(0, 50);
                return `${href} - "${text}"`;
              }).get();
              console.log(`📋 Sample links:`, sampleLinks);
              
              // Check if page has dynamic content indicators
              const hasScripts = $('script').length;
              const hasForms = $('form').length;
              console.log(`⚙️ Scripts: ${hasScripts}, Forms: ${hasForms}`);
              
              if (pageJobUrls.length === 0) {
                console.log(`❌ No job URLs found for Mifotra path: ${path}`);
                console.log(`🔍 Trying alternative selectors...`);
                
                // Try alternative selectors
                const altSelectors = [
                  'a[href*="/"]',
                  'a[href*="mifotra"]',
                  'a[href*="gov.rw"]',
                  '.content a',
                  'main a',
                  'article a'
                ];
                
                for (const selector of altSelectors) {
                  const altLinks = $(selector).length;
                  if (altLinks > 0) {
                    console.log(`✅ Found ${altLinks} links with selector: ${selector}`);
                    const altSample = $(selector).slice(0, 5).map((i, el) => $(el).attr('href')).get();
                    console.log(`📋 Sample:`, altSample);
                  }
                }
              } else {
                console.log(`✅ Found ${pageJobUrls.length} job URLs for Mifotra`);
              }
            }
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
  private static extractTextContent($: any, selectors: string[]): string {
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
  private static extractArrayContent($: any, selectors: string[]): string[] {
    const items: string[] = [];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length) {
        elements.each((_: any, el: any) => {
          const text = $(el).text().trim();
          if (text) {
            // Split by common delimiters and add to items
            const splitItems = text.split(/[,;•\n]/).map((item: string) => item.trim()).filter((item: string) => item);
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
      
      // Enhanced iframe and tracking content filtering
      if (!description || description.length < 100 || 
          description.includes('Toggle navigation') || 
          description.includes('<iframe') ||
          this.containsTrackingContent(description)) {
        console.log('🔄 Using enhanced fallback description extraction...');
        const fallbackSelectors = [
          '.job-description', 
          '.vacancy-description', 
          '.description:not(:contains("googletagmanager"))',
          'main:not(:contains("googletagmanager"))',
          'article:not(:contains("googletagmanager"))',
          '.content-wrapper:not(:contains("googletagmanager"))'
        ];
        description = this.extractTextContent($, fallbackSelectors);
        
        // Clean up fallback description more aggressively
        if (description) {
          description = this.cleanDescriptionContent(description);
        }
        
        // If still no good description, try to extract from body text
        if (!description || description.length < 100) {
          console.log('🔄 Extracting from body text with enhanced filtering...');
          const bodyText = $('body').text();
          if (bodyText && bodyText.length > 200) {
            // Remove navigation and common non-content elements
            let cleanedText = bodyText
              .replace(/Toggle navigation.*?(?=\n|\r|$)/gi, '')
              .replace(/Navigation.*?(?=\n|\r|$)/gi, '')
              .replace(/Menu.*?(?=\n|\r|$)/gi, '')
              .replace(/Login.*?(?=\n|\r|$)/gi, '')
              .replace(/Sign up.*?(?=\n|\r|$)/gi, '')
              .replace(/Cookie.*?(?=\n|\r|$)/gi, '')
              .replace(/Privacy.*?(?=\n|\r|$)/gi, '')
              .replace(/Terms.*?(?=\n|\r|$)/gi, '')
              .replace(/googletagmanager\.com.*?ns\.html.*?display:none;visibility:hidden/gi, '')
              .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
              .replace(/<script[^>]*>.*?<\/script>/gi, '')
              .replace(/<style[^>]*>.*?<\/style>/gi, '')
              .replace(/\s+/g, ' ')
              .trim();
            
            // Additional tracking content filtering
            cleanedText = this.cleanDescriptionContent(cleanedText);
            
            if (cleanedText.length > 200 && !this.containsTrackingContent(cleanedText)) {
              description = cleanedText.substring(0, 2000); // Limit to 2000 chars
              console.log(`📝 Extracted description from body text (${description.length} chars)`);
            }
          }
        }
      }
      
      // Extract posted date
      const postedDateText = source.selectors.postedDate ? this.extractTextContent($, source.selectors.postedDate) : '';
      const postedDate = this.parseJobDate(postedDateText);
      
      // Extract application deadline
      const deadlineText = source.selectors.deadline ? this.extractTextContent($, source.selectors.deadline) : '';
      const applicationDeadline = this.extractDeadline($, deadlineText);
      
      if (!title || !description) {
        console.log(`❌ Missing essential data (title: ${!!title}, description: ${!!description})`);
        return null;
      }

      // Extract additional details
      const requirements = this.extractArrayContent($, source.selectors.requirements);
      const responsibilities = this.extractArrayContent($, source.selectors.responsibilities);
      const benefits = source.selectors.benefits ? this.extractArrayContent($, source.selectors.benefits) : [];
      
      // Extract application instructions and contact information
      const applicationInstructions = source.selectors.applicationInstructions ? 
        this.extractTextContent($, source.selectors.applicationInstructions) : '';
      const contactInfoText = source.selectors.contactInfo ? 
        this.extractTextContent($, source.selectors.contactInfo) : '';
      
      // Debug extracted data
      console.log(`📋 Extracted data - Requirements: ${requirements.length}, Responsibilities: ${responsibilities.length}, Benefits: ${benefits.length}`);
      console.log(`📞 Contact & Application info - Instructions: ${applicationInstructions ? 'Found' : 'None'}, Contact: ${contactInfoText ? 'Found' : 'None'}`);
      
      console.log(`📅 Posted date found: "${postedDateText}" -> ${postedDate?.toDateString() || 'not parsed'}`);
      console.log(`📅 Application deadline found: "${deadlineText}" -> ${applicationDeadline?.toDateString() || 'not parsed'}`);
      
      // Use AI to enhance and standardize the job data
      let enhancedJobData = await this.enhanceJobDataWithAI({
        title,
        company: company || 'Not specified',
        location: location || 'Remote/Not specified',
        description,
        requirements,
        responsibilities,
        benefits,
        applicationInstructions,
        contactInfoText,
        sourceUrl: jobUrl,
        postedDate: postedDate,
        applicationDeadline: applicationDeadline
      });

      if (!enhancedJobData) {
        console.log(`❌ AI processing failed for job: ${title}, creating fallback job data`);
        // Create fallback job data to ensure job is saved
        enhancedJobData = {
          title: title || 'Job Title Not Available',
          description: description || 'Job description not available',
          company: this.extractCompanyFromTitle(title) || 'Company Not Specified',
          location: 'Location Not Specified',
          jobType: JobType.FULL_TIME,
          category: JobCategory.JOBS,
          experienceLevel: ExperienceLevel.MID_LEVEL,
          educationLevel: EducationLevel.BACHELOR,
          skills: ['General Skills'],
          requirements: ['See job description for requirements'],
          responsibilities: ['See job description for responsibilities'],
          benefits: [],
          externalApplicationUrl: jobUrl,
          externalJobId: this.extractJobId(jobUrl)
        };
      }

      const result: Partial<ScrapedJobData> = {
        title: enhancedJobData ? enhancedJobData.title : title || 'Job Title Not Available',
        description: enhancedJobData ? enhancedJobData.description : description || 'Job description not available',
        company: enhancedJobData ? enhancedJobData.company : this.extractCompanyFromTitle(title) || 'Company Not Specified',
        location: enhancedJobData ? enhancedJobData.location : 'Location Not Specified',
        jobType: enhancedJobData ? enhancedJobData.jobType : JobType.FULL_TIME,
        category: enhancedJobData && enhancedJobData.category ? enhancedJobData.category : JobCategory.JOBS,
        experienceLevel: enhancedJobData ? enhancedJobData.experienceLevel : ExperienceLevel.MID_LEVEL,
        educationLevel: enhancedJobData ? enhancedJobData.educationLevel : EducationLevel.BACHELOR,
        skills: enhancedJobData ? enhancedJobData.skills : ['General Skills'],
        requirements: enhancedJobData ? enhancedJobData.requirements : ['See job description for requirements'],
        responsibilities: enhancedJobData ? enhancedJobData.responsibilities : ['See job description for responsibilities'],
        benefits: enhancedJobData ? enhancedJobData.benefits : [],
        externalApplicationUrl: jobUrl,
        externalJobId: this.extractJobId(jobUrl)
      };
      
      // Only add optional properties if they have values
      if (enhancedJobData && enhancedJobData.salary !== undefined) {
        result.salary = enhancedJobData.salary;
      }
      if (enhancedJobData && enhancedJobData.applicationDeadline !== undefined) {
        result.applicationDeadline = enhancedJobData.applicationDeadline;
      }
      if (enhancedJobData && enhancedJobData.postedDate !== undefined) {
        result.postedDate = enhancedJobData.postedDate;
      } else if (postedDate) {
        result.postedDate = postedDate;
      }
      if (enhancedJobData && enhancedJobData.contactInfo !== undefined) {
        result.contactInfo = enhancedJobData.contactInfo;
      }
      
      return result as ScrapedJobData;

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
        Application Instructions: ${rawJobData.applicationInstructions || 'Not specified'}
        Contact Information: ${rawJobData.contactInfoText || 'Not specified'}

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
          "applicationDeadline": "2025-09-15T23:59:59.000Z or null",
          "postedDate": "2024-09-08T00:00:00.000Z or null",
          "contactInfo": {
            "email": "contact@company.com or null",
            "phone": "phone number or null",
            "website": "company website or null",
            "address": "physical address or null",
            "contactPerson": "contact person name or null",
            "applicationInstructions": "detailed application instructions or null"
          }
        }

        Rules:
        - Keep original job title but clean it up
        - For jobType: Use exact values - "full_time", "part_time", "contract", "freelance", or "internship" (default: "full_time")
        - For category: Always use "jobs"
        - For experienceLevel: Use exact values - "entry_level", "mid_level", "senior_level", or "executive" (default: "mid_level")
        - For educationLevel: Use exact values - "high_school", "associate", "bachelor", "master", "doctorate", or "professional" (default: "bachelor")
        - Extract 3-8 relevant skills
        - CRITICAL: For applicationDeadline, look for patterns like:
          * "Deadline 8 September 2025" -> convert to "2025-09-08T23:59:59.000Z"
          * "Deadline: 30 September, 2025" -> convert to "2025-09-30T23:59:59.000Z"  
          * "(Deadline 8 September 2025)" -> convert to "2025-09-08T23:59:59.000Z"
          * "Apply before October 5, 2025" -> convert to "2025-10-05T23:59:59.000Z"
          * "Closing date: 15 Dec 2025" -> convert to "2025-12-15T23:59:59.000Z"
          * "Application deadline: 2025-11-30" -> convert to "2025-11-30T23:59:59.000Z"
          * "Due date: 25/12/2025" -> convert to "2025-12-25T23:59:59.000Z"
          * "Expires on: January 10, 2026" -> convert to "2026-01-10T23:59:59.000Z"
          * "Last date for application: 2025-10-15" -> convert to "2025-10-15T23:59:59.000Z"
          * "Submission deadline: 20 November 2025" -> convert to "2025-11-20T23:59:59.000Z"
          * Look for date patterns in the title, description, contact information, and application instructions
          * Search for keywords: "deadline", "closing date", "due date", "expires", "last date", "final date", "cutoff date", "end date", "submission deadline"
          * Handle various date formats: DD Month YYYY, Month DD YYYY, YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
          * If no clear deadline found, return null
          * ALWAYS use proper ISO 8601 format with timezone Z
          * Set time to end of day (23:59:59) for deadlines
          * CRITICAL: If year is not specified, assume current year or next year based on context
          * CRITICAL: September 8, 2025 should be "2025-09-08T23:59:59.000Z" (year 2025 is future)
        - Include 3-6 key requirements
        - Include 3-6 main responsibilities
        - Include benefits if mentioned
        - IMPORTANT: Extract all contact information from the job posting:
          * Look for email addresses (like contact@company.com, hr@company.com, apply@company.com)
          * Do NOT use placeholder emails like [email protected], your@email.com, email@company.com
          * Look for phone numbers (including country codes)
          * Look for company websites or application portals
          * Look for physical addresses or office locations
          * Look for contact person names (HR Manager, Hiring Manager, etc.)
          * Extract company name from the title if needed (e.g., "Agronomist at Association Mwana Ukundwa (AMU)" -> company: "Association Mwana Ukundwa (AMU)")
        - CRITICAL: Extract detailed application instructions from the job posting:
          * Look for phrases like "How to Apply", "Application Procedure", "To Apply"
          * Include specific requirements like "send CV and cover letter to"
          * Include application methods (email, online portal, physical submission)
          * Include required documents (CV, certificates, portfolio, etc.)
          * Include application deadlines if mentioned
          * Include any special instructions or requirements
        - Return null only if the specific field is completely missing from the job posting
      `;

      const aiResponse = await aiManager.generateContent(prompt);
      
      if (!aiResponse || typeof aiResponse !== 'string' || aiResponse.trim().length === 0) {
        console.error('❌ AI response failed:', { type: typeof aiResponse, length: aiResponse?.length || 0 });
        throw new Error('AI processing failed');
      }

      console.log('🤖 AI Response received:', aiResponse.substring(0, 200) + '...');
      
      let jobData;
      try {
        jobData = this.extractJsonFromResponse(aiResponse);
      } catch (parseError) {
        console.error('❌ JSON parsing failed, using fallback extraction');
        // Extract basic info from raw response as fallback
        const titleMatch = aiResponse.match(/"title"\s*:\s*"([^"]+)"/);
        const companyMatch = aiResponse.match(/"company"\s*:\s*"([^"]+)"/);
        const descriptionMatch = aiResponse.match(/"description"\s*:\s*"([^"]+)"/);
        
        jobData = {
          title: titleMatch ? titleMatch[1] : rawJobData.title || 'Job Title Not Available',
          company: companyMatch ? companyMatch[1] : this.extractCompanyFromTitle(rawJobData.title) || 'Company Not Specified',
          description: descriptionMatch ? descriptionMatch[1] : rawJobData.description || 'Job description not available',
          location: 'Location Not Specified',
          jobType: JobType.FULL_TIME,
          category: JobCategory.JOBS,
          experienceLevel: ExperienceLevel.MID_LEVEL,
          educationLevel: EducationLevel.BACHELOR,
          skills: ['General Skills'],
          requirements: ['See job description for requirements'],
          responsibilities: ['See job description for responsibilities'],
          benefits: [],
          salary: undefined,
          applicationDeadline: undefined,
          postedDate: undefined,
          contactInfo: {
            email: undefined,
            phone: undefined,
            website: undefined,
            address: undefined,
            contactPerson: undefined,
            applicationInstructions: undefined
          }
        };
        console.log('✅ Fallback extraction successful');
      }
      
      // Parse date strings to Date objects with enhanced logging
      if (jobData.applicationDeadline && typeof jobData.applicationDeadline === 'string') {
        try {
          console.log(`📅 AI extracted deadline string: "${jobData.applicationDeadline}"`);
          const originalDeadline = jobData.applicationDeadline;
          
          // Try to parse with our enhanced parser first
          const parsedDeadline = this.parseDeadlineText(jobData.applicationDeadline);
          if (parsedDeadline) {
            jobData.applicationDeadline = parsedDeadline;
            console.log(`✅ Enhanced parser successfully parsed deadline: ${parsedDeadline.toISOString()}`);
          } else {
            // Fallback to native Date parsing
            jobData.applicationDeadline = new Date(jobData.applicationDeadline);
            if (isNaN(jobData.applicationDeadline.getTime())) {
              console.log(`⚠️ Both enhanced and native parsing failed for deadline: "${originalDeadline}", setting to null`);
              jobData.applicationDeadline = null;
            } else {
              console.log(`📅 Native parser successfully parsed deadline: ${jobData.applicationDeadline.toISOString()}`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Failed to parse application deadline: "${jobData.applicationDeadline}", error: ${error}, setting to null`);
          jobData.applicationDeadline = null;
        }
      } else if (jobData.applicationDeadline) {
        console.log(`📅 AI provided deadline as ${typeof jobData.applicationDeadline}: ${jobData.applicationDeadline}`);
      }
      
      if (jobData.postedDate && typeof jobData.postedDate === 'string') {
        try {
          jobData.postedDate = new Date(jobData.postedDate);
          if (isNaN(jobData.postedDate.getTime())) {
            console.log('⚠️ Invalid posted date format, setting to null');
            jobData.postedDate = null;
          }
        } catch (error) {
          console.log('⚠️ Failed to parse posted date, setting to null');
          jobData.postedDate = null;
        }
      }
      
      // Validate and provide fallbacks for required fields
      if (!jobData.title) {
        console.log('⚠️ AI response missing title, using extracted title');
        jobData.title = rawJobData.title || 'Job Title Not Available';
      }
      
      if (!jobData.description) {
        console.log('⚠️ AI response missing description, using extracted description');
        jobData.description = rawJobData.description || 'Job description not available';
      }
      
      if (!jobData.company) {
        console.log('⚠️ AI response missing company, extracting from title or using default');
        // Try to extract company from title with Rwanda-specific patterns
        const companyMatch = rawJobData.title?.match(/at\s+([^,]+)|@\s*([^,]+)|-\s*([^,]+)|:\s*([^,]+)/i);
        if (companyMatch) {
          jobData.company = (companyMatch[1] || companyMatch[2] || companyMatch[3] || companyMatch[4]).trim();
        } else {
          // For Rwanda jobs, try to extract from URL patterns
          const urlMatch = rawJobData.sourceUrl?.match(/rwandajob\.com\/job-vacancies-[a-z]+\/([a-z0-9-]+)/);
          if (urlMatch) {
            jobData.company = 'Company Not Specified';
          } else {
            jobData.company = 'Company Not Specified';
          }
        }
      }
      
      // Ensure other critical fields have defaults
      if (!jobData.jobType) {
        jobData.jobType = 'full_time';
      }
      
      if (!jobData.category) {
        jobData.category = 'jobs';
      }
      
      if (!jobData.experienceLevel) {
        jobData.experienceLevel = 'mid_level';
      }
      
      if (!jobData.educationLevel) {
        jobData.educationLevel = 'bachelor';
      }
      
      if (!jobData.location) {
        jobData.location = 'Location Not Specified';
      }
      
      if (!jobData.skills || !Array.isArray(jobData.skills) || jobData.skills.length === 0) {
        jobData.skills = ['General Skills'];
      }
      
      if (!jobData.requirements || !Array.isArray(jobData.requirements) || jobData.requirements.length === 0) {
        jobData.requirements = ['See job description for requirements'];
      }
      
      if (!jobData.responsibilities || !Array.isArray(jobData.responsibilities) || jobData.responsibilities.length === 0) {
        jobData.responsibilities = ['See job description for responsibilities'];
      }
      
      console.log('✅ AI processing completed with fallbacks applied');

      return jobData;

    } catch (error) {
      console.error('❌ AI enhancement failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Extract company name from job title
   */
  private static extractCompanyFromTitle(title: string): string | null {
    if (!title) return null;
    
    // Common patterns for company extraction
    const patterns = [
      /at\s+([^,]+)/i,           // "Job Title at Company Name"
      /@\s*([^,]+)/i,            // "Job Title @ Company Name"
      /-\s*([^,]+)/i,            // "Job Title - Company Name"
      /:\s*([^,]+)/i,            // "Job Title: Company Name"
      /\(([^)]+)\)/i,            // "Job Title (Company Name)"
      /\[([^\]]+)\]/i,           // "Job Title [Company Name]"
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        // Filter out common non-company words
        if (!['remote', 'hybrid', 'full-time', 'part-time', 'contract', 'freelance'].includes(company.toLowerCase())) {
          return company;
        }
      }
    }
    
    return null;
  }

  /**
   * Normalize job type to valid enum values
   */
  private static normalizeJobType(jobType: string): JobType {
    if (!jobType) return JobType.FULL_TIME;
    
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

    return typeMapping[normalized] || JobType.FULL_TIME;
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
   * Save job to database
   */
  private static async saveJobToDatabase(
    jobData: ScrapedJobData, 
    employerId: string, 
    sourceUrl: string, 
    sourceName: string
  ): Promise<void> {
    try {
      // First, delete any expired jobs before saving new ones
      await Job.deleteExpiredJobs();
      // Handle expired deadline validation - if deadline is in the past, set status to EXPIRED
      let jobStatus = JobStatus.ACTIVE;
      let cleanedApplicationDeadline = jobData.applicationDeadline;
      
      if (jobData.applicationDeadline) {
        // Normalize and validate the deadline
        const normalizedDeadline = this.normalizeDeadlineDate(jobData.applicationDeadline);
        
        if (normalizedDeadline) {
          cleanedApplicationDeadline = normalizedDeadline;
          
          const now = new Date();
          now.setHours(0, 0, 0, 0); // Set to start of today for fair comparison
          
          const deadline = new Date(normalizedDeadline);
          deadline.setHours(23, 59, 59, 999); // Set to end of deadline day
          
          console.log(`🔍 Date comparison: Now=${now.toISOString()}, Deadline=${deadline.toISOString()}`);
          
          if (deadline < now) {
            console.log(`⏰ Job has expired deadline (${normalizedDeadline.toDateString()}), marking as EXPIRED`);
            jobStatus = JobStatus.EXPIRED;
          } else {
            console.log(`📅 Job deadline is valid (${normalizedDeadline.toDateString()}), keeping as ACTIVE`);
          }
        } else {
          console.log(`⚠️ Invalid deadline format, setting to undefined: ${jobData.applicationDeadline}`);
          cleanedApplicationDeadline = undefined;
        }
      }

      // Clean and validate contact info to avoid validation errors
      let cleanedContactInfo = jobData.contactInfo;
      if (cleanedContactInfo) {
        // Validate and clean email - remove placeholder emails and invalid formats
        if (cleanedContactInfo.email) {
          const email = cleanedContactInfo.email.toLowerCase().trim();
          const isPlaceholder = email.includes('[email') || email.includes('email@') || 
                                 email.includes('your@') || email.includes('contact@example') ||
                                 email.includes('@company') || email.includes('@yourcompany');
          const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          
          if (isPlaceholder || !isValidFormat) {
            console.log(`📧 Invalid or placeholder email detected (${cleanedContactInfo.email}), removing from contact info`);
            delete cleanedContactInfo.email;
          }
        }
        
        // If no valid contact info remains, provide fallback
        if (!cleanedContactInfo.email && !cleanedContactInfo.phone && !cleanedContactInfo.website && 
            !cleanedContactInfo.contactPerson && !cleanedContactInfo.applicationInstructions) {
          console.log(`📞 No valid contact info found, using external application URL`);
          cleanedContactInfo = {
            applicationInstructions: `Please apply through the original job posting: ${sourceUrl}`
          };
        }
      } else {
        // Provide fallback contact info if none exists
        console.log(`📞 No contact info provided, creating fallback instructions`);
        cleanedContactInfo = {
          applicationInstructions: `Please apply through the original job posting: ${sourceUrl}`
        };
      }

      // Check for existing job to prevent duplicates
      const existingJob = await Job.findOne({
        externalJobSource: sourceName,
        externalJobId: jobData.externalJobId
      });

      if (existingJob) {
        console.log(`⚠️ Job already exists: ${jobData.title} (${sourceName}:${jobData.externalJobId})`);
        return; // Skip saving this job
      }

      const job = new Job({
        title: jobData.title,
        description: jobData.description,
        company: jobData.company,
        location: jobData.location,
        jobType: this.normalizeJobType(jobData.jobType.toString()),
        category: jobData.category,
        experienceLevel: this.normalizeExperienceLevel(jobData.experienceLevel.toString()),
        educationLevel: jobData.educationLevel,
        skills: jobData.skills,
        requirements: jobData.requirements,
        responsibilities: jobData.responsibilities,
        benefits: jobData.benefits,
        salary: jobData.salary,
        applicationDeadline: cleanedApplicationDeadline,
        postedDate: jobData.postedDate,
        status: jobStatus,
        employer: employerId,
        isExternalJob: true,
        externalJobSource: sourceName,
        externalJobId: jobData.externalJobId,
        externalApplicationUrl: jobData.externalApplicationUrl,
        contactInfo: cleanedContactInfo,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await job.save();
      console.log(`💾 Saved job to database: ${jobData.title} at ${jobData.company} (Status: ${jobStatus})`);

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
              
              // Validate that this is a real job posting, not navigation/category content
              if (jobData && !this.isValidJobContent(jobData)) {
                console.log(`⚠️ Skipping non-job content: ${jobData.title} at ${jobData.company}`);
                continue;
              }
              
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

  /**
   * Check if content contains tracking/analytics code
   */
  private static containsTrackingContent(content: string): boolean {
    const trackingPatterns = [
      /googletagmanager\.com/,
      /google-analytics\.com/,
      /doubleclick\.net/,
      /facebook\.com.*\/tr\?/,
      /twitter\.com.*\/p\.html/,
      /linkedin\.com.*\/li\.js/,
      /hotjar\.com/,
      /mixpanel\.com/,
      /segment\.com/,
      /optimizely\.com/,
      /adobe\.com.*\/target/,
      /googlesyndication\.com/,
      /youtube\.com.*\/iframe_api/,
      /vimeo\.com.*\/player/,
      /analytics\.js/,
      /gtag\/js/,
      /gtm\.js/,
      /fbevents\.js/
    ];

    return trackingPatterns.some(pattern => pattern.test(content.toLowerCase()));
  }

  /**
   * Clean description content by removing tracking code and unwanted elements
   */
  private static cleanDescriptionContent(content: string): string {
    if (!content) return '';

    return content
      // Remove iframe tags and their content
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      // Remove script tags and their content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      // Remove style tags and their content
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      // Remove Google Tag Manager tracking code
      .replace(/googletagmanager\.com.*?ns\.html.*?display:none;visibility:hidden/gi, '')
      // Remove Google Analytics tracking code
      .replace(/ga\([^)]*\)/gi, '')
      // Remove Facebook Pixel tracking code
      .replace(/fbq\([^)]*\)/gi, '')
      // Remove LinkedIn Insight tracking code
      .replace(/_linkedin_partner_id\s*=\s*['"][^'"]*['"]/gi, '')
      // Remove generic tracking parameters
      .replace(/[?&](?:utm_[^&=]*|fbclid|gclid|msclkid)=[^&]*/gi, '')
      // Remove tracking pixel images
      .replace(/<img[^>]*src[^>]*googletagmanager\.com[^>]*>/gi, '')
      .replace(/<img[^>]*src[^>]*google-analytics\.com[^>]*>/gi, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Trim whitespace
      .trim();
  }

  /**
   * Validate if scraped content represents a real job posting
   */
  private static isValidJobContent(jobData: any): boolean {
    if (!jobData || !jobData.title || !jobData.description) {
      return false;
    }

    const title = jobData.title.toLowerCase();
    const description = jobData.description.toLowerCase();
    
    // Exclude navigation/category pages
    const excludePatterns = [
      'employment types', 'employment by', 'jobs by', 'jobs types',
      'categories', 'sectors', 'business sectors', 'cities',
      'not specified', 'remote/not specified', 'other employments',
      'employment links', 'job categories', 'vacancy types'
    ];
    
    const hasExcludePattern = excludePatterns.some(pattern => 
      title.includes(pattern) || description.includes(pattern)
    );
    
    if (hasExcludePattern) {
      return false;
    }
    
    // Must have meaningful content
    const hasMinDescription = jobData.description.length > 50;
    const hasRealCompany = jobData.company && 
                          !jobData.company.toLowerCase().includes('not specified') &&
                          jobData.company.length > 2;
    
    // Must contain job-related keywords
    const jobKeywords = [
      'responsibilities', 'requirements', 'qualifications', 'skills',
      'experience', 'education', 'degree', 'apply', 'application',
      'salary', 'benefits', 'full-time', 'part-time', 'contract',
      'deadline', 'start date', 'location', 'duties', 'role'
    ];
    
    const hasJobKeywords = jobKeywords.some(keyword => 
      description.includes(keyword) || title.includes(keyword)
    );
    
    // Check for tracking content
    const hasTrackingContent = this.containsTrackingContent(description);
    
    return hasMinDescription && hasRealCompany && hasJobKeywords && !hasTrackingContent;
  }

  // AI Scraping Prevention System - Prevent reprocessing jobs on the same day
  private static aiProcessingLog: Map<string, Date> = new Map();

  /**
   * Check if a job has already been processed with AI today
   */
  private static hasBeenProcessedToday(jobId: string): boolean {
    const lastProcessed = this.aiProcessingLog.get(jobId);
    if (!lastProcessed) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastProcessedDate = new Date(lastProcessed);
    lastProcessedDate.setHours(0, 0, 0, 0);

    return lastProcessedDate.getTime() === today.getTime();
  }

  /**
   * Mark a job as processed with AI today
   */
  private static markAsProcessed(jobId: string): void {
    this.aiProcessingLog.set(jobId, new Date());
    
    // Clean up old entries (older than 7 days) to prevent memory leaks
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    for (const [id, processedDate] of this.aiProcessingLog.entries()) {
      if (processedDate < oneWeekAgo) {
        this.aiProcessingLog.delete(id);
      }
    }
  }

  /**
   * Process jobs in chunks to avoid errors with long files
   */
  private static async processJobsInChunks<T>(
    items: T[], 
    processor: (item: T) => Promise<boolean>,
    chunkSize: number = 5
  ): Promise<{ successCount: number, errors: string[] }> {
    const results = {
      successCount: 0,
      errors: [] as string[]
    };

    // Process in chunks
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      console.log(`🔄 Processing chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(items.length/chunkSize)} (${chunk.length} items)`);

      // Process each item in the chunk
      for (let j = 0; j < chunk.length; j++) {
        try {
          const success = await processor(chunk[j]);
          if (success) {
            results.successCount++;
          }
        } catch (error) {
          const errorMsg = `Error processing item ${i + j}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }

      // Add delay between chunks to avoid rate limiting
      if (i + chunkSize < items.length) {
        console.log(`⏳ Waiting 30 seconds before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    return results;
  }
}
