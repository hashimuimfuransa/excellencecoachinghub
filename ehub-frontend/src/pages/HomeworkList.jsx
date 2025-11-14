import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { levelOptions } from '../utils/languageOptions';

const HomeworkList = () => {
  const navigate = useNavigate();
  
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  
  // Define language options
  const languageOptions = [
    { value: '', label: 'All Languages' },
    { value: 'english', label: 'English' },
    { value: 'french', label: 'French' },
    { value: 'kinyarwanda', label: 'Kinyarwanda' }
  ];

  // Get all level options for the dropdown
  const getAllLevelOptions = () => {
    const allLevels = [
      { value: '', label: 'All Levels' },
      { label: 'Nursery', options: levelOptions.nursery },
      { label: 'Primary', options: levelOptions.primary }
    ];
    return allLevels;
  };

  // Fetch homework based on filters
  useEffect(() => {
    const fetchHomework = async () => {
      setLoading(true);
      try {
        // Get homework without requiring course ID
        const response = await homeworkApi.getHomework(null, selectedLevel, selectedLanguage);
        if (response.data.success) {
          // Handle different possible response structures
          const homeworkData = response.data.data.homework || 
                              response.data.data || 
                              response.data || 
                              [];
          
          // If it's an object with a homework array, use that
          if (Array.isArray(homeworkData)) {
            setHomeworkList(homeworkData);
          } else if (homeworkData.homework && Array.isArray(homeworkData.homework)) {
            setHomeworkList(homeworkData.homework);
          } else if (homeworkData.data && Array.isArray(homeworkData.data)) {
            setHomeworkList(homeworkData.data);
          } else {
            // Fallback to empty array
            setHomeworkList([]);
          }
        } else {
          console.error('Failed to fetch homework:', response.data.message);
          setHomeworkList([]);
        }
      } catch (error) {
        console.error('Error fetching homework:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [selectedLevel, selectedLanguage]);

  // Function to get level label
  const getLevelLabel = (level) => {
    const levelMap = {
      'nursery-1': 'Nursery 1',
      'nursery-2': 'Nursery 2',
      'nursery-3': 'Nursery 3',
      'p1': 'P1',
      'p2': 'P2',
      'p3': 'P3',
      'p4': 'P4',
      'p5': 'P5',
      'p6': 'P6'
    };
    return levelMap[level] || level;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Interactive Homework</h1>
        <button
          onClick={() => navigate('/homework/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Homework
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="level">
              Level
            </label>
            <select
              id="level"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getAllLevelOptions().map((group) => (
                group.options ? (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                )
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="language">
              Language
            </label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedLevel('');
                setSelectedLanguage('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Homework List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (!homeworkList || homeworkList.length === 0) ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h3 className="text-xl font-medium text-gray-800 mb-2">No homework found</h3>
          <p className="text-gray-600">
            {selectedLevel || selectedLanguage 
              ? 'Try adjusting your filters or create a new homework assignment.'
              : 'There are no homework assignments available yet.'}
          </p>
          <button
            onClick={() => navigate('/homework/create')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Homework
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(homeworkList || []).map((homework) => (
            <div key={homework._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{homework.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{homework.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {getLevelLabel(homework.level)}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {homework.language.charAt(0).toUpperCase() + homework.language.slice(1)}
                  </span>
                  {homework.course && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {homework.course.title}
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>Due: {new Date(homework.dueDate).toLocaleDateString()}</span>
                  <span>{homework.maxPoints} points</span>
                </div>
                
                <button
                  onClick={() => navigate(`/homework/${homework._id}`)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Homework
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeworkList;