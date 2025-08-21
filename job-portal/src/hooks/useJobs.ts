import { useState, useEffect } from 'react';
import { Job, JobFilters, PaginatedResponse } from '../types';
import jobService from '../services/jobService';

export const useJobs = (filters: JobFilters = {}, page = 1, limit = 10) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedResponse<Job> = await jobService.getJobs(filters, page, limit);
      setJobs(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [JSON.stringify(filters), page, limit]);

  const refetch = () => {
    fetchJobs();
  };

  return {
    jobs,
    loading,
    error,
    pagination,
    refetch
  };
};

export const useJob = (jobId: string) => {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      
      try {
        setLoading(true);
        setError(null);
        const jobData = await jobService.getJobById(jobId);
        setJob(jobData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch job');
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const refetch = async () => {
    if (!jobId) return;
    
    try {
      setLoading(true);
      setError(null);
      const jobData = await jobService.getJobById(jobId);
      setJob(jobData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch job');
    } finally {
      setLoading(false);
    }
  };

  return {
    job,
    loading,
    error,
    refetch
  };
};

export const useCuratedJobs = (page = 1, limit = 10) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    const fetchCuratedJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await jobService.getCuratedJobs(page, limit);
        setJobs(response.data);
        setPagination(response.pagination);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch curated jobs');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCuratedJobs();
  }, [page, limit]);

  return {
    jobs,
    loading,
    error,
    pagination
  };
};

export const useStudentJobs = (page = 1, limit = 10) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    const fetchStudentJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await jobService.getJobsForStudent(page, limit);
        setJobs(response.data);
        setPagination(response.pagination);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch student jobs');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentJobs();
  }, [page, limit]);

  return {
    jobs,
    loading,
    error,
    pagination
  };
};

export const useEmployerJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployerJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobsData = await jobService.getJobsByEmployer();
      setJobs(jobsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch employer jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployerJobs();
  }, []);

  const refetch = () => {
    fetchEmployerJobs();
  };

  return {
    jobs,
    loading,
    error,
    refetch
  };
};