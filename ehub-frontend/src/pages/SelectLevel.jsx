import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { levelOptions, languageOptions } from '../utils/languageOptions';

const SelectLevel = () => {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const navigate = useNavigate();
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
      alert('Please select both level and language');
      return;
    }

    const result = await updateProfile({
      level: selectedLevel,
      language: selectedLanguage,
    });

    if (result.success) {
      navigate('/dashboard');
    } else {
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Choose Your Learning Path</h2>
          <p className="text-sm sm:text-base text-gray-600">Select your level and preferred language</p>
        </div>

        <div className="card">
          <div className="space-y-6">
            {/* Level Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Your Level</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(levelOptions).map(([category, levels]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-gray-700 capitalize">{category}</h4>
                    <div className="space-y-2">
                      {levels.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setSelectedLevel(level.value)}
                          className={`w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                            selectedLevel === level.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Your Language</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      {language.value === 'english' ? '🇺🇸' : '🇫🇷'}
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
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/select-role')}
            className="btn-secondary"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectLevel;