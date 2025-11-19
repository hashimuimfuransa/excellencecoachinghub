import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { levelOptions } from '../utils/languageOptions';
import { useTranslation } from 'react-i18next';

const CreateHomework = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [level, setLevel] = useState(''); // Added level state
  const [language, setLanguage] = useState('english'); // Added language state with default
  const [interactiveElements, setInteractiveElements] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define language options
  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'french', label: 'French' },
    { value: 'kinyarwanda', label: 'Kinyarwanda' }
  ];

  const addInteractiveElement = (type) => {
    const newElement = {
      id: Date.now().toString(),
      type,
      question: '',
      points: 1,
      ...(type === 'quiz' && { options: ['', ''], correctAnswer: '' }),
      ...(type === 'matching' && { 
        leftItems: ['', ''], 
        rightItems: ['', ''],
        leftItemImages: ['', ''],
        rightItemImages: ['', ''],
        correctMatches: {}
      }),
      ...(type === 'text' && { placeholder: 'Enter your answer here...' }),
      ...(type === 'true-false' && { correctAnswer: 'true' }),
      ...(type === 'fill-in-blank' && { correctAnswers: [''], caseSensitive: false }),
      ...(type === 'ordering' && { items: ['', ''], correctOrder: [] })
    };
    setInteractiveElements([...interactiveElements, newElement]);
  };

  const updateInteractiveElement = (id, field, value) => {
    setInteractiveElements(interactiveElements.map(element => 
      element.id === id ? { ...element, [field]: value } : element
    ));
  };

  const removeInteractiveElement = (id) => {
    setInteractiveElements(interactiveElements.filter(element => element.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!title || !level || !language) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Validate that we have at least one interactive element
    if (interactiveElements.length === 0) {
      alert('Please add at least one interactive element');
      return;
    }
    
    // Validate that all elements have questions and correct answers
    for (const element of interactiveElements) {
      if (!element.question || element.question.trim() === '') {
        alert('Please fill in all question fields');
        return;
      }
      
      // Validate based on question type
      switch (element.type) {
        case 'quiz':
          if (!element.options || element.options.some(opt => !opt || opt.trim() === '')) {
            alert('Please fill in all quiz options');
            return;
          }
          if (!element.correctAnswer) {
            alert('Please select the correct answer for the quiz');
            return;
          }
          break;
        case 'matching':
          if (!element.leftItems || element.leftItems.some(item => !item || item.trim() === '') ||
              !element.rightItems || element.rightItems.some(item => !item || item.trim() === '')) {
            alert('Please fill in all matching items');
            return;
          }
          if (!element.correctMatches || Object.keys(element.correctMatches).length === 0) {
            alert('Please define correct matches for the matching question');
            return;
          }
          break;
        case 'true-false':
          if (!element.correctAnswer) {
            alert('Please select the correct answer for the true/false question');
            return;
          }
          break;
        case 'fill-in-blank':
          if (!element.correctAnswers || element.correctAnswers.some(ans => !ans || ans.trim() === '')) {
            alert('Please fill in all correct answers for the fill-in-blank question');
            return;
          }
          break;
        case 'ordering':
          if (!element.items || element.items.some(item => !item || item.trim() === '')) {
            alert('Please fill in all ordering items');
            return;
          }
          break;
        default:
          break;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Transform elements to match backend schema
      const transformedElements = interactiveElements.map(element => {
        const baseElement = {
          question: element.question,
          type: element.type,
          points: element.points,
          aiExtracted: true
        };
        
        switch (element.type) {
          case 'quiz':
            return {
              ...baseElement,
              options: element.options,
              correctAnswer: element.correctAnswer,
              type: 'multiple-choice'
            };
          case 'matching':
            return {
              ...baseElement,
              leftItems: element.leftItems,
              rightItems: element.rightItems,
              leftItemImages: element.leftItemImages,
              rightItemImages: element.rightItemImages,
              correctMatches: element.correctMatches,
              type: 'matching'
            };
          case 'text':
            return {
              ...baseElement,
              correctAnswer: '',
              type: 'short-answer'
            };
          case 'true-false':
            return {
              ...baseElement,
              correctAnswer: element.correctAnswer,
              options: ['true', 'false'],
              type: 'true-false'
            };
          case 'fill-in-blank':
            return {
              ...baseElement,
              correctAnswer: element.correctAnswers,
              caseSensitive: element.caseSensitive,
              type: 'fill-in-blank'
            };
          case 'ordering':
            return {
              ...baseElement,
              options: element.items,
              correctAnswer: element.correctOrder,
              type: 'ordering'
            };
          default:
            return baseElement;
        }
      });
      
      // Prepare homework data - no course ID required
      const homeworkData = {
        title,
        description,
        dueDate,
        level,
        language,
        maxPoints: interactiveElements.reduce((total, element) => total + element.points, 0),
        submissionType: 'text',
        isRequired: true,
        status: 'published',
        instructions: 'Complete the interactive homework assignment',
        extractedQuestions: transformedElements, // Store in extractedQuestions for compatibility
        autoGrading: true
        // courseId is optional and not required
      };
      
      // Submit homework to backend
      const response = await homeworkApi.createHomework(homeworkData);
      
      if (response.data.success) {
        console.log('Homework created successfully:', response.data);
        navigate('/homework/manage'); // Redirect to homework manage page
      } else {
        throw new Error(response.data.message || 'Failed to create homework');
      }
    } catch (error) {
      console.error('Error creating homework:', error);
      alert('Failed to create homework. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white mb-4 shadow-lg">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Interactive Homework</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">Design engaging, interactive homework assignments with various question types to enhance student learning</p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
        <div className="mb-6">
          <label className="block text-gray-800 text-sm font-bold mb-2" htmlFor="title">
            Homework Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter homework title"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-800 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter homework description"
            rows="3"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-gray-800 text-sm font-bold mb-2" htmlFor="dueDate">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-800 text-sm font-bold mb-2" htmlFor="level">
              Level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            >
              <option value="">Select Level</option>
              <optgroup label="Nursery">
                {levelOptions.nursery.map(option => (
                  <option key={option.value} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Primary">
                {levelOptions.primary.map(option => (
                  <option key={option.value} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-800 text-sm font-bold mb-2" htmlFor="language">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            >
              <option value="">Select Language</option>
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Interactive Questions</h2>
              <p className="text-gray-600 text-sm">Add different types of interactive questions to engage students</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {interactiveElements.length} Questions
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            <button
              type="button"
              onClick={() => addInteractiveElement('quiz')}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md"
              title="Multiple Choice"
            >
              <span className="text-2xl mb-1">📋</span>
              <span className="text-xs font-medium">Quiz</span>
            </button>
            
            <button
              type="button"
              onClick={() => addInteractiveElement('matching')}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md"
              title="Matching"
            >
              <span className="text-2xl mb-1">🔗</span>
              <span className="text-xs font-medium">Matching</span>
            </button>
            
            <button
              type="button"
              onClick={() => addInteractiveElement('text')}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-md"
              title="Short Answer"
            >
              <span className="text-2xl mb-1">✍️</span>
              <span className="text-xs font-medium">Text</span>
            </button>
            
            <button
              type="button"
              onClick={() => addInteractiveElement('true-false')}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-md"
              title="True/False"
            >
              <span className="text-2xl mb-1">✅</span>
              <span className="text-xs font-medium">True/False</span>
            </button>
            
            <button
              type="button"
              onClick={() => addInteractiveElement('fill-in-blank')}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 shadow-md"
              title="Fill in Blank"
            >
              <span className="text-2xl mb-1">📝</span>
              <span className="text-xs font-medium">Fill Blank</span>
            </button>
            
            <button
              type="button"
              onClick={() => addInteractiveElement('ordering')}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-md"
              title="Ordering"
            >
              <span className="text-2xl mb-1">🔢</span>
              <span className="text-xs font-medium">Ordering</span>
            </button>
          </div>
          
          {interactiveElements.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="text-5xl mb-4 text-gray-300">❓</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Questions Added</h3>
              <p className="text-gray-500 mb-4">Click the buttons above to add interactive questions</p>
              <div className="inline-flex items-center text-sm text-blue-600">
                <span className="mr-2">💡</span>
                <span>Try adding a Quiz or Matching question to get started</span>
              </div>
            </div>
          )}
          
          {interactiveElements.map((element) => (
            <div key={element.id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100 relative">
              <button
                type="button"
                onClick={() => removeInteractiveElement(element.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove question"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                  {element.type === 'quiz' && '📋'}
                  {element.type === 'matching' && '🔗'}
                  {element.type === 'text' && '✍️'}
                  {element.type === 'true-false' && '✅'}
                  {element.type === 'fill-in-blank' && '📝'}
                  {element.type === 'ordering' && '🔢'}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {element.type.replace('-', ' ')} Question
                </h3>
                <div className="ml-auto flex items-center">
                  <label className="mr-2 text-sm font-medium text-gray-700">Points:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={element.points}
                    onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {element.type === 'quiz' ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                    <textarea
                      value={element.question}
                      onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your question here..."
                      rows="2"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                    <div className="space-y-3">
                      {element.options?.map((option, idx) => (
                        <div key={idx} className="flex items-center">
                          <div className="mr-2 w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-medium">
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...element.options];
                              newOptions[idx] = e.target.value;
                              updateInteractiveElement(element.id, 'options', newOptions);
                            }}
                            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = [...element.options];
                              newOptions.splice(idx, 1);
                              updateInteractiveElement(element.id, 'options', newOptions);
                            }}
                            className="ml-2 p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                            title="Remove option"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateInteractiveElement(element.id, 'options', [...(element.options || []), ''])}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Option
                    </button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                    <select
                      value={element.correctAnswer}
                      onChange={(e) => updateInteractiveElement(element.id, 'correctAnswer', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select correct answer</option>
                      {element.options?.map((option, idx) => (
                        <option key={idx} value={option}>
                          {String.fromCharCode(65 + idx)}. {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={element.points}
                      onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : element.type === 'matching' ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                    <textarea
                      value={element.question}
                      onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your question here..."
                      rows="2"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium mr-2">A</span>
                        Left Column Items
                      </h4>
                      <div className="space-y-3">
                        {element.leftItems?.map((item, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...(element.leftItems || [])];
                                  newItems[idx] = e.target.value;
                                  updateInteractiveElement(element.id, 'leftItems', newItems);
                                }}
                                className="flex-grow px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`Item ${String.fromCharCode(65 + idx)}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = [...(element.leftItems || [])];
                                  newItems.splice(idx, 1);
                                  const newImages = [...(element.leftItemImages || [])];
                                  newImages.splice(idx, 1);
                                  updateInteractiveElement(element.id, 'leftItems', newItems);
                                  updateInteractiveElement(element.id, 'leftItemImages', newImages);
                                }}
                                className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                                title="Remove item"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Image URL:</span>
                              <input
                                type="text"
                                value={element.leftItemImages?.[idx] || ''}
                                onChange={(e) => {
                                  const newImages = [...(element.leftItemImages || [])];
                                  newImages[idx] = e.target.value;
                                  updateInteractiveElement(element.id, 'leftItemImages', newImages);
                                }}
                                className="flex-grow px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter image URL (optional)"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...(element.leftItems || []), ''];
                            const newImages = [...(element.leftItemImages || []), ''];
                            updateInteractiveElement(element.id, 'leftItems', newItems);
                            updateInteractiveElement(element.id, 'leftItemImages', newImages);
                          }}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Item
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium mr-2">1</span>
                        Right Column Items
                      </h4>
                      <div className="space-y-3">
                        {element.rightItems?.map((item, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...(element.rightItems || [])];
                                  newItems[idx] = e.target.value;
                                  updateInteractiveElement(element.id, 'rightItems', newItems);
                                }}
                                className="flex-grow px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`Option ${idx + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = [...(element.rightItems || [])];
                                  newItems.splice(idx, 1);
                                  const newImages = [...(element.rightItemImages || [])];
                                  newImages.splice(idx, 1);
                                  updateInteractiveElement(element.id, 'rightItems', newItems);
                                  updateInteractiveElement(element.id, 'rightItemImages', newImages);
                                }}
                                className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                                title="Remove option"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Image URL:</span>
                              <input
                                type="text"
                                value={element.rightItemImages?.[idx] || ''}
                                onChange={(e) => {
                                  const newImages = [...(element.rightItemImages || [])];
                                  newImages[idx] = e.target.value;
                                  updateInteractiveElement(element.id, 'rightItemImages', newImages);
                                }}
                                className="flex-grow px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter image URL (optional)"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...(element.rightItems || []), ''];
                            const newImages = [...(element.rightItemImages || []), ''];
                            updateInteractiveElement(element.id, 'rightItems', newItems);
                            updateInteractiveElement(element.id, 'rightItemImages', newImages);
                          }}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Option
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Matches</label>
                    <div className="space-y-2 bg-blue-50 p-3 rounded-lg">
                      {element.leftItems?.map((leftItem, leftIdx) => (
                        <div key={leftIdx} className="flex items-center p-2 bg-white rounded">
                          <span className="mr-2 w-6 text-center font-medium bg-blue-100 text-blue-800 rounded-full h-6 flex items-center justify-center text-sm">
                            {String.fromCharCode(65 + leftIdx)}
                          </span>
                          <span className="mr-2 text-gray-500">matches</span>
                          <select
                            value={element.correctMatches?.[leftItem] || ''}
                            onChange={(e) => {
                              const newMatches = { ...element.correctMatches };
                              newMatches[leftItem] = e.target.value;
                              updateInteractiveElement(element.id, 'correctMatches', newMatches);
                            }}
                            className="flex-grow px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select match</option>
                            {element.rightItems?.map((rightItem, rightIdx) => (
                              <option key={rightIdx} value={rightItem}>
                                {rightIdx + 1}. {rightItem}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={element.points}
                      onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : element.type === 'text' ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                    <textarea
                      value={element.question}
                      onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your question here..."
                      rows="2"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder Text</label>
                    <input
                      type="text"
                      value={element.placeholder || ''}
                      onChange={(e) => updateInteractiveElement(element.id, 'placeholder', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter placeholder text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={element.points}
                      onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : element.type === 'true-false' ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                    <textarea
                      value={element.question}
                      onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your question here..."
                      rows="2"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                    <div className="flex space-x-6 bg-gray-50 p-4 rounded-lg">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`true-false-${element.id}`}
                          value="true"
                          checked={element.correctAnswer === 'true'}
                          onChange={(e) => updateInteractiveElement(element.id, 'correctAnswer', e.target.value)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-800 font-medium">True</span>
                      </label>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`true-false-${element.id}`}
                          value="false"
                          checked={element.correctAnswer === 'false'}
                          onChange={(e) => updateInteractiveElement(element.id, 'correctAnswer', e.target.value)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-800 font-medium">False</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={element.points}
                      onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : element.type === 'fill-in-blank' ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                    <textarea
                      value={element.question}
                      onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your question here..."
                      rows="2"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answers</label>
                    <div className="space-y-3">
                      {element.correctAnswers?.map((answer, idx) => (
                        <div key={idx} className="flex items-center">
                          <div className="mr-2 w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-sm font-medium">
                            {idx + 1}
                          </div>
                          <input
                            type="text"
                            value={answer}
                            onChange={(e) => {
                              const newAnswers = [...element.correctAnswers];
                              newAnswers[idx] = e.target.value;
                              updateInteractiveElement(element.id, 'correctAnswers', newAnswers);
                            }}
                            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Correct answer ${idx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newAnswers = [...element.correctAnswers];
                              newAnswers.splice(idx, 1);
                              updateInteractiveElement(element.id, 'correctAnswers', newAnswers);
                            }}
                            className="ml-2 p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                            title="Remove answer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateInteractiveElement(element.id, 'correctAnswers', [...(element.correctAnswers || []), ''])}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Correct Answer
                    </button>
                  </div>
                  <div className="mb-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={element.caseSensitive || false}
                        onChange={(e) => updateInteractiveElement(element.id, 'caseSensitive', e.target.checked)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span className="ml-2 text-gray-800 font-medium">Case Sensitive</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={element.points}
                      onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : element.type === 'ordering' ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                    <textarea
                      value={element.question}
                      onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your question here..."
                      rows="2"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Items to Order</label>
                    <div className="space-y-3">
                      {element.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center">
                          <div className="mr-2 w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-sm font-medium">
                            {idx + 1}
                          </div>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newItems = [...element.items];
                              newItems[idx] = e.target.value;
                              updateInteractiveElement(element.id, 'items', newItems);
                            }}
                            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Item ${idx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = [...element.items];
                              newItems.splice(idx, 1);
                              updateInteractiveElement(element.id, 'items', newItems);
                            }}
                            className="ml-2 p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                            title="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateInteractiveElement(element.id, 'items', [...(element.items || []), ''])}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Item
                    </button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Order (Drag to reorder)</label>
                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg min-h-12">
                      {element.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center p-2 bg-white border border-gray-200 rounded cursor-move hover:bg-gray-50">
                          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                          <span>{item || `Item ${idx + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={element.points}
                      onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                    <textarea
                      value={element.question}
                      onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your question here..."
                      rows="2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={element.points}
                      onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transform transition-all duration-200 hover:scale-105 shadow-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Homework...
              </div>
            ) : 'Create Homework'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHomework;