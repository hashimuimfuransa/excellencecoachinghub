import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';

const ReviewHomework = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSubmission = async () => {
      try {
        // In a real app, you would fetch the specific submission by ID
        // const response = await homeworkApi.getSubmissionById(id);
        // setSubmission(response.data);
        
        // For now, we'll simulate with mock data
        const mockSubmission = {
          id: id,
          studentName: 'John Doe',
          studentGrade: 'Grade 7',
          homeworkTitle: 'Math Problem Set 3',
          subject: 'Mathematics',
          submittedAt: '2023-05-15T14:30:00Z',
          fileUrl: '/sample-submission.pdf',
          fileName: 'john-math-hw3.pdf',
          message: 'I had some trouble with questions 4 and 5. Please let me know if my approach was correct.',
          feedback: '',
          grade: '',
          status: 'pending'
        };
        
        setSubmission(mockSubmission);
      } catch (error) {
        console.error('Error loading submission:', error);
        setError('Failed to load submission');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadSubmission();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const feedbackData = {
        feedback,
        grade
      };

      // Submit feedback to backend
      await homeworkApi.reviewSubmission(id, feedbackData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/homework/reviews');
      }, 2000);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmitting(false);
    }
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
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading submission...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
          <button 
            onClick={() => navigate('/homework/reviews')}
            className="btn-primary"
          >
            Back to Reviews
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => navigate('/homework/reviews')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="mr-2">←</span> Back to Reviews
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Homework Submission</h1>
          <p className="text-gray-600">Provide feedback and grade for {submission?.studentName}{`'`}s submission</p>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            Feedback submitted successfully! Redirecting...
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Student Submission */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Submission</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Student</p>
                  <p className="font-medium">{submission?.studentName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Grade</p>
                  <p className="font-medium">{submission?.studentGrade}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Homework</p>
                  <p className="font-medium">{submission?.homeworkTitle}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Subject</p>
                  <p className="font-medium">{submission?.subject}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="font-medium">{new Date(submission?.submittedAt).toLocaleString()}</p>
              </div>

              {submission?.message && (
                <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Student{`'`}s Message</h3>
                  <p className="text-gray-800">{submission.message}</p>
                </div>
              )}

              {submission?.fileUrl && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Attached File</h3>
                    <button
                      onClick={() => handleDownload(submission.fileUrl, submission.fileName)}
                      className="btn-primary px-3 py-1 text-sm"
                    >
                      Download
                    </button>
                  </div>
                  {submission.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
                    <div className="mt-3">
                      <img 
                        src={submission.fileUrl} 
                        alt="Student homework submission" 
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Feedback Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Provide Feedback</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Grade</option>
                    <option value="A+">A+ (Excellent)</option>
                    <option value="A">A (Very Good)</option>
                    <option value="B+">B+ (Good)</option>
                    <option value="B">B (Above Average)</option>
                    <option value="C+">C+ (Average)</option>
                    <option value="C">C (Below Average)</option>
                    <option value="D">D (Poor)</option>
                    <option value="F">F (Fail)</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide detailed feedback on the student's work..."
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/homework/reviews')}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewHomework;