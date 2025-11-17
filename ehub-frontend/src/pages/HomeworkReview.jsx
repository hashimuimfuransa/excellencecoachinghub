import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import BottomNavbar from '../components/ui/BottomNavbar';

const HomeworkReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [homework, setHomework] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);

  // Fetch homework and submission data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch homework using the homework ID
        const homeworkResponse = await homeworkApi.getHomeworkById(id);
        if (!homeworkResponse.data.success) {
          setError(homeworkResponse.data.message || 'Failed to fetch homework');
          setLoading(false);
          return;
        }
        
        setHomework(homeworkResponse.data.data);
        
        // Fetch the current student's submission for this homework
        const submissionResponse = await homeworkApi.getStudentSubmission(id);
        if (!submissionResponse.data.success || !submissionResponse.data.data) {
          setError('No submission data found for this homework. You may not have submitted it yet.');
          setLoading(false);
          return;
        }
        
        const submissionData = submissionResponse.data.data;
        setSubmissionData(submissionData);
        
        // Load saved answers
        const savedAnswers = {};
        submissionData.extractedAnswers?.forEach(answer => {
          savedAnswers[answer.questionIndex] = answer.answer;
        });
        setAnswers(savedAnswers);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load homework review data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 pt-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Error: {error}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate('/homework')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Homework
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="max-w-4xl mx-auto p-6 pt-16">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('homework_not_found')}</h2>
          <p className="text-gray-600 mb-6">{t('homework_not_found_message')}</p>
          <button 
            onClick={() => navigate('/homework')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            ← {t('back_to_homework')}
          </button>
        </div>
      </div>
    );
  }

  // Function to get level label
  const getLevelLabel = (level) => {
    const levelMap = {
      'nursery-1': t('nursery_1'),
      'nursery-2': t('nursery_2'),
      'nursery-3': t('nursery_3'),
      'p1': t('p1'),
      'p2': t('p2'),
      'p3': t('p3'),
      'p4': t('p4'),
      'p5': t('p5'),
      'p6': t('p6')
    };
    return levelMap[level] || level;
  };

  // Get questions, default to empty array if undefined
  const questions = homework.extractedQuestions || [];

  // Calculate score from auto-grade if available
  const displayScore = () => {
    // If we have submission data with autoGrade, use that
    if (submissionData && submissionData.autoGrade !== undefined) {
      return {
        percentage: submissionData.autoGrade,
        message: `${t('auto_graded_score')}: ${submissionData.autoGrade}%`
      };
    }
    
    return null;
  };

  // Get detailed feedback for each question
  const getQuestionFeedback = (questionIndex) => {
    // Make sure we have submission data and answers
    if (!submissionData || !submissionData.extractedAnswers) {
      return {
        isCorrect: null,
        correctAnswer: 'Submission data not available',
        userAnswer: 'No answer recorded',
        feedback: 'No submission data available for this question.'
      };
    }
    
    const answer = submissionData.extractedAnswers.find(a => a.questionIndex === questionIndex);
    if (!answer) {
      return {
        isCorrect: null,
        correctAnswer: 'Answer not found',
        userAnswer: 'No answer recorded',
        feedback: 'No answer recorded for this question.'
      };
    }
    
    const question = homework?.extractedQuestions?.[questionIndex];
    if (!question) {
      return {
        isCorrect: null,
        correctAnswer: 'Question not found',
        userAnswer: answer.answer,
        feedback: 'Question data not available.'
      };
    }
    
    // For multiple choice questions
    if (question.type === 'multiple-choice') {
      const isCorrect = answer.answer === question.correctAnswer;
      return {
        isCorrect,
        correctAnswer: question.correctAnswer,
        userAnswer: answer.answer,
        feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`
      };
    }
    
    // For true-false questions
    if (question.type === 'true-false') {
      const isCorrect = answer.answer === question.correctAnswer;
      return {
        isCorrect,
        correctAnswer: question.correctAnswer,
        userAnswer: answer.answer,
        feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`
      };
    }
    
    // For fill-in-blank questions
    if (question.type === 'fill-in-blank') {
      const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
      const userAnswer = answer.answer?.toLowerCase().trim();
      const isCorrect = userAnswer && correctAnswers.some(correct => 
        question.caseSensitive ? correct === userAnswer : correct.toLowerCase() === userAnswer
      );
      
      return {
        isCorrect,
        correctAnswer: correctAnswers.join(' or '),
        userAnswer: answer.answer,
        feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${correctAnswers.join(' or ')}`
      };
    }
    
    // For matching questions
    if (question.type === 'matching') {
      const userMatches = answer.answer?.matches || {};
      const correctMatches = question.correctMatches || {};
      let correctCount = 0;
      let totalCount = 0;
      
      // Count correct matches
      Object.entries(correctMatches).forEach(([leftItem, rightItem]) => {
        totalCount++;
        if (userMatches[`left-${question.leftItems?.indexOf(leftItem)}`] === `right-${question.rightItems?.indexOf(rightItem)}`) {
          correctCount++;
        }
      });
      
      const isCorrect = correctCount === totalCount;
      return {
        isCorrect,
        correctAnswer: correctMatches,
        userAnswer: userMatches,
        feedback: isCorrect ? `Correct! All ${totalCount} matches are correct.` : 
                 `Incorrect. ${correctCount} out of ${totalCount} matches are correct.`
      };
    }
    
    // For ordering questions
    if (question.type === 'ordering') {
      const userOrder = Array.isArray(answer.answer) ? answer.answer : [];
      const correctOrder = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
      
      const isCorrect = userOrder.length === correctOrder.length && 
                       userOrder.every((item, index) => item === correctOrder[index]);
      
      return {
        isCorrect,
        correctAnswer: correctOrder.map(index => question.options?.[index]).join(' → '),
        userAnswer: userOrder.map(index => question.options?.[index]).join(' → '),
        feedback: isCorrect ? 'Correct!' : 'Incorrect. Check the correct order.'
      };
    }
    
    // For short-answer questions
    if (question.type === 'short-answer' || question.type === 'text') {
      return {
        isCorrect: null, // Can't automatically determine for text answers
        correctAnswer: question.correctAnswer || 'See teacher feedback',
        userAnswer: answer.answer,
        feedback: 'Answer submitted. Teacher will provide detailed feedback.'
      };
    }
    
    return {
      isCorrect: null,
      correctAnswer: 'Unknown question type',
      userAnswer: answer.answer,
      feedback: 'Unable to provide feedback for this question type.'
    };
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20 md:pb-6 pt-16 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{homework.title}</h1>
            <p className="text-gray-600 mb-4">{homework.description}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-sm font-semibold whitespace-nowrap">
              {homework.maxPoints} {t('points')}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{t('due')}: {new Date(homework.dueDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{t('level')}: {getLevelLabel(homework.level)}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span>{t('language')}: {homework.language?.charAt(0).toUpperCase() + homework.language?.slice(1)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
        {(!questions || questions.length === 0) ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❓</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('no_questions_available')}</h3>
            <p className="text-gray-600 mb-6">{t('try_adjusting_filters')}</p>
            <button 
              onClick={() => navigate('/homework')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              ← {t('back_to_homework')}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {questions.map((element, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 sm:pb-8 last:border-b-0 last:pb-0">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold mr-3">
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                      {element.question}
                    </h3>
                    <div className="mt-1 text-xs sm:text-sm text-gray-500 flex flex-wrap items-center gap-2">
                      {element.type === 'multiple-choice' && t('multiple_choice_question')}
                      {element.type === 'short-answer' && t('short_answer_question')}
                      {element.type === 'matching' && t('matching_question')}
                      {element.type === 'true-false' && t('true_false_question')}
                      {element.type === 'fill-in-blank' && t('fill_in_blank_question')}
                      {element.type === 'ordering' && t('ordering_question')}
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded-full">
                        {element.points} {t('points')}
                      </span>
                    </div>
                  </div>
                </div>

                {element.type === 'multiple-choice' && (
                  <div className="ml-11 space-y-3">
                    {element.options?.map((option, optionIndex) => {
                      const isSelected = answers[index] === option;
                      return (
                        <div 
                          key={optionIndex} 
                          className={`flex items-center p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 shadow-sm' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0">
                            {isSelected && (
                              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="ml-3 sm:ml-4 text-gray-800 text-base sm:text-lg">{option}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {(element.type === 'short-answer' || element.type === 'text') && (
                  <div className="ml-11">
                    <div className="p-4 sm:p-5 bg-gray-50 rounded-xl">
                      <textarea
                        value={answers[index] || ''}
                        readOnly
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-base sm:text-lg"
                        rows="4"
                      />
                    </div>
                  </div>
                )}

                {element.type === 'matching' && (
                  <div className="ml-11 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3 sm:mb-4 text-base sm:text-lg">{t('left_column')}</h4>
                        <div className="space-y-3">
                          {element.leftItems?.map((item, leftIndex) => (
                            <div key={leftIndex} className="p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-3 flex-shrink-0">
                                  {String.fromCharCode(65 + leftIndex)}
                                </div>
                                {element.leftItemImages?.[leftIndex] ? (
                                  <div className="flex items-center">
                                    <img 
                                      src={element.leftItemImages[leftIndex]} 
                                      alt={`Item ${leftIndex + 1}`} 
                                      className="w-12 sm:w-16 h-12 sm:h-16 object-contain mr-3 rounded"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                    <p className="text-gray-800 text-base sm:text-lg">{item}</p>
                                  </div>
                                ) : (
                                  <p className="text-gray-800 text-base sm:text-lg">{item}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3 sm:mb-4 text-base sm:text-lg">{t('right_column')}</h4>
                        <div className="space-y-3">
                          {element.rightItems?.map((item, rightIndex) => (
                            <div key={rightIndex} className="p-3 sm:p-4 bg-green-50 rounded-xl border border-green-100">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold mr-3 flex-shrink-0">
                                  {rightIndex + 1}
                                </div>
                                {element.rightItemImages?.[rightIndex] ? (
                                  <div className="flex items-center">
                                    <img 
                                      src={element.rightItemImages[rightIndex]} 
                                      alt={`Option ${rightIndex + 1}`} 
                                      className="w-12 sm:w-16 h-12 sm:h-16 object-contain mr-3 rounded"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                    <p className="text-gray-800 text-base sm:text-lg">{item}</p>
                                  </div>
                                ) : (
                                  <p className="text-gray-800 text-base sm:text-lg">{item}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 sm:mb-4 text-base sm:text-lg">{t('your_matches')}</h4>
                      <div className="space-y-4 bg-gray-50 p-4 sm:p-5 rounded-xl">
                        {element.leftItems?.map((leftItem, leftIndex) => {
                          const userMatch = answers[index]?.matches?.[`left-${leftIndex}`];
                          const matchedRightIndex = userMatch ? parseInt(userMatch.split('-')[1]) : -1;
                          const matchedRightItem = matchedRightIndex >= 0 ? element.rightItems?.[matchedRightIndex] : null;
                          
                          return (
                            <div key={leftIndex} className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 bg-white rounded-xl border shadow-sm gap-3">
                              <div className="flex items-center w-full sm:w-auto">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                                  {String.fromCharCode(65 + leftIndex)}
                                </span>
                                {element.leftItemImages?.[leftIndex] ? (
                                  <div className="flex items-center mr-4">
                                    <img 
                                      src={element.leftItemImages[leftIndex]} 
                                      alt={`Item ${leftIndex + 1}`} 
                                      className="w-10 h-10 object-contain mr-3 rounded"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                    <span className="text-gray-800 text-base sm:text-lg">{leftItem}</span>
                                  </div>
                                ) : (
                                  <span className="mr-4 text-gray-800 text-base sm:text-lg flex-grow">{leftItem}</span>
                                )}
                              </div>
                              <div className="flex items-center w-full">
                                <span className="mx-2 text-gray-400 text-xl hidden sm:block">→</span>
                                <span className="mx-2 text-gray-400 text-xl sm:hidden">↓</span>
                                <div className="flex-grow px-4 py-3 border-2 border-gray-200 rounded-lg text-base sm:text-lg bg-white">
                                  {matchedRightItem ? (
                                    <div className="flex items-center">
                                      <span className="mr-2">{matchedRightIndex + 1}.</span>
                                      {element.rightItemImages?.[matchedRightIndex] ? (
                                        <div className="flex items-center">
                                          <img 
                                            src={element.rightItemImages[matchedRightIndex]} 
                                            alt={`Option ${matchedRightIndex + 1}`} 
                                            className="w-8 h-8 object-contain mr-2 rounded"
                                            onError={(e) => {
                                              e.target.onerror = null;
                                              e.target.style.display = 'none';
                                            }}
                                          />
                                          <span>{matchedRightItem}</span>
                                        </div>
                                      ) : (
                                        <span>{matchedRightItem}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">{t('no_match_selected')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {element.type === 'true-false' && (
                  <div className="ml-11 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div
                      className={`flex-1 p-4 sm:p-5 rounded-xl border-2 font-semibold text-base sm:text-lg transition-all duration-200 ${
                        answers[index] === 'true'
                          ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                          : 'border-gray-200 bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="mr-2 sm:mr-3 text-xl sm:text-2xl">✓</span>
                        {t('yes')}
                      </div>
                    </div>
                    <div
                      className={`flex-1 p-4 sm:p-5 rounded-xl border-2 font-semibold text-base sm:text-lg transition-all duration-200 ${
                        answers[index] === 'false'
                          ? 'border-red-500 bg-red-50 text-red-700 shadow-md'
                          : 'border-gray-200 bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="mr-2 sm:mr-3 text-xl sm:text-2xl">✗</span>
                        {t('no')}
                      </div>
                    </div>
                  </div>
                )}

                {element.type === 'fill-in-blank' && (
                  <div className="ml-11">
                    <div className="p-4 sm:p-5 bg-gray-50 rounded-xl">
                      <input
                        type="text"
                        value={answers[index] || ''}
                        readOnly
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-base sm:text-lg"
                      />
                      {element.caseSensitive && (
                        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500 flex items-center">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          {t('case_sensitive')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {element.type === 'ordering' && (
                  <div className="ml-11">
                    <div className="space-y-4">
                      {element.options && (answers[index] || Array(element.options.length).fill(null)).map((_, itemIndex) => {
                        // Get the actual index from the current order
                        const actualIndex = answers[index] ? answers[index][itemIndex] : itemIndex;
                        const item = element.options[actualIndex];
                        
                        return (
                          <div 
                            key={itemIndex}
                            className="p-4 sm:p-5 bg-white rounded-xl border-2 border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
                          >
                            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0">
                              {itemIndex + 1}
                            </div>
                            <p className="text-gray-800 text-base sm:text-lg flex-grow text-center sm:text-left">{item}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Success View */}
      <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-400 text-green-800 px-4 py-4 sm:px-6 sm:py-5 rounded-2xl shadow-lg mt-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 sm:ml-4 flex-1">
            <h3 className="text-base sm:text-lg font-bold">
              {t('homework_review_mode')}
            </h3>
            {displayScore() && (
              <p className="mt-1 text-green-700 text-sm sm:text-base">
                {displayScore().message}
              </p>
            )}
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/homework')}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {t('back_to_homework')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Feedback Section */}
      {submissionData && homework?.extractedQuestions && (
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Question-by-Question Review</h3>
          <div className="space-y-6">
            {homework.extractedQuestions.map((question, index) => {
              const feedback = getQuestionFeedback(index);
              // Don't render feedback section if we don't have proper feedback data
              if (!feedback) return null;
              
              return (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start mb-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                        {question.question}
                      </h4>
                      <div className="mt-1 text-xs sm:text-sm text-gray-500 flex flex-wrap items-center gap-2">
                        <span className="inline-block bg-gray-100 px-2 py-1 rounded-full">
                          {question.points} {t('points')}
                        </span>
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
                          {question.type.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-11 space-y-3">
                    {/* User's Answer */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Your Answer:</p>
                      <div className={`p-3 rounded-lg ${feedback.isCorrect === true ? 'bg-green-50 border border-green-200' : feedback.isCorrect === false ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                        {question.type === 'matching' ? (
                          <div className="space-y-2">
                            {Object.entries(feedback.userAnswer || {}).map(([leftId, rightId], matchIndex) => {
                              const leftIndex = parseInt(leftId.split('-')[1]);
                              const rightIndex = parseInt(rightId.split('-')[1]);
                              const leftItem = question.leftItems?.[leftIndex];
                              const rightItem = question.rightItems?.[rightIndex];
                              return (
                                <div key={matchIndex} className="flex items-center text-sm">
                                  <span className="font-medium">{leftItem}</span>
                                  <span className="mx-2">→</span>
                                  <span>{rightItem}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : question.type === 'ordering' ? (
                          <p className="text-sm">{feedback.userAnswer}</p>
                        ) : (
                          <p className="text-sm">{feedback.userAnswer || 'No answer provided'}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Correct Answer (if incorrect) */}
                    {feedback.isCorrect === false && feedback.correctAnswer && feedback.correctAnswer !== 'Submission data not available' && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Correct Answer:</p>
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                          {question.type === 'matching' ? (
                            <div className="space-y-2">
                              {Object.entries(feedback.correctAnswer || {}).map(([leftItem, rightItem], matchIndex) => (
                                <div key={matchIndex} className="flex items-center text-sm">
                                  <span className="font-medium">{leftItem}</span>
                                  <span className="mx-2">→</span>
                                  <span>{rightItem}</span>
                                </div>
                              ))}
                            </div>
                          ) : question.type === 'ordering' ? (
                              <p className="text-sm">{feedback.correctAnswer}</p>
                          ) : (
                              <p className="text-sm">{feedback.correctAnswer}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Feedback */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                      <div className={`p-3 rounded-lg ${feedback.isCorrect === true ? 'bg-green-100 text-green-800' : feedback.isCorrect === false ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        <p className="text-sm">{feedback.feedback}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <BottomNavbar />
    </div>
  );
};

export default HomeworkReview;