import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { levelOptions } from '../utils/languageOptions';
import { useAuth } from '../hooks/useAuth';
import BottomNavbar from '../components/ui/BottomNavbar';

const HomeworkHelp = () => {
  const { id } = useParams(); // Get the ID parameter from the URL
  const [helpRequests, setHelpRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { user } = useAuth();
  
  // Filter states
  const [filters, setFilters] = useState({
    level: '',
    search: '',
    dateRange: ''
  });
  
  // Get level label from level value
  const getLevelLabel = (levelValue) => {
    for (const category in levelOptions) {
      const level = levelOptions[category].find(l => l.value === levelValue);
      if (level) return level.label;
    }
    return levelValue;
  };

  useEffect(() => {
    const loadHelpRequests = async () => {
      try {
        // If we have an ID parameter, load that specific request
        if (id) {
          try {
            const response = await homeworkApi.getHomeworkHelpById(id);
            if (response.data && response.data.data) {
              setSelectedRequest(response.data.data);
            }
          } catch (error) {
            console.error('Error loading specific help request:', error);
          }
          setLoading(false);
          return;
        }
        
        // Otherwise load all requests
        const response = await homeworkApi.getHomeworkHelp();
        // Extract the data array from the response
        const requests = Array.isArray(response.data.data) ? response.data.data : [];
        setHelpRequests(requests);
        
        // Filter requests based on teacher's level if they are a teacher
        if (user?.role === 'teacher' && user?.level) {
          const filtered = requests.filter(request => request.level === user.level);
          setFilteredRequests(filtered);
        } else {
          // For students or teachers without a level set, show all requests
          setFilteredRequests(requests);
        }
      } catch (error) {
        console.error('Error loading help requests:', error);
        // Fallback to mock data if backend is not available
        const mockRequests = [
          {
            _id: 1,
            studentName: 'John Doe',
            homeworkTitle: 'Algebra Homework',
            level: 'p3',
            description: 'I&#39;m having trouble with question 3 about quadratic equations. Can someone help me understand the steps?',
            file: {
              fileUrl: '/sample-file.pdf',
              fileName: 'john-algebra-hw.pdf'
            },
            createdAt: '2023-05-15T10:30:00Z',
            comments: 2
          },
          {
            _id: 2,
            studentName: 'Sarah Johnson',
            homeworkTitle: 'History Essay',
            level: 'p5',
            description: 'Could someone review my essay draft and provide feedback on the structure?',
            file: {
              fileUrl: '/sample-file2.pdf',
              fileName: 'sarah-history-essay.docx'
            },
            createdAt: '2023-05-14T14:45:00Z',
            comments: 5
          }
        ];
        setHelpRequests(mockRequests);
        setFilteredRequests(mockRequests);
      } finally {
        setLoading(false);
      }
    };

    loadHelpRequests();
  }, [user, id]);
  
  // Apply filters whenever helpRequests or filters change
  useEffect(() => {
    let result = [...helpRequests];
    
    // Apply level filter
    if (filters.level) {
      result = result.filter(request => request.level === filters.level);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(request => 
        (request.student?.firstName && request.student?.firstName.toLowerCase().includes(searchTerm)) ||
        (request.student?.lastName && request.student?.lastName.toLowerCase().includes(searchTerm)) ||
        (request.student?.email && request.student?.email.toLowerCase().includes(searchTerm)) ||
        (request.homeworkTitle && request.homeworkTitle.toLowerCase().includes(searchTerm)) ||
        (request.description && request.description.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply date filter
    if (filters.dateRange) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      result = result.filter(request => new Date(request.createdAt) >= filterDate);
    }
    
    // Apply teacher level filter if user is a teacher
    if (user?.role === 'teacher' && user?.level) {
      result = result.filter(request => request.level === user.level);
    }
    
    setFilteredRequests(result);
  }, [helpRequests, filters, user]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      level: '',
      search: '',
      dateRange: ''
    });
  };

  const handleDownload = async (fileUrl, fileName) => {
    try {
      // For mock data, open in new tab
      if (fileUrl.startsWith('/sample')) {
        alert('In a real implementation, this would download the file: ' + fileName);
        return;
      }
      
      // Download file from backend
      const response = await homeworkApi.downloadHomeworkHelp(fileUrl);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'homework_help_file');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // Handle adding a response/comment to a help request
  const handleAddResponse = async (requestId, responseText) => {
    try {
      // Call the API to add the comment
      const response = await homeworkApi.addCommentToHomeworkHelp(requestId, responseText);
      
      // Update the UI with the response data
      if (response.data && response.data.data) {
        // If we're viewing a specific request, update it directly
        if (selectedRequest && selectedRequest._id === requestId) {
          setSelectedRequest(response.data.data);
        }
        
        // Also update the requests lists
        const updatedRequests = helpRequests.map(request => {
          if (request._id === requestId) {
            return response.data.data;
          }
          return request;
        });
        
        setHelpRequests(updatedRequests);
        setFilteredRequests(updatedRequests);
        return response.data;
      }
    } catch (error) {
      console.error('Error adding response:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❓</span>
            </div>
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading help requests...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {id ? "Help Request Details" : "Student Help Requests"}
          </h1>
          <p className="text-gray-600">
            {id 
              ? "View and respond to this student's homework help request" 
              : "View and respond to student homework help requests"}
          </p>
          {user?.role === 'teacher' && user?.level && !id && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                Showing requests for your teaching level: <span className="font-semibold">{getLevelLabel(user.level)}</span>
              </p>
            </div>
          )}
        </div>

        {selectedRequest ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Help Request Details</h2>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Requests
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Student Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">
                    {selectedRequest.student?.firstName 
                      ? `${selectedRequest.student.firstName} ${selectedRequest.student.lastName || ''}` 
                      : selectedRequest.student?.email || selectedRequest.studentName || 'Unknown Student'}
                  </p>
                  <p className="text-gray-600">Submitted: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Homework Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{selectedRequest.homeworkTitle || 'N/A'}</p>
                  <p className="text-gray-600">Level: {getLevelLabel(selectedRequest.level) || selectedRequest.level || 'N/A'}</p>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Student Message</h3>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-gray-800">{selectedRequest.description || 'No message provided'}</p>
                </div>
                
                {/* Comments/Responses Section */}
                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Previous Responses</h3>
                {selectedRequest.comments && selectedRequest.comments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRequest.comments.map((comment) => (
                      <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {comment.author || 'Unknown User'}
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
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-500">No responses yet</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Attached Files</h3>
                {selectedRequest.file?.fileUrl ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedRequest.file.fileName || 'homework_help.jpg'}</p>
                        <p className="text-sm text-gray-600">Click to view or download</p>
                      </div>
                      <button
                        onClick={() => handleDownload(selectedRequest.file.fileUrl, selectedRequest.file.fileName)}
                        className="btn-primary px-4 py-2"
                      >
                        Download
                      </button>
                    </div>
                    {selectedRequest.file.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
                      <div className="mt-4">
                        <img 
                          src={selectedRequest.file.fileUrl} 
                          alt="Student homework help" 
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-500">No files attached</p>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Your Response</h3>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Type your response to the student..."
                  id="teacherResponse"
                ></textarea>
                <div className="flex justify-end mt-3">
                  <button 
                    className="btn-primary px-4 py-2"
                    onClick={async () => {
                      const responseText = document.getElementById('teacherResponse').value;
                      if (!responseText.trim()) {
                        alert('Please enter a response');
                        return;
                      }
                      
                      try {
                        await handleAddResponse(selectedRequest._id, responseText);
                        document.getElementById('teacherResponse').value = '';
                        alert('Response sent successfully!');
                      } catch (error) {
                        alert('Failed to send response. Please try again.');
                      }
                    }}
                  >
                    Send Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 md:mb-0">Pending Help Requests ({filteredRequests.length})</h2>
              
              {/* Filters for Help Requests */}
              <div className="bg-gray-50 rounded-lg p-3 w-full md:w-auto">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
                    <select
                      value={filters.level}
                      onChange={(e) => handleFilterChange('level', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Levels</option>
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Student or homework..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Any Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {filteredRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Help Requests</h3>
                <p className="text-gray-600">
                  {helpRequests.length > 0 
                    ? "No help requests match your filters." 
                    : (user?.role === 'teacher' && user?.level 
                        ? `No help requests found for your teaching level (${getLevelLabel(user.level)}).` 
                        : "Students haven't submitted any help requests yet.")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <div 
                    key={request._id} 
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-xl">❓</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {request.student?.firstName 
                              ? `${request.student.firstName} ${request.student.lastName || ''}` 
                              : request.student?.email || request.studentName || 'Unknown Student'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {request.homeworkTitle || 'Homework help request'} 
                            {request.level && ` - ${getLevelLabel(request.level)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                    {request.description && (
                      <div className="mt-3 ml-16">
                        <p className="text-gray-700 text-sm line-clamp-2">
                          &#34;{request.description}&#34;
                        </p>
                      </div>
                    )}
                    {request.file?.fileUrl && (
                      <div className="mt-2 ml-16">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          File attached
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default HomeworkHelp;