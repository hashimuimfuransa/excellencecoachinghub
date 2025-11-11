import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalVideos: 0,
    totalHomework: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real app, this would come from API
    setStats({
      totalUsers: 1250,
      totalStudents: 980,
      totalTeachers: 45,
      totalParents: 225,
      totalVideos: 156,
      totalHomework: 89,
    });

    setRecentActivity([
      { id: 1, type: 'user', action: 'New teacher registered', timestamp: '2 hours ago' },
      { id: 2, type: 'content', action: 'Video uploaded: "Advanced Calculus"', timestamp: '4 hours ago' },
      { id: 3, type: 'user', action: 'Parent account activated', timestamp: '6 hours ago' },
      { id: 4, type: 'system', action: 'System backup completed', timestamp: '1 day ago' },
    ]);

    setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard ⚙️</h1>
          <p className="text-gray-600">Manage users, content, and system settings</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            <p className="text-sm text-gray-600">Total Users</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
            <p className="text-sm text-gray-600">Students</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{stats.totalTeachers}</p>
            <p className="text-sm text-gray-600">Teachers</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.totalParents}</p>
            <p className="text-sm text-gray-600">Parents</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.totalVideos}</p>
            <p className="text-sm text-gray-600">Videos</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-600">{stats.totalHomework}</p>
            <p className="text-sm text-gray-600">Homework</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Management Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/users" className="btn-primary text-center">
                👥 Manage Users
              </Link>
              <Link to="/admin/content" className="btn-primary text-center">
                📚 Manage Content
              </Link>
              <Link to="/admin/reports" className="btn-secondary text-center">
                📊 View Reports
              </Link>
              <Link to="/admin/settings" className="btn-secondary text-center">
                ⚙️ System Settings
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Server Status</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage</span>
                <span className="text-sm text-gray-600">2.3 GB / 10 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Backup</span>
                <span className="text-sm text-gray-600">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    activity.type === 'user' ? 'bg-blue-100' :
                    activity.type === 'content' ? 'bg-green-100' :
                    'bg-purple-100'
                  }`}>
                    {activity.type === 'user' ? '👤' :
                     activity.type === 'content' ? '📄' :
                     '⚙️'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-500 text-sm">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* User Management Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registrations (Last 30 Days)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Students</span>
                <span className="text-sm font-medium">+23</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Teachers</span>
                <span className="text-sm font-medium">+2</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Parents</span>
                <span className="text-sm font-medium">+8</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Uploads (Last 7 Days)</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📹</span>
                  <span className="text-sm">Videos</span>
                </div>
                <span className="font-medium">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📝</span>
                  <span className="text-sm">Homework</span>
                </div>
                <span className="font-medium">8</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📄</span>
                  <span className="text-sm">Documents</span>
                </div>
                <span className="font-medium">15</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;