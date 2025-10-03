import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import CommunityLayout from '../../components/Layout/CommunityLayout';
import CommunityFeed from './CommunityFeed';
import CommunityGroups from './CommunityGroups';
import CommunityAchievements from './CommunityAchievements';
import CommunityOpportunities from './CommunityOpportunities';
import CommunityChat from './CommunityChat';
import CommunityTeachers from './CommunityTeachers';
import CommunityTrending from './CommunityTrending';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const CommunityRouter: React.FC = () => {
  return (
    <ProtectedRoute>
      <CommunityLayout>
        <Routes>
          <Route path="/" element={<Navigate to="feed" replace />} />
          <Route path="feed" element={<CommunityFeed />} />
          <Route path="groups" element={<CommunityGroups />} />
          <Route path="achievements" element={<CommunityAchievements />} />
          <Route path="opportunities" element={<CommunityOpportunities />} />
          <Route path="chat" element={<CommunityChat />} />
          <Route path="teachers" element={<CommunityTeachers />} />
          <Route path="trending" element={<CommunityTrending />} />
        </Routes>
      </CommunityLayout>
    </ProtectedRoute>
  );
};

export default CommunityRouter;
