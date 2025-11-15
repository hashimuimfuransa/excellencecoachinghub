import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/ui/LanguageSelector';
import LanguageTestComponent from '../components/ui/LanguageTestComponent';

const TestLanguagePage = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Language Selector Test</h1>
          
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Current Language Info</h2>
            <p className="text-gray-600">Language Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{i18n.language}</span></p>
            <p className="text-gray-600 mt-2">Translated &quot;Language&quot; text: <span className="font-semibold">{t('language')}</span></p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Translations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Dashboard:</h3>
                <p className="text-lg">{t('dashboard')}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Homework:</h3>
                <p className="text-lg">{t('homework')}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Students:</h3>
                <p className="text-lg">{t('students')}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Language Selector</h2>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Select Language:</span>
              <LanguageSelector />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Language Functionality Test</h2>
            <LanguageTestComponent />
          </div>

          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Instructions</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Click on the language selector to change the language</li>
              <li>Verify that the translations update correctly</li>
              <li>Refresh the page to ensure the language preference is saved</li>
              <li>Use the &quot;Run Language Tests&quot; button to test all languages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestLanguagePage;