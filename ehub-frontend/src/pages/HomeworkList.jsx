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

  // Get subject icon
  const getSubjectIcon = (subject) => {
    const iconMap = {
      'Mathematics': '📊',
      'Science': '🔬',
      'English': '📖',
      'History': '🏛️',
      'Art': '🎨',
      'Other': '📝'
    };
    return iconMap[subject] || '📚';
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20 md:pb-4 pt-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('homework')}</h1>
              <p className="text-gray-600 text-sm">{t('find_assignments_here')}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm font-medium flex items-center"
        >
          <span className="mr-2">←</span>
          {t('back_to_dashboard')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-5 mb-8 transition-all duration-300 hover:shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-1" htmlFor="level">
              {t('level')}
            </label>
            <select
              id="level"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-gray-700"
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
            <label className="block text-gray-700 font-semibold text-sm mb-1" htmlFor="language">
              {t('language')}
            </label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-gray-700"
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
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
            >
              {t('reset')}
            </button>
          </div>
        </div>
        
        {/* Current Preferences Display */}
        {user?.level || user?.language ? (
          <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{t('your_preferences')}:</span> {getLevelLabel(user.level) || t('not_set')} - 
              {user.language?.charAt(0).toUpperCase() + user.language?.slice(1) || t('not_set')}
            </p>
          </div>
        ) : null}
      </div>

      {/* Homework List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-64">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce flex items-center justify-center mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <div className="animate-pulse text-lg font-medium text-gray-700">{t('loading')}...</div>
          </div>
        </div>
      ) : (!homeworkList || homeworkList.length === 0) ? (
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center transition-all duration-300 hover:shadow-xl">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('no_homework_found')}</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
            {selectedLevel || selectedLanguage 
              ? t('try_adjusting_filters')
              : t('no_homework_assignments_available')}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
          >
            <span className="mr-2">←</span>
            {t('back_to_dashboard')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(homeworkList || []).map((homework) => (
            <div key={homework._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-xl">{getSubjectIcon(homework.subject)}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 truncate flex-1 mr-2">{homework.title}</h3>
                  </div>
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                    {homework.maxPoints} {t('points')}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{homework.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {getLevelLabel(homework.level)}
                  </span>
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {homework.language.charAt(0).toUpperCase() + homework.language.slice(1)}
                  </span>
                  {homework.course && (
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      {homework.course.title}
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                  <span>📅 {new Date(homework.dueDate).toLocaleDateString()}</span>
                </div>
                
                <button
                  onClick={() => navigate(`/homework/${homework._id}`)}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center"
                >
                  <span className="mr-2">👁️</span>
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