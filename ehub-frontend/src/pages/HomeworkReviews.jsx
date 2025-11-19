import React, { useState, useEffect } from 'react';
import { homeworkApi } from '../api/homeworkApi';
import { useNavigate } from 'react-router-dom';

const HomeworkReviews = () => {
  const navigate = useNavigate();
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, hasSubmissions, noSubmissions

  useEffect(() => {
    const loadHomework = async () => {
      try {
        // Fetch all homework assignments
        const response = await homeworkApi.getHomework();
        console.log('Homework API Response:', response);
        
        // Transform homework data to include submission counts
        let transformedHomework = [];
        if (Array.isArray(response.data)) {
          transformedHomework = await Promise.all(response.data.map(async (hw) => {
            try {
              // Get submission count for this homework
              const submissionResponse = await homeworkApi.getHomeworkSubmissions(hw._id);
              const submissions = submissionResponse.data || [];
              const pendingCount = submissions.filter(s => s.status !== 'graded').length;
              const gradedCount = submissions.filter(s => s.status === 'graded').length;
              
              return {
                ...hw,
                totalSubmissions: submissions.length,
                pendingSubmissions: pendingCount,
                gradedSubmissions: gradedCount,
                hasSubmissions: submissions.length > 0
              };
            } catch (err) {
              console.error('Error fetching submissions for homework:', hw._id, err);
              return {
                ...hw,
                totalSubmissions: 0,
                pendingSubmissions: 0,
                gradedSubmissions: 0,
                hasSubmissions: false
              };
            }
          }));
        }
        
        setHomeworkList(transformedHomework);
      } catch (error) {
        console.error('Error loading homework:', error);
        // Fallback to mock data if backend is not available
        const mockHomework = [
          {
            _id: '1',
            title: 'Math Problem Set 3',
            description: 'Solve the math problems in the attached worksheet',
            level: 'p4',
            language: 'english',
            dueDate: '2023-05-20T23:59:59Z',
            maxPoints: 20,
            totalSubmissions: 15,
            pendingSubmissions: 8,
            gradedSubmissions: 7,
            hasSubmissions: true
          },
          {
            _id: '2',
            title: 'Science Experiment Report',
            description: 'Write a report on your recent experiment',
            level: 'p5',
            language: 'english',
            dueDate: '2023-05-18T23:59:59Z',
            maxPoints: 30,
            totalSubmissions: 12,
            pendingSubmissions: 0,
            gradedSubmissions: 12,
            hasSubmissions: true
          },
          {
            _id: '3',
            title: 'English Essay',
            description: 'Write an essay about your favorite book',
            level: 'p3',
            language: 'english',
            dueDate: '2023-05-25T23:59:59Z',
            maxPoints: 25,
            totalSubmissions: 0,
            pendingSubmissions: 0,
            gradedSubmissions: 0,
            hasSubmissions: false
          }
        ];
        setHomeworkList(mockHomework);
      } finally {
        setLoading(false);
      }
    };

    loadHomework();
  }, []);

  const filteredHomework = homeworkList.filter(hw => {
    if (filter === 'hasSubmissions') return hw.hasSubmissions;
    if (filter === 'noSubmissions') return !hw.hasSubmissions;
    return true;
  });

  const handleReview = (homeworkId) => {
    navigate(`/homework/review/${homeworkId}`);
  };

  const getLevelLabel = (level) => {
    const levelMap = {
      'nursery-1': 'Nursery 1',
      'nursery-2': 'Nursery 2',
      'nursery-3': 'Nursery 3',
      'p1': 'Primary 1',
      'p2': 'Primary 2',
      'p3': 'Primary 3',
      'p4': 'Primary 4',
      'p5': 'Primary 5',
      'p6': 'Primary 6'
    };
    return levelMap[level] || level;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📚</span>
            </div>
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading homework...</div>
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
            <span className="mr-2">←</span> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Homework Assignments</h1>
          <p className="text-gray-600">Review and grade student submissions for your homework assignments</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${filter === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('all')}
          >
            All ({homeworkList.length})
          </button>
          <button
            className={`py-2 px-4 font-medium ${filter === 'hasSubmissions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('hasSubmissions')}
          >
            With Submissions ({homeworkList.filter(h => h.hasSubmissions).length})
          </button>
          <button
            className={`py-2 px-4 font-medium ${filter === 'noSubmissions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('noSubmissions')}
          >
            No Submissions ({homeworkList.filter(h => !h.hasSubmissions).length})
          </button>
        </div>

        {filteredHomework.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">
              {filter === 'hasSubmissions' ? '📋' : filter === 'noSubmissions' ? '📚' : '📖'}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {filter === 'hasSubmissions' 
                ? 'No Homework with Submissions' 
                : filter === 'noSubmissions' 
                ? 'No Homework without Submissions' 
                : 'No Homework Assignments'}
            </h3>
            <p className="text-gray-600">
              {filter === 'hasSubmissions' 
                ? 'No homework assignments have student submissions yet.' 
                : filter === 'noSubmissions' 
                ? 'All homework assignments have student submissions.' 
                : 'No homework assignments found.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredHomework.map((homework) => (
                <div key={homework._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-xl">📚</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{homework.title}</h3>
                        <p className="text-sm text-gray-600">
                          {getLevelLabel(homework.level)} • {homework.language?.charAt(0).toUpperCase() + homework.language?.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          Due: {new Date(homework.dueDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {homework.maxPoints} points
                        </p>
                      </div>
                      <div className="text-right">
                        {homework.hasSubmissions ? (
                          <>
                            <p className="text-sm text-gray-900">
                              {homework.totalSubmissions} submissions
                            </p>
                            <p className="text-xs text-gray-500">
                              {homework.pendingSubmissions} pending
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">No submissions</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleReview(homework._id)}
                        className="btn-primary px-4 py-2 text-sm"
                        disabled={!homework.hasSubmissions}
                      >
                        {homework.hasSubmissions ? 'Review' : 'No Submissions'}
                      </button>
                    </div>
                  </div>
                  {homework.description && (
                    <div className="mt-2 ml-16">
                      <p className="text-sm text-gray-600">{homework.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkReviews;