import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { useAuth } from '../context/AuthContext';

const InteractiveHomework = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [homework, setHomework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [grading, setGrading] = useState(false);
  const [score, setScore] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadHomework = async () => {
      try {
        // Fetch homework from backend
        const response = await homeworkApi.getInteractiveHomework(id);
        const homeworkData = response.data;
        
        // Check if homework is appropriate for student's level and language
        if (user && user.level && user.language) {
          if (homeworkData.level && homeworkData.level !== user.level) {
            alert(`This homework is for ${homeworkData.level} students. Your level is ${user.level}.`);
            navigate('/homework');
            return;
          }
          
          if (homeworkData.language && homeworkData.language !== user.language) {
            alert(`This homework is in ${homeworkData.language}. Your language is ${user.language}.`);
            navigate('/homework');
            return;
          }
        }
        
        setHomework(homeworkData);
      } catch (error) {
        console.error('Error loading homework:', error);
        // Fallback to mock data if backend is not available
        const mockHomework = {
          id: id,
          title: 'Interactive Learning Activities',
          subject: 'General',
          description: 'Complete these fun interactive activities to learn and practice new skills!',
          dueDate: '2023-05-25',
          maxPoints: 100,
          autoGrade: true,
          type: 'interactive',
          level: 'Grade 7',
          language: 'English',
          interactiveElements: [
            {
              id: 1,
              type: 'quiz',
              question: 'What color is the sky?',
              options: ['Red', 'Blue', 'Green', 'Yellow'],
              correctAnswer: 'Blue',
              points: 10
            },
            {
              id: 2,
              type: 'dragDrop',
              question: 'Match the animals to their homes',
              items: ['Bird', 'Fish', 'Bear'],
              targets: ['Nest', 'Ocean', 'Forest'],
              points: 15
            },
            {
              id: 3,
              type: 'sound',
              question: 'Listen to the sound and identify the animal',
              audioUrl: '/sample-audio.mp3',
              options: ['Lion', 'Cat', 'Cow', 'Dog'],
              correctAnswer: 'Cat',
              points: 10
            },
            {
              id: 4,
              type: 'tracing',
              question: 'Practice writing the letter A',
              letter: 'A',
              points: 10
            },
            {
              id: 5,
              type: 'coloring',
              question: 'Color the butterfly',
              imageUrl: '/butterfly-outline.png',
              points: 10
            },
            {
              id: 6,
              type: 'videoQuiz',
              question: 'Watch the video and answer the questions',
              videoUrl: '/educational-video.mp4',
              questions: [
                'What was the main topic of the video?',
                'Name one thing you learned from the video'
              ],
              points: 20
            },
            {
              id: 7,
              type: 'recording',
              question: 'Record yourself saying the word "Hello"',
              prompt: 'Press the record button and say "Hello" clearly into your microphone',
              points: 10
            },
            {
              id: 8,
              type: 'imageUpload',
              question: 'Upload a photo of something red',
              prompt: 'Find something red in your house and take a photo of it',
              points: 15
            }
          ]
        };
        
        // Check if mock homework is appropriate for student's level and language
        if (user && user.level && user.language) {
          if (mockHomework.level && mockHomework.level !== user.level) {
            alert(`This homework is for ${mockHomework.level} students. Your level is ${user.level}.`);
            navigate('/homework');
            return;
          }
          
          if (mockHomework.language && mockHomework.language !== user.language) {
            alert(`This homework is in ${mockHomework.language}. Your language is ${user.language}.`);
            navigate('/homework');
            return;
          }
        }
        
        setHomework(mockHomework);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadHomework();
    }
  }, [id, user, navigate]);

  const handleAnswerChange = (elementId, value) => {
    setAnswers(prev => ({
      ...prev,
      [elementId]: value
    }));
  };

  const calculateScore = () => {
    if (!homework?.autoGrade) return null;
    
    let totalScore = 0;
    let earnedPoints = 0;
    
    homework.interactiveElements.forEach(element => {
      totalScore += element.points;
      
      // For quiz questions, check if the answer is correct
      if (element.type === 'quiz') {
        if (answers[element.id] === element.correctAnswer) {
          earnedPoints += element.points;
        }
      }
      // For other interactive elements that can be automatically graded
      // For now, we'll give full points for completing these activities
      else if (element.type === 'dragDrop' || 
               element.type === 'sound' || 
               element.type === 'tracing' || 
               element.type === 'coloring' || 
               element.type === 'videoQuiz' || 
               element.type === 'recording' || 
               element.type === 'imageUpload' || 
               element.type === 'drawing' || 
               element.type === 'text') {
        // Check if the student provided an answer
        if (answers[element.id]) {
          earnedPoints += element.points;
        }
      }
      // H5P and Wordwall activities are typically graded separately
    });
    
    return {
      earned: earnedPoints,
      total: totalScore,
      percentage: Math.round((earnedPoints / totalScore) * 100)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Calculate automatic score if enabled
      let submissionData = { answers };
      
      if (homework.autoGrade) {
        setGrading(true);
        const calculatedScore = calculateScore();
        setScore(calculatedScore);
        submissionData.score = calculatedScore;
        
        // Simulate grading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        setGrading(false);
      }
      
      // Submit to backend
      await homeworkApi.submitInteractiveHomework(id, submissionData);
      
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/homework');
      }, 3000);
    } catch (error) {
      console.error('Error submitting homework:', error);
      alert('Failed to submit homework. Please try again.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => navigate('/homework')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="mr-2">←</span> Back to Homework
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{homework?.title}</h1>
          <p className="text-gray-600">{homework?.subject} • Due: {new Date(homework?.dueDate).toLocaleDateString()}</p>
          {homework?.autoGrade && (
            <div className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✨ Automatic Grading Enabled
            </div>
          )}
        </div>

        {showSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {grading ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-t-2 border-green-700 rounded-full animate-spin mr-2"></div>
                Grading your answers...
              </div>
            ) : score ? (
              <div>
                <p>Homework submitted successfully!</p>
                <p className="font-bold mt-1">Your Score: {score.earned}/{score.total} ({score.percentage}%)</p>
                {score.percentage >= 90 && <p className="mt-1">🏆 Excellent work! This score will be added to the leaderboard.</p>}
                {score.percentage >= 80 && score.percentage < 90 && <p className="mt-1">🎉 Great job!</p>}
                {score.percentage >= 70 && score.percentage < 80 && <p className="mt-1">👍 Good work!</p>}
                {score.percentage < 70 && <p className="mt-1">📚 Keep practicing and you&#39;ll improve!</p>}
              </div>
            ) : (
              "Homework submitted successfully! Your teacher will review and grade it soon."
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="prose max-w-none mb-8">
            <p className="text-gray-700 text-lg">{homework?.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {homework?.interactiveElements.map((element) => (
              <InteractiveElement 
                key={element.id} 
                element={element} 
                onAnswerChange={handleAnswerChange}
                currentAnswer={answers[element.id]}
              />
            ))}

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Homework'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Interactive Element Component
const InteractiveElement = ({ element, onAnswerChange, currentAnswer }) => {
  switch (element.type) {
    case 'quiz':
      return <QuizElement element={element} onAnswerChange={onAnswerChange} currentAnswer={currentAnswer} />;
    case 'drawing':
      return <DrawingElement element={element} onAnswerChange={onAnswerChange} currentAnswer={currentAnswer} />;
    case 'text':
      return <TextElement element={element} onAnswerChange={onAnswerChange} currentAnswer={currentAnswer} />;
    case 'dragDrop':
      return <DragDropElement element={element} onAnswerChange={onAnswerChange} currentAnswer={currentAnswer} />;
    case 'sound':
      return <SoundElement element={element} onAnswerChange={onAnswerChange} currentAnswer={currentAnswer} />;
    case 'tracing':
      return <TracingElement element={element} onAnswerChange={onAnswerChange} currentAnswer={currentAnswer} />;
    case 'coloring':
      return <ColoringElement element={element} onAnswerChange={onAnswerChange} currentAnswer={currentAnswer} />;
    case 'videoQuiz':
      return <VideoQuizElement element={element} onAnswerChange={onAnswerChange} currentAnswer={currentAnswer} />;
    case 'recording':
      return <RecordingElement element={element} onAnswerChange={onAnswerChange} currentAnswer={currentAnswer} />;
    case 'imageUpload':
      return <ImageUploadElement element={element} onAnswerChange={onAnswerChange} currentAnswer={currentAnswer} />;
    case 'h5p':
      return <H5PElement element={element} />;
    case 'wordwall':
      return <WordwallElement element={element} />;
    default:
      return <div>Unsupported element type</div>;
  }
};

// Quiz Element Component
const QuizElement = ({ element, onAnswerChange, currentAnswer }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {element.points} points
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {element.options.map((option, index) => (
          <label 
            key={index}
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
          >
            <input
              type="radio"
              name={`question-${element.id}`}
              value={option}
              checked={currentAnswer === option}
              onChange={(e) => onAnswerChange(element.id, e.target.value)}
              className="h-5 w-5 text-blue-600"
            />
            <span className="ml-3 text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

// Drawing Element Component
const DrawingElement = ({ element, onAnswerChange, currentAnswer }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.fillStyle = '#ffffff';
    setContext(ctx);

    // Fill canvas with white background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load existing drawing if available
    if (currentAnswer) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = currentAnswer;
    }
  }, [currentAnswer, color, brushSize]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      context.beginPath();
      
      // Save drawing data
      const dataUrl = canvasRef.current.toDataURL();
      onAnswerChange(element.id, dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save cleared canvas
    const dataUrl = canvas.toDataURL();
    onAnswerChange(element.id, dataUrl);
  };

  const changeColor = (newColor) => {
    setColor(newColor);
    context.strokeStyle = newColor;
  };

  const changeBrushSize = (size) => {
    setBrushSize(size);
    context.lineWidth = size;
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {element.points} points
        </span>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="flex items-center mr-4">
          <span className="mr-2 text-gray-700">Colors:</span>
          {['#000000', '#ff0000', '#0000ff', '#00ff00', '#ffff00', '#ff00ff'].map((c) => (
            <button 
              key={c}
              onClick={() => changeColor(c)}
              className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-gray-800' : 'border-gray-300'} mr-1`}
              style={{ backgroundColor: c }}
              title={c}
            ></button>
          ))}
        </div>
        
        <div className="flex items-center mr-4">
          <span className="mr-2 text-gray-700">Size:</span>
          {[1, 3, 5, 10].map((size) => (
            <button 
              key={size}
              onClick={() => changeBrushSize(size)}
              className={`w-8 h-8 rounded-full border-2 ${brushSize === size ? 'border-gray-800' : 'border-gray-300'} mr-1 flex items-center justify-center text-xs`}
            >
              {size}
            </button>
          ))}
        </div>
        
        <button 
          onClick={clearCanvas}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-sm"
        >
          Clear
        </button>
      </div>
      
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          className="w-full h-auto cursor-crosshair bg-white"
        />
      </div>
      <p className="text-sm text-gray-500 mt-2">Click and drag to draw on the canvas above</p>
    </div>
  );
};

// Text Element Component
const TextElement = ({ element, onAnswerChange, currentAnswer }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          {element.points} points
        </span>
      </div>
      <textarea
        value={currentAnswer || ''}
        onChange={(e) => onAnswerChange(element.id, e.target.value)}
        rows={6}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Type your answer here..."
      />
    </div>
  );
};

// Drag & Drop Element Component
const DragDropElement = ({ element, onAnswerChange, currentAnswer }) => {
  const [items, setItems] = useState(element.items || []);
  const [targets, setTargets] = useState(element.targets || []);
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, target) => {
    e.preventDefault();
    if (draggedItem) {
      const newAnswer = {
        ...currentAnswer,
        [target]: draggedItem
      };
      onAnswerChange(element.id, newAnswer);
      setDraggedItem(null);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {element.points} points
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Items to Drag</h4>
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg cursor-move hover:bg-blue-200 transition-colors"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Drop Targets</h4>
          <div className="space-y-3">
            {targets.map((target, index) => (
              <div
                key={index}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, target)}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg min-h-12 flex items-center justify-center"
              >
                {currentAnswer && currentAnswer[target] ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                    {currentAnswer[target]}
                  </span>
                ) : (
                  <span className="text-gray-400">Drop {target} here</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sound Element Component
const SoundElement = ({ element, onAnswerChange, currentAnswer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const playSound = () => {
    if (element.audioUrl) {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleOptionSelect = (option) => {
    onAnswerChange(element.id, option);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {element.points} points
        </span>
      </div>
      
      <div className="mb-4">
        <button
          onClick={playSound}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <span className="mr-2">🔊</span>
          {isPlaying ? 'Playing...' : 'Play Sound'}
        </button>
        <audio 
          ref={audioRef} 
          src={element.audioUrl} 
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {element.options.map((option, index) => (
          <label 
            key={index}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              currentAnswer === option 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-blue-400'
            }`}
          >
            <input
              type="radio"
              name={`sound-${element.id}`}
              value={option}
              checked={currentAnswer === option}
              onChange={(e) => handleOptionSelect(e.target.value)}
              className="h-5 w-5 text-blue-600"
            />
            <span className="ml-3 text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

// Tracing Element Component
const TracingElement = ({ element, onAnswerChange, currentAnswer }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#ffffff';
    setContext(ctx);

    // Fill canvas with white background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the letter/number to trace
    ctx.font = '100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(element.letter, canvas.width / 2, canvas.height / 2);

    // Load existing drawing if available
    if (currentAnswer) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = currentAnswer;
    }
  }, [currentAnswer, element.letter]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      context.beginPath();
      
      // Save drawing data
      const dataUrl = canvasRef.current.toDataURL();
      onAnswerChange(element.id, dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw the letter/number to trace
    ctx.font = '100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(element.letter, canvas.width / 2, canvas.height / 2);
    
    // Save cleared canvas
    const dataUrl = canvas.toDataURL();
    onAnswerChange(element.id, dataUrl);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {element.points} points
        </span>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-700 mb-2">Trace the letter/number: <strong>{element.letter}</strong></p>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Use your mouse or finger to trace</span>
          <button 
            onClick={clearCanvas}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-sm"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          className="w-full h-auto cursor-crosshair bg-white"
        />
      </div>
    </div>
  );
};

// Coloring Element Component
const ColoringElement = ({ element, onAnswerChange, currentAnswer }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [color, setColor] = useState('#ff0000');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    setContext(ctx);

    // Load existing drawing if available
    if (currentAnswer) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = currentAnswer;
    }
  }, [currentAnswer, color]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      context.beginPath();
      
      // Save drawing data
      const dataUrl = canvasRef.current.toDataURL();
      onAnswerChange(element.id, dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save cleared canvas
    const dataUrl = canvas.toDataURL();
    onAnswerChange(element.id, dataUrl);
  };

  const changeColor = (newColor) => {
    setColor(newColor);
    context.strokeStyle = newColor;
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {element.points} points
        </span>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="flex items-center mr-4">
          <span className="mr-2 text-gray-700">Colors:</span>
          {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#000000'].map((c) => (
            <button 
              key={c}
              onClick={() => changeColor(c)}
              className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-gray-800' : 'border-gray-300'} mr-1`}
              style={{ backgroundColor: c }}
              title={c}
            ></button>
          ))}
        </div>
        
        <button 
          onClick={clearCanvas}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-sm"
        >
          Clear
        </button>
      </div>
      
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          className="w-full h-auto cursor-crosshair"
        />
      </div>
    </div>
  );
};

// Video Quiz Element Component
const VideoQuizElement = ({ element, onAnswerChange, currentAnswer }) => {
  const [videoStarted, setVideoStarted] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const videoRef = useRef(null);

  const handleVideoEnd = () => {
    setShowQuestions(true);
  };

  const handleAnswerChange = (questionIndex, answer) => {
    const newAnswers = {
      ...currentAnswer,
      [questionIndex]: answer
    };
    onAnswerChange(element.id, newAnswers);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {element.points} points
        </span>
      </div>
      
      {!videoStarted ? (
        <div className="text-center">
          <button
            onClick={() => {
              setVideoStarted(true);
              if (videoRef.current) {
                videoRef.current.play();
              }
            }}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center mx-auto"
          >
            <span className="mr-2">▶️</span> Play Video
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <video
              ref={videoRef}
              src={element.videoUrl}
              controls
              onEnded={handleVideoEnd}
              className="w-full rounded-lg"
            />
          </div>
          
          {showQuestions && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">Answer the questions:</h4>
              <div className="space-y-4">
                {element.questions.map((question, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{question}</p>
                    <input
                      type="text"
                      value={currentAnswer?.[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Type your answer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Recording Element Component
const RecordingElement = ({ element, onAnswerChange, currentAnswer }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onAnswerChange(element.id, url);
      };
      
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {element.points} points
        </span>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-700 mb-4">{element.prompt}</p>
        
        <div className="flex flex-col items-center">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
            >
              <span className="mr-2">🎤</span> Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
            >
              <span className="mr-2">⏹️</span> Stop Recording
            </button>
          )}
          
          {audioUrl && (
            <div className="mt-4 w-full">
              <audio controls src={audioUrl} className="w-full" />
              <p className="text-sm text-gray-500 mt-2 text-center">Your recording</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Image Upload Element Component
const ImageUploadElement = ({ element, onAnswerChange, currentAnswer }) => {
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        onAnswerChange(element.id, e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {element.points} points
        </span>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-700 mb-4">{element.prompt}</p>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        <div className="flex flex-col items-center">
          <button
            onClick={triggerFileInput}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
          >
            <span className="mr-2">📸</span> Upload Image
          </button>
          
          {preview && (
            <div className="mt-4">
              <img src={preview} alt="Uploaded" className="max-w-full h-auto rounded-lg border border-gray-300" />
              <p className="text-sm text-gray-500 mt-2 text-center">Your uploaded image</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// H5P Element Component
const H5PElement = ({ element }) => {
  // In a real implementation, you would render the H5P content
  // For now, we'll show a placeholder
  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {element.points} points
        </span>
      </div>
      
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🧩</div>
        <h4 className="font-medium text-gray-900 mb-2">H5P Interactive Content</h4>
        <p className="text-gray-600">This content will be displayed using the H5P library.</p>
        <div className="mt-4 text-sm text-gray-500">
          Embed code: {element.embedCode ? 'Provided' : 'Not available'}
        </div>
      </div>
    </div>
  );
};

// Wordwall Element Component
const WordwallElement = ({ element }) => {
  // In a real implementation, you would render the Wordwall content
  // For now, we'll show a placeholder
  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{element.question}</h3>
      </div>
      
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🔤</div>
        <h4 className="font-medium text-gray-900 mb-2">Wordwall Interactive Activity</h4>
        <p className="text-gray-600">This content will be displayed using the Wordwall embed code.</p>
        <div className="mt-4 text-sm text-gray-500">
          Embed code: {element.embedCode ? 'Provided' : 'Not available'}
        </div>
      </div>
    </div>
  );
};

export default InteractiveHomework;