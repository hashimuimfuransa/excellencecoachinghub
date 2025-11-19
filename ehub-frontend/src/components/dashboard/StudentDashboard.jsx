import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { homeworkApi } from '../../api/homeworkApi';
import { useAuth } from '../../hooks/useAuth';
import { levelOptions, languageOptions } from '../../utils/languageOptions';
import { useTranslation } from 'react-i18next';
import BottomNavbar from '../ui/BottomNavbar';

const StudentDashboard = () => {
  const [homework, setHomework] = useState([]);
  const [homeworkHelp, setHomeworkHelp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();

  // Initialize level and language from user profile
  useEffect(() => {
    if (user?.level) {
      setSelectedLevel(user.level);
    }
    if (user?.language) {
      setSelectedLanguage(user.language);
    }
  }, [user]);

  // Fetch homework based on selected level and language
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load homework data with filters
        const homeworkPromise = homeworkApi.getHomework(null, selectedLevel, selectedLanguage).catch(() => ({ data: [] }));
        const helpPromise = homeworkApi.getHomeworkHelp().catch(() => ({ data: [] }));

        const [homeworkResponse, helpResponse] = await Promise.all([homeworkPromise, helpPromise]);
        
        // Handle different possible response structures for homework
        let homeworkData = [];
        if (Array.isArray(homeworkResponse.data)) {
          homeworkData = homeworkResponse.data;
        } else if (homeworkResponse.data && Array.isArray(homeworkResponse.data.data)) {
          homeworkData = homeworkResponse.data.data;
        }
        
        // Ensure we're setting arrays for homework and help requests
        setHomework(homeworkData);
        setHomeworkHelp(Array.isArray(helpResponse.data) ? helpResponse.data : []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setHomework([]);
        setHomeworkHelp([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedLevel, selectedLanguage]);

  // Update user profile when level or language changes
  const updatePreferences = async (level, language) => {
    try {
      const result = await updateProfile({ level, language });
      if (!result.success) {
        console.error('Failed to update profile:', result.error);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  // Handle level change
  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    updatePreferences(level, selectedLanguage);
  };

  // Handle language change
  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    updatePreferences(selectedLevel, language);
  };

  // Get level label
  const getLevelLabel = (levelValue) => {
    for (const category in levelOptions) {
      const level = levelOptions[category].find(l => l.value === levelValue);
      if (level) return level.label;
    }
    return levelValue;
  };

  // Get language label
  const getLanguageLabel = (languageValue) => {
    const language = languageOptions.find(l => l.value === languageValue);
    return language ? language.label : languageValue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl sm:text-4xl">📚</span>
            </div>
            <div className="animate-pulse text-base sm:text-xl font-bold text-gray-700">{t('loading')}...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6 pb-20 md:pb-4 pt-16">
      <div className="max-w-6xl mx-auto">
        {/* Header with Welcome Message and Preferences */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('welcome')}, {user?.firstName || user?.email || 'Student'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">{t('lets_get_your_homework_done_today')}</p>
            </div>
            
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="mt-3 sm:mt-0 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              {showPreferences ? t('hide') : t('show')} {t('preferences')}
              <svg 
                className={`ml-1 w-4 h-4 transform transition-transform ${showPreferences ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Preferences Panel */}
          {showPreferences && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 mt-4 animate-fade-in-up">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('your_learning_preferences')}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold text-sm mb-1" htmlFor="level">
                    {t('level')}
                  </label>
                  <select
                    id="level"
                    value={selectedLevel}
                    onChange={(e) => handleLevelChange(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-gray-700"
                  >
                    <option value="">{t('all_levels')}</option>
                    {Object.keys(levelOptions).map(category => 
                      levelOptions[category].map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold text-sm mb-1" htmlFor="language">
                    {t('language')}
                  </label>
                  <select
                    id="language"
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-gray-700"
                  >
                    <option value="">{t('all_languages')}</option>
                    {languageOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Current Preferences Display */}
              {(user?.level || user?.language) ? (
                <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{t('your_preferences')}:</span> {getLevelLabel(user.level) || t('not_set')} - 
                    {languageOptions.find(lang => lang.value === user.language)?.label || user.language?.charAt(0).toUpperCase() + user.language?.slice(1) || t('not_set')}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Main Action Buttons - Modernized with enhanced visuals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {/* Upload Homework Button - For homework from school */}
          <Link 
            to="/homework/help/request"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center justify-center animate-fade-in-up hover:from-blue-600 hover:to-blue-700"
          >
            <div className="text-4xl mb-4 animate-bounce">📤</div>
            <h3 className="text-xl font-bold mb-2">{t('upload_homework')}</h3>
            <p className="text-blue-100 text-sm">{t('homework_from_school_help')}</p>
            <div className="mt-4 px-4 py-1 bg-blue-400 bg-opacity-30 rounded-full text-xs">
              {t('need_help')}
            </div>
          </Link>

          {/* Do Homework Button - For homework provided by teacher */}
          <Link 
            to="/homework" 
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center justify-center animate-fade-in-up hover:from-green-600 hover:to-green-700"
          >
            <div className="text-4xl mb-4 animate-pulse">✏️</div>
            <h3 className="text-xl font-bold mb-2">{t('do_homework')}</h3>
            <p className="text-green-100 text-sm">{t('homework_from_teacher')}</p>
            <div className="mt-4 px-4 py-1 bg-green-400 bg-opacity-30 rounded-full text-xs">
              {t('interactive_homework')}
            </div>
          </Link>

          {/* View Homework Help Requests Button - For viewing and providing feedback */}
          <Link 
            to="/homework/help/view"
            className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center justify-center animate-fade-in-up hover:from-amber-600 hover:to-orange-600"
          >
            <div className="text-4xl mb-4 animate-pulse">🤝</div>
            <h3 className="text-xl font-bold mb-2">{t('view_help_requests')}</h3>
            <p className="text-amber-100 text-sm">{t('see_and_provide_feedback')}</p>
            <div className="mt-4 px-4 py-1 bg-amber-400 bg-opacity-30 rounded-full text-xs">
              {t('collaborate')}
            </div>
          </Link>
        </div>

        {/* Contact Us Section - Simplified to only show phone number */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100 mb-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t('contact_us')}
          </h2>
          <div className="text-2xl font-semibold text-indigo-600">
            0793828834
          </div>
        </div>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default StudentDashboard;