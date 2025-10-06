import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { teacherProfileService, ITeacherProfile } from '../services/teacherProfileService';

interface TeacherProfileContextType {
  profile: ITeacherProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

const TeacherProfileContext = createContext<TeacherProfileContextType | undefined>(undefined);

interface TeacherProfileProviderProps {
  children: ReactNode;
}

export const TeacherProfileProvider: React.FC<TeacherProfileProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ITeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!user || user.role !== 'teacher') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 TeacherProfileProvider: Loading profile for user:', user._id);
      const profileData = await teacherProfileService.getMyProfile();
      console.log('🔍 TeacherProfileProvider: Profile loaded:', profileData);
      setProfile(profileData);
    } catch (err: any) {
      console.error('❌ TeacherProfileProvider: Error loading profile:', err);
      
      // Handle specific error cases
      if (err.response?.status === 404 || err.message?.includes('Profile not found')) {
        // If no profile exists, treat as incomplete
        console.log('🔍 TeacherProfileProvider: No profile found, treating as incomplete');
        setProfile({
          _id: '',
          userId: user._id,
          specialization: [],
          experience: 0,
          education: [],
          certifications: [],
          skills: [],
          languages: [],
          teachingAreas: [],
          preferredLevels: [],
          documents: [],
          profileStatus: 'incomplete',
          totalStudents: 0,
          activeCourses: 0,
          totalCourses: 0,
          averageRating: 0,
          totalEarnings: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as ITeacherProfile);
      } else if (err.response?.status === 401 || err.message?.includes('User ID not found')) {
        // Authentication issue
        console.log('🔍 TeacherProfileProvider: Authentication issue');
        setError('Authentication required. Please log in again.');
      } else if (err.message?.includes('Unable to connect to server')) {
        // Server connection issue
        console.log('🔍 TeacherProfileProvider: Server connection issue');
        setError('Unable to connect to server. Please check your connection and try again.');
      } else {
        // Other errors - treat as incomplete to allow user to proceed
        console.log('🔍 TeacherProfileProvider: Other error, treating as incomplete');
        setProfile({
          _id: '',
          userId: user._id,
          specialization: [],
          experience: 0,
          education: [],
          certifications: [],
          skills: [],
          languages: [],
          teachingAreas: [],
          preferredLevels: [],
          documents: [],
          profileStatus: 'incomplete',
          totalStudents: 0,
          activeCourses: 0,
          totalCourses: 0,
          averageRating: 0,
          totalEarnings: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as ITeacherProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const value: TeacherProfileContextType = {
    profile,
    loading,
    error,
    refreshProfile
  };

  return (
    <TeacherProfileContext.Provider value={value}>
      {children}
    </TeacherProfileContext.Provider>
  );
};

export const useTeacherProfile = (): TeacherProfileContextType => {
  const context = useContext(TeacherProfileContext);
  if (context === undefined) {
    throw new Error('useTeacherProfile must be used within a TeacherProfileProvider');
  }
  return context;
};
