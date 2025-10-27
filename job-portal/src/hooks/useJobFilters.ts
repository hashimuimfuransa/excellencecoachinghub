import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { matchesWorkLocationFilter } from '../utils/workLocationUtils';

export interface FilterState {
  searchTerm: string;
  searchType?: 'all' | 'title' | 'company' | 'skills' | 'location' | 'category';
  location: string;
  jobTypes: string[];
  workLocation: string[];
  salaryRange: [number, number];
  experienceLevel: string[];
  categories: string[];
  companies: string[];
  postedDate: string;
  sortBy: string;
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  category?: string;
  jobType?: string;
  experienceLevel?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  skills?: string[];
  skillsRequired?: string[];
  remote?: boolean;
  createdAt: string | Date;
  applicationDeadline?: string | Date;
  isExternalJob?: boolean;
}

interface UseJobFiltersProps {
  initialJobs: Job[];
  categories?: Array<{ key: string; label: string; count: number }>;
  syncWithUrl?: boolean;
}

interface UseJobFiltersReturn {
  filters: FilterState;
  filteredJobs: Job[];
  totalJobs: number;
  setFilters: (filters: FilterState) => void;
  updateFilter: (key: keyof FilterState, value: any) => void;
  updateSearchTerm: (searchTerm: string, searchType?: FilterState['searchType']) => void;
  updateSearchType: (searchType: FilterState['searchType']) => void;
  clearFilters: () => void;
  getActiveFiltersCount: () => number;
  isLoading: boolean;
  searchSuggestions: {
    popularJobs: Array<{ title: string; count: number }>;
    popularCompanies: Array<{ name: string; count: number }>;
    popularSkills: Array<{ name: string; count: number }>;
    popularLocations: Array<{ name: string; count: number }>;
    recentSearches: string[];
    trendingSearches: string[];
  };
}

const defaultFilters: FilterState = {
  searchTerm: '',
  searchType: 'all',
  location: '',
  jobTypes: [],
  workLocation: [],
  salaryRange: [0, 200],
  experienceLevel: [],
  categories: [],
  companies: [],
  postedDate: 'all',
  sortBy: 'relevance'
};

// Helper function to calculate relevance score
const calculateRelevanceScore = (job: Job, searchTerm: string): number => {
  if (!searchTerm.trim()) return 1;
  
  let score = 0;
  const query = searchTerm.toLowerCase();
  
  // Title match (highest weight)
  if (job.title.toLowerCase().includes(query)) score += 10;
  
  // Company match
  if (job.company.toLowerCase().includes(query)) score += 5;
  
  // Skills match
  const allSkills = [...(job.skills || []), ...(job.skillsRequired || [])];
  const skillMatches = allSkills.filter(skill => 
    skill.toLowerCase().includes(query)
  ).length;
  score += skillMatches * 3;
  
  // Description match (lower weight)
  if (job.description.toLowerCase().includes(query)) score += 2;
  
  // Location match
  if (job.location.toLowerCase().includes(query)) score += 3;
  
  // Category match
  if (job.category?.toLowerCase().includes(query)) score += 4;
  
  return score;
};

// Helper function to check if job matches posted date filter
const matchesPostedDate = (job: Job, postedDate: string): boolean => {
  if (postedDate === 'all') return true;
  
  const now = new Date();
  const jobDate = new Date(job.createdAt);
  const diffTime = now.getTime() - jobDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  switch (postedDate) {
    case 'today':
      return diffDays <= 1;
    case 'week':
      return diffDays <= 7;
    case 'month':
      return diffDays <= 30;
    default:
      return true;
  }
};

// Helper function to sort jobs
const sortJobs = (jobs: Job[], sortBy: string, searchTerm: string): Job[] => {
  return [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        const scoreA = calculateRelevanceScore(a, searchTerm);
        const scoreB = calculateRelevanceScore(b, searchTerm);
        return scoreB - scoreA;
        
      case 'date':
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
        
      case 'salary-high':
        const salaryA = a.salary?.max || a.salary?.min || 0;
        const salaryB = b.salary?.max || b.salary?.min || 0;
        return salaryB - salaryA;
        
      case 'salary-low':
        const salaryALow = a.salary?.min || a.salary?.max || 0;
        const salaryBLow = b.salary?.min || b.salary?.max || 0;
        return salaryALow - salaryBLow;
        
      case 'title':
        return a.title.localeCompare(b.title);
        
      case 'company':
        return a.company.localeCompare(b.company);
        
      default:
        return 0;
    }
  });
};

export const useJobFilters = ({ 
  initialJobs = [], 
  categories = [], 
  syncWithUrl = true 
}: UseJobFiltersProps): UseJobFiltersReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize filters from URL or defaults
  const [filters, setFiltersState] = useState<FilterState>(() => {
    if (!syncWithUrl) return defaultFilters;
    
    return {
      searchTerm: searchParams.get('search') || '',
      searchType: (searchParams.get('searchType') as FilterState['searchType']) || 'all',
      location: searchParams.get('location') || '',
      jobTypes: searchParams.get('jobTypes')?.split(',').filter(Boolean) || [],
      workLocation: searchParams.get('workLocation')?.split(',').filter(Boolean) || [],
      salaryRange: [
        parseInt(searchParams.get('salaryMin') || '0'),
        parseInt(searchParams.get('salaryMax') || '200')
      ] as [number, number],
      experienceLevel: searchParams.get('experience')?.split(',').filter(Boolean) || [],
      categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
      companies: searchParams.get('companies')?.split(',').filter(Boolean) || [],
      postedDate: searchParams.get('postedDate') || 'all',
      sortBy: searchParams.get('sortBy') || 'relevance'
    };
  });

  // Update URL when filters change
  useEffect(() => {
    if (!syncWithUrl) return;
    
    const params = new URLSearchParams();
    
    if (filters.searchTerm) params.set('search', filters.searchTerm);
    if (filters.searchType && filters.searchType !== 'all') params.set('searchType', filters.searchType);
    if (filters.location) params.set('location', filters.location);
    if (filters.jobTypes.length > 0) params.set('jobTypes', filters.jobTypes.join(','));
    if (filters.workLocation.length > 0) params.set('workLocation', filters.workLocation.join(','));
    if (filters.salaryRange[0] > 0) params.set('salaryMin', filters.salaryRange[0].toString());
    if (filters.salaryRange[1] < 200) params.set('salaryMax', filters.salaryRange[1].toString());
    if (filters.experienceLevel.length > 0) params.set('experience', filters.experienceLevel.join(','));
    if (filters.categories.length > 0) params.set('categories', filters.categories.join(','));
    if (filters.companies.length > 0) params.set('companies', filters.companies.join(','));
    if (filters.postedDate !== 'all') params.set('postedDate', filters.postedDate);
    if (filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy);
    
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams, syncWithUrl]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    setIsLoading(true);
    
    let filtered = initialJobs;

    // Search term filter with type-specific search
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      const searchType = filters.searchType || 'all';
      
      filtered = filtered.filter(job => {
        switch (searchType) {
          case 'title':
            return job.title.toLowerCase().includes(searchLower);
          
          case 'company':
            return job.company.toLowerCase().includes(searchLower);
          
          case 'skills':
            return (job.skills && job.skills.some(skill => skill.toLowerCase().includes(searchLower))) ||
                   (job.skillsRequired && job.skillsRequired.some(skill => skill.toLowerCase().includes(searchLower)));
          
          case 'location':
            return job.location.toLowerCase().includes(searchLower);
          
          case 'category':
            return job.category && job.category.toLowerCase().includes(searchLower);
          
          case 'all':
          default:
            return job.title.toLowerCase().includes(searchLower) ||
                   job.company.toLowerCase().includes(searchLower) ||
                   job.description.toLowerCase().includes(searchLower) ||
                   (job.skills && job.skills.some(skill => skill.toLowerCase().includes(searchLower))) ||
                   (job.skillsRequired && job.skillsRequired.some(skill => skill.toLowerCase().includes(searchLower))) ||
                   job.location.toLowerCase().includes(searchLower) ||
                   (job.category && job.category.toLowerCase().includes(searchLower));
        }
      });
    }

    // Location filter with intelligent matching
    if (filters.location.trim()) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(job => {
        const jobLocationLower = job.location.toLowerCase();
        
        // Special handling for specific location types
        if (locationLower === 'remote') {
          return jobLocationLower.includes('remote') || 
                 jobLocationLower.includes('anywhere') ||
                 jobLocationLower.includes('work from home') ||
                 jobLocationLower.includes('wfh');
        }
        
        if (locationLower === 'international') {
          return !['kigali', 'musanze', 'huye', 'rubavu', 'rusizi', 'nyagatare', 'muhanga', 'rwamagana', 'rwanda'].some(rwandanLocation => 
            jobLocationLower.includes(rwandanLocation)
          ) && !jobLocationLower.includes('remote');
        }
        
        // Default substring matching for specific locations
        return jobLocationLower.includes(locationLower);
      });
    }

    // Job type filter
    if (filters.jobTypes.length > 0) {
      filtered = filtered.filter(job =>
        filters.jobTypes.includes(job.jobType?.toLowerCase() || 'full-time')
      );
    }

    // Work location filter (remote, hybrid, on-site)
    if (filters.workLocation.length > 0) {
      filtered = filtered.filter(job => 
        matchesWorkLocationFilter(job.location, filters.workLocation)
      );
    }

    // Salary range filter
    if (filters.salaryRange[0] > 0 || filters.salaryRange[1] < 200) {
      filtered = filtered.filter(job => {
        if (!job.salary) return filters.salaryRange[0] === 0;
        const jobMin = job.salary.min || 0;
        const jobMax = job.salary.max || jobMin;
        return jobMax >= filters.salaryRange[0] * 1000 && jobMin <= filters.salaryRange[1] * 1000;
      });
    }

    // Experience level filter
    if (filters.experienceLevel.length > 0) {
      filtered = filtered.filter(job =>
        filters.experienceLevel.some(exp =>
          job.experienceLevel?.toLowerCase().includes(exp)
        )
      );
    }

    // Categories filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(job => {
        const jobCategory = job.category?.toLowerCase() || '';
        
        // Handle special category filters
        if (filters.categories.includes('jobs')) {
          // If 'jobs' is selected, include all non-internship jobs
          if (jobCategory !== 'internships' && job.jobType !== 'internship') {
            return true;
          }
        }
        
        if (filters.categories.includes('internships')) {
          // If 'internships' is selected, include internship jobs
          if (jobCategory === 'internships' || job.jobType === 'internship') {
            return true;
          }
        }
        
        // For other specific categories, use direct matching
        const otherCategories = filters.categories.filter(cat => 
          cat !== 'jobs' && cat !== 'internships'
        );
        if (otherCategories.length > 0) {
          return otherCategories.includes(jobCategory);
        }
        
        return false;
      });
    }
    // If no categories are selected, show all opportunities (no filtering)

    // Companies filter
    if (filters.companies.length > 0) {
      filtered = filtered.filter(job =>
        filters.companies.some(company =>
          job.company.toLowerCase().includes(company.toLowerCase())
        )
      );
    }

    // Posted date filter
    filtered = filtered.filter(job => matchesPostedDate(job, filters.postedDate));

    // Sort jobs
    const sorted = sortJobs(filtered, filters.sortBy, filters.searchTerm);
    
    setTimeout(() => setIsLoading(false), 100); // Small delay to show loading state
    
    return sorted;
  }, [initialJobs, filters]);

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    const jobTitleCounts: Record<string, number> = {};
    const companyCounts: Record<string, number> = {};
    const skillCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};

    initialJobs.forEach(job => {
      // Count job titles (simplified)
      const titleWords = job.title.toLowerCase().split(' ');
      titleWords.forEach(word => {
        if (word.length > 3) {
          jobTitleCounts[word] = (jobTitleCounts[word] || 0) + 1;
        }
      });

      // Count companies
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;

      // Count skills
      [...(job.skills || []), ...(job.skillsRequired || [])].forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });

      // Count locations
      locationCounts[job.location] = (locationCounts[job.location] || 0) + 1;
    });

    return {
      popularJobs: Object.entries(jobTitleCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([title, count]) => ({ title, count })),
      
      popularCompanies: Object.entries(companyCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
      
      popularSkills: Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
      
      popularLocations: Object.entries(locationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
      
      recentSearches: typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('recentJobSearches') || '[]').slice(0, 5)
        : [],
      
      trendingSearches: [
        'Remote Developer',
        'Data Scientist',
        'Product Manager',
        'UX Designer',
        'Software Engineer'
      ]
    };
  }, [initialJobs]);

  // Save recent searches
  useEffect(() => {
    if (typeof window === 'undefined' || !filters.searchTerm.trim()) return;
    
    const recent = JSON.parse(localStorage.getItem('recentJobSearches') || '[]');
    const updated = [filters.searchTerm, ...recent.filter((s: string) => s !== filters.searchTerm)].slice(0, 10);
    localStorage.setItem('recentJobSearches', JSON.stringify(updated));
  }, [filters.searchTerm]);

  // Public methods
  const setFilters = useCallback((newFilters: FilterState) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateSearchTerm = useCallback((searchTerm: string, searchType?: FilterState['searchType']) => {
    setFiltersState(prev => ({ 
      ...prev, 
      searchTerm,
      searchType: searchType || prev.searchType || 'all'
    }));
  }, []);

  const updateSearchType = useCallback((searchType: FilterState['searchType']) => {
    setFiltersState(prev => ({ ...prev, searchType }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if (filters.location.trim()) count++;
    if (filters.jobTypes.length > 0) count++;
    if (filters.workLocation.length > 0) count++;
    if (filters.salaryRange[0] > 0 || filters.salaryRange[1] < 200) count++;
    if (filters.experienceLevel.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.companies.length > 0) count++;
    if (filters.postedDate !== 'all') count++;
    return count;
  }, [filters]);

  return {
    filters,
    filteredJobs,
    totalJobs: initialJobs.length,
    setFilters,
    updateFilter,
    updateSearchTerm,
    updateSearchType,
    clearFilters,
    getActiveFiltersCount,
    isLoading,
    searchSuggestions
  };
};