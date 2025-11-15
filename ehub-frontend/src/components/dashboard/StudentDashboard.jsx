import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { homeworkApi } from '../../api/homeworkApi';
import { useAuth } from '../../hooks/useAuth';
import { levelOptions, languageOptions } from '../../utils/languageOptions';
import { useTranslation } from 'react-i18next';
import './animations.css';

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
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📚</span>
            </div>
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent mb-3">
            👋 {t('welcome_back')}
          </h1>
          <p className="text-gray-700 font-medium">
            {t('lets_get_your_homework_done_today')}
          </p>
        </div>

        {/* Level and Language Selection - Simplified View */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{t('preferences')}</h2>
            <button 
              onClick={() => setShowPreferences(!showPreferences)}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              {showPreferences ? t('hide') : t('show')}
            </button>
          </div>
          
          {/* Current Selection Display */}
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {getLevelLabel(selectedLevel) || t('not_selected')} - 
              {getLanguageLabel(selectedLanguage) || t('not_selected')}
            </p>
          </div>
          
          {/* Expanded Preferences */}
          {showPreferences && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Level Selection */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-2">{t('level')}</h3>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(levelOptions).map(([category, levels]) => (
                      <div key={category} className="space-y-1">
                        <h4 className="font-medium text-gray-700 capitalize text-xs">{category}</h4>
                        <div className="space-y-1">
                          {levels.map((level) => (
                            <button
                              key={level.value}
                              onClick={() => handleLevelChange(level.value)}
                              className={`w-full p-1 text-xs rounded-lg border ${
                                selectedLevel === level.value
                                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-bold'
                                  : 'border-gray-200 hover:border-primary-300 text-gray-700'
                              }`}
                            >
                              {level.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Language Selection */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-2">{t('language')}</h3>
                  <div className="grid grid-cols-2 gap-1">
                    {languageOptions.map((language) => (
                      <button
                        key={language.value}
                        onClick={() => handleLanguageChange(language.value)}
                        className={`p-2 rounded-lg border ${
                          selectedLanguage === language.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700 font-bold'
                            : 'border-gray-200 hover:border-primary-300 text-gray-700'
                        }`}
                      >
                        <div className="text-md mb-1">
                          {language.value === 'kinyarwanda' && '🇷🇼'}
                          {language.value === 'english' && '🇺🇸'}
                          {language.value === 'french' && '🇫🇷'}
                        </div>
                        <div className="text-xs font-medium">{language.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Action Buttons - Simplified */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Homework Button */}
          <Link 
            to="/homework" 
            className="bg-blue-500 rounded-2xl p-4 text-white text-center shadow hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-2">📝</div>
            <h3 className="text-sm font-bold">{t('homework')}</h3>
          </Link>

          {/* Help Button */}
          <Link 
            to="/homework/help/request"
            className="bg-red-500 rounded-2xl p-4 text-white text-center shadow hover:shadow-md transition-all cursor-pointer"
          >
            <div className="text-3xl mb-2">🆘</div>
            <h3 className="text-sm font-bold">{t('help')}</h3>
          </Link>

          {/* Leaderboard Button */}
          <Link 
            to="/leaderboard" 
            className="bg-purple-500 rounded-2xl p-4 text-white text-center shadow hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="text-sm font-bold">{t('leaderboard')}</h3>
          </Link>
        </div>

        {/* Homework Section - Simplified */}
        {homework.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-gray-900">
                📝 {t('your_pending_homework')}
              </h2>
              <Link to="/homework" className="text-blue-600 hover:text-blue-800 text-sm">
                {t('see_all')} →
              </Link>
            </div>
            <div className="space-y-2">
              {homework.slice(0, 3).map((hw, index) => (
                <div 
                  key={hw.id} 
                  className="bg-blue-50 border-l-2 border-blue-500 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{hw.title}</h4>
                      <p className="text-xs text-gray-600">
                        {t('due')}: {new Date(hw.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Link 
                      to={`/homework/${hw.id}`} 
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-full"
                    >
                      {t('start_now')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Homework Help Section - Simplified */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              🤝 {t('help_from_classmates')}
            </h2>
            <Link
              to="/homework/help/request"
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full text-xs"
            >
              + {t('ask')}
            </Link>
          </div>

          {homeworkHelp.length > 0 ? (
            <div className="space-y-2">
              {homeworkHelp.slice(0, 3).map((help) => (
                <div 
                  key={help.id} 
                  className="bg-yellow-50 border-l-2 border-yellow-500 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold text-sm">
                          {help.studentName ? help.studentName.charAt(0).toUpperCase() : '👤'}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{help.studentName || t('classmate')}</h4>
                          <p className="text-xs text-gray-600">{help.subject || t('general')}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 text-xs truncate">{help.description}</p>
                    </div>
                    <div className="text-right">
                      {help.file && (
                        <a
                          href={help.file}
                          download
                          className="inline-flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded-full text-xs"
                        >
                          📥
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🤝</div>
              <h3 className="font-bold text-gray-900 mb-1">{t('no_help_requests_yet')}</h3>
              <p className="text-gray-600 text-xs mb-3">{t('be_first_to_ask_or_help')}</p>
              <button
                onClick={() => navigate('/homework/help/request')}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full text-sm"
              >
                {t('ask_for_help')}
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {homework.length === 0 && homeworkHelp.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg text-center py-8 mt-6">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('all_caught_up')}</h3>
            <p className="text-gray-600 text-sm mb-4">{t('you_dont_have_any_pending_homework')}</p>
            <button
              onClick={() => navigate('/homework/help/request')}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full text-sm"
            >
              {t('ask_for_help')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;