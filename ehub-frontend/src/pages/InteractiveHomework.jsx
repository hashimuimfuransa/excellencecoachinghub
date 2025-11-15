import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { useTranslation } from 'react-i18next';

const InteractiveHomework = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [homework, setHomework] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch homework data from API
  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const response = await homeworkApi.getHomeworkById(id);
        if (response.data.success) {
          setHomework(response.data.data);
        } else {
          console.error('Failed to fetch homework:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching homework:', error);
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
      totalScore += element.points;
      
      // For quiz questions, check if the answer is correct
      if (element.type === 'multiple-choice') {
        if (answers[index] === element.correctAnswer) {
          earnedPoints += element.points;
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
            earnedPoints += Math.round(element.points * matchPercentage);
          }
        }
      }
      // For other interactive elements that can be automatically graded
      // For now, we'll give full points for completing these activities
      else if (element.type === 'short-answer') {
        // Check if the student provided an answer
        if (answers[index]) {
          earnedPoints += element.points;
        }
      }
    });
    
    return {
      earned: earnedPoints,
      total: totalScore,
      percentage: Math.round((earnedPoints / totalScore) * 100)
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
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
      alert('Failed to submit homework. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800">{t('homework_not_found')}</h2>
          <p className="text-gray-600 mt-2">{t('homework_not_found_message')}</p>
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
  // Also handle the case where questions might be stored directly
  // Handle different possible data structures for homework questions
  const questions = homework.extractedQuestions || 
                   homework.questions || 
                   homework.interactiveElements || 
                   (homework.data && homework.data.extractedQuestions) || 
                   (homework.data && homework.data.questions) || 
                   (homework.data && homework.data.interactiveElements) || 
                   [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{homework.title}</h1>
        <p className="text-gray-600 mb-4">{homework.description}</p>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <span>{t('due')}: {new Date(homework.dueDate).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>{t('level')}: {getLevelLabel(homework.level)}</span>
            <span className="mx-2">•</span>
            <span>{t('language')}: {homework.language?.charAt(0).toUpperCase() + homework.language?.slice(1)}</span>
          </div>
          {score && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {t('score')}: {score.earned}/{score.total} ({score.percentage}%)
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('questions')}</h2>
        {questions && questions.length > 0 ? (
          questions.map((element, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">{element.question}</h3>
              
              {element.type === 'multiple-choice' && (
                <div className="space-y-2">
                  {element.options?.map((option, optIndex) => (
                    <label key={optIndex} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`quiz-${index}`}
                        value={option}
                        checked={answers[index] === option}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {element.type === 'matching' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">{t('left_column')}</h4>
                    <div className="space-y-3">
                      {element.leftItems?.map((item, itemIndex) => (
                        <div key={itemIndex} className="p-3 bg-blue-50 rounded-lg">
                          {/* Display image if available */}
                          {element.leftItemImages?.[itemIndex] && (
                            <div className="mb-2">
                              <img 
                                src={element.leftItemImages[itemIndex]} 
                                alt={`${t('item')} ${String.fromCharCode(65 + itemIndex)}`}
                                className="max-w-full h-32 object-contain rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <span className="font-medium">{String.fromCharCode(65 + itemIndex)}. {item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">{t('right_column')}</h4>
                    <div className="space-y-3">
                      {element.rightItems?.map((item, itemIndex) => (
                        <div key={itemIndex} className="p-3 bg-green-50 rounded-lg">
                          {/* Display image if available */}
                          {element.rightItemImages?.[itemIndex] && (
                            <div className="mb-2">
                              <img 
                                src={element.rightItemImages[itemIndex]} 
                                alt={`${t('option')} ${itemIndex + 1}`}
                                className="max-w-full h-32 object-contain rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <span className="font-medium">{itemIndex + 1}. {item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-700 mb-2">{t('make_your_matches')}</h4>
                    <div className="space-y-3">
                      {element.leftItems?.map((item, leftIndex) => (
                        <div key={leftIndex} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          {/* Display image if available */}
                          {element.leftItemImages?.[leftIndex] && (
                            <div className="mr-3">
                              <img 
                                src={element.leftItemImages[leftIndex]} 
                                alt={`${t('item')} ${String.fromCharCode(65 + leftIndex)}`}
                                className="h-12 w-12 object-contain rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <span className="font-medium mr-4">{String.fromCharCode(65 + leftIndex)}. {item}</span>
                          <span className="mx-2 text-gray-500">{t('matches')}</span>
                          <select
                            value={answers[index]?.matches?.[`left-${leftIndex}`] || ''}
                            onChange={(e) => {
                              const newAnswers = { ...answers };
                              if (!newAnswers[index]) {
                                newAnswers[index] = { matches: {} };
                              } else if (!newAnswers[index].matches) {
                                newAnswers[index] = { ...newAnswers[index], matches: {} };
                              }
                              newAnswers[index].matches[`left-${leftIndex}`] = e.target.value;
                              setAnswers(newAnswers);
                            }}
                            className="ml-2 flex-grow px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">{t('select_match')}</option>
                            {element.rightItems?.map((rightItem, rightIndex) => (
                              <option key={rightIndex} value={`right-${rightIndex}`}>
                                {rightIndex + 1}. {rightItem}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {element.type === 'short-answer' && (
                <textarea
                  value={answers[index] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="4"
                  placeholder={t('enter_your_answer')}
                />
              )}
              
              <div className="mt-3 text-sm text-gray-500">
                {t('points')}: {element.points}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {t('no_questions_available')}
          </div>
        )}
      </div>

      {!submitted ? (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || !questions || questions.length === 0}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? t('submitting') : t('submit_homework')}
          </button>
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          <p className="font-medium">{t('homework_submitted_successfully')}</p>
          {score && (
            <p className="mt-1">{t('your_score')}: {score.earned}/{score.total} ({score.percentage}%)</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveHomework;