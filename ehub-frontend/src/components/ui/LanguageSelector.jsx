import React, { useState } from 'react';
import { languageOptions } from '../../utils/languageOptions';

const LanguageSelector = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (languageValue) => {
    setSelectedLanguage(languageValue);
    setIsOpen(false);
    // In a real app, you'd save this to user preferences and update the app language
    localStorage.setItem('preferred-language', languageValue);
  };

  const currentLanguage = languageOptions.find(lang => lang.value === selectedLanguage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-primary-600 focus:outline-none"
      >
        <span className="text-lg">
          {selectedLanguage === 'english' ? '🇺🇸' : '🇫🇷'}
        </span>
        <span className="hidden sm:block">{currentLanguage?.label}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="py-1">
            {languageOptions.map((language) => (
              <button
                key={language.value}
                onClick={() => handleLanguageChange(language.value)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                  selectedLanguage === language.value ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                }`}
              >
                <span>{language.value === 'english' ? '🇺🇸' : '🇫🇷'}</span>
                <span>{language.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default LanguageSelector;