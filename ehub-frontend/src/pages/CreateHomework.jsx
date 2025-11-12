import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';

const CreateHomework = () => {
  const navigate = useNavigate();
  const [homeworkData, setHomeworkData] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    type: 'interactive',
    maxPoints: 100,
    autoGrade: true,
    level: '', // Add level field
    language: '', // Add language field
    interactiveElements: [],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHomeworkData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Submit to backend
      await homeworkApi.createHomework(homeworkData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/homework/manage');
      }, 2000);
    } catch (err) {
      setError('Failed to create homework. Please try again.');
      console.error('Error creating homework:', err);
    } finally {
      setLoading(false);
    }
  };

  const addInteractiveElement = (type) => {
    const newElement = {
      id: Date.now(), // Temporary ID, will be replaced by backend
      type,
      question: '',
      points: 10,
      ...(type === 'quiz' && {
        options: ['', ''],
        correctAnswer: ''
      }),
      ...(type === 'dragDrop' && {
        items: [],
        targets: []
      }),
      ...(type === 'sound' && {
        audioUrl: '',
        options: []
      }),
      ...(type === 'tracing' && {
        letter: ''
      }),
      ...(type === 'coloring' && {
        imageUrl: ''
      }),
      ...(type === 'videoQuiz' && {
        videoUrl: '',
        questions: []
      }),
      ...(type === 'recording' && {
        prompt: ''
      }),
      ...(type === 'imageUpload' && {
        prompt: ''
      }),
      ...(type === 'h5p' && {
        embedCode: ''
      }),
      ...(type === 'wordwall' && {
        embedCode: ''
      })
    };
    
    setHomeworkData(prev => ({
      ...prev,
      interactiveElements: [...prev.interactiveElements, newElement]
    }));
  };

  const removeInteractiveElement = (id) => {
    setHomeworkData(prev => ({
      ...prev,
      interactiveElements: prev.interactiveElements.filter(element => element.id !== id)
    }));
  };

  const updateInteractiveElement = (id, field, value) => {
    setHomeworkData(prev => ({
      ...prev,
      interactiveElements: prev.interactiveElements.map(element => 
        element.id === id ? { ...element, [field]: value } : element
      )
    }));
  };

  const addOption = (elementId) => {
    setHomeworkData(prev => ({
      ...prev,
      interactiveElements: prev.interactiveElements.map(element => 
        element.id === elementId 
          ? { ...element, options: [...element.options, ''] } 
          : element
      )
    }));
  };

  const updateOption = (elementId, optionIndex, value) => {
    setHomeworkData(prev => ({
      ...prev,
      interactiveElements: prev.interactiveElements.map(element => {
        if (element.id === elementId) {
          const newOptions = [...element.options];
          newOptions[optionIndex] = value;
          return { ...element, options: newOptions };
        }
        return element;
      })
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="mr-2">←</span> Back to Homework
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Interactive Homework</h1>
          <p className="text-gray-600">Design engaging assignments with automatic grading capabilities</p>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            Homework created successfully! Students can now complete it and receive automatic grades.
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Homework Title</label>
              <input
                type="text"
                name="title"
                value={homeworkData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Math Quiz - Geometry Basics"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Subject</label>
              <select
                name="subject"
                value={homeworkData.subject}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="History">History</option>
                <option value="Art">Art</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Student Level</label>
              <select
                name="level"
                value={homeworkData.level}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Level</option>
                <optgroup label="Nursery">
                  <option value="nursery-1">Nursery 1</option>
                  <option value="nursery-2">Nursery 2</option>
                  <option value="nursery-3">Nursery 3</option>
                </optgroup>
                <optgroup label="Primary">
                  <option value="p1">P1</option>
                  <option value="p2">P2</option>
                  <option value="p3">P3</option>
                  <option value="p4">P4</option>
                  <option value="p5">P5</option>
                  <option value="p6">P6</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Language</label>
              <select
                name="language"
                value={homeworkData.language}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Language</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={homeworkData.dueDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Maximum Points</label>
              <input
                type="number"
                name="maxPoints"
                value={homeworkData.maxPoints}
                onChange={handleInputChange}
                min="1"
                max="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={homeworkData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the homework assignment in detail..."
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="autoGrade"
                  checked={homeworkData.autoGrade}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700 font-medium">Enable Automatic Grading</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">When enabled, student submissions will be automatically graded and added to the leaderboard</p>
            </div>
          </div>

          {/* Interactive Elements Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Interactive Questions</h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => addInteractiveElement('quiz')}
                  className="btn-secondary text-sm"
                >
                  + Add Quiz Question
                </button>
                <button
                  type="button"
                  onClick={() => addInteractiveElement('drawing')}
                  className="btn-secondary text-sm"
                >
                  + Add Drawing Task
                </button>
                <button
                  type="button"
                  onClick={() => addInteractiveElement('text')}
                  className="btn-secondary text-sm"
                >
                  + Add Text Response
                </button>
                <div className="relative group">
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                  >
                    + More Activities
                  </button>
                  <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-10">
                    <button
                      type="button"
                      onClick={() => addInteractiveElement('dragDrop')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🧩 Drag & Drop
                    </button>
                    <button
                      type="button"
                      onClick={() => addInteractiveElement('sound')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🔊 Sound Game
                    </button>
                    <button
                      type="button"
                      onClick={() => addInteractiveElement('tracing')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ✏️ Tracing Practice
                    </button>
                    <button
                      type="button"
                      onClick={() => addInteractiveElement('coloring')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🎨 Coloring Page
                    </button>
                    <button
                      type="button"
                      onClick={() => addInteractiveElement('videoQuiz')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🎬 Video + Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => addInteractiveElement('recording')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🎤 Record & Say
                    </button>
                    <button
                      type="button"
                      onClick={() => addInteractiveElement('imageUpload')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📸 Upload Picture
                    </button>
                    <button
                      type="button"
                      onClick={() => addInteractiveElement('h5p')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🧩 H5P Embed
                    </button>
                    <button
                      type="button"
                      onClick={() => addInteractiveElement('wordwall')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🧩 Wordwall Embed
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {homeworkData.interactiveElements.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No interactive elements added yet</p>
                <p className="text-gray-400 text-sm mt-2">Add quiz questions, drawing tasks, or text responses to make your homework interactive</p>
              </div>
            ) : (
              <div className="space-y-4">
                {homeworkData.interactiveElements.map((element) => (
                  <div key={element.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">
                        {element.type === 'quiz' ? 'Quiz Question' : element.type === 'drawing' ? 'Drawing Task' : 'Text Response'}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={element.points}
                          onChange={(e) => updateInteractiveElement(element.id, 'points', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Points"
                        />
                        <span className="text-sm text-gray-500">points</span>
                        <button
                          type="button"
                          onClick={() => removeInteractiveElement(element.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {element.type === 'quiz' ? (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                          placeholder="Enter your question"
                          required
                        />
                        <div className="space-y-2">
                          {element.options.map((option, idx) => (
                            <div key={idx} className="flex items-center">
                              <span className="mr-2">{String.fromCharCode(65 + idx)}.</span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(element.id, idx, e.target.value)}
                                className="flex-grow px-3 py-1 border border-gray-300 rounded"
                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                required
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(element.id)}
                            className="text-blue-500 text-sm"
                          >
                            + Add Option
                          </button>
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Correct Answer</label>
                          <select
                            value={element.correctAnswer}
                            onChange={(e) => updateInteractiveElement(element.id, 'correctAnswer', e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded"
                          >
                            <option value="">Select correct answer</option>
                            {element.options.map((option, idx) => (
                              <option key={idx} value={String.fromCharCode(65 + idx)}>
                                {String.fromCharCode(65 + idx)}: {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : element.type === 'dragDrop' ? (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                          placeholder="Enter drag & drop instructions"
                          required
                        />
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Items to Drag</label>
                          <div className="space-y-2">
                            {element.items?.map((item, idx) => (
                              <input
                                key={idx}
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...(element.items || [])];
                                  newItems[idx] = e.target.value;
                                  updateInteractiveElement(element.id, 'items', newItems);
                                }}
                                className="w-full px-3 py-1 border border-gray-300 rounded"
                                placeholder={`Item ${idx + 1}`}
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...(element.items || []), ''];
                                updateInteractiveElement(element.id, 'items', newItems);
                              }}
                              className="text-blue-500 text-sm"
                            >
                              + Add Item
                            </button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Target Areas</label>
                          <div className="space-y-2">
                            {element.targets?.map((target, idx) => (
                              <input
                                key={idx}
                                type="text"
                                value={target}
                                onChange={(e) => {
                                  const newTargets = [...(element.targets || [])];
                                  newTargets[idx] = e.target.value;
                                  updateInteractiveElement(element.id, 'targets', newTargets);
                                }}
                                className="w-full px-3 py-1 border border-gray-300 rounded"
                                placeholder={`Target ${idx + 1}`}
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newTargets = [...(element.targets || []), ''];
                                updateInteractiveElement(element.id, 'targets', newTargets);
                              }}
                              className="text-blue-500 text-sm"
                            >
                              + Add Target
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : element.type === 'sound' ? (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                          placeholder="Enter sound game question"
                          required
                        />
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Audio URL</label>
                          <input
                            type="text"
                            value={element.audioUrl}
                            onChange={(e) => updateInteractiveElement(element.id, 'audioUrl', e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded"
                            placeholder="Enter audio file URL"
                          />
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Answer Options</label>
                          <div className="space-y-2">
                            {element.options?.map((option, idx) => (
                              <input
                                key={idx}
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(element.options || [])];
                                  newOptions[idx] = e.target.value;
                                  updateInteractiveElement(element.id, 'options', newOptions);
                                }}
                                className="w-full px-3 py-1 border border-gray-300 rounded"
                                placeholder={`Option ${idx + 1}`}
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = [...(element.options || []), ''];
                                updateInteractiveElement(element.id, 'options', newOptions);
                              }}
                              className="text-blue-500 text-sm"
                            >
                              + Add Option
                            </button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Correct Answer</label>
                          <input
                            type="text"
                            value={element.correctAnswer}
                            onChange={(e) => updateInteractiveElement(element.id, 'correctAnswer', e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded"
                            placeholder="Enter correct answer"
                          />
                        </div>
                      </div>
                    ) : element.type === 'tracing' ? (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                          placeholder="Enter tracing instructions"
                          required
                        />
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Letter/Number to Trace</label>
                          <input
                            type="text"
                            value={element.letter}
                            onChange={(e) => updateInteractiveElement(element.id, 'letter', e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded"
                            placeholder="Enter letter or number"
                            maxLength="1"
                          />
                        </div>
                      </div>
                    ) : element.type === 'coloring' ? (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                          placeholder="Enter coloring instructions"
                          required
                        />
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Image URL</label>
                          <input
                            type="text"
                            value={element.imageUrl}
                            onChange={(e) => updateInteractiveElement(element.id, 'imageUrl', e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded"
                            placeholder="Enter image URL for coloring"
                          />
                        </div>
                      </div>
                    ) : element.type === 'videoQuiz' ? (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                          placeholder="Enter video quiz instructions"
                          required
                        />
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Video URL</label>
                          <input
                            type="text"
                            value={element.videoUrl}
                            onChange={(e) => updateInteractiveElement(element.id, 'videoUrl', e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded"
                            placeholder="Enter video URL"
                          />
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Quiz Questions</label>
                          <div className="space-y-2">
                            {element.questions?.map((q, idx) => (
                              <input
                                key={idx}
                                type="text"
                                value={q}
                                onChange={(e) => {
                                  const newQuestions = [...(element.questions || [])];
                                  newQuestions[idx] = e.target.value;
                                  updateInteractiveElement(element.id, 'questions', newQuestions);
                                }}
                                className="w-full px-3 py-1 border border-gray-300 rounded"
                                placeholder={`Question ${idx + 1}`}
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newQuestions = [...(element.questions || []), ''];
                                updateInteractiveElement(element.id, 'questions', newQuestions);
                              }}
                              className="text-blue-500 text-sm"
                            >
                              + Add Question
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : element.type === 'recording' ? (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                          placeholder="Enter recording prompt"
                          required
                        />
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Recording Prompt</label>
                          <textarea
                            value={element.prompt}
                            onChange={(e) => updateInteractiveElement(element.id, 'prompt', e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded"
                            placeholder="Enter detailed recording instructions"
                            rows="3"
                          />
                        </div>
                      </div>
                    ) : element.type === 'imageUpload' ? (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                          placeholder="Enter image upload instructions"
                          required
                        />
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Upload Prompt</label>
                          <textarea
                            value={element.prompt}
                            onChange={(e) => updateInteractiveElement(element.id, 'prompt', e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded"
                            placeholder="Enter detailed upload instructions"
                            rows="3"
                          />
                        </div>
                      </div>
                    ) : element.type === 'h5p' ? (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                          placeholder="Enter H5P activity title"
                          required
                        />
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">H5P Embed Code</label>
                          <textarea
                            value={element.embedCode}
                            onChange={(e) => updateInteractiveElement(element.id, 'embedCode', e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded"
                            placeholder="Paste H5P embed code here"
                            rows="4"
                          />
                        </div>
                      </div>
                    ) : element.type === 'wordwall' ? (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                          placeholder="Enter Wordwall activity title"
                          required
                        />
                        <div className="mt-3">
                          <label className="block text-sm text-gray-700 mb-1">Wordwall Embed Code</label>
                          <textarea
                            value={element.embedCode}
                            onChange={(e) => updateInteractiveElement(element.id, 'embedCode', e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded"
                            placeholder="Paste Wordwall embed code here"
                            rows="4"
                          />
                        </div>
                      </div>
                    ) : element.type === 'drawing' ? (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Describe the drawing task"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-2">Students will use an interactive drawing tool to complete this task</p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={element.question}
                          onChange={(e) => updateInteractiveElement(element.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Enter your text response question"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-2">Students will type their response to this question</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/homework')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Homework'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHomework;