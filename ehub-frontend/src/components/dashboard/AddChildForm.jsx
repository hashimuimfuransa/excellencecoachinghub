import React, { useState } from 'react';
import { parentApi } from '../../api/parentApi';

const AddChildForm = ({ onChildAdded }) => {
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!childName.trim()) {
      setError('Please enter your child&#39;s name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await parentApi.addChild(childName.trim());
      
      if (response.data.success) {
        // Notify parent that child was added successfully
        onChildAdded(response.data.data);
      } else {
        setError(response.data.message || 'Failed to add child');
      }
    } catch (err) {
      console.error('Error adding child:', err);
      setError('Failed to add child. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 p-4 sm:p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Parent!</h1>
            <p className="text-gray-600">
              Please enter your child&#39;s name to get started
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="childName" className="block text-gray-700 font-medium mb-2">
                Child&#39;s Name
              </label>
              <input
                type="text"
                id="childName"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your child&#39;s name"
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Adding...
                </span>
              ) : (
                'Add Child'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>You can add more children later from your dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddChildForm;