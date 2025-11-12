import React, { useState } from 'react';
import { homeworkApi } from '../api/homeworkApi';
import { useNavigate } from 'react-router-dom';

const HomeworkHelpStudent = () => {
  const navigate = useNavigate();
  const [helpData, setHelpData] = useState({
    homeworkTitle: '',
    subject: '',
    message: '',
    file: null,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHelpData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHelpData(prev => ({
        ...prev,
        file: file
      }));

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('homeworkTitle', helpData.homeworkTitle);
      formData.append('subject', helpData.subject);
      formData.append('message', helpData.message);
      if (helpData.file) {
        formData.append('file', helpData.file);
      }

      // Submit to backend
      await homeworkApi.uploadHomeworkHelp(formData);

      setSuccess(true);
      setTimeout(() => {
        navigate('/homework');
      }, 2000);
    } catch (err) {
      setError('Failed to submit help request. Please try again.');
      console.error('Error submitting help request:', err);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Homework Help</h1>
          <p className="text-gray-600">Upload your homework to get assistance from teachers and classmates</p>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            Help request submitted successfully! Teachers and classmates will review your work and provide assistance soon.
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
                name="homeworkTitle"
                value={helpData.homeworkTitle}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Math Problem Set 3"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Subject</label>
              <select
                name="subject"
                value={helpData.subject}
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
          </div>

          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-2">Describe Your Problem</label>
            <textarea
              name="message"
              value={helpData.message}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explain what you're having trouble with or what kind of help you need..."
              required
            />
          </div>

          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-2">Upload Your Homework (Optional)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF, DOC up to 10MB</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
              </label>
            </div>
            {preview && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
                <img src={preview} alt="Preview" className="max-h-48 rounded-lg" />
              </div>
            )}
            {helpData.file && (
              <div className="mt-2 text-sm text-gray-600">
                Selected file: {helpData.file.name}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">💡 How Homework Help Works</h3>
            <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
              <li>Teachers and classmates can view your uploaded homework</li>
              <li>They&#39;ll provide feedback and suggestions to help you</li>
              <li>Your work will be kept private and only shared with your teacher and classmates</li>
            </ul>
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
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Help Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeworkHelpStudent;