import React, { useState, useEffect } from 'react';
import { homeworkApi } from '../api/homeworkApi';
import { useNavigate } from 'react-router-dom';

const HomeworkReviews = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, reviewed, all

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const response = await homeworkApi.getSubmissions();
        
        // Transform submissions data to match expected format
        let transformedSubmissions = [];
        if (Array.isArray(response.data)) {
          transformedSubmissions = response.data.map(submission => ({
            id: submission._id,
            studentName: `${submission.student.firstName} ${submission.student.lastName}`,
            studentGrade: 'N/A', // This would need to be fetched from student data
            homeworkTitle: submission.assignment.title,
            subject: 'Homework', // This would need to be fetched from course data
            submittedAt: submission.submittedAt,
            status: submission.status,
            reviewed: submission.status === 'graded',
            grade: submission.grade || submission.score,
            fileUrl: submission.attachments && submission.attachments.length > 0 ? submission.attachments[0].url : null,
            fileName: submission.attachments && submission.attachments.length > 0 ? submission.attachments[0].originalName : null
          }));
        }
        
        setSubmissions(transformedSubmissions);
      } catch (error) {
        console.error('Error loading submissions:', error);
        // Fallback to mock data if backend is not available
        const mockSubmissions = [
          {
            id: 1,
            studentName: 'John Doe',
            studentGrade: 'Grade 7',
            homeworkTitle: 'Math Problem Set 3',
            subject: 'Mathematics',
            submittedAt: '2023-05-15T14:30:00Z',
            status: 'pending',
            fileUrl: '/sample-submission.pdf',
            fileName: 'john-math-hw3.pdf'
          },
          {
            id: 2,
            studentName: 'Sarah Johnson',
            studentGrade: 'Grade 7',
            homeworkTitle: 'Science Experiment Report',
            subject: 'Science',
            submittedAt: '2023-05-14T16:45:00Z',
            status: 'reviewed',
            grade: 'A',
            fileUrl: '/sample-submission2.pdf',
            fileName: 'sarah-science-report.docx'
          },
          {
            id: 3,
            studentName: 'Michael Brown',
            studentGrade: 'Grade 8',
            homeworkTitle: 'English Essay',
            subject: 'English',
            submittedAt: '2023-05-16T09:15:00Z',
            status: 'pending',
            fileUrl: '/sample-submission3.pdf',
            fileName: 'michael-english-essay.pdf'
          }
        ];
        setSubmissions(mockSubmissions);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'pending') return !submission.reviewed;
    if (filter === 'reviewed') return submission.reviewed;
    return true;
  });

  const handleReview = (submissionId) => {
    navigate(`/homework/review/${submissionId}`);
  };

  const handleDownload = (fileUrl, fileName) => {
    // In a real app, this would download the file
    // For now, we'll just open it in a new tab
    window.open(fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📝</span>
            </div>
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading submissions...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="mr-2">←</span> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Homework Submissions</h1>
          <p className="text-gray-600">Review and grade student homework submissions</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${filter === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({submissions.filter(s => !s.reviewed).length})
          </button>
          <button
            className={`py-2 px-4 font-medium ${filter === 'reviewed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('reviewed')}
          >
            Reviewed ({submissions.filter(s => s.reviewed).length})
          </button>
          <button
            className={`py-2 px-4 font-medium ${filter === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilter('all')}
          >
            All ({submissions.length})
          </button>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">
              {filter === 'pending' ? '📋' : filter === 'reviewed' ? '✅' : '📚'}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {filter === 'pending' ? 'No Pending Reviews' : filter === 'reviewed' ? 'No Reviewed Submissions' : 'No Submissions'}
            </h3>
            <p className="text-gray-600">
              {filter === 'pending' 
                ? 'All homework submissions have been reviewed!' 
                : filter === 'reviewed' 
                ? 'No submissions have been reviewed yet.' 
                : 'No homework submissions found.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-xl">👤</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{submission.studentName}</h3>
                        <p className="text-sm text-gray-600">
                          {submission.homeworkTitle} 
                          {submission.subject && ` - ${submission.subject}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(submission.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div>
                        {submission.reviewed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Reviewed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleReview(submission.id)}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        {submission.reviewed ? 'View Feedback' : 'Review'}
                      </button>
                    </div>
                  </div>
                  {submission.fileUrl && (
                    <div className="mt-3 ml-16">
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-sm">{submission.fileName || 'homework_submission.jpg'}</p>
                          <p className="text-xs text-gray-600">Click to view or download</p>
                        </div>
                        <button
                          onClick={() => handleDownload(submission.fileUrl, submission.fileName)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Download
                        </button>
                      </div>
                      {submission.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
                        <div className="mt-3">
                          <img 
                            src={submission.fileUrl} 
                            alt="Student homework submission" 
                            className="max-w-xs h-auto rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {submission.reviewed && submission.feedback && (
                    <div className="mt-3 ml-16">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-800">Teacher Feedback:</p>
                        <p className="text-gray-700 text-sm mt-1">{submission.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkReviews;