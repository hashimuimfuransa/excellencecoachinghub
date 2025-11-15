import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { testAllLanguages, getCurrentLanguage, getSavedLanguage } from '../../utils/testLanguageUtils';

const LanguageTestComponent = () => {
  const { t, i18n } = useTranslation();
  const [testResults, setTestResults] = useState(null);
  const [currentLang, setCurrentLang] = useState('');
  const [savedLang, setSavedLang] = useState('');

  useEffect(() => {
    setCurrentLang(getCurrentLanguage(i18n));
    setSavedLang(getSavedLanguage());
  }, [i18n]);

  const runTests = () => {
    const results = testAllLanguages(i18n);
    setTestResults(results);
    setCurrentLang(getCurrentLanguage(i18n));
    setSavedLang(getSavedLanguage());
  };

  return (
    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
      <h3 className="text-lg font-semibold text-yellow-800 mb-3">Language Functionality Test</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 rounded shadow">
          <p className="text-sm text-gray-600">Current Language</p>
          <p className="font-mono text-lg">{currentLang}</p>
        </div>
        <div className="bg-white p-3 rounded shadow">
          <p className="text-sm text-gray-600">Saved Language</p>
          <p className="font-mono text-lg">{savedLang || 'Not set'}</p>
        </div>
        <div className="bg-white p-3 rounded shadow">
          <p className="text-sm text-gray-600">Translated Text</p>
          <p className="font-mono text-lg">{t('dashboard')}</p>
        </div>
      </div>

      <button 
        onClick={runTests}
        className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        Run Language Tests
      </button>

      {testResults && (
        <div className="mt-4 p-3 bg-white rounded shadow">
          <h4 className="font-medium text-gray-800 mb-2">Test Results:</h4>
          <div className="space-y-2">
            {Object.entries(testResults).map(([lang, result]) => (
              <div key={lang} className="flex items-center">
                <span className="font-mono w-12">{lang}:</span>
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '✓' : '✗'} {result.translation || result.error}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageTestComponent;