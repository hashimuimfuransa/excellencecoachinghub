import React from 'react';
import { useNavigate } from 'react-router-dom';
import OptimizedCVBuilder from '../components/enhanced-cv-builder/OptimizedCVBuilder';

const OptimizedCVBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <div>
      <OptimizedCVBuilder onClose={handleClose} />
    </div>
  );
};

export default OptimizedCVBuilderPage;