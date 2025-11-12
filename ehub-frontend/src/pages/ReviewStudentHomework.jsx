import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';

const ReviewStudentHomework = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [homework, setHomework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHomework = async () => {
      try {
        // Fetch homework from backend
        const response = await homeworkApi.getHomeworkHelpById(id);
        setHomework(response.data);
      } catch (error) {
        console.error('Error loading homework:', error);
        // Fallback to mock data if backend is not available
        const mockHomework = {
          id: id,
          title: 'My Math Challenge',
          subject: 'Mathematics',
          description: 'Solve these interesting geometry problems I created',
          studentName: 'Emma Johnson',
          studentGrade: 'Grade 7',
          createdAt: '2023-05-15',
          type: 'math',
          status: 'pending',
          content: 'Create a triangle with sides of 3cm, 4cm, and 5cm. What type of triangle is this? Explain your reasoning and show your work.',
          drawingData: null // This would be a data URL for drawing homework
        };
        setHomework(mockHomework);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadHomework();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const reviewData = {
        feedback,
        grade
      };

      // Submit review to backend
      await homeworkApi.reviewStudentHomework(id, reviewData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/homework/student');
      }, 2000);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📝</span>
            </div>
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading homework...</div>
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
            onClick={() => navigate('/homework/student')}
            className="btn-primary"
          >
            Back to Student Homework
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
            onClick={() => navigate('/homework/student')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="mr-2">←</span> Back to Student Homework
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Student Homework</h1>
          <p className="text-gray-600">Provide feedback for {homework?.studentName}&#39;s assignment</p>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            Feedback submitted successfully! Redirecting...
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Student Homework */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Homework Details</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Student</p>
                  <p className="font-medium">{homework?.studentName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Grade</p>
                  <p className="font-medium">{homework?.studentGrade}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Homework</p>
                  <p className="font-medium">{homework?.title}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Subject</p>
                  <p className="font-medium">{homework?.subject}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">{new Date(homework?.createdAt).toLocaleString()}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-800">{homework?.description}</p>
              </div>

              {homework?.type === 'drawing' && homework?.drawingData && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Student&#39;s Drawing</h3>
                  <img 
                    src={homework.drawingData} 
                    alt="Student&#39;s drawing" 
                    className="max-w-full h-auto rounded-lg border border-gray-300"
                  />
                </div>
              )}

              {homework?.type === 'math' && homework?.content && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Math Problem</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-800 whitespace-pre-wrap">{homework.content}</p>
                  </div>
                </div>
              )}

              {homework?.type === 'science' && homework?.content && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Science Experiment</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-800 whitespace-pre-wrap">{homework.content}</p>
                  </div>
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
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide detailed feedback on the student's work. What did they do well? How can they improve?"
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
                    onClick={() => navigate('/homework/student')}
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

export default ReviewStudentHomework;