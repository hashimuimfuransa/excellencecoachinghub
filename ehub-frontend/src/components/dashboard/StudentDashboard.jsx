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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 p-4 sm:p-6 pb-24 md:pb-8 pt-16">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-indigo-700 transition-colors duration-200"
          >
            <span className="mr-1">←</span> {t('back_to_dashboard')}
          </button>
        </div>
        
        {/* Welcome Section - Enhanced with modern design */}
        <div className="mb-8 text-center bg-white rounded-2xl shadow-lg p-6 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t('welcome_back')}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">{user?.firstName || user?.name || 'Student'}</span>!
          </h1>
          <p className="text-gray-600 text-base">
            {t('lets_get_your_homework_done_today')}
          </p>
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

          {/* See Marks and Ranking Button - From all students */}
          <Link 
            to="/leaderboard" 
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center justify-center animate-fade-in-up hover:from-purple-600 hover:to-purple-700"
          >
            <div className="text-4xl mb-4 animate-wiggle">🏅</div>
            <h3 className="text-xl font-bold mb-2">{t('see_marks_ranking')}</h3>
            <p className="text-purple-100 text-sm">{t('ranking_from_all_students')}</p>
            <div className="mt-4 px-4 py-1 bg-purple-400 bg-opacity-30 rounded-full text-xs">
              {t('see_top_students')}
            </div>
          </Link>
        </div>

        {/* Contact Information Section - Updated with new phone number */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-10 animate-fade-in-up">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            <h2 className="text-2xl font-bold text-gray-900">{t('need_help_contact_us')}</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100 transition-all hover:shadow-md">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="text-4xl mr-4 animate-float">📱</div>
              <div>
                <p className="font-bold text-gray-900">{t('phone')}</p>
                <p className="text-gray-700 text-xl font-semibold">0793828834</p>
              </div>
            </div>
            <button 
              onClick={() => window.open('tel:0793828834', '_self')}
              className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 font-medium flex items-center"
            >
              <span className="mr-2">📞</span>
              {t('call_now')}
            </button>
          </div>
        </div>

        {/* Removed Preferences Section as requested */}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default StudentDashboard;