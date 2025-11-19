import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi } from '../../api/homeworkApi';
import { levelOptions } from '../../utils/languageOptions';
import { useTranslation } from 'react-i18next';

const TeacherLeaderboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setError('');
        // Fetch leaderboard data with level filter
        const response = await homeworkApi.getLeaderboard(selectedLevel);
        // Ensure we're setting an array for students
        const leaderboardData = response.data?.leaderboard || response.data || [];
        setStudents(Array.isArray(leaderboardData) ? leaderboardData : []);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        setError('Failed to load leaderboard data');
        // Set empty array if API call fails
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [selectedLevel]);

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedStudent(null);
  };

  const viewStudentDetails = (student) => {
    // Add rank to the student object for display
    const studentWithRank = { ...student };
    
    // If student is not already in leaderboard, rank will be 0
    const rankIndex = students.findIndex(s => s.studentId === student.studentId);
    if (rankIndex !== -1) {
      studentWithRank.rank = rankIndex + 1;
    } else {
      studentWithRank.rank = 0; // Not ranked yet
    }
    
    setSelectedStudent(studentWithRank);
    setShowDetails(true);
  };

  const getLevelLabel = (levelValue) => {
    for (const category in levelOptions) {
      if (category !== 'language') { // Skip language category
        const level = levelOptions[category].find(l => l.value === levelValue);
        if (level) return level.label;
      }
    }
    return levelValue;
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-red-50 to-pink-50 p-4 sm:p-6 pb-20 md:pb-6 pt-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">
            🏆 Teacher Leaderboard
          </h1>
          <p className="text-gray-700 text-lg">View student performance by level</p>
        </div>
        
        {/* Level Selection */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Filter by Level</h2>
              <p className="text-gray-600 text-sm">Select a level to view student performance</p>
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Levels</option>
                <optgroup label="Nursery">
                  {levelOptions.nursery.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Primary">
                  {levelOptions.primary.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Secondary">
                  {levelOptions.secondary.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        {students.length > 0 && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl shadow text-center">
              <p className="text-lg font-bold text-blue-600">{students.length}</p>
              <p className="text-xs text-gray-600">Total Students</p>
            </div>
            <div className="bg-white p-3 rounded-xl shadow text-center">
              <p className="text-lg font-bold text-green-600">{students.reduce((sum, s) => sum + s.completedAssignments + s.completedAssessments, 0)}</p>
              <p className="text-xs text-gray-600">Total Submissions</p>
            </div>
            <div className="bg-white p-3 rounded-xl shadow text-center">
              <p className="text-lg font-bold text-purple-600">{Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length) || 0}%</p>
              <p className="text-xs text-gray-600">Avg Score</p>
            </div>
            <div className="bg-white p-3 rounded-xl shadow text-center">
              <p className="text-lg font-bold text-amber-600">{students.reduce((max, s) => s.totalPoints > max ? s.totalPoints : max, 0)}</p>
              <p className="text-xs text-gray-600">Highest Score</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl shadow text-center">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Podium Visualization */}
        <div className="flex justify-center items-end mb-8 space-x-2">
          {/* Second Place */}
          <div className="flex flex-col items-center">
            <div className="bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-t-lg w-16 text-center">
              <div className="text-lg">🥈</div>
              <div className="text-sm">{students[1]?.totalPoints || 0}</div>
            </div>
            <div className="w-16 h-24 bg-gradient-to-b from-gray-400 to-gray-500 rounded-b-lg flex items-center justify-center">
              <div className="text-white text-lg font-bold">{students[1]?.studentName?.charAt(0) || 'S'}</div>
            </div>
            <div className="mt-2 text-center">
              <h3 className="font-bold text-gray-900 text-xs">{students[1]?.studentName || 'Student'}</h3>
              <p className="text-gray-600 text-xs">2nd</p>
              {students[1] && (
                <button 
                  onClick={() => viewStudentDetails(students[1])}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                >
                  Details
                </button>
              )}
            </div>
          </div>

          {/* First Place */}
          <div className="flex flex-col items-center">
            <div className="bg-yellow-400 text-yellow-900 font-bold py-2 px-3 rounded-t-lg w-20 text-center">
              <div className="text-lg">🥇</div>
              <div className="text-sm">{students[0]?.totalPoints || 0}</div>
            </div>
            <div className="w-20 h-32 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-b-lg flex items-center justify-center">
              <div className="text-white text-lg font-bold">{students[0]?.studentName?.charAt(0) || 'S'}</div>
            </div>
            <div className="mt-2 text-center">
              <h3 className="font-bold text-gray-900 text-xs">{students[0]?.studentName || 'Student'}</h3>
              <p className="text-gray-600 text-xs">1st 🎉</p>
              {students[0] && (
                <button 
                  onClick={() => viewStudentDetails(students[0])}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                >
                  Details
                </button>
              )}
            </div>
          </div>

          {/* Third Place */}
          <div className="flex flex-col items-center">
            <div className="bg-amber-700 text-amber-100 font-bold py-2 px-3 rounded-t-lg w-14 text-center">
              <div className="text-lg">🥉</div>
              <div className="text-sm">{students[2]?.totalPoints || 0}</div>
            </div>
            <div className="w-14 h-20 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-lg flex items-center justify-center">
              <div className="text-white text-lg font-bold">{students[2]?.studentName?.charAt(0) || 'S'}</div>
            </div>
            <div className="mt-2 text-center">
              <h3 className="font-bold text-gray-900 text-xs">{students[2]?.studentName || 'Student'}</h3>
              <p className="text-gray-600 text-xs">3rd</p>
              {students[2] && (
                <button 
                  onClick={() => viewStudentDetails(students[2])}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                >
                  Details
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Full Rankings List */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Full Rankings</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {students.slice(3).map((student, index) => (
              <div key={student.studentId} className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold mr-3 text-sm">
                      {student.studentName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{student.studentName || 'Unknown Student'}</h3>
                      <p className="text-xs text-gray-600">
                        {student.averageScore || 0}% 
                        ({student.completedAssignments + student.completedAssessments} completed)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => viewStudentDetails(student)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Details
                    </button>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{(student.totalPoints || 0)} pts</p>
                      <p className="text-xs text-gray-600">#{index + 4}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {showDetails && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedStudent.studentName}&#39;s Performance
                </h2>
                <button 
                  onClick={closeDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-1 flex items-center space-x-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {selectedStudent.totalPoints} pts
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {selectedStudent.averageScore}% avg
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {selectedStudent.rank > 0 ? `#${selectedStudent.rank} rank` : 'Not ranked yet'}
                </span>
                {selectedLevel && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {getLevelLabel(selectedLevel)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">All Homework Scores</h3>
              
              {selectedStudent.submissions && selectedStudent.submissions.length > 0 ? (
                <div className="space-y-3">
                  {selectedStudent.submissions.map((submission, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{submission.title}</h4>
                          <div className="flex items-center mt-1">
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize mr-2">
                              {submission.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          {submission.level && (
                            <div className="mt-1">
                              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                                {getLevelLabel(submission.level)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-gray-900 text-sm">{submission.score}/{submission.maxScore}</p>
                          <p className="text-xs text-gray-600">{submission.percentage}%</p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <div className="flex items-center">
                          {submission.percentage >= 80 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Excellent
                            </span>
                          ) : submission.percentage >= 60 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Good
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Needs Improvement
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            // Navigate to homework review page using homework ID
                            if (submission.type === 'assignment') {
                              // Use homeworkId if available
                              const homeworkId = submission.homeworkId || submission.id;
                              if (homeworkId) {
                                // Navigate to the homework review page
                                navigate(`/homework/review/${homeworkId}`);
                              }
                            } else {
                              // For assessments, we might want to show a different view
                              alert('Assessment details view coming soon!');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Review
                        </button>
                      </div>
                      
                      {/* Progress bar for visual representation */}
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${submission.percentage >= 80 ? 'bg-green-500' : submission.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${submission.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-gray-600 text-sm">No homework submissions found.</p>
                  <p className="text-gray-500 text-xs mt-1">This student has not submitted any homework yet.</p>
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 text-sm mb-2">Performance Summary</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Total Points</p>
                    <p className="font-bold text-gray-900 text-lg">{selectedStudent.totalPoints}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Avg Score</p>
                    <p className="font-bold text-gray-900 text-lg">{selectedStudent.averageScore}%</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Assignments</p>
                    <p className="font-bold text-gray-900 text-lg">{selectedStudent.completedAssignments}</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Assessments</p>
                    <p className="font-bold text-gray-900 text-lg">{selectedStudent.completedAssessments}</p>
                  </div>
                </div>
              </div>
              
              {/* Badges section */}
              {selectedStudent.badges && selectedStudent.badges.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Achievements</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.badges.map((badge, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        🏅 {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Challenges section */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 text-sm mb-2">Challenges Identified</h4>
                {selectedStudent.submissions && selectedStudent.submissions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.submissions
                      .filter(submission => submission.percentage < 70) // Only show submissions with scores below 70%
                      .slice(0, 3) // Show only top 3 challenges
                      .map((submission, index) => (
                        <div key={index} className="bg-red-50 p-3 rounded-lg border border-red-100">
                          <div className="flex justify-between items-start">
                            <h5 className="font-medium text-red-800 text-sm">{submission.title}</h5>
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              {submission.percentage}%
                            </span>
                          </div>
                          <p className="text-red-700 text-xs mt-1">
                            {submission.type === 'assignment' 
                              ? 'Student struggled with this assignment. Consider providing additional resources or one-on-one support.' 
                              : 'Student needs improvement in this assessment area.'}
                          </p>
                          <div className="mt-2 flex items-center text-xs text-red-600">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Low performance detected
                          </div>
                        </div>
                      ))
                    }
                    {selectedStudent.submissions.filter(submission => submission.percentage < 70).length === 0 && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-green-800 text-sm">No significant challenges identified. Student is performing well!</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                    <p className="text-yellow-800 text-sm">Not enough data to identify specific challenges. Student needs to complete more assignments.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <button 
                onClick={closeDetails}
                className="w-full py-2 px-4 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLeaderboard;