import React, { useState, useEffect } from 'react';
import { homeworkApi } from '../api/homeworkApi';
import { Link, useNavigate } from 'react-router-dom';

const ManageHomework = () => {
  const navigate = useNavigate();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, past

  useEffect(() => {
    const loadHomework = async () => {
      try {
        const response = await homeworkApi.getHomework();
        setHomework(response.data || []);
      } catch (error) {
        console.error('Error loading homework:', error);
        // Fallback to mock data if backend is not available
        const mockHomework = [
          {
            id: 1,
            title: 'Interactive Learning Activities',
            subject: 'General',
            dueDate: '2023-05-20',
            assignedDate: '2023-05-15',
            submissions: 12,
            totalStudents: 15,
            status: 'active',
            level: 'p1',
            language: 'english'
          },
          {
            id: 2,
            title: 'Science Experiment Report',
            subject: 'Science',
            dueDate: '2023-05-25',
            assignedDate: '2023-05-15',
            submissions: 8,
            totalStudents: 15,
            status: 'active',
            level: 'p2',
            language: 'english'
          },
          {
            id: 3,
            title: 'History Essay',
            subject: 'History',
            dueDate: '2023-05-10',
            assignedDate: '2023-05-01',
            submissions: 15,
            totalStudents: 15,
            status: 'past',
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

  const filteredHomework = homework.filter(hw => {
    if (filter === 'active') return hw.status === 'active';
    if (filter === 'past') return hw.status === 'past';
    return true;
  });

  const handleEdit = (homeworkId) => {
    // Navigate to edit homework page
    console.log('Edit homework:', homeworkId);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this homework?')) {
      try {
        await homeworkApi.deleteHomework(id);
        setHomework(prev => prev.filter(hw => hw.id !== id));
      } catch (error) {
        console.error('Error deleting homework:', error);
        alert('Failed to delete homework. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Homework</h1>
              <p className="text-gray-600">Create, edit, and track homework assignments</p>
            </div>
            <Link to="/homework/create" className="btn-primary px-6 py-3">
              + Create New Homework
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${filter === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('all')}
          >
            All ({homework.length})
          </button>
          <button
            className={`py-2 px-4 font-medium ${filter === 'active' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('active')}
          >
            Active ({homework.filter(h => h.status === 'active').length})
          </button>
          <button
            className={`py-2 px-4 font-medium ${filter === 'past' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('past')}
          >
            Past ({homework.filter(h => h.status === 'past').length})
          </button>
        </div>

        {filteredHomework.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {filter === 'active' ? 'No Active Homework' : filter === 'past' ? 'No Past Homework' : 'No Homework'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'active' 
                ? 'All your homework assignments have been completed!' 
                : filter === 'past' 
                ? 'No homework assignments have been completed yet.' 
                : 'No homework assignments found.'}
            </p>
            <Link to="/homework/create" className="btn-primary px-6 py-3">
              Create Your First Homework
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredHomework.map((hw) => (
                <div key={hw.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-xl">📝</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{hw.title}</h3>
                        <p className="text-sm text-gray-600">
                          {hw.subject} • Assigned: {new Date(hw.assignedDate).toLocaleDateString()}
                          {hw.level && ` • Level: ${hw.level}`}
                          {hw.language && ` • Language: ${hw.language}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          Due: {new Date(hw.dueDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {hw.submissions}/{hw.totalStudents} submitted
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(hw.status)}`}>
                          {hw.status === 'active' ? 'Active' : 'Past'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(hw.id)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(hw.id)}
                          className="text-gray-500 hover:text-red-500"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 ml-16">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(hw.submissions / hw.totalStudents) * 100}%` }}
                      ></div>
                    </div>
                  </div>
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
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                ✅
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {homework.filter(h => h.status === 'active').length}
                </p>
                <p className="text-gray-600">Active Assignments</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                📊
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(homework.reduce((acc, hw) => acc + (hw.submissions / hw.totalStudents) * 100, 0) / homework.length)}%
                </p>
                <p className="text-gray-600">Average Completion</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageHomework;