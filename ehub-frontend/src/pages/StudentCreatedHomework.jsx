import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';

const StudentCreatedHomework = () => {
  const navigate = useNavigate();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, reviewed, all

  useEffect(() => {
    const loadHomework = async () => {
      try {
        const response = await homeworkApi.getStudentHomework();
        setHomework(response.data || []);
      } catch (error) {
        console.error('Error loading student homework:', error);
        // Fallback to mock data if backend is not available
        const mockHomework = [
          {
            id: 1,
            title: 'My Math Challenge',
            level: 'p5',
            description: 'Solve these interesting geometry problems I created',
            studentName: 'Emma Johnson',
            studentGrade: 'Grade 7',
            createdAt: '2023-05-15',
            type: 'math',
            status: 'pending',
            content: 'Create a triangle with sides of 3cm, 4cm, and 5cm. What type of triangle is this? Explain your reasoning and show your work.'
          },
          {
            id: 2,
            title: 'Science Experiment Idea',
            level: 'p6',
            description: 'An experiment to test the effect of different liquids on plant growth',
            studentName: 'Michael Chen',
            studentGrade: 'Grade 8',
            createdAt: '2023-05-14',
            type: 'science',
            status: 'reviewed',
            grade: 'A',
            content: 'Hypothesis: Plants watered with soda will grow differently than those watered with plain water. Procedure: Set up 3 groups of bean plants...'
          }
        ];
        setHomework(mockHomework);
      } finally {
        setLoading(false);
      }
    };

    loadHomework();
  }, []);

  const filteredHomework = homework.filter(hw => {
    if (filter === 'pending') return hw.status === 'pending';
    if (filter === 'reviewed') return hw.status === 'reviewed';
    return true;
  });

  const handleReview = (homeworkId) => {
    navigate(`/homework/student/${homeworkId}/review`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📚</span>
            </div>
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading student homework...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="mr-2">←</span> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student-Created Homework</h1>
          <p className="text-gray-600">Review and grade homework assignments created by your students</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${filter === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({homework.filter(h => h.status === 'pending').length})
          </button>
          <button
            className={`py-2 px-4 font-medium ${filter === 'reviewed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('reviewed')}
          >
            Reviewed ({homework.filter(h => h.status === 'reviewed').length})
          </button>
          <button
            className={`py-2 px-4 font-medium ${filter === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('all')}
          >
            All ({homework.length})
          </button>
        </div>

        {filteredHomework.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {filter === 'pending' ? 'No Pending Homework' : filter === 'reviewed' ? 'No Reviewed Homework' : 'No Homework'}
            </h3>
            <p className="text-gray-600">
              {filter === 'pending' 
                ? 'All student-created homework has been reviewed!' 
                : filter === 'reviewed' 
                ? 'No homework has been reviewed yet.' 
                : 'No student-created homework found.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredHomework.map((hw) => (
                <div key={hw.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                        hw.type === 'drawing' ? 'bg-purple-100' : 
                        hw.type === 'math' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <span className="text-xl">
                          {hw.type === 'drawing' ? '🎨' : 
                           hw.type === 'math' ? '🧮' : '🔬'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{hw.title}</h3>
                        <p className="text-sm text-gray-600">
                          Level {hw.level} • Created by {hw.studentName} ({hw.studentGrade})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          Created: {new Date(hw.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        {hw.status === 'reviewed' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Reviewed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleReview(hw.id)}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        {hw.status === 'reviewed' ? 'View Feedback' : 'Review'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 ml-16">
                    <p className="text-gray-700 text-sm">{hw.description}</p>
                  </div>
                  
                  {hw.status === 'reviewed' && hw.feedback && (
                    <div className="mt-3 ml-16">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-800">Your Feedback:</p>
                        <p className="text-gray-700 text-sm mt-1">{hw.feedback}</p>
                        {hw.grade && (
                          <p className="text-sm font-medium text-green-800 mt-2">Grade: {hw.grade}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                📝
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{homework.length}</p>
                <p className="text-gray-600">Total Assignments</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                ⏳
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {homework.filter(h => h.status === 'pending').length}
                </p>
                <p className="text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                ✅
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(homework.filter(h => h.status === 'reviewed').length / homework.length * 100) || 0}%
                </p>
                <p className="text-gray-600">Review Completion</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCreatedHomework;