import React, { useState, useEffect } from 'react';
import { homeworkApi } from '../api/homeworkApi';
import BottomNavbar from '../components/ui/BottomNavbar';

const HomeworkHelp = () => {
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const loadHelpRequests = async () => {
      try {
        const response = await homeworkApi.getHomeworkHelp();
        setHelpRequests(response.data || []);
      } catch (error) {
        console.error('Error loading help requests:', error);
        // Fallback to mock data if backend is not available
        const mockRequests = [
          {
            id: 1,
            studentName: 'John Doe',
            homeworkTitle: 'Algebra Homework',
            subject: 'Mathematics',
            message: 'I{`}m having trouble with question 3 about quadratic equations. Can someone help me understand the steps?',
            fileUrl: '/sample-file.pdf',
            fileName: 'john-algebra-hw.pdf',
            createdAt: '2023-05-15T10:30:00Z',
            comments: 2
          },
          {
            id: 2,
            studentName: 'Sarah Johnson',
            homeworkTitle: 'History Essay',
            subject: 'History',
            message: 'Could someone review my essay draft and provide feedback on the structure?',
            fileUrl: '/sample-file2.pdf',
            fileName: 'sarah-history-essay.docx',
            createdAt: '2023-05-14T14:45:00Z',
            comments: 5
          }
        ];
        setHelpRequests(mockRequests);
      } finally {
        setLoading(false);
      }
    };

    loadHelpRequests();
  }, []);

  const handleDownload = async (helpId, fileName) => {
    try {
      // Download file from backend
      const response = await homeworkApi.downloadHomeworkHelp(helpId);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Help Requests</h1>
          <p className="text-gray-600">View and respond to student homework help requests</p>
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
                  <p className="font-medium">{selectedRequest.studentName}</p>
                  <p className="text-gray-600">Grade: {selectedRequest.studentGrade || 'N/A'}</p>
                  <p className="text-gray-600">Submitted: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Homework Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{selectedRequest.homeworkTitle || 'N/A'}</p>
                  <p className="text-gray-600">Subject: {selectedRequest.subject || 'N/A'}</p>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Student Message</h3>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-gray-800">{selectedRequest.message || 'No message provided'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Attached Files</h3>
                {selectedRequest.fileUrl ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedRequest.fileName || 'homework_help.jpg'}</p>
                        <p className="text-sm text-gray-600">Click to view or download</p>
                      </div>
                      <button
                        onClick={() => handleDownload(selectedRequest.fileUrl, selectedRequest.fileName)}
                        className="btn-primary px-4 py-2"
                      >
                        Download
                      </button>
                    </div>
                    {selectedRequest.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
                      <div className="mt-4">
                        <img 
                          src={selectedRequest.fileUrl} 
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
                ></textarea>
                <div className="flex justify-end mt-3">
                  <button className="btn-primary px-4 py-2">
                    Send Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Pending Help Requests ({helpRequests.length})</h2>
            </div>
            
            {helpRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Help Requests</h3>
                <p className="text-gray-600">Students haven&#39;t submitted any help requests yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {helpRequests.map((request) => (
                  <div 
                    key={request.id} 
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-xl">❓</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{request.studentName}</h3>
                          <p className="text-sm text-gray-600">
                            {request.homeworkTitle || 'Homework help request'} 
                            {request.subject && ` - ${request.subject}`}
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
                    {request.message && (
                      <div className="mt-3 ml-16">
                        <p className="text-gray-700 text-sm line-clamp-2">
                          &#34;{request.message}&#34;
                        </p>
                      </div>
                    )}
                    {request.fileUrl && (
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