import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { levelOptions } from '../utils/languageOptions';

const CreateHomework = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Remove courseId requirement
  // const { courseId } = location.state || {};
  
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
      })
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
    if (!level || !language) {
      alert('Please select both level and language');
      return;
    }
    
    // Validate that we have at least one interactive element
    if (interactiveElements.length === 0) {
      alert('Please add at least one interactive element');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
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
        interactiveElements, // This will be stored in the extractedQuestions field
        extractedQuestions: interactiveElements, // Also store in extractedQuestions for compatibility
        autoGrading: true
        // courseId is optional and not required
      };
      
      // Submit homework to backend
      const response = await homeworkApi.createHomework(homeworkData);
      
      if (response.data.success) {
        console.log('Homework created successfully:', response.data);
        navigate('/homework/list'); // Redirect to homework list instead of manage
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Create Interactive Homework</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Homework Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter homework title"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter homework description"
            rows="3"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="level">
              Level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Level</option>
              <optgroup label="Nursery">
                {levelOptions.nursery.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Primary">
                {levelOptions.primary.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="language">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Interactive Elements</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => addInteractiveElement('quiz')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Quiz Question
            </button>
            <button
              type="button"
              onClick={() => addInteractiveElement('matching')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Add Matching Question
            </button>
            <button
              type="button"
              onClick={() => addInteractiveElement('text')}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Add Text Response
            </button>
          </div>
          
          {interactiveElements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No interactive elements added yet. Click the buttons above to add questions.
            </div>
          )}
          
          {interactiveElements.map((element) => (
            <div key={element.id} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800 capitalize">{element.type} Question</h3>
                <button
                  type="button"
                  onClick={() => removeInteractiveElement(element.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              
              {element.type === 'quiz' ? (
                <div>
                  <input
                    type="text"
                    value={element.question}
                    onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                    placeholder="Enter quiz question"
                    required
                  />
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">Options</label>
                    {element.options?.map((option, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...element.options];
                          newOptions[idx] = e.target.value;
                          updateInteractiveElement(element.id, 'options', newOptions);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                        placeholder={`Option ${idx + 1}`}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => updateInteractiveElement(element.id, 'options', [...(element.options || []), ''])}
                      className="text-blue-500 text-sm"
                    >
                      + Add Option
                    </button>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">Correct Answer</label>
                    <select
                      value={element.correctAnswer}
                      onChange={(e) => updateInteractiveElement(element.id, 'correctAnswer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select correct answer</option>
                      {element.options?.map((option, idx) => (
                        <option key={idx} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Points</label>
                    <input
                      type="number"
                      min="1"
                      value={element.points}
                      onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              ) : element.type === 'matching' ? (
                <div>
                  <input
                    type="text"
                    value={element.question}
                    onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                    placeholder="Enter matching question instructions"
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Left Column Items</h4>
                      <div className="space-y-3">
                        {element.leftItems?.map((item, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-3">
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
                                className="flex-grow px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder={`Item ${String.fromCharCode(65 + idx)}`}
                              />
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
                                className="flex-grow px-2 py-1 border border-gray-300 rounded text-xs"
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
                          className="text-blue-500 text-sm"
                        >
                          + Add Item
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Right Column Items</h4>
                      <div className="space-y-3">
                        {element.rightItems?.map((item, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-3">
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
                                className="flex-grow px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder={`Option ${idx + 1}`}
                              />
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
                                className="flex-grow px-2 py-1 border border-gray-300 rounded text-xs"
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
                          className="text-blue-500 text-sm"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm text-gray-700 mb-2">Correct Matches</label>
                    <div className="space-y-2">
                      {element.leftItems?.map((leftItem, leftIdx) => (
                        <div key={leftIdx} className="flex items-center p-2 bg-gray-50 rounded">
                          <span className="mr-2 w-6 text-center font-medium">
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
                            className="flex-grow px-2 py-1 border border-gray-300 rounded text-sm"
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
                  <div className="mt-3">
                    <label className="block text-sm text-gray-700 mb-1">Points</label>
                    <input
                      type="number"
                      min="1"
                      value={element.points}
                      onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={element.question}
                    onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                    placeholder="Enter question or instruction"
                    required
                  />
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Points</label>
                    <input
                      type="number"
                      min="1"
                      value={element.points}
                      onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Homework'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHomework;