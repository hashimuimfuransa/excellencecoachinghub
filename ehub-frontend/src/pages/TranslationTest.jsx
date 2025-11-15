import React from 'react';
import { useTranslation } from 'react-i18next';

const TranslationTest = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Translation Test Page</h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Language: {i18n.language}</h2>
            
            <div className="flex space-x-4 mb-6">
              <button 
                onClick={() => changeLanguage('rw')}
                className={`px-4 py-2 rounded ${i18n.language === 'rw' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Kinyarwanda
              </button>
              <button 
                onClick={() => changeLanguage('en')}
                className={`px-4 py-2 rounded ${i18n.language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                English
              </button>
              <button 
                onClick={() => changeLanguage('fr')}
                className={`px-4 py-2 rounded ${i18n.language === 'fr' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Français
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800">Dashboard: {t('dashboard')}</h3>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800">Homework: {t('homework')}</h3>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-800">Students: {t('students')}</h3>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-800">Welcome: {t('welcome')}</h3>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-800">Sign In: {t('sign_in')}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationTest;