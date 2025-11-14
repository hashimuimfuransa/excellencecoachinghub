import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Homework = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to the new homework list page on component mount
  React.useEffect(() => {
    navigate('/homework/list');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
      <div className="text-center">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📝</span>
          </div>
          <div className="animate-pulse text-xl font-bold text-gray-700">Redirecting to homework list...</div>
        </div>
      </div>
    </div>
  );
};

export default Homework;