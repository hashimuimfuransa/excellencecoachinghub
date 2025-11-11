import React, { useState, useEffect } from 'react';

const LiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        // TODO: Replace with actual API call when live sessions endpoint is implemented
        // const response = await liveSessionApi.getSessions();
        // setSessions(response.data || []);

        // Mock data for now - in real app, this would come from API
        const mockSessions = [
          {
            id: 1,
            title: 'Mathematics - Algebra Fundamentals',
            teacher: 'Ms. Johnson',
            scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
            duration: 60,
            participants: 25,
            maxParticipants: 30,
            status: 'upcoming',
            description: 'Learn the basics of algebra including variables, equations, and simple problem solving.',
          },
          {
            id: 2,
            title: 'Science - Chemistry Experiments',
            teacher: 'Mr. Davis',
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            duration: 90,
            participants: 18,
            maxParticipants: 25,
            status: 'upcoming',
            description: 'Hands-on chemistry experiments with safe, educational demonstrations.',
          },
          {
            id: 3,
            title: 'English Literature - Poetry Analysis',
            teacher: 'Mrs. Wilson',
            scheduledTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            duration: 45,
            participants: 22,
            maxParticipants: 25,
            status: 'live',
            description: 'Explore famous poems and learn how to analyze literary devices.',
          },
        ];

        setSessions(mockSessions);
      } catch (error) {
        console.error('Error loading live sessions:', error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live':
        return '🔴 Live Now';
      case 'upcoming':
        return '🟢 Upcoming';
      case 'ended':
        return '⚫ Ended';
      default:
        return status;
    }
  };

  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Sessions 🎥</h1>
          <p className="text-gray-600">Join interactive live classes with your teachers</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div key={session.id} className="card hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                  {getStatusText(session.status)}
                </div>
                <div className="text-sm text-gray-500">
                  {session.duration} min
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{session.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-2">👩‍🏫</span>
                  <span>{session.teacher}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-2">🕒</span>
                  <span>{formatTime(session.scheduledTime)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-2">👥</span>
                  <span>{session.participants}/{session.maxParticipants} participants</span>
                </div>
              </div>

              <button
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                  session.status === 'live'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : session.status === 'upcoming'
                    ? 'btn-primary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={session.status === 'ended'}
              >
                {session.status === 'live' ? 'Join Live Session' :
                 session.status === 'upcoming' ? 'Set Reminder' :
                 'Session Ended'}
              </button>
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No live sessions scheduled</h3>
            <p className="text-gray-600">Check back later for upcoming interactive classes</p>
          </div>
        )}

        {/* Session Stats */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-2xl font-bold text-gray-900">12</p>
            <p className="text-sm text-gray-600">Sessions This Week</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-2xl font-bold text-gray-900">245</p>
            <p className="text-sm text-gray-600">Total Participants</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <p className="text-2xl font-bold text-gray-900">89%</p>
            <p className="text-sm text-gray-600">Average Attendance</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-2xl font-bold text-gray-900">4.8</p>
            <p className="text-sm text-gray-600">Average Rating</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSessions;