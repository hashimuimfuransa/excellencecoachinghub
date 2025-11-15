import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { homeworkApi } from '../../api/homeworkApi';
import { useAuth } from '../../hooks/useAuth';
import { levelOptions, languageOptions } from '../../utils/languageOptions';
import { useTranslation } from 'react-i18next';
import './animations.css';
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 p-4 sm:p-6 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Section - More attractive and prominent with animations */}
        <div className="mb-10 text-center bg-white rounded-2xl shadow-lg p-6 animate-fade-in-up">
          <div className="inline-block p-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 mb-4 animate-float">
            <span className="text-4xl">👋</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t('welcome_back')}, <span className="text-purple-600">{user?.firstName || user?.name || 'Student'}</span>!
          </h1>
          <p className="text-gray-600 text-base">
            {t('lets_get_your_homework_done_today')}
          </p>
        </div>

        {/* Main Action Buttons - Updated with clearer purpose and new descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {/* Upload Homework Button - For homework from school */}
          <Link 
            to="/homework/help/request"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center justify-center animate-fade-in-up"
          >
            <div className="text-5xl mb-3 animate-bounce">📤</div>
            <h3 className="text-xl font-bold">{t('upload_homework')}</h3>
            <p className="text-blue-100 text-sm mt-2">{t('homework_from_school_help')}</p>
          </Link>

          {/* Do Homework Button - For homework provided by teacher */}
          <Link 
            to="/homework" 
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center justify-center animate-fade-in-up"
          >
            <div className="text-5xl mb-3 animate-pulse">✏️</div>
            <h3 className="text-xl font-bold">{t('do_homework')}</h3>
            <p className="text-green-100 text-sm mt-2">{t('homework_from_teacher')}</p>
          </Link>

          {/* See Marks and Ranking Button - From all students */}
          <Link 
            to="/leaderboard" 
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center justify-center animate-fade-in-up"
          >
            <div className="text-5xl mb-3 animate-wiggle">🏅</div>
            <h3 className="text-xl font-bold">{t('see_marks_ranking')}</h3>
            <p className="text-purple-100 text-sm mt-2">{t('ranking_from_all_students')}</p>
          </Link>
        </div>

        {/* Contact Information Section - Simplified to show only phone number */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-10 animate-fade-in-up">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            <h2 className="text-2xl font-bold text-gray-900">{t('need_help_contact_us')}</h2>
          </div>
          <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-100 transition-all hover:shadow-md max-w-md mx-auto">
            <div className="text-3xl mr-4 animate-float">📱</div>
            <div>
              <p className="font-bold text-gray-900">{t('phone')}</p>
              <p className="text-gray-600 text-lg">+1 (555) 123-4567</p>
            </div>
          </div>
        </div>

        {/* Removed Preferences Section as requested */}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default StudentDashboard;