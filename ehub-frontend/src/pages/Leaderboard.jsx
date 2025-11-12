import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';

const Leaderboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        // Fetch real leaderboard data from backend
        const response = await homeworkApi.getLeaderboard();
        // Ensure we're setting an array for students
        const leaderboardData = response.data?.leaderboard || response.data || [];
        setStudents(Array.isArray(leaderboardData) ? leaderboardData : []);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        // Set empty array if API call fails
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-red-50 to-pink-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-4 animate-pulse">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-700 text-xl">Top performers this month</p>
        </div>

        <div className="mb-8 p-6 bg-white rounded-3xl shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How Scoring Works</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-2xl">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-bold text-gray-900 mb-2">Interactive Homework</h3>
              <p className="text-gray-700 text-sm">Teachers create auto-graded assignments</p>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold text-gray-900 mb-2">Instant Scoring</h3>
              <p className="text-gray-700 text-sm">Students get immediate feedback</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-2xl">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="font-bold text-gray-900 mb-2">Leaderboard Points</h3>
              <p className="text-gray-700 text-sm">Scores automatically update rankings</p>
            </div>
          </div>
        </div>

        {/* Podium Visualization */}
        <div className="flex justify-center items-end mb-12 space-x-4 sm:space-x-8">
          {/* Second Place */}
          <div className="flex flex-col items-center">
            <div className="bg-gray-300 text-gray-800 font-bold py-4 px-6 rounded-t-lg w-24 sm:w-32 text-center transform hover:scale-105 transition-transform">
              <div className="text-2xl">🥈</div>
              <div className="text-lg sm:text-xl">{students[1]?.points || students[1]?.score || 0}</div>
              <div className="text-sm">{students[1]?.grade || students[1]?.letterGrade || 'N/A'}</div>
            </div>
            <div className="w-24 sm:w-32 h-32 sm:h-40 bg-gradient-to-b from-gray-400 to-gray-500 rounded-b-lg flex items-center justify-center">
              <div className="text-white text-2xl font-bold">{students[1]?.avatar}</div>
            </div>
            <div className="mt-3 text-center">
              <h3 className="font-bold text-gray-900">{students[1]?.name}</h3>
              <p className="text-gray-600 text-sm">2nd Place</p>
            </div>
          </div>

          {/* First Place */}
          <div className="flex flex-col items-center">
            <div className="bg-yellow-400 text-yellow-900 font-bold py-4 px-6 rounded-t-lg w-28 sm:w-36 text-center transform hover:scale-105 transition-transform">
              <div className="text-2xl">🥇</div>
              <div className="text-lg sm:text-xl">{students[0]?.points || students[0]?.score || 0}</div>
              <div className="text-sm">{students[0]?.grade || students[0]?.letterGrade || 'N/A'}</div>
            </div>
            <div className="w-28 sm:w-36 h-40 sm:h-48 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-b-lg flex items-center justify-center">
              <div className="text-white text-2xl font-bold">{students[0]?.avatar}</div>
            </div>
            <div className="mt-3 text-center">
              <h3 className="font-bold text-gray-900">{students[0]?.name}</h3>
              <p className="text-gray-600 text-sm">1st Place 🎉</p>
            </div>
          </div>

          {/* Third Place */}
          <div className="flex flex-col items-center">
            <div className="bg-amber-700 text-amber-100 font-bold py-4 px-6 rounded-t-lg w-20 sm:w-28 text-center transform hover:scale-105 transition-transform">
              <div className="text-2xl">🥉</div>
              <div className="text-lg sm:text-xl">{students[2]?.points || students[2]?.score || 0}</div>
              <div className="text-sm">{students[2]?.grade || students[2]?.letterGrade || 'N/A'}</div>
            </div>
            <div className="w-20 sm:w-28 h-24 sm:h-32 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-lg flex items-center justify-center">
              <div className="text-white text-2xl font-bold">{students[2]?.avatar}</div>
            </div>
            <div className="mt-3 text-center">
              <h3 className="font-bold text-gray-900">{students[2]?.name}</h3>
              <p className="text-gray-600 text-sm">3rd Place</p>
            </div>
          </div>
        </div>

        {/* Full Rankings List */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Full Rankings</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {students.slice(3).map((student, index) => (
              <div key={student.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold mr-4">
                      {student.avatar}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{student.name || student.firstName + ' ' + student.lastName || 'Unknown Student'}</h3>
                      <p className="text-sm text-gray-600">Grade: {student.grade || student.level || student.letterGrade || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-4">
                      <p className="font-bold text-gray-900">{(student.points || student.score || 0)} pts</p>
                      <p className="text-sm text-gray-600">#{index + 4}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="font-bold text-gray-700">#{index + 4}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            to="/homework" 
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl"
          >
            Start Homework to Earn Points
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;