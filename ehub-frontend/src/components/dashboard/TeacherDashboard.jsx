import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { homeworkApi } from '../../api/homeworkApi';

const TeacherDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    homeworkCreated: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch real data from backend
        const [submissionsResponse, helpResponse, statsResponse] = await Promise.all([
          homeworkApi.getSubmissions(),
          homeworkApi.getHomeworkHelp(),
          homeworkApi.getTeacherStats()
        ]);
        
        // Ensure we're setting arrays for submissions and help requests
        setSubmissions(Array.isArray(submissionsResponse.data) ? submissionsResponse.data : []);
        setHelpRequests(Array.isArray(helpResponse.data) ? helpResponse.data : []);
        
        // Calculate stats from real data
        const submissionsData = Array.isArray(submissionsResponse.data) ? submissionsResponse.data : [];
        setStats({
          totalStudents: statsResponse?.data?.totalStudents || 0,
          pendingReviews: submissionsData.filter(s => !s.reviewed).length,
          homeworkCreated: statsResponse?.data?.homeworkCreated || 0,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Set empty data if API calls fail
        setSubmissions([]);
        setHelpRequests([]);
        setStats({
          totalStudents: 0,
          pendingReviews: 0,
          homeworkCreated: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
          <p className="text-xl text-gray-600">Welcome back! Here&#39;s what&#39;s happening with your students today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 transform transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6 transform transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pending Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6 transform transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Homework Created</p>
                <p className="text-3xl font-bold text-gray-900">{stats.homeworkCreated}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions - Focused on Homework */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Homework Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/homework/create" className="btn-primary text-center">
                ✨ Create Interactive Homework
              </Link>
              <Link to="/homework/reviews" className="btn-primary text-center">
                📝 Review Submissions
              </Link>
              <Link to="/homework/manage" className="btn-secondary text-center">
                📋 Manage Homework
              </Link>
              <Link to="/students" className="btn-secondary text-center">
                👥 Manage Students
              </Link>
            </div>
          </div>

          {/* Interactive Activity Ideas */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Activity Ideas</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors cursor-pointer" onClick={() => window.location.href='/homework/create'}>
                <div className="text-2xl mb-2">🧩</div>
                <h4 className="font-medium text-gray-900 text-sm">Quizzes</h4>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors cursor-pointer" onClick={() => window.location.href='/homework/create'}>
                <div className="text-2xl mb-2">🎨</div>
                <h4 className="font-medium text-gray-900 text-sm">Drawing</h4>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors cursor-pointer" onClick={() => window.location.href='/homework/create'}>
                <div className="text-2xl mb-2">:UIControl</div>
                <h4 className="font-medium text-gray-900 text-sm">Drag & Drop</h4>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors cursor-pointer" onClick={() => window.location.href='/homework/create'}>
                <div className="text-2xl mb-2">🔊</div>
                <h4 className="font-medium text-gray-900 text-sm">Sound Games</h4>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors cursor-pointer" onClick={() => window.location.href='/homework/create'}>
                <div className="text-2xl mb-2">✏️</div>
                <h4 className="font-medium text-gray-900 text-sm">Tracing</h4>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors cursor-pointer" onClick={() => window.location.href='/homework/create'}>
                <div className="text-2xl mb-2">🎬</div>
                <h4 className="font-medium text-gray-900 text-sm">Video Quiz</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Submissions</h2>
            <Link to="/homework/reviews" className="text-blue-600 hover:text-blue-800 font-bold">
              View all →
            </Link>
          </div>
          
          {submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.slice(0, 3).map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{submission.homeworkTitle}</h3>
                      <p className="text-gray-600 text-sm">{submission.studentName} • {submission.subject}</p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Pending Review
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <p className="text-gray-500 text-sm">
                      Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                    <Link 
                      to={`/homework/review/${submission.id}`} 
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent submissions</p>
            </div>
          )}
        </div>

        {/* Help Requests */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Student Help Requests</h2>
            <Link to="/homework/help" className="text-blue-600 hover:text-blue-800 font-bold">
              View all →
            </Link>
          </div>
          
          {helpRequests.length > 0 ? (
            <div className="space-y-4">
              {helpRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{request.homeworkTitle}</h3>
                      <p className="text-gray-600 text-sm">{request.studentName} • {request.subject}</p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      Help Needed
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm line-clamp-2 mt-2">
                    &#34;{request.message}&#34;
                  </p>
                  <div className="mt-3 flex justify-between items-center">
                    <p className="text-gray-500 text-sm">
                      Requested: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex space-x-2">
                      <Link 
                        to={`/homework/help/${request.id}`} 
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                      >
                        Help Student
                      </Link>
                      {request.fileUrl && (
                        <a 
                          href={request.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                        >
                          View File
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No help requests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;