import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { homeworkApi } from '../../api/homeworkApi';

const TeacherDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    completedLessons: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const submissionsResponse = await homeworkApi.getSubmissions();
        setSubmissions(submissionsResponse.data || []);

        // Calculate stats from real data
        const submissions = submissionsResponse.data || [];
        setStats({
          totalStudents: 45, // This would come from a separate API call
          pendingReviews: submissions.filter(s => !s.reviewed).length,
          completedLessons: 23, // This would come from a separate API call
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setSubmissions([]);
        setStats({
          totalStudents: 0,
          pendingReviews: 0,
          completedLessons: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-educational-light p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard 👩‍🏫</h1>
          <p className="text-gray-600">Manage your classroom and students</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                👥
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                <p className="text-gray-600">Total Students</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                📝
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
                <p className="text-gray-600">Pending Reviews</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                📚
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completedLessons}</p>
                <p className="text-gray-600">Lessons Created</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/videos/upload" className="btn-primary text-center">
                📹 Upload Video
              </Link>
              <Link to="/homework/create" className="btn-primary text-center">
                📝 Create Homework
              </Link>
              <Link to="/live-sessions" className="btn-secondary text-center">
                🎥 Start Live Session
              </Link>
              <Link to="/students" className="btn-secondary text-center">
                👥 Manage Students
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  📹
                </div>
                <div>
                  <p className="text-sm font-medium">Uploaded &quot;Science Experiment&quot; video</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  📝
                </div>
                <div>
                  <p className="text-sm font-medium">Reviewed 5 homework submissions</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  🎥
                </div>
                <div>
                  <p className="text-sm font-medium">Hosted live math session</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Homework Reviews</h3>
            <Link to="/homework/reviews" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {submissions.filter(s => !s.reviewed).slice(0, 5).map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    👤
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{submission.studentName}</h4>
                    <p className="text-sm text-gray-600">{submission.homeworkTitle}</p>
                    <p className="text-xs text-gray-500">Submitted {new Date(submission.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Link to={`/homework/review/${submission.id}`} className="btn-primary text-sm px-4 py-2">
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Live Sessions */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Live Sessions</h3>
            <Link to="/live-sessions" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
              Schedule New →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Mathematics - Algebra Basics</h4>
                <p className="text-sm text-gray-600">Tomorrow at 10:00 AM</p>
                <p className="text-xs text-gray-500">15 students registered</p>
              </div>
              <div className="flex space-x-2">
                <button className="btn-secondary text-sm px-3 py-1">Edit</button>
                <button className="btn-primary text-sm px-3 py-1">Start</button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Science - Chemistry Lab</h4>
                <p className="text-sm text-gray-600">Friday at 2:00 PM</p>
                <p className="text-xs text-gray-500">12 students registered</p>
              </div>
              <div className="flex space-x-2">
                <button className="btn-secondary text-sm px-3 py-1">Edit</button>
                <button className="text-gray-500 text-sm px-3 py-1">Not Started</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;