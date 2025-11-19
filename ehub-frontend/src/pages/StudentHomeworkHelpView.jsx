import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { useAuth } from '../hooks/useAuth';
import { levelOptions, languageOptions } from '../utils/languageOptions';
import { useTranslation } from 'react-i18next';
import BottomNavbar from '../components/ui/BottomNavbar';

const StudentHomeworkHelpView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('my-requests'); // 'my-requests' or 'all-requests'
  const [myRequests, setMyRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  
  // Filter states
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Get level label from level value
  const getLevelLabel = (levelValue) => {
    for (const category in levelOptions) {
      const level = levelOptions[category].find(l => l.value === levelValue);
      if (level) return level.label;
    }
    return levelValue;
  };
  
  // Get language label from language value
  const getLanguageLabel = (languageValue) => {
    const language = languageOptions.find(l => l.value === languageValue);
    return language ? language.label : languageValue;
  };
  
  // Filter requests based on selected filters
  const filterRequests = (requests) => {
    return requests.filter(request => {
      // Level filter
      if (selectedLevel && request.level !== selectedLevel) {
        return false;
      }
      
      // Status filter
      if (statusFilter && request.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  };
  
  // Load data when component mounts or filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load student's own requests
        const myRequestsResponse = await homeworkApi.getStudentHomeworkHelp();
        setMyRequests(Array.isArray(myRequestsResponse.data.data) ? myRequestsResponse.data.data : []);
        
        // Load all requests (for providing feedback)
        const allRequestsResponse = await homeworkApi.getHomeworkHelp();
        setAllRequests(Array.isArray(allRequestsResponse.data.data) ? allRequestsResponse.data.data : []);
      } catch (error) {
        console.error('Error loading homework help requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Apply filters to requests
  const filteredMyRequests = filterRequests(myRequests);
  const filteredAllRequests = filterRequests(allRequests);
  
  // Handle adding a comment to a request
  const handleAddComment = async (requestId) => {
    if (!newComment.trim()) return;
    
    try {
      setCommentLoading(true);
      // Call the API to add the comment
      const response = await homeworkApi.addCommentToHomeworkHelp(requestId, newComment);
      
      // Update the UI with the response data
      if (response.data && response.data.data) {
        const updatedRequests = allRequests.map(request => {
          if (request._id === requestId) {
            return response.data.data;
          }
          return request;
        });
        
        setAllRequests(updatedRequests);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setCommentLoading(false);
    }
  };
  
  // Handle downloading a file
  const handleDownload = async (fileUrl, fileName) => {
    try {
      // Create download link directly from the file URL
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', fileName || 'homework_help_file');
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };
  
  // Export requests to CSV
  const exportToCSV = (requests, filename) => {
    const headers = [
      t('student_name'), 
      t('homework_title'), 
      t('level'), 
      t('status'), 
      t('description'), 
      t('created_at')
    ];
    const csvContent = [
      headers.join(','),
      ...requests.map(request => [
        request.student?.firstName 
          ? `${request.student.firstName} ${request.student.lastName || ''}` 
          : request.student?.email || t('unknown_student'),
        `"${request.homeworkTitle || t('untitled_request')}"`,
        getLevelLabel(request.level),
        request.status,
        `"${request.description}"`,
        new Date(request.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl sm:text-4xl">📚</span>
            </div>
            <div className="animate-pulse text-base sm:text-xl font-bold text-gray-700">{t('loading')}...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t('homework_help_requests')}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'my-requests' 
              ? t('view_your_sent_requests_and_feedback') 
              : t('browse_requests_from_other_students')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'my-requests'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('my-requests')}
          >
            {t('my_requests')}
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'all-requests'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('all-requests')}
          >
            {t('all_requests')}
          </button>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('level')}</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('all_levels')}</option>
                {Object.keys(levelOptions).map(category => 
                  levelOptions[category].map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('all_statuses')}</option>
                <option value="pending">{t('pending')}</option>
                <option value="in-progress">{t('in_progress')}</option>
                <option value="completed">{t('completed')}</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedLevel('');
                  setSelectedLanguage('');
                  setStatusFilter('');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {t('clear_filters')}
              </button>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  if (activeTab === 'my-requests') {
                    exportToCSV(filteredMyRequests, 'my-homework-help-requests.csv');
                  } else {
                    exportToCSV(filteredAllRequests, 'all-homework-help-requests.csv');
                  }
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('export')}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'my-requests' ? (
          <div>
            {filteredMyRequests.length > 0 ? (
              <div className="space-y-6">
                {filteredMyRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{request.homeworkTitle || t('untitled_request')}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {getLevelLabel(request.level)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">&quot;{request.description}&quot;</p>
                    
                    {request.file?.fileUrl && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{t('attached_file')}</span>
                        </div>
                        <button
                          onClick={() => handleDownload(request.file.fileUrl, request.fileName)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          {t('download')}
                        </button>
                      </div>
                    )}
                    
                    {/* Comments Section */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-3">{t('feedback_received')}</h4>
                      
                      {request.comments && request.comments.length > 0 ? (
                        <div className="space-y-4">
                          {request.comments.map((comment) => (
                            <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium text-gray-900">
                                  {comment.author || t('unknown_user')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">&quot;{comment.text}&quot;</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">{t('no_feedback_yet')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{t('no_requests_yet')}</h3>
                <p className="text-gray-500 mb-4">{t('you_havent_sent_any_help_requests')}</p>
                <button
                  onClick={() => navigate('/homework/help/request')}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  {t('request_help')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredAllRequests.length > 0 ? (
              <div className="space-y-6">
                {filteredAllRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.student?.firstName 
                            ? `${request.student.firstName} ${request.student.lastName || ''}` 
                            : request.student?.email || t('unknown_student')}
                        </h3>
                        <p className="text-gray-600">{request.homeworkTitle || t('untitled_request')}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {getLevelLabel(request.level)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">&quot;{request.description}&quot;</p>
                    
                    {request.file?.fileUrl && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{t('attached_file')}</span>
                        </div>
                        <button
                          onClick={() => handleDownload(request.file.fileUrl, request.fileName)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          {t('download')}
                        </button>
                      </div>
                    )}
                    
                    {/* Comments Section */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-3">{t('provide_feedback')}</h4>
                      
                      {/* Existing Comments */}
                      {request.comments && request.comments.length > 0 ? (
                        <div className="space-y-4 mb-4">
                          {request.comments.map((comment) => (
                            <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium text-gray-900">
                                  {comment.author || t('unknown_user')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">&quot;{comment.text}&quot;</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic mb-4">{t('no_feedback_yet')}</p>
                      )}
                      
                      {/* Add Comment Form */}
                      <div className="flex">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder={t('write_your_feedback_here')}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleAddComment(request._id)}
                          disabled={commentLoading || !newComment.trim()}
                          className={`px-4 py-2 rounded-r-lg font-medium ${
                            commentLoading || !newComment.trim()
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {commentLoading ? t('sending') : t('send')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{t('no_requests_available')}</h3>
                <p className="text-gray-500">{t('there_are_no_help_requests_from_other_students')}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default StudentHomeworkHelpView;