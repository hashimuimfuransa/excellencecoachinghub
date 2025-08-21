import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProfileAccessGuard from './ProfileAccessGuard';

interface SimpleProfileGuardProps {
  feature?: 'psychometricTests' | 'aiInterviews' | 'premiumJobs';
  children: React.ReactNode;
}

const SimpleProfileGuard: React.FC<SimpleProfileGuardProps> = ({
  feature = 'psychometricTests',
  children
}) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <ProfileAccessGuard user={user} feature={feature}>
      {children}
    </ProfileAccessGuard>
  );
};

export default SimpleProfileGuard;