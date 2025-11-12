import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parentApi } from '../../api/parentApi';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const childrenResponse = await parentApi.getChildren();
        const childrenData = Array.isArray(childrenResponse.data) ? childrenResponse.data : [];
        setChildren(childrenData);
        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0]);
          try {
            const progressResponse = await parentApi.getChildProgress(childrenData[0].id);
            setChildProgress(progressResponse.data || null);
          } catch (progressError) {
            console.error('Error loading child progress:', progressError);
            setChildProgress(null);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setChildren([]);
        setChildProgress(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChildSelect = async (child) => {
    setSelectedChild(child);
    try {
      const progressResponse = await parentApi.getChildProgress(child.id);
      setChildProgress(progressResponse.data || null);
    } catch (error) {
      console.error('Error loading child progress:', error);
      setChildProgress(null);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Parent Dashboard 👨‍👩‍👧</h1>
          <p className="text-gray-600">Monitor your child&apos;s learning progress</p>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Child</h3>
            <div className="flex space-x-4">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleChildSelect(child)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedChild?.id === child.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedChild && childProgress && (
          <>
            {/* Child Overview */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="card">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    📊
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{childProgress.overallGrade}%</p>
                  <p className="text-gray-600">Overall Grade</p>
                </div>
              </div>

              <div className="card">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    📚
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{childProgress.completedLessons}</p>
                  <p className="text-gray-600">Lessons Completed</p>
                </div>
              </div>

              <div className="card">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    🏆
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{childProgress.points}</p>
                  <p className="text-gray-600">Points Earned</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Activity */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {childProgress.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {activity.type === 'video' ? '📹' : activity.type === 'homework' ? '📝' : '💬'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher Communications */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teacher Communications</h3>
                <div className="space-y-3">
                  {childProgress.messages.map((message, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs">
                          👩‍🏫
                        </div>
                        <span className="text-sm font-medium">{message.teacherName}</span>
                        <span className="text-xs text-gray-500">{message.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700">{message.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link to="/chat" className="btn-primary w-full text-center">
                    Message Teacher
                  </Link>
                </div>
              </div>
            </div>

            {/* Subject Progress */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Progress</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {childProgress.subjects.map((subject) => (
                  <div key={subject.name} className="text-center">
                    <div className="relative mb-2">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                        <span className="text-lg">{subject.icon}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                        {subject.grade}
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900">{subject.name}</h4>
                    <p className="text-sm text-gray-600">{subject.progress}% complete</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Link to="/leaderboard" className="btn-primary text-center">
                  🏆 View Leaderboard
                </Link>
                <Link to={`/child/${selectedChild.id}/report`} className="btn-secondary text-center">
                  📊 Detailed Report
                </Link>
                <Link to="/chat" className="btn-secondary text-center">
                  💬 Contact Teacher
                </Link>
              </div>
            </div>
          </>
        )}

        {children.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">👨‍👩‍👧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Children Added</h3>
            <p className="text-gray-600 mb-4">Contact the school administration to link your children to this account.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;