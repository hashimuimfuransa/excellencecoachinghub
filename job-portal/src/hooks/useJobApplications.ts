import { useState, useEffect } from 'react';
import { JobApplication, ApplicationFilters } from '../types';
import jobApplicationService from '../services/jobApplicationService';

export const useJobApplications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const applicationsData = await jobApplicationService.getUserApplications();
      setApplications(applicationsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const refetch = () => {
    fetchApplications();
  };

  const applyForJob = async (jobId: string, applicationData: any) => {
    try {
      const newApplication = await jobApplicationService.applyForJob(jobId, applicationData);
      setApplications(prev => [newApplication, ...prev]);
      return newApplication;
    } catch (error) {
      throw error;
    }
  };

  const withdrawApplication = async (applicationId: string) => {
    try {
      await jobApplicationService.withdrawApplication(applicationId);
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId 
            ? { ...app, status: 'withdrawn' as any }
            : app
        )
      );
    } catch (error) {
      throw error;
    }
  };

  return {
    applications,
    loading,
    error,
    refetch,
    applyForJob,
    withdrawApplication
  };
};

export const useJobApplication = (applicationId: string) => {
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) return;
      
      try {
        setLoading(true);
        setError(null);
        const applicationData = await jobApplicationService.getApplicationDetails(applicationId);
        setApplication(applicationData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch application');
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId]);

  return {
    application,
    loading,
    error
  };
};

export const useEmployerApplications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const applicationsData = await jobApplicationService.getEmployerApplications();
      setApplications(applicationsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      const updatedApplication = await jobApplicationService.updateApplicationStatus(applicationId, status, notes);
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId ? updatedApplication : app
        )
      );
      return updatedApplication;
    } catch (error) {
      throw error;
    }
  };

  const refetch = () => {
    fetchApplications();
  };

  return {
    applications,
    loading,
    error,
    refetch,
    updateApplicationStatus
  };
};

export const useJobApplicationsForJob = (jobId: string) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!jobId) return;
      
      try {
        setLoading(true);
        setError(null);
        const applicationsData = await jobApplicationService.getJobApplications(jobId);
        setApplications(applicationsData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch job applications');
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [jobId]);

  return {
    applications,
    loading,
    error
  };
};

export const useApplicationStatus = (jobId: string) => {
  const [hasApplied, setHasApplied] = useState(false);
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!jobId) return;
      
      try {
        setLoading(true);
        const applied = await jobApplicationService.hasAppliedForJob(jobId);
        setHasApplied(applied);
        
        if (applied) {
          const app = await jobApplicationService.getApplicationByJobId(jobId);
          setApplication(app);
        }
      } catch (error) {
        console.error('Error checking application status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkApplicationStatus();
  }, [jobId]);

  return {
    hasApplied,
    application,
    loading
  };
};