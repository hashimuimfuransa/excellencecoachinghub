import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi'; // Use teacherApi instead
import { homeworkApi } from '../../api/homeworkApi'; // Add homeworkApi for help requests
import BottomNavbar from '../ui/BottomNavbar';
import { levelOptions } from '../../utils/languageOptions';

// Get level label from level value
const getLevelLabel = (levelValue) => {
  for (const category in levelOptions) {
    const level = levelOptions[category].find(l => l.value === levelValue);
    if (level) return level.label;
  }
  return levelValue;
};

const TeacherDashboard = () => {
  const [helpRequests, setHelpRequests] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    homeworkCreated: 0,
    totalSubmissions: 0,
    averageGrade: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch real data from backend
        const [helpRequestsResponse, statsResponse] = await Promise.all([
          homeworkApi.getHomeworkHelp(), // Get teacher's help requests
          teacherApi.getStats() // Use the correct teacher stats endpoint
        ]);
        
        // Transform help requests data
        let transformedHelpRequests = [];
        if (helpRequestsResponse.data && helpRequestsResponse.data.data) {
          transformedHelpRequests = Array.isArray(helpRequestsResponse.data.data) 
            ? helpRequestsResponse.data.data.slice(0, 3).map(req => ({
                id: req._id,
                studentName: req.studentName || 'Unknown Student',
                homeworkTitle: req.homeworkTitle || 'Help Request',
                level: req.level || 'N/A',
                message: req.description || 'No description provided',
                createdAt: req.createdAt,
                fileUrl: req.file?.fileUrl || null
              }))
            : [];
        }
        
        // Set help requests data
        setHelpRequests(transformedHelpRequests);
        
        // Calculate stats from real data
        const teacherStats = statsResponse.data.data.overview;
        setStats({
          totalStudents: teacherStats?.totalStudents || 0,
          pendingReviews: teacherStats?.totalSubmissions - (teacherStats?.gradedSubmissions || 0) || 0,
          homeworkCreated: teacherStats?.totalHomework || 0,
          totalSubmissions: teacherStats?.totalSubmissions || 0,
          averageGrade: teacherStats?.averageGrade || 0,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Set empty data if API calls fail
        setHelpRequests([]);
        setStats({
          totalStudents: 0,
          pendingReviews: 0,
          homeworkCreated: 0,
          totalSubmissions: 0,
          averageGrade: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 pt-16">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <div className="animate-pulse text-lg font-bold text-gray-700">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8 pt-16">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome back! Here&#39;s what&#39;s happening with your students today.</p>
        </div>

        {/* Simplified Stats Cards - Reduced from 5 to 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-white bg-opacity-20 mr-4">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Total Students</p>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-white bg-opacity-20 mr-4">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <p className="text-amber-100 text-sm">Pending Reviews</p>
                <p className="text-3xl font-bold">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-white bg-opacity-20 mr-4">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-emerald-100 text-sm">Average Grade</p>
                <p className="text-3xl font-bold">{stats.averageGrade.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions - Focused on Homework */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">📚</span>
              Homework Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/homework/create" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-4 text-center font-medium transition-all duration-200 transform hover:scale-105 shadow-md">
                <div className="text-2xl mb-1">✨</div>
                <div className="text-sm">Create Homework</div>
              </Link>
              <Link to="/homework/help" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl p-4 text-center font-medium transition-all duration-200 transform hover:scale-105 shadow-md">
                <div className="text-2xl mb-1">📝</div>
                <div className="text-sm">View Help Requests</div>
              </Link>
              <Link to="/homework/manage" className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-4 text-center font-medium transition-all duration-200 transform hover:scale-105 shadow-md">
                <div className="text-2xl mb-1">📋</div>
                <div className="text-sm">Manage Homework</div>
              </Link>
              <Link to="/students" className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl p-4 text-center font-medium transition-all duration-200 transform hover:scale-105 shadow-md">
                <div className="text-2xl mb-1">👥</div>
                <div className="text-sm">Manage Students</div>
              </Link>
            </div>
          </div>

          {/* Interactive Activity Ideas */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3">🎨</span>
              Activity Ideas
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center hover:from-blue-100 hover:to-blue-200 transition-all duration-200 cursor-pointer border border-blue-200" onClick={() => window.location.href='/homework/create'}>
                <div className="text-xl mb-1">🧩</div>
                <h4 className="font-medium text-blue-800 text-xs">Quizzes</h4>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 text-center hover:from-amber-100 hover:to-amber-200 transition-all duration-200 cursor-pointer border border-amber-200" onClick={() => window.location.href='/homework/create'}>
                <div className="text-xl mb-1">🎨</div>
                <h4 className="font-medium text-amber-800 text-xs">Drawing</h4>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center hover:from-purple-100 hover:to-purple-200 transition-all duration-200 cursor-pointer border border-purple-200" onClick={() => window.location.href='/homework/create'}>
                <div className="text-xl mb-1">:UIControl</div>
                <h4 className="font-medium text-purple-800 text-xs">Drag & Drop</h4>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 text-center hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 cursor-pointer border border-emerald-200" onClick={() => window.location.href='/homework/create'}>
                <div className="text-xl mb-1">🔊</div>
                <h4 className="font-medium text-emerald-800 text-xs">Sound Games</h4>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-3 text-center hover:from-rose-100 hover:to-rose-200 transition-all duration-200 cursor-pointer border border-rose-200" onClick={() => window.location.href='/homework/create'}>
                <div className="text-xl mb-1">✏️</div>
                <h4 className="font-medium text-rose-800 text-xs">Tracing</h4>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3 text-center hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 cursor-pointer border border-indigo-200" onClick={() => window.location.href='/homework/create'}>
                <div className="text-xl mb-1">🎬</div>
                <h4 className="font-medium text-indigo-800 text-xs">Video Quiz</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Help Requests - Replaced Submissions section */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mr-2 text-sm">🆘</span>
              Recent Help Requests
            </h2>
            <Link to="/homework/help" className="text-rose-600 hover:text-rose-800 font-medium text-sm flex items-center">
              View all →
            </Link>
          </div>
          
          {helpRequests.length > 0 ? (
            <div className="space-y-3">
              {helpRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{request.homeworkTitle}</h3>
                      <p className="text-gray-600 text-xs mt-1">{request.studentName} • {getLevelLabel(request.level)}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                      Help
                    </span>
                  </div>
                  <p className="text-gray-700 text-xs line-clamp-2 mb-3">
                    &quot;{request.message}&quot;
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-500 text-xs">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex space-x-2">
                      <Link 
                        to={`/homework/help/${request.id}`} 
                        className="bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs py-1.5 px-3 rounded-lg transition-colors"
                      >
                        Help
                      </Link>
                      {request.fileUrl && (
                        <a 
                          href={request.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-xs py-1.5 px-3 rounded-lg transition-colors"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-xl border border-gray-200">
              <div className="text-3xl mb-2 text-gray-300">✅</div>
              <p className="text-gray-500 text-sm">No help requests</p>
            </div>
          )}
        </div>

        {/* Updated Help Requests section - previously was a duplicate */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm">📈</span>
              Class Performance
            </h2>
            <Link to="/leaderboard" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
              View leaderboard →
            </Link>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">Overall Class Average</h3>
                <span className="text-lg font-bold text-blue-600">{stats.averageGrade.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" 
                  style={{ width: `${stats.averageGrade}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2">
                    <span className="text-sm">📋</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Homework Created</p>
                    <p className="font-bold text-gray-900">{stats.homeworkCreated}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-2">
                    <span className="text-sm">📝</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Pending Reviews</p>
                    <p className="font-bold text-gray-900">{stats.pendingReviews}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default TeacherDashboard;