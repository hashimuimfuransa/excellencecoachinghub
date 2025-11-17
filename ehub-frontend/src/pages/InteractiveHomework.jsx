import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { useTranslation } from 'react-i18next';
import BottomNavbar from '../components/ui/BottomNavbar';

const InteractiveHomework = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [homework, setHomework] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Fetch homework data from API
  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const response = await homeworkApi.getHomeworkById(id);
        if (response.data.success) {
          setHomework(response.data.data);
          
          // Initialize answers state with default values based on question types
          const initialAnswers = {};
          const questions = response.data.data.extractedQuestions || [];
          questions.forEach((_, index) => {
            initialAnswers[index] = getInitialAnswerValue(questions[index]);
          });
          setAnswers(initialAnswers);
        } else {
          setError(response.data.message || 'Failed to fetch homework');
        }
      } catch (error) {
        console.error('Error fetching homework:', error);
        setError('Failed to fetch homework. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHomework();
    } else {
      setLoading(false);
    }
  }, [id]);

  // Helper function to get initial answer value based on question type
  const getInitialAnswerValue = (question) => {
    switch (question.type) {
      case 'matching':
        return { matches: {} };
      case 'ordering':
        // Initialize with the original order of options
        return question.options ? [...Array(question.options.length).keys()] : [];
      default:
        return '';
    }
  };

  const handleAnswerChange = (elementId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [elementId]: answer
    }));
  };

  const calculateScore = () => {
    if (!homework?.autoGrading) return null;
    
    let totalScore = 0;
    let earnedPoints = 0;
    
    // Use extractedQuestions from the homework data, default to empty array if undefined
    const questions = homework.extractedQuestions || [];
    
    questions.forEach((element, index) => {
      totalScore += element.points || 0;
      
      // For quiz questions, check if the answer is correct
      if (element.type === 'multiple-choice') {
        if (answers[index] === element.correctAnswer) {
          earnedPoints += element.points || 0;
        }
      }
      // For matching questions, check if matches are correct
      else if (element.type === 'matching') {
        const userAnswer = answers[index];
        if (userAnswer && userAnswer.matches) {
          let correctMatches = 0;
          const totalMatches = element.leftItems?.length || 0;
          
          // Check each match
          Object.entries(userAnswer.matches).forEach(([leftId, rightId]) => {
            // Find the original left item text
            const leftIndex = parseInt(leftId.split('-')[1]);
            const leftItemText = element.leftItems?.[leftIndex];
            
            // Find the original right item text
            const rightIndex = parseInt(rightId.split('-')[1]);
            const rightItemText = element.rightItems?.[rightIndex];
            
            // Check if this is a correct match
            if (leftItemText && rightItemText && element.correctMatches?.[leftItemText] === rightItemText) {
              correctMatches++;
            }
          });
          
          // Award points based on percentage of correct matches
          if (totalMatches > 0) {
            const matchPercentage = correctMatches / totalMatches;
            earnedPoints += Math.round((element.points || 0) * matchPercentage);
          }
        }
      }
      // For other interactive elements that can be automatically graded
      // For now, we'll give full points for completing these activities
      else if (element.type === 'short-answer') {
        // Check if the student provided an answer
        if (answers[index]) {
          earnedPoints += element.points || 0;
        }
      }
      // For true-false questions
      else if (element.type === 'true-false') {
        if (answers[index] === element.correctAnswer) {
          earnedPoints += element.points || 0;
        }
      }
      // For fill-in-blank questions
      else if (element.type === 'fill-in-blank') {
        const correctAnswers = Array.isArray(element.correctAnswer) ? element.correctAnswer : [element.correctAnswer];
        const userAnswer = answers[index]?.toLowerCase().trim();
        
        if (userAnswer && correctAnswers.some(correct => 
          element.caseSensitive ? correct === userAnswer : correct.toLowerCase() === userAnswer
        )) {
          earnedPoints += element.points || 0;
        }
      }
      // For ordering questions
      else if (element.type === 'ordering') {
        const correctOrder = Array.isArray(element.correctAnswer) ? element.correctAnswer : [];
        const userOrder = Array.isArray(answers[index]) ? answers[index] : [];
        
        if (userOrder.length === correctOrder.length) {
          let correctPositions = 0;
          for (let j = 0; j < correctOrder.length; j++) {
            if (userOrder[j] === correctOrder[j]) {
              correctPositions++;
            }
          }
          
          const positionPercentage = correctPositions / correctOrder.length;
          earnedPoints += Math.round((element.points || 0) * positionPercentage);
        }
      }
    });
    
    return {
      earned: earnedPoints,
      total: totalScore,
      percentage: totalScore > 0 ? Math.round((earnedPoints / totalScore) * 100) : 0
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Prepare submission data
      const submissionData = {
        answers: Object.keys(answers).map(key => ({
          questionIndex: parseInt(key),
          answer: answers[key],
          questionType: homework?.extractedQuestions?.[parseInt(key)]?.type || 'unknown'
        })),
        isDraft: false
      };
      
      // Submit homework to API
      const response = await homeworkApi.submitHomework(id, submissionData);
      
      if (response.data.success) {
        setSubmitted(true);
      } else {
        throw new Error(response.data.message || 'Failed to submit homework');
      }
    } catch (error) {
      console.error('Error submitting homework:', error);
      setError('Failed to submit homework. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Function to move an item in an array for ordering questions
  const moveItem = (array, fromIndex, toIndex) => {
    const newArray = [...array];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);
    return newArray;
  };

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
        <button 
          onClick={() => navigate('/homework')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Back to Homework
        </button>
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

  const score = calculateScore();

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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20 md:pb-6 pt-16 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{homework.title}</h1>
            <p className="text-gray-600 mb-4">{homework.description}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-sm font-semibold whitespace-nowrap">
            {homework.maxPoints} {t('points')}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
                    {element.options?.map((option, optionIndex) => (
                      <label 
                        key={optionIndex} 
                        className={`flex items-center p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          answers[index] === option 
                            ? 'border-blue-500 bg-blue-50 shadow-sm' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option}
                          checked={answers[index] === option}
                          onChange={() => handleAnswerChange(index, option)}
                          className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="ml-3 sm:ml-4 text-gray-800 text-base sm:text-lg">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {(element.type === 'short-answer' || element.type === 'text') && (
                  <div className="ml-11">
                    <textarea
                      value={answers[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder={t('enter_your_answer')}
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base sm:text-lg"
                      rows="4 sm:rows-5"
                    />
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
                      <h4 className="font-semibold text-gray-700 mb-3 sm:mb-4 text-base sm:text-lg">{t('make_your_matches')}</h4>
                      <div className="space-y-4 bg-gray-50 p-4 sm:p-5 rounded-xl">
                        {element.leftItems?.map((leftItem, leftIndex) => (
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
                              <select
                                value={answers[index]?.matches?.[`left-${leftIndex}`] || ''}
                                onChange={(e) => {
                                  const currentMatches = answers[index]?.matches || {};
                                  handleAnswerChange(index, {
                                    ...answers[index],
                                    matches: {
                                      ...currentMatches,
                                      [`left-${leftIndex}`]: e.target.value
                                    }
                                  });
                                }}
                                className="flex-grow px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg w-full"
                              >
                                <option value="">{t('select_match')}</option>
                                {element.rightItems?.map((rightItem, rightIndex) => (
                                  <option key={rightIndex} value={`right-${rightIndex}`}>
                                    {rightIndex + 1}. {rightItem}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {element.type === 'true-false' && (
                  <div className="ml-11 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(index, 'true')}
                      className={`flex-1 p-4 sm:p-5 rounded-xl border-2 font-semibold text-base sm:text-lg transition-all duration-200 ${
                        answers[index] === 'true'
                          ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="mr-2 sm:mr-3 text-xl sm:text-2xl">✓</span>
                        {t('yes')}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(index, 'false')}
                      className={`flex-1 p-4 sm:p-5 rounded-xl border-2 font-semibold text-base sm:text-lg transition-all duration-200 ${
                        answers[index] === 'false'
                          ? 'border-red-500 bg-red-50 text-red-700 shadow-md'
                          : 'border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="mr-2 sm:mr-3 text-xl sm:text-2xl">✗</span>
                        {t('no')}
                      </div>
                    </button>
                  </div>
                )}

                {element.type === 'fill-in-blank' && (
                  <div className="ml-11">
                    <div className="p-4 sm:p-5 bg-gray-50 rounded-xl">
                      <input
                        type="text"
                        value={answers[index] || ''}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        placeholder={t('enter_your_answer')}
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base sm:text-lg"
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
                            <div className="flex space-x-1 sm:space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (itemIndex > 0) {
                                    const currentOrder = answers[index] || [...Array(element.options.length).keys()];
                                    const newOrder = moveItem(currentOrder, itemIndex, itemIndex - 1);
                                    handleAnswerChange(index, newOrder);
                                  }
                                }}
                                className="p-2 sm:p-3 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                                disabled={itemIndex === 0}
                                aria-label={t('move_up')}
                              >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (itemIndex < (element.options?.length || 1) - 1) {
                                    const currentOrder = answers[index] || [...Array(element.options.length).keys()];
                                    const newOrder = moveItem(currentOrder, itemIndex, itemIndex + 1);
                                    handleAnswerChange(index, newOrder);
                                  }
                                }}
                                className="p-2 sm:p-3 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                                disabled={itemIndex === (element.options?.length || 1) - 1}
                                aria-label={t('move_down')}
                              >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 sm:mt-4 text-sm text-gray-500 flex items-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0v3m0 0V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                      </svg>
                      {t('drag_and_drop_instruction')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!submitted ? (
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6">
          <button
            onClick={() => navigate('/homework')}
            className="px-4 py-3 sm:px-6 sm:py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm sm:text-base"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !questions || questions.length === 0}
            className="px-4 py-3 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transform transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center text-sm sm:text-base"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('submitting')}
              </>
            ) : t('submit_homework')}
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-400 text-green-800 px-4 py-4 sm:px-6 sm:py-5 rounded-2xl shadow-lg mt-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <h3 className="text-base sm:text-lg font-bold">{t('homework_submitted_successfully')}</h3>
              {score && (
                <p className="mt-1 text-green-700 text-sm sm:text-base">
                  {t('your_score')}: <span className="font-bold">{score.earned}/{score.total}</span> 
                  {score.percentage > 0 && ` (${score.percentage}%)`}
                </p>
              )}
              <div className="mt-3 sm:mt-4">
                <button
                  onClick={() => navigate('/homework')}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  {t('back_to_homework')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <BottomNavbar />
    </div>
  );
};

export default InteractiveHomework;