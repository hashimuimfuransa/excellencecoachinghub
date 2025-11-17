import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi'; // Use teacherApi instead
import BottomNavbar from '../ui/BottomNavbar';

const TeacherDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
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
        const [submissionsResponse, statsResponse] = await Promise.all([
          teacherApi.getSubmissions(), // Get teacher's homework submissions
          teacherApi.getStats() // Use the correct teacher stats endpoint
        ]);
        
        // Transform submissions data
        let transformedSubmissions = [];
        if (submissionsResponse.data && submissionsResponse.data.data && submissionsResponse.data.data.submissions) {
          transformedSubmissions = submissionsResponse.data.data.submissions.slice(0, 3).map(sub => ({
            id: sub._id,
            studentName: `${sub.student.firstName} ${sub.student.lastName}`,
            studentGrade: 'Grade 5', // This would come from student data in a real implementation
            homeworkTitle: sub.assignment.title,
            subject: 'Homework',
            submittedAt: sub.submittedAt,
            status: sub.status,
            reviewed: sub.status === 'graded',
            grade: sub.grade
          }));
        }
        
        // Set submissions data
        setSubmissions(transformedSubmissions);
        setHelpRequests([]); // Mock empty help requests for now
        
        // Calculate stats from real data
        const teacherStats = statsResponse.data.data.overview;
        setStats({
          totalStudents: teacherStats?.totalStudents || 0,
          pendingReviews: transformedSubmissions.filter(s => !s.reviewed).length,
          homeworkCreated: teacherStats?.totalHomework || 0,
          totalSubmissions: teacherStats?.totalSubmissions || 0,
          averageGrade: teacherStats?.averageGrade || 0,
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
              <Link to="/homework/reviews" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl p-4 text-center font-medium transition-all duration-200 transform hover:scale-105 shadow-md">
                <div className="text-2xl mb-1">📝</div>
                <div className="text-sm">Review Submissions</div>
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

        {/* Recent Submissions */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm">📥</span>
              Recent Submissions
            </h2>
            <Link to="/homework/reviews" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
              View all →
            </Link>
          </div>
          
          {submissions.length > 0 ? (
            <div className="space-y-3">
              {submissions.slice(0, 3).map((submission) => (
                <div key={submission.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{submission.homeworkTitle}</h3>
                      <p className="text-gray-600 text-xs mt-1">{submission.studentName} • {submission.subject}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      submission.reviewed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {submission.reviewed ? 'Graded' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-500 text-xs">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                    <Link 
                      to={`/homework/review/${submission.id}`} 
                      className={`font-medium text-xs py-1.5 px-3 rounded-lg transition-colors ${
                        submission.reviewed 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {submission.reviewed ? 'View' : 'Review'}
                    </Link>
                  </div>
                  {submission.reviewed && submission.grade && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs">Grade</span>
                        <span className="font-bold text-gray-900">{submission.grade}%</span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${submission.grade}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-xl border border-gray-200">
              <div className="text-3xl mb-2 text-gray-300">📭</div>
              <p className="text-gray-500 text-sm">No recent submissions</p>
            </div>
          )}
        </div>

        {/* Help Requests */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mr-2 text-sm">🆘</span>
              Help Requests
            </h2>
            <Link to="/homework/help" className="text-rose-600 hover:text-rose-800 font-medium text-sm flex items-center">
              View all →
            </Link>
          </div>
          
          {helpRequests.length > 0 ? (
            <div className="space-y-3">
              {helpRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{request.homeworkTitle}</h3>
                      <p className="text-gray-600 text-xs mt-1">{request.studentName} • {request.subject}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                      Help
                    </span>
                  </div>
                  <p className="text-gray-700 text-xs line-clamp-2 mb-3">
                    &#34;{request.message}&#34;
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
      </div>
      <BottomNavbar />
    </div>
  );
};

export default TeacherDashboard;