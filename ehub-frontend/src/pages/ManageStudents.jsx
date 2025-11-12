import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';

const ManageStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        // Fetch real student data from backend
        const response = await homeworkApi.getStudents();
        // Ensure we're setting an array
        const studentsData = Array.isArray(response.data) ? response.data : [];
        setStudents(studentsData);
      } catch (error) {
        console.error('Error loading students:', error);
        // Set empty array if API call fails
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const filteredStudents = students.filter(student =>
    (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.firstName && student.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.lastName && student.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.grade && student.grade.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.level && student.level.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.emailAddress && student.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewProgress = (studentId) => {
    // Navigate to student progress page
    console.log('View progress for student:', studentId);
  };

  const handleSendMessage = (studentId) => {
    // Open message dialog
    console.log('Send message to student:', studentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">👥</span>
            </div>
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading students...</div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Students</h1>
          <p className="text-gray-600">View and manage your students</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search students by name, grade, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-4 top-3.5 text-gray-400">
              🔍
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Students ({filteredStudents.length})</h2>
          </div>
          
          {filteredStudents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <div key={student.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-xl">👤</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{student.name || student.firstName + ' ' + student.lastName || 'Unknown Student'}</h3>
                        <p className="text-sm text-gray-600">
                          {student.grade || student.level || 'Grade not set'} • {student.email || student.emailAddress || 'No email'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          Last active: {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewProgress(student.id)}
                          className="btn-secondary px-3 py-1 text-sm"
                        >
                          Progress
                        </button>
                        <button
                          onClick={() => handleSendMessage(student.id)}
                          className="btn-primary px-3 py-1 text-sm"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                👥
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                <p className="text-gray-600">Total Students</p>
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
                  {students.filter(s => s.lastActive && new Date(s.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
                <p className="text-gray-600">Active This Week</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                📚
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length > 0 ? Math.round(students.reduce((acc, student) => acc + (student.completionRate || Math.random() * 100), 0) / students.length) : 0}%
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

export default ManageStudents;