import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentHomeworkCreator = () => {
  const navigate = useNavigate();
  const [homeworkType, setHomeworkType] = useState('drawing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [drawingData, setDrawingData] = useState(null);
  const [mathProblem, setMathProblem] = useState('');
  const [scienceExperiment, setScienceExperiment] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      // In a real app, you would submit the homework to the backend
      // For now, we'll simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/homework');
      }, 2000);
    } catch (error) {
      console.error('Error creating homework:', error);
      alert('Failed to create homework. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDrawingComplete = (dataUrl) => {
    setDrawingData(dataUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="mr-2">←</span> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Own Homework</h1>
          <p className="text-gray-600">Design interactive homework assignments to share with your classmates</p>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            Homework created successfully! Your teacher will review it soon.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Homework Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., My Math Challenge"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Art">Art</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Describe your homework assignment..."
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Homework Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setHomeworkType('drawing')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    homeworkType === 'drawing' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-2">🎨</div>
                  <h3 className="font-medium">Drawing Project</h3>
                  <p className="text-sm text-gray-600 mt-1">Create art and diagrams</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setHomeworkType('math')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    homeworkType === 'math' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-3xl mb-2">🧮</div>
                  <h3 className="font-medium">Math Challenge</h3>
                  <p className="text-sm text-gray-600 mt-1">Solve interactive problems</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setHomeworkType('science')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    homeworkType === 'science' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-2">🔬</div>
                  <h3 className="font-medium">Science Experiment</h3>
                  <p className="text-sm text-gray-600 mt-1">Design virtual experiments</p>
                </button>
              </div>
            </div>

            {homeworkType === 'drawing' && (
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Drawing Canvas</h3>
                <DrawingCanvas onDrawingComplete={handleDrawingComplete} />
              </div>
            )}

            {homeworkType === 'math' && (
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Math Problem</h3>
                <textarea
                  value={mathProblem}
                  onChange={(e) => setMathProblem(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your math problem here. You can include equations, word problems, or interactive challenges."
                />
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Tips for Creating Math Homework:</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>Include clear instructions</li>
                    <li>Provide space for working out solutions</li>
                    <li>Consider adding visual elements like shapes or graphs</li>
                    <li>Think about how classmates will solve your problem</li>
                  </ul>
                </div>
              </div>
            )}

            {homeworkType === 'science' && (
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Science Experiment</h3>
                <textarea
                  value={scienceExperiment}
                  onChange={(e) => setScienceExperiment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your science experiment. Include materials, procedure, and what you expect to learn."
                />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Hypothesis</h4>
                    <p className="text-blue-800 text-sm">What do you think will happen?</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Procedure</h4>
                    <p className="text-green-800 text-sm">Step-by-step instructions</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Conclusion</h4>
                    <p className="text-purple-800 text-sm">What did you learn?</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {creating ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Homework'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Drawing Canvas Component
const DrawingCanvas = ({ onDrawingComplete }) => {
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);

  React.useEffect(() => {
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
  }, [color, brushSize]);

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
      onDrawingComplete(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save cleared canvas
    const dataUrl = canvas.toDataURL();
    onDrawingComplete(dataUrl);
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
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
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

export default StudentHomeworkCreator;