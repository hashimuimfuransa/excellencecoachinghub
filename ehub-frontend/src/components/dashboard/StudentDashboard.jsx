import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { homeworkApi } from '../../api/homeworkApi';
import './animations.css';

const StudentDashboard = () => {
  const [homework, setHomework] = useState([]);
  const [homeworkHelp, setHomeworkHelp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    subject: '',
    description: '',
    file: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load homework data
        const homeworkPromise = homeworkApi.getHomework().catch(() => ({ data: [] }));
        const helpPromise = homeworkApi.getHomeworkHelp().catch(() => ({ data: [] }));

        const [homeworkResponse, helpResponse] = await Promise.all([homeworkPromise, helpPromise]);
        
        setHomework(homeworkResponse.data || []);
        setHomeworkHelp(helpResponse.data || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setHomework([]);
        setHomeworkHelp([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.subject || !uploadForm.description) {
      alert('Please fill in all fields and select a file');
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('subject', uploadForm.subject);
      formData.append('description', uploadForm.description);

      await homeworkApi.uploadHomeworkHelp(formData);
      
      const response = await homeworkApi.getHomeworkHelp();
      setHomeworkHelp(response.data || []);
      
      setUploadForm({ subject: '', description: '', file: null });
      setShowUploadModal(false);
      alert('Homework uploaded successfully! Teachers and friends can now help you 🎉');
    } catch (error) {
      console.error('Error uploading homework:', error);
      alert('Failed to upload homework. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📚</span>
            </div>
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading your dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Section with 3D-like effect */}
        <div className="mb-8 text-center transform transition-transform hover:scale-105">
          <div className="relative inline-block">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-lg blur opacity-75 animate-pulse"></div>
            <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-3 animate-bounce">
              👋 Welcome Back!
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-700 font-medium mt-4 animate-fade-in">
            Let&#39;s get your homework done today! 📚
          </p>
        </div>

        {/* Main Action Buttons with 3D animations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {/* Homework Button */}
          <Link 
            to="/homework" 
            className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white text-center shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-float"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-700 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4 transform group-hover:rotate-12 transition-transform duration-300 animate-pulse-slow">📝</div>
              <h3 className="text-2xl font-bold mb-2">My Homework</h3>
              <p className="text-blue-100">View &amp; complete assignments</p>
            </div>
            <div className="absolute bottom-4 right-4 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              👉
            </div>
          </Link>

          {/* Help Button */}
          <button 
            onClick={() => setShowUploadModal(true)}
            className="group relative bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-6 text-white text-center shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 cursor-pointer animate-bounce-slow"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-700 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4 transform group-hover:rotate-12 transition-transform duration-300 animate-spin-slow">🆘</div>
              <h3 className="text-2xl font-bold mb-2">Need Help?</h3>
              <p className="text-red-100">Ask teachers &amp; friends</p>
            </div>
            <div className="absolute bottom-4 right-4 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              👉
            </div>
          </button>

          {/* Leaderboard Button */}
          <Link 
            to="/leaderboard" 
            className="group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white text-center shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-pulse"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-700 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4 transform group-hover:rotate-12 transition-transform duration-300">🏆</div>
              <h3 className="text-2xl font-bold mb-2 animate-rainbow">Leaderboard</h3>
              <p className="text-purple-100">See top students</p>
            </div>
            <div className="absolute bottom-4 right-4 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              👉
            </div>
          </Link>
        </div>

        {/* Homework Section - Only show pending homework */}
        {homework.filter(hw => !hw.submitted).length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8 transform transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="text-3xl mr-2 animate-pulse">📝</span> Your Pending Homework
              </h2>
              <Link to="/homework" className="text-blue-600 hover:text-blue-800 font-bold flex items-center">
                See all <span className="ml-1">→</span>
              </Link>
            </div>
            <div className="space-y-4">
              {homework.filter(hw => !hw.submitted).slice(0, 3).map((hw, index) => (
                <div 
                  key={hw.id} 
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 shimmer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-1">📌 {hw.title}</h4>
                      <p className="text-sm text-gray-600">
                        📅 Due: <span className="font-semibold">{new Date(hw.dueDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <Link 
                      to={`/homework/${hw.id}`} 
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full whitespace-nowrap transition-all duration-300 transform hover:scale-110"
                    >
                      Start Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Homework Help Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 transform transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-3xl mr-2 animate-bounce">🤝</span> Help from Classmates
            </h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-all duration-300 transform hover:scale-110"
            >
              + Ask for Help
            </button>
          </div>

          {homeworkHelp.length > 0 ? (
            <div className="space-y-4">
              {homeworkHelp.slice(0, 5).map((help, index) => (
                <div 
                  key={help.id} 
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 shimmer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-bold text-xl transform hover:rotate-12 transition-transform duration-300 animate-float">
                          {help.studentName ? help.studentName.charAt(0).toUpperCase() : '👤'}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{help.studentName || 'Classmate'}</h4>
                          <p className="text-xs text-gray-600">📚 {help.subject || 'General'}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 mt-2">{help.description}</p>
                      <p className="text-xs text-gray-500 mt-2">📤 {new Date(help.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      {help.file && (
                        <a
                          href={help.file}
                          download
                          className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-all duration-300 transform hover:scale-110"
                        >
                          📥 Download
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 animate-bounce">🤝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Help Requests Yet!</h3>
              <p className="text-gray-600 text-lg mb-6">Be the first to ask or help a classmate! 🎯</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-110"
              >
                Ask for Help
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {homework.length === 0 && homeworkHelp.length === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl text-center py-12 mt-8 transform transition-transform hover:scale-[1.02]">
            <div className="text-7xl mb-6 animate-bounce">🎉</div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">All Caught Up!</h3>
            <p className="text-gray-600 text-xl mb-8">You don&#39;t have any pending homework. Great job! 🎓</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-10 rounded-full text-xl transition-all duration-300 transform hover:scale-110"
            >
              Ask for Help Anyway
            </button>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-95 animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="text-3xl mr-2">📤</span> Ask for Homework Help
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl transition-transform duration-300 hover:rotate-90"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject/Topic 📚</label>
                  <input
                    type="text"
                    value={uploadForm.subject}
                    onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                    placeholder="e.g., Math, Science, English"
                    className="w-full border-2 border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-blue-500 transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">What do you need help with? 📝</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Explain your question or problem..."
                    rows="4"
                    className="w-full border-2 border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-blue-500 resize-none transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Attach File (Optional) 📎</label>
                  <div className="border-2 border-dashed border-blue-300 rounded-2xl p-6 text-center cursor-pointer hover:bg-blue-50 transition-all duration-300">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.png,.gif,.zip"
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="cursor-pointer block">
                      <div className="text-4xl mb-3">📎</div>
                      {uploadForm.file ? (
                        <p className="text-blue-600 font-semibold">{uploadForm.file.name}</p>
                      ) : (
                        <>
                          <p className="text-gray-700 font-semibold text-lg">Click to upload file</p>
                          <p className="text-xs text-gray-600">PDF, DOC, Images, ZIP (Optional)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingFile}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingFile ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      'Send Request 🚀'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Custom styles for animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;