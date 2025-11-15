import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { useTranslation } from 'react-i18next';
import BottomNavbar from '../components/ui/BottomNavbar';

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
    <div className="max-w-4xl mx-auto p-6 pb-20 md:pb-6 pt-16">
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
          <div className="text-sm font-medium text-gray-700">
            {homework.maxPoints} {t('points')}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {(!questions || questions.length === 0) ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('no_questions_available')}</h3>
            <p className="text-gray-600">{t('try_adjusting_filters')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {questions.map((element, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                {element.type === 'multiple-choice' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">
                      {index + 1}. {element.question}
                    </h3>
                    <div className="space-y-2">
                      {element.options?.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            checked={answers[index] === option}
                            onChange={() => handleAnswerChange(index, option)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {element.type === 'short-answer' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-880 mb-3">
                      {index + 1}. {element.question}
                    </h3>
                    <textarea
                      value={answers[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder={t('enter_your_answer')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>
                )}

                {element.type === 'matching' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">
                      {index + 1}. {t('make_your_matches')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">{t('left_column')}</h4>
                        <div className="space-y-2">
                          {element.leftItems?.map((item, leftIndex) => (
                            <div key={leftIndex} className="p-2 bg-gray-50 rounded">
                              <p>{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">{t('right_column')}</h4>
                        <div className="space-y-2">
                          {element.rightItems?.map((item, rightIndex) => (
                            <div key={rightIndex} className="p-2 bg-gray-50 rounded">
                              <p>{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">{t('matches')}</h4>
                      <div className="space-y-2">
                        {element.leftItems?.map((leftItem, leftIndex) => (
                          <div key={leftIndex} className="flex items-center">
                            <span className="w-1/3 text-gray-700">{leftItem}</span>
                            <span className="mx-2 text-gray-500">→</span>
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
                              className="w-1/2 px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="">{t('select_match')}</option>
                              {element.rightItems?.map((rightItem, rightIndex) => (
                                <option key={rightIndex} value={`right-${rightIndex}`}>
                                  {rightItem}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {element.type === 'drag-and-drop' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">
                      {index + 1}. {element.question}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">{t('items')}</h4>
                        <div className="space-y-2">
                          {element.items?.map((item, itemIndex) => (
                            <div key={itemIndex} className="p-2 bg-gray-50 rounded cursor-move">
                              <p>{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">{t('options')}</h4>
                        <div className="space-y-2">
                          {element.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="p-2 bg-gray-50 rounded">
                              <p>{option}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {element.type === 'fill-in-the-blank' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">
                      {index + 1}. {element.question}
                    </h3>
                    <div className="space-y-2">
                      {element.blanks?.map((blank, blankIndex) => (
                        <div key={blankIndex} className="flex items-center">
                          <span className="mr-2">{blank.before}</span>
                          <input
                            type="text"
                            value={answers[index]?.blanks?.[blankIndex] || ''}
                            onChange={(e) => {
                              const currentBlanks = answers[index]?.blanks || {};
                              handleAnswerChange(index, {
                                ...answers[index],
                                blanks: {
                                  ...currentBlanks,
                                  [blankIndex]: e.target.value
                                }
                              });
                            }}
                            className="px-2 py-1 border border-gray-300 rounded w-32"
                          />
                          <span className="ml-2">{blank.after}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {element.type === 'true-false' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">
                      {index + 1}. {element.question}
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value="true"
                          checked={answers[index] === 'true'}
                          onChange={() => handleAnswerChange(index, 'true')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">{t('yes')}</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value="false"
                          checked={answers[index] === 'false'}
                          onChange={() => handleAnswerChange(index, 'false')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">{t('no')}</span>
                      </label>
                    </div>
                  </div>
                )}

                {element.type === 'image' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">
                      {index + 1}. {element.caption}
                    </h3>
                    <img 
                      src={element.url} 
                      alt={element.alt || element.caption} 
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}

                {element.type === 'text' && (
                  <div>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: element.content }}
                    />
                  </div>
                )}
              </div>
            ))}
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
      
      <BottomNavbar />
    </div>
  );
};

export default InteractiveHomework;