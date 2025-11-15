import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { levelOptions } from '../utils/languageOptions';
import BottomNavbar from '../components/ui/BottomNavbar';

const HomeworkList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [userPreferencesLoaded, setUserPreferencesLoaded] = useState(false);
  
  // Define language options
  const languageOptions = [
    { value: '', label: t('all_languages') },
    { value: 'english', label: 'English' },
    { value: 'french', label: 'French' },
    { value: 'kinyarwanda', label: 'Kinyarwanda' }
  ];

  // Initialize with user's preferences
  useEffect(() => {
    if (user) {
      setSelectedLevel(user.level || '');
      setSelectedLanguage(user.language || '');
      setUserPreferencesLoaded(true);
    }
  }, [user]);

  // Get all level options for the dropdown
  const getAllLevelOptions = () => {
    const allLevels = [
      { value: '', label: t('all_levels') },
      { label: t('nursery'), options: levelOptions.nursery },
      { label: t('primary'), options: levelOptions.primary }
    ];
    return allLevels;
  };

  // Fetch homework based on filters
  useEffect(() => {
    // Only fetch homework after user preferences are loaded
    if (!userPreferencesLoaded) {
      return;
    }
    
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
  }, [selectedLevel, selectedLanguage, userPreferencesLoaded]);

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

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20 md:pb-4 pt-16">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{t('homework')}</h1>
        <button
          onClick={() => navigate('/homework/create')}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          {t('create')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="level">
              {t('level')}
            </label>
            <select
              id="level"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
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
            <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="language">
              {t('language')}
            </label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
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
                setSelectedLevel(user?.level || '');
                setSelectedLanguage(user?.language || '');
                setUserPreferencesLoaded(true);
              }}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
            >
              {t('reset')}
            </button>
          </div>
        </div>
        
        {/* Current Preferences Display */}
        {user?.level || user?.language ? (
          <div className="mt-3 p-2 bg-blue-50 rounded">
            <p className="text-xs text-gray-600">
              {getLevelLabel(user.level) || t('not_set')} - 
              {user.language?.charAt(0).toUpperCase() + user.language?.slice(1) || t('not_set')}
            </p>
          </div>
        ) : null}
      </div>

      {/* Homework List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (!homeworkList || homeworkList.length === 0) ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-800 mb-1">{t('no_homework_found')}</h3>
          <p className="text-gray-600 text-sm">
            {selectedLevel || selectedLanguage 
              ? t('try_adjusting_filters')
              : t('no_homework_assignments_available')}
          </p>
          <button
            onClick={() => navigate('/homework/create')}
            className="mt-3 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {t('create')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(homeworkList || []).map((homework) => (
            <div key={homework._id} className="bg-white rounded-lg shadow hover:shadow-md">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{homework.title}</h3>
                <p className="text-gray-600 text-xs mb-3 line-clamp-2">{homework.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {getLevelLabel(homework.level)}
                  </span>
                  <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                    {homework.language.charAt(0).toUpperCase() + homework.language.slice(1)}
                  </span>
                  {homework.course && (
                    <span className="px-1 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {homework.course.title}
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                  <span>{t('due')}: {new Date(homework.dueDate).toLocaleDateString()}</span>
                  <span>{homework.maxPoints} {t('points')}</span>
                </div>
                
                <button
                  onClick={() => navigate(`/homework/${homework._id}`)}
                  className="w-full px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  {t('view')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <BottomNavbar />
    </div>
  );
};

export default HomeworkList;