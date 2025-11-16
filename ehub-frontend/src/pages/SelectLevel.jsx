import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { levelOptions, languageOptions } from '../utils/languageOptions';

const SelectLevel = () => {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [expandedCategory, setExpandedCategory] = useState('primary'); // Default to primary expanded
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();

  // Pre-fill selections if they exist in user data
  useEffect(() => {
    if (user?.level) {
      setSelectedLevel(user.level);
    }
    if (user?.language) {
      setSelectedLanguage(user.language);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedLevel || !selectedLanguage) {
      alert(t('please_select_both_level_and_language'));
      return;
    }

    const result = await updateProfile({
      level: selectedLevel,
      language: selectedLanguage,
    });

    if (result.success) {
      navigate('/dashboard');
    } else {
      alert(t('failed_to_update_profile_please_try_again'));
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('choose_your_learning_path')}</h2>
          <p className="text-sm sm:text-base text-gray-600">{t('select_your_level_and_preferred_language')}</p>
        </div>

        <div className="card">
          <div className="space-y-6">
            {/* Level Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('select_your_level')}</h3>
              
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.keys(levelOptions).map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      expandedCategory === category
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t(category)}
                  </button>
                ))}
              </div>
              
              {/* Levels for the selected category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {expandedCategory && levelOptions[expandedCategory]?.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setSelectedLevel(level.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedLevel === level.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-primary-300 text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{level.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('select_your_language')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {languageOptions.map((language) => (
                  <button
                    key={language.value}
                    onClick={() => setSelectedLanguage(language.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedLanguage === language.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-primary-300 text-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {language.value === 'rw' && '🇷🇼'}
                      {language.value === 'en' && '🇺🇸'}
                      {language.value === 'fr' && '🇫🇷'}
                    </div>
                    <div className="font-medium">{language.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={!selectedLevel || !selectedLanguage}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('continue_to_dashboard')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectLevel;