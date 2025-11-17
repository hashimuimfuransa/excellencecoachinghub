import React, { useState, useEffect } from 'react';
import { teacherApi } from '../api/teacherApi';
import { Link, useNavigate } from 'react-router-dom';

const ManageHomework = () => {
  const navigate = useNavigate();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, draft

  useEffect(() => {
    const loadHomework = async () => {
      try {
        const response = await teacherApi.getHomework();
        // Ensure we're working with an array
        let homeworkData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data.homework)) {
          homeworkData = response.data.data.homework;
        }
        setHomework(homeworkData);
      } catch (error) {
        console.error('Error loading homework:', error);
        // Fallback to mock data if backend is not available
        const mockHomework = [
          {
            _id: 1,
            title: 'Interactive Learning Activities',
            description: 'Complete the interactive activities',
            dueDate: '2023-05-20',
            createdAt: '2023-05-15',
            status: 'published',
            level: 'p1',
            language: 'english'
          },
          {
            _id: 2,
            title: 'Science Experiment Report',
            description: 'Write a report on your experiment',
            dueDate: '2023-05-25',
            createdAt: '2023-05-15',
            status: 'published',
            level: 'p2',
            language: 'english'
          },
          {
            _id: 3,
            title: 'History Essay',
            description: 'Write an essay on ancient civilizations',
            dueDate: '2023-05-10',
            createdAt: '2023-05-01',
            status: 'draft',
            level: 'p3',
            language: 'english'
          }
        ];
        setHomework(mockHomework);
      } finally {
        setLoading(false);
      }
    };

    loadHomework();
  }, []);

  // Ensure homework is an array before filtering
  const filteredHomework = Array.isArray(homework) ? homework.filter(hw => {
    if (filter === 'active') return hw.status === 'published';
    if (filter === 'draft') return hw.status === 'draft';
    return true;
  }) : [];

  const handleEdit = (homeworkId) => {
    // Navigate to edit homework page
    navigate(`/homework/edit/${homeworkId}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this homework?')) {
      try {
        await teacherApi.deleteHomework(id);
        setHomework(prev => Array.isArray(prev) ? prev.filter(hw => hw._id !== id) : []);
      } catch (error) {
        console.error('Error deleting homework:', error);
        alert('Failed to delete homework. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    if (status === 'published') return 'bg-green-100 text-green-800';
    if (status === 'draft') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    if (status === 'published') return 'Published';
    if (status === 'draft') return 'Draft';
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 pt-16">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-6 px-4 sm:px-6 lg:px-8 pt-16">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center sm:text-left">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Homework</h1>
              <p className="text-gray-600">Manage your homework assignments</p>
            </div>
            <Link 
              to="/homework/create" 
              className="btn-primary px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Homework
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{Array.isArray(homework) ? homework.length : 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(homework) ? homework.filter(h => h.status === 'published').length : 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(homework) ? homework.filter(h => h.status === 'draft').length : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-4 font-medium text-sm md:text-base ${filter === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setFilter('all')}
          >
            All Assignments
          </button>
          <button
            className={`py-3 px-4 font-medium text-sm md:text-base ${filter === 'active' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setFilter('active')}
          >
            Published
          </button>
          <button
            className={`py-3 px-4 font-medium text-sm md:text-base ${filter === 'draft' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setFilter('draft')}
          >
            Drafts
          </button>
        </div>

        {/* Homework List */}
        {Array.isArray(filteredHomework) && filteredHomework.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center border border-gray-100">
            <div className="text-5xl mb-4 text-gray-300">📝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {filter === 'active' ? 'No Published Homework' : filter === 'draft' ? 'No Drafts' : 'No Homework Found'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {filter === 'active' 
                ? 'You have no published homework assignments yet.' 
                : filter === 'draft' 
                ? 'You have no draft homework assignments.' 
                : 'You haven\'t created any homework assignments yet.'}
            </p>
            <Link 
              to="/homework/create" 
              className="btn-primary px-6 py-3 rounded-lg font-medium inline-flex items-center transition-all duration-200 hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Your First Homework
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="divide-y divide-gray-100">
              {Array.isArray(filteredHomework) && filteredHomework.map((hw) => (
                <div key={hw._id} className="px-4 py-5 sm:px-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-xl">📝</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{hw.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {hw.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {hw.level && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {hw.level}
                            </span>
                          )}
                          {hw.language && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {hw.language}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="text-gray-900 font-medium">
                          Due: {new Date(hw.dueDate).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500">
                          Created: {new Date(hw.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(hw.status)}`}>
                          {getStatusText(hw.status)}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(hw._id)}
                            className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors duration-200"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(hw._id)}
                            className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors duration-200"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageHomework;