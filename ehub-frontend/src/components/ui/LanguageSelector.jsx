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
      {/* Enhanced language selector button with better visibility */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 focus:outline-none bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 border border-gray-300 shadow-sm"
        aria-label="Select language"
      >
        <span className="text-lg">
          {getFlagEmoji(selectedLanguage)}
        </span>
        <span className="hidden sm:block">{currentLanguage?.label}</span>
        {/* Always show abbreviation for better mobile visibility */}
        <span className="sm:hidden font-bold">{selectedLanguage?.toUpperCase()}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          {/* Header to clearly indicate purpose */}
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
            {selectedLanguage === 'rw' ? 'Hitamo Ururimi' : 
             selectedLanguage === 'fr' ? 'Choisir la langue' : 'Select Language'}
          </div>
          <div className="py-1">
            {languageOptions.map((language) => (
              <button
                key={language.value}
                onClick={() => handleLanguageChange(language.value)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                  selectedLanguage === language.value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{getFlagEmoji(language.value)}</span>
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