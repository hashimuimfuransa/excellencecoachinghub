import React from 'react';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';

const TestLanguageSelector = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('language')} Selector Test</h1>
      <div className="mb-4">
        <p className="mb-2">Current language: {t('language')}</p>
        <LanguageSelector />
      </div>
    </div>
  );
};

export default TestLanguageSelector;