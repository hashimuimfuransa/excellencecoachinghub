import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';

const ReviewHomework = () => {
  const { id } = useParams(); // This is now the homework ID
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load all submissions for this homework
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        // Validate homework ID
        if (!id) {
          setError('Invalid homework ID.');
          setLoading(false);
          return;
        }
        
        console.log('Loading submissions for homework ID:', id);
        // Fetch all submissions for this homework
        const response = await homeworkApi.getHomeworkSubmissions(id);
        console.log('Submissions API Response:', response);
        
        // Ensure submissions is always an array
        const submissionsData = Array.isArray(response.data) ? response.data : [];
        setSubmissions(submissionsData);
        
        // If there's only one submission, select it automatically
        if (submissionsData.length === 1) {
          setSelectedSubmission(submissionsData[0]);
          // Pre-fill feedback and grade if they exist
          if (submissionsData[0].feedback) {
            setFeedback(submissionsData[0].feedback);
          }
          if (submissionsData[0].grade) {
            setGrade(submissionsData[0].grade);
          }
        }
      } catch (error) {
        console.error('Error loading submissions:', error);
        // Check if it's a 404 error (homework not found)
        if (error.response && error.response.status === 404) {
          setError('Homework not found. The homework ID may be invalid or the homework has been deleted.');
        } else {
          setError('Failed to load submissions. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadSubmissions();
    } else {
      setError('No homework ID provided.');
      setLoading(false);
    }
  }, [id]);

  // Handle submission selection
  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
    // Pre-fill feedback and grade if they exist
    if (submission.feedback) {
      setFeedback(submission.feedback);
    } else {
      setFeedback('');
    }
    if (submission.grade) {
      setGrade(submission.grade);
    } else {
      setGrade('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) {
      setError('Please select a submission to review.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      const feedbackData = {
        feedback,
        grade
      };

      // Submit feedback to backend
      await homeworkApi.gradeHomeworkSubmission(selectedSubmission._id, feedbackData);
      
      setSuccess(true);
      // Update the submission with the new feedback and grade
      const updatedSubmissions = submissions.map(sub => 
        sub._id === selectedSubmission._id 
          ? { ...sub, feedback, grade, status: 'graded' } 
          : sub
      );
      setSubmissions(updatedSubmissions);
      
      // Update selected submission
      setSelectedSubmission(prev => ({
        ...prev,
        feedback,
        grade,
        status: 'graded'
      }));
      
      setTimeout(() => {
        setSuccess(false);
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

  // Helper function to check if student answer is correct
  const checkAnswerCorrectness = (question, studentAnswer) => {
    if (!studentAnswer || studentAnswer.answer === undefined || studentAnswer.answer === null) {
      return false;
    }
    
    switch (question.type) {
      case 'multiple-choice':
        return studentAnswer.answer === question.correctAnswer;
      case 'true-false':
        return studentAnswer.answer === question.correctAnswer;
      case 'fill-in-blank': {
        const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
        const userAnswer = studentAnswer.answer?.toLowerCase().trim();
        return userAnswer && correctAnswers.some((correct) => 
          question.caseSensitive ? correct === userAnswer : correct.toLowerCase() === userAnswer
        );
      }
      default:
        // For other question types, we'll consider them correct for now
        return true;
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
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading submissions...</div>
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => navigate('/homework/reviews')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="mr-2">←</span> Back to Reviews
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Homework Submissions</h1>
          <p className="text-gray-600">Select a student submission to review and provide feedback</p>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            Feedback submitted successfully!
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Student Submissions List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Submissions</h2>
              <p className="text-sm text-gray-600 mb-4">{submissions.length} submissions found</p>
              
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-gray-600">No submissions found for this homework.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {submissions.map((submission) => (
                    <div 
                      key={submission._id}
                      onClick={() => handleSelectSubmission(submission)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedSubmission && selectedSubmission._id === submission._id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {submission.student?.firstName} {submission.student?.lastName}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          {submission.status === 'graded' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Graded
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                      {submission.grade && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Grade: {submission.grade}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submission Review and Feedback */}
          <div className="lg:col-span-2">
            {selectedSubmission ? (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Submission Review</h2>
                    <p className="text-gray-600">Provide feedback and grade for {selectedSubmission.student?.firstName} {selectedSubmission.student?.lastName}&#39;s submission</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedSubmission.status === 'graded' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Graded
                      </span>
                    )}
                  </div>
                </div>

                {/* Student Information */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Student</p>
                    <p className="font-medium">
                      {selectedSubmission.student?.firstName} {selectedSubmission.student?.lastName}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Submission Date</p>
                    <p className="font-medium">
                      {selectedSubmission.submittedAt 
                        ? new Date(selectedSubmission.submittedAt).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Submission Content */}
                {selectedSubmission.message && (
                  <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Student&#39;s Message</h3>
                    <p className="text-gray-800">{selectedSubmission.message}</p>
                  </div>
                )}

                {selectedSubmission.fileUrl && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Attached File</h3>
                      <button
                        onClick={() => handleDownload(selectedSubmission.fileUrl, selectedSubmission.fileName)}
                        className="btn-primary px-3 py-1 text-sm"
                      >
                        Download
                      </button>
                    </div>
                    {selectedSubmission.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
                      <div className="mt-3">
                        <img 
                          src={selectedSubmission.fileUrl} 
                          alt="Student homework submission" 
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Questions and Answers Section */}
                {selectedSubmission.assignment?.extractedQuestions && selectedSubmission.extractedAnswers && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions & Student Answers</h3>
                    <div className="space-y-4">
                      {selectedSubmission.assignment.extractedQuestions.map((question, index) => {
                        const studentAnswer = selectedSubmission.extractedAnswers.find(ans => ans.questionIndex === index);
                        const isCorrect = checkAnswerCorrectness(question, studentAnswer);
                        
                        return (
                          <div 
                            key={index} 
                            className={`border rounded-lg p-4 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                              {isCorrect ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Correct
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Incorrect
                                </span>
                              )}
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-gray-700">{question.question}</p>
                              {question.type === 'multiple-choice' && (
                                <div className="mt-2 space-y-1">
                                  {question.options?.map((option, optIndex) => (
                                    <div key={optIndex} className="flex items-center">
                                      <span className={`w-5 h-5 rounded-full border mr-2 flex items-center justify-center text-xs ${question.correctAnswer === optIndex ? 'border-green-500 bg-green-100 text-green-700' : 'border-gray-300'}`}>
                                        {question.correctAnswer === optIndex ? '✓' : ''}
                                      </span>
                                      <span className={question.correctAnswer === optIndex ? 'font-medium text-green-700' : ''}>{option}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {question.type === 'true-false' && (
                                <div className="mt-2">
                                  <p>Correct Answer: <span className="font-medium">{question.correctAnswer ? 'True' : 'False'}</span></p>
                                </div>
                              )}
                            </div>
                            
                            {studentAnswer && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-1">Student&#39;s Answer:</p>
                                {question.type === 'multiple-choice' ? (
                                  <p className="text-gray-800">
                                    {question.options?.[studentAnswer.answer] || 'No answer provided'}
                                  </p>
                                ) : question.type === 'true-false' ? (
                                  <p className="text-gray-800">{studentAnswer.answer ? 'True' : 'False'}</p>
                                ) : (
                                  <p className="text-gray-800">{studentAnswer.answer || 'No answer provided'}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Existing Feedback Section */}
                {selectedSubmission.feedback && (
                  <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Previous Feedback</h3>
                    <div className="flex items-center mb-2">
                      {selectedSubmission.grade && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          Grade: {selectedSubmission.grade}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800">{selectedSubmission.feedback}</p>
                  </div>
                )}

                {/* Feedback Form */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Provide Feedback</h3>
                  
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
                        onClick={() => {
                          setSelectedSubmission(null);
                          setFeedback('');
                          setGrade('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Clear Selection
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
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Select a Submission</h3>
                <p className="text-gray-600">
                  Choose a student submission from the list to review and provide feedback.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewHomework;