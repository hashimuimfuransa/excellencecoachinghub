import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        // Mock data for now - in real app, this would come from API
        const mockLeaderboard = [
          { id: 1, name: 'Alice Johnson', points: 2450, level: 'Primary 5', avatar: '👩‍🎓', rank: 1 },
          { id: 2, name: 'Bob Smith', points: 2380, level: 'Primary 6', avatar: '👨‍🎓', rank: 2 },
          { id: 3, name: 'Charlie Brown', points: 2290, level: 'Primary 4', avatar: '👦', rank: 3 },
          { id: 4, name: 'Diana Prince', points: 2150, level: 'Primary 5', avatar: '👩‍🎓', rank: 4 },
          { id: 5, name: 'Edward Norton', points: 2080, level: 'Primary 3', avatar: '👨‍🎓', rank: 5 },
          { id: 6, name: user?.name || 'You', points: 1950, level: 'Primary 4', avatar: '🎓', rank: 6, isCurrentUser: true },
          { id: 7, name: 'Fiona Green', points: 1890, level: 'Primary 5', avatar: '👩‍🎓', rank: 7 },
          { id: 8, name: 'George Lucas', points: 1820, level: 'Primary 3', avatar: '👨‍🎓', rank: 8 },
        ];

        setLeaderboard(mockLeaderboard);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [user]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800';
      case 2:
        return 'bg-gray-100 text-gray-800';
      case 3:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏆</span>
            </div>
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading leaderboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-yellow-500 bg-clip-text text-transparent mb-3">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-600 text-lg">See how you rank among your peers</p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {leaderboard.slice(0, 3).map((student, index) => {
            const positions = [1, 0, 2]; // 2nd, 1st, 3rd for visual layout
            const position = positions[index];
            const actualStudent = leaderboard[position];

            // Determine podium height and color
            const podiumHeights = ['h-32', 'h-40', 'h-24'];
            const podiumColors = ['bg-gray-300', 'bg-yellow-400', 'bg-orange-300'];
            const height = podiumHeights[position];
            const color = podiumColors[position];

            return (
              <div
                key={actualStudent.id}
                className="flex flex-col items-center"
              >
                {/* Student Card */}
                <div className={`bg-white rounded-2xl shadow-2xl p-4 text-center mb-4 w-full transform transition-transform hover:scale-105 ${
                  actualStudent.isCurrentUser ? 'ring-4 ring-purple-500' : ''
                }`}>
                  <div className="text-4xl mb-2">{actualStudent.avatar}</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-lg font-bold mb-2 ${getRankColor(actualStudent.rank)}`}>
                    {getRankIcon(actualStudent.rank)}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-lg">
                    {actualStudent.name}
                    {actualStudent.isCurrentUser && <span className="text-purple-600 ml-1">(You)</span>}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{actualStudent.level}</p>
                  <div className="text-xl font-bold text-purple-600">
                    {actualStudent.points.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600">points</p>
                </div>

                {/* Podium Step */}
                <div className={`${height} ${color} rounded-t-xl w-full flex items-end justify-center p-2`}>
                  <span className="text-2xl font-bold text-gray-800">
                    {position === 0 ? '2nd' : position === 1 ? '1st' : '3rd'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <div className="bg-white rounded-3xl shadow-2xl p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-2">📋</span> Full Rankings
          </h3>
          <div className="space-y-4">
            {leaderboard.map((student, index) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                  student.isCurrentUser
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${getRankColor(student.rank)}`}>
                    {student.rank <= 3 ? getRankIcon(student.rank) : student.rank}
                  </div>
                  <div className="text-3xl">{student.avatar}</div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {student.name}
                      {student.isCurrentUser && <span className="text-purple-600 ml-2">(You)</span>}
                    </h4>
                    <p className="text-gray-600">{student.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {student.points.toLocaleString()}
                  </div>
                  <p className="text-gray-600">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;