import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { languageOptions } from '../../utils/languageOptions';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Set the initial language based on i18n language
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  // Update selected language when i18n language changes
  useEffect(() => {
    setSelectedLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (languageValue) => {
    i18n.changeLanguage(languageValue);
    setIsOpen(false);
    // Save to localStorage
    localStorage.setItem('preferred-language', languageValue);
  };

  const currentLanguage = languageOptions.find(lang => lang.value === selectedLanguage);

  // Flag emojis for the languages
  const getFlagEmoji = (languageCode) => {
    switch (languageCode) {
      case 'rw': return '🇷🇼';
      case 'en': return '🇺🇸';
      case 'fr': return '🇫🇷';
      default: return '🌐';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-primary-600 focus:outline-none"
      >
        <span className="text-lg">
          {getFlagEmoji(selectedLanguage)}
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
                <span>{getFlagEmoji(language.value)}</span>
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