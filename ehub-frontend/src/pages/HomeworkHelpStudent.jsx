import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { Widget } from '@uploadcare/react-widget';

const HomeworkHelpStudent = () => {
  const navigate = useNavigate();
  const [helpData, setHelpData] = useState({
    homeworkTitle: '',
    subject: '',
    message: '',
    fileUrl: '' // Changed from file to fileUrl for Uploadcare
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get Uploadcare public key from environment or window object
  const uploadcarePublicKey = (
    (typeof process !== 'undefined' && process.env?.REACT_APP_UPLOADCARE_PUBLIC_KEY)
    || (typeof window !== 'undefined' && window.UPLOADCARE_PUBLIC_KEY)
    || ''
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHelpData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate required fields
    if (!helpData.homeworkTitle || !helpData.subject || !helpData.message) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      // Create form data with text fields and file URL
      const formData = {
        homeworkTitle: helpData.homeworkTitle,
        subject: helpData.subject,
        message: helpData.message,
        fileUrl: helpData.fileUrl // Include the Uploadcare file URL if available
      };

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
            <div className="mb-4">
              <Widget
                publicKey={uploadcarePublicKey}
                multiple={false}
                tabs="file url"
                onFileSelect={(file) => {
                  if (!file) {
                    setHelpData(prev => ({ ...prev, fileUrl: '' }));
                    return;
                  }
                  
                  setUploading(true);
                  setUploadProgress(0);
                  
                  // Track widget progress
                  file.progress((info) => {
                    const pct = Math.round((info.progress || 0) * 100);
                    setUploadProgress(pct);
                  });
                  
                  file.done((fileInfo) => {
                    const cdnUrl = fileInfo?.cdnUrl || (fileInfo?.cdnUrl && fileInfo?.cdnUrlModifiers ? `${fileInfo.cdnUrl}${fileInfo.cdnUrlModifiers}` : '') || fileInfo?.originalUrl;
                    setHelpData(prev => ({ ...prev, fileUrl: cdnUrl || '' }));
                    setUploading(false);
                    setUploadProgress(100);
                  });
                  
                  file.fail((error) => {
                    console.error('Uploadcare upload failed:', error);
                    setUploading(false);
                    setUploadProgress(0);
                    setError('File upload failed. Please try again.');
                  });
                }}
              />
            </div>
            
            {uploading && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
              </div>
            )}
            
            {helpData.fileUrl && !uploading && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ File uploaded successfully! It will be attached to your help request.
                </p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">💡 How Homework Help Works</h3>
            <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
              <li>Teachers and classmates can view your uploaded homework</li>
              <li>They&apos;ll provide feedback and suggestions to help you</li>
              <li>Your work will be kept private and only shared with your teacher and classmates</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/homework')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
            >
              {loading || uploading ? 'Submitting...' : 'Submit Help Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeworkHelpStudent;